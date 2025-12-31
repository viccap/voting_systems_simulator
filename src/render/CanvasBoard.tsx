import { useEffect, useRef, useState } from "react";
import { useAppStore } from "../state/store";
import { Candidate, Cluster, IRVRound, Voter } from "../sim/types";
import { WORLD_MAX, WORLD_MIN } from "../sim/sampling";
import { colorForCandidate } from "./colors";

type Point = { x: number; y: number };

const BASE_SPAN = WORLD_MAX - WORLD_MIN;

export default function CanvasBoard() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<SelectionState | null>(null);
  const [size, setSize] = useState({ width: 800, height: 440 });
  const [zoom, setZoom] = useState(1);

  const clusters = useAppStore((s) => s.clusters);
  const candidates = useAppStore((s) => s.candidates);
  const voters = useAppStore((s) => s.voters);
  const densityMode = useAppStore((s) => s.densityMode);
  const selection = useAppStore((s) => s.selection);
  const irvRounds = useAppStore((s) => s.irvRounds);
  const irvRoundIndex = useAppStore((s) => s.irvRoundIndex);

  const addCluster = useAppStore((s) => s.addCluster);
  const addCandidate = useAppStore((s) => s.addCandidate);
  const select = useAppStore((s) => s.select);
  const updateCluster = useAppStore((s) => s.updateCluster);
  const updateCandidate = useAppStore((s) => s.updateCandidate);

  // track resize so the canvas is crisp
  useEffect(() => {
    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) setSize({ width: rect.width, height: rect.height });
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size.width * 2;
    canvas.height = size.height * 2;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    draw(ctx, size.width, size.height, { clusters, candidates, voters, densityMode }, selection, {
      irvRounds,
      irvRoundIndex
    }, zoom);
  }, [clusters, candidates, voters, densityMode, selection, size, irvRounds, irvRoundIndex, zoom]);

  // pointer interactions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventWheel = (e: WheelEvent) => {
      // avoid browser zoom/scroll gestures on trackpads while interacting
      e.preventDefault();
    };
    canvas.addEventListener("wheel", preventWheel, { passive: false });

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      const pos = screenToWorld(e.offsetX, e.offsetY, size, zoom);
      const hit = hitTest(pos, clusters, candidates);
      if (!hit) {
        if (e.shiftKey) {
          addCandidate(pos.x, pos.y);
        } else {
          addCluster(pos.x, pos.y);
        }
        return;
      }
      select(hit);
      canvas.setPointerCapture(e.pointerId);
      setDragging({ selection: hit, offset: pos, pointerId: e.pointerId });
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== dragging.pointerId) return;
      const pos = screenToWorld(e.offsetX, e.offsetY, size, zoom);
      const dx = pos.x - dragging.offset.x;
      const dy = pos.y - dragging.offset.y;
      const targetPos = { x: dragging.offset.x + dx, y: dragging.offset.y + dy };
      if (dragging.selection.type === "cluster") {
        requestAnimationFrame(() => updateCluster(dragging.selection.id, targetPos));
      } else {
        requestAnimationFrame(() => updateCandidate(dragging.selection.id, targetPos));
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragging && e.pointerId === dragging.pointerId) {
        canvas.releasePointerCapture(e.pointerId);
        setDragging(null);
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("wheel", preventWheel);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
    };
  }, [addCandidate, addCluster, candidates, clusters, dragging, select, size, updateCandidate, updateCluster, zoom]);

  return (
    <div ref={containerRef} className="canvas-container">
      <canvas ref={canvasRef} />
      <div className="canvas-hint">
        Click = cluster • Shift+Click = candidate • Drag to move • Range [{WORLD_MIN}, {WORLD_MAX}]
      </div>
      <div style={{ position: "absolute", right: 8, top: 8, display: "flex", gap: 6 }}>
        <button onClick={() => setZoom((z) => Math.min(4, z * 1.25))}>+</button>
        <button onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}>-</button>
        <button onClick={() => setZoom(1)}>Reset</button>
      </div>
    </div>
  );
}

type SelectionState = {
  selection: { type: "cluster" | "candidate"; id: string };
  offset: Point;
  pointerId: number;
};

function draw(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: { clusters: Cluster[]; candidates: Candidate[]; voters: Voter[]; densityMode: boolean },
  selection: { type: "cluster" | "candidate"; id: string } | null,
  irv: { irvRounds: IRVRound[]; irvRoundIndex: number },
  zoom: number
) {
  ctx.clearRect(0, 0, width, height);
  const view = getView(zoom);
  drawGrid(ctx, width, height, view);
  drawAxes(ctx, width, height, view);

  const remaining =
    irv.irvRounds[irv.irvRoundIndex]?.remaining ?? data.candidates.map((c) => c.id);
  if (data.densityMode) {
    drawDensity(ctx, width, height, data.voters, remaining, data.candidates, view);
  } else {
    drawVoters(ctx, width, height, data.voters, remaining, data.candidates, view);
  }
  drawClusters(ctx, width, height, data.clusters, selection, view);
  drawCandidates(ctx, width, height, data.candidates, selection, view);
}

function getView(zoom: number) {
  const span = BASE_SPAN / zoom;
  const min = -span / 2;
  const max = span / 2;
  return { min, max, span };
}

function project(p: Point, width: number, height: number, view: { min: number; max: number; span: number }) {
  const scale = Math.min(width, height) / view.span;
  const xOffset = (width - view.span * scale) / 2;
  const yOffset = (height - view.span * scale) / 2;
  const x = (p.x - view.min) * scale + xOffset;
  const y = height - ((p.y - view.min) * scale + yOffset);
  return { x, y };
}

function screenToWorld(sx: number, sy: number, size: { width: number; height: number }, zoom: number) {
  const view = getView(zoom);
  const scale = Math.min(size.width, size.height) / view.span;
  const xOffset = (size.width - view.span * scale) / 2;
  const yOffset = (size.height - view.span * scale) / 2;
  const x = (sx - xOffset) / scale + view.min;
  const y = (size.height - sy - yOffset) / scale + view.min;
  return { x, y };
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: { min: number; max: number; span: number }
) {
  ctx.save();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  for (let v = Math.ceil(view.min); v <= view.max; v++) {
    const p1 = project({ x: v, y: view.min }, width, height, view);
    const p2 = project({ x: v, y: view.max }, width, height, view);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const p3 = project({ x: view.min, y: v }, width, height, view);
    const p4 = project({ x: view.max, y: v }, width, height, view);
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  view: { min: number; max: number; span: number }
) {
  ctx.save();
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  const originX = project({ x: 0, y: 0 }, width, height, view).x;
  const originY = project({ x: 0, y: 0 }, width, height, view).y;
  ctx.beginPath();
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, originY);
  ctx.lineTo(width, originY);
  ctx.stroke();
  ctx.restore();
}

function drawClusters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  clusters: Cluster[],
  selection: { type: "cluster" | "candidate"; id: string } | null,
  view: { min: number; max: number; span: number }
) {
  clusters.forEach((c) => {
    const { x, y } = project(c, width, height, view);
    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.strokeStyle = selection?.id === c.id && selection.type === "cluster" ? "#f97316" : "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(x - 8, y - 8, 16, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px Manrope";
    ctx.fillText(`w=${c.weight.toFixed(2)} σ=${c.spread.toFixed(2)}`, x + 12, y - 12);
    ctx.restore();
  });
}

function drawCandidates(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  candidates: Candidate[],
  selection: { type: "cluster" | "candidate"; id: string } | null,
  view: { min: number; max: number; span: number }
) {
  candidates.forEach((c) => {
    const { x, y } = project(c, width, height, view);
    const color = colorForCandidate(c.id, candidates);
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = selection?.id === c.id && selection.type === "candidate" ? "#0f172a" : "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "12px Manrope";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.label, x, y);
    ctx.restore();
  });
}

function drawVoters(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  voters: Voter[],
  remaining: string[],
  candidates: Candidate[],
  view: { min: number; max: number; span: number }
) {
  const remainingCandidates = candidates.filter((c) => remaining.includes(c.id));
  voters.forEach((v) => {
    const closest = nearestCandidate(v, remainingCandidates);
    const color = closest ? colorForCandidate(closest.id, candidates) : "#94a3b8";
    const { x, y } = project(v, width, height, view);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawDensity(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  voters: Voter[],
  remaining: string[],
  candidates: Candidate[],
  view: { min: number; max: number; span: number }
) {
  const gridSize = 48;
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
  const remainingCandidates = candidates.filter((c) => remaining.includes(c.id));
  voters.forEach((v) => {
    const gx = Math.floor(((v.x - view.min) / view.span) * gridSize);
    const gy = Math.floor(((v.y - view.min) / view.span) * gridSize);
    if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) {
      grid[gx][gy] += 1;
    }
  });
  const max = Math.max(...grid.flat(), 1);
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      const count = grid[gx][gy];
      if (count === 0) continue;
      const intensity = count / max;
      const wx = view.min + (gx / gridSize) * view.span;
      const wy = view.min + (gy / gridSize) * view.span;
      const { x, y } = project({ x: wx, y: wy }, width, height, view);
      const closest = nearestCandidate({ x: wx, y: wy }, remainingCandidates);
      const color = closest ? colorForCandidate(closest.id, candidates) : "#0f172a";
      ctx.fillStyle = hexToRgba(color, Math.min(0.75, intensity));
      ctx.fillRect(x, y, width / gridSize + 1, height / gridSize + 1);
    }
  }
}

function nearestCandidate(p: Point, candidates: Candidate[]): Candidate | null {
  if (!candidates.length) return null;
  let best = candidates[0];
  let bestDist = distance(p, best);
  for (let i = 1; i < candidates.length; i++) {
    const d = distance(p, candidates[i]);
    if (d < bestDist) {
      best = candidates[i];
      bestDist = d;
    }
  }
  return best;
}

function hexToRgba(hex: string, alpha: number) {
  const c = hex.replace("#", "");
  const bigint = parseInt(c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function distance(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function hitTest(
  pos: Point,
  clusters: Cluster[],
  candidates: Candidate[]
): { type: "cluster" | "candidate"; id: string } | null {
  const threshold = 0.6;
  const foundCluster = clusters.find((c) => distance(pos, c) < threshold);
  if (foundCluster) return { type: "cluster", id: foundCluster.id };
  const foundCandidate = candidates.find((c) => distance(pos, c) < threshold);
  if (foundCandidate) return { type: "candidate", id: foundCandidate.id };
  return null;
}

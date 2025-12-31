import { useMemo } from "react";
import { useAppStore } from "../state/store";

export default function SelectionPanel() {
  const selection = useAppStore((s) => s.selection);
  const clusters = useAppStore((s) => s.clusters);
  const candidates = useAppStore((s) => s.candidates);
  const updateCluster = useAppStore((s) => s.updateCluster);
  const updateCandidate = useAppStore((s) => s.updateCandidate);
  const deleteSelection = useAppStore((s) => s.deleteSelection);

  const selectedEntity = useMemo(() => {
    if (!selection) return null;
    if (selection.type === "cluster") return clusters.find((c) => c.id === selection.id);
    return candidates.find((c) => c.id === selection.id);
  }, [selection, clusters, candidates]);

  if (!selection || !selectedEntity) {
    return (
      <div className="panel">
        <h2>Selection</h2>
        <p>Click the canvas to add clusters, Shift+click for candidates. Drag to move.</p>
      </div>
    );
  }

  if (selection.type === "cluster") {
    const cluster = selectedEntity;
    return (
      <div className="panel">
        <h2>Cluster</h2>
        <div className="row">
          <label>Weight</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={cluster.weight}
            onChange={(e) => updateCluster(cluster.id, { weight: Number(e.target.value) })}
            className="slider"
          />
          <span>{cluster.weight.toFixed(2)}</span>
        </div>
        <div className="row">
          <label>Spread (σ)</label>
          <input
            type="range"
            min={0.05}
            max={3}
            step={0.05}
            value={cluster.spread}
            onChange={(e) => updateCluster(cluster.id, { spread: Number(e.target.value) })}
            className="slider"
          />
          <span>{cluster.spread.toFixed(2)}</span>
        </div>
        <button onClick={deleteSelection}>Delete cluster</button>
      </div>
    );
  }

  const candidate = selectedEntity;
  return (
    <div className="panel">
      <h2>Candidate</h2>
      <div className="row">
        <label>Label</label>
        <input
          value={candidate.label}
          onChange={(e) => updateCandidate(candidate.id, { label: e.target.value })}
        />
      </div>
      <div className="row">
        <label>Position</label>
        <span>
          ({candidate.x.toFixed(2)}, {candidate.y.toFixed(2)})
        </span>
      </div>
      <button onClick={deleteSelection}>Delete candidate</button>
    </div>
  );
}

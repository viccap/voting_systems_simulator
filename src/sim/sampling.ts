import { Cluster, Voter } from "./types";
import { LcgRng } from "./rng";

export const WORLD_MIN = -5;
export const WORLD_MAX = 5;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export function sampleVoters(clusters: Cluster[], n: number, rng: LcgRng): Voter[] {
  if (clusters.length === 0) {
    return Array.from({ length: n }, () => ({
      x: rng.uniform(WORLD_MIN, WORLD_MAX),
      y: rng.uniform(WORLD_MIN, WORLD_MAX)
    }));
  }

  const weights = clusters.map((c) => Math.max(0, c.weight));
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const normWeights =
    weightSum > 0 ? weights.map((w) => w / weightSum) : Array(weights.length).fill(1 / weights.length);
  const cumulative = normWeights.reduce<number[]>((acc, w, idx) => {
    acc.push(w + (acc[idx - 1] ?? 0));
    return acc;
  }, []);

  const pickCluster = () => {
    const r = rng.next();
    const idx = cumulative.findIndex((c) => r <= c);
    return clusters[idx === -1 ? clusters.length - 1 : idx];
  };

  return Array.from({ length: n }, () => {
    const cl = pickCluster();
    const x = clamp(rng.normal(cl.x, cl.spread), WORLD_MIN, WORLD_MAX);
    const y = clamp(rng.normal(cl.y, cl.spread), WORLD_MIN, WORLD_MAX);
    return { x, y };
  });
}

export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

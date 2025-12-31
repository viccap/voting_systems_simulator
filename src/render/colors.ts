import { Candidate } from "../sim/types";

export const palette = ["#2563eb", "#e11d48", "#22c55e", "#a855f7", "#f97316", "#0ea5e9"];

export function colorForCandidate(id: string, candidates: Candidate[]) {
  const idx = candidates.findIndex((c) => c.id === id);
  return palette[idx % palette.length] ?? "#0f172a";
}

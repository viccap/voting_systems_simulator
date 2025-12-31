import { describe, expect, it } from "vitest";
import { Candidate, Voter } from "./types";
import { computeBallots, plurality, approval, pairwiseMatrix, condorcetWinner, irv } from "./voting";

const candidates: Candidate[] = [
  { id: "A", label: "A", x: 0, y: 0 },
  { id: "B", label: "B", x: 3, y: 0 },
  { id: "C", label: "C", x: -3, y: 0 }
];

const voters: Voter[] = [
  { x: 0, y: 0 },
  { x: 0.2, y: 0 },
  { x: 2.2, y: 0 },
  { x: 2.1, y: 0.1 },
  { x: -2.1, y: 0 }
];

describe("voting rules", () => {
  const ballots = computeBallots(voters, candidates);

  it("plurality picks nearest candidates", () => {
    const res = plurality(ballots);
    expect(res.winners).toEqual(["A", "B"]); // tie at 2 votes each
  });

  it("approval counts top-k picks", () => {
    const res = approval(ballots, 2);
    expect(res.tally["A"]).toBeGreaterThan(res.tally["C"]);
  });

  it("condorcet finds head-to-head winner when exists", () => {
    const matrix = pairwiseMatrix(ballots, candidates.map((c) => c.id));
    const winner = condorcetWinner(matrix);
    expect(winner).toBe("A");
  });

  it("irv eliminates lowest and elects remaining", () => {
    const result = irv(ballots);
    expect(result.winner).toBeDefined();
    expect(result.rounds.length).toBeGreaterThan(0);
  });
});

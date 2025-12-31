import { Ballot, Candidate, IRVRound, PairwiseMatrix, RuleResults, Voter } from "./types";
import { distance } from "./sampling";

export function computeBallots(voters: Voter[], candidates: Candidate[]): Ballot[] {
  if (candidates.length === 0) return [];
  return voters.map((v) => {
    const ranking = [...candidates]
      .map((c) => ({ id: c.id, d: distance(v, c) }))
      .sort((a, b) => a.d - b.d)
      .map((c) => c.id);
    return { ranking };
  });
}

export function plurality(ballots: Ballot[]): { tally: Record<string, number>; winners: string[] } {
  const tally: Record<string, number> = {};
  ballots.forEach((b) => {
    const top = b.ranking[0];
    tally[top] = (tally[top] ?? 0) + 1;
  });
  return { tally, winners: winnersFromTally(tally) };
}

export function approval(
  ballots: Ballot[],
  topK: number
): { tally: Record<string, number>; winners: string[]; topK: number } {
  const tally: Record<string, number> = {};
  ballots.forEach((b) => {
    b.ranking.slice(0, topK).forEach((id) => {
      tally[id] = (tally[id] ?? 0) + 1;
    });
  });
  return { tally, winners: winnersFromTally(tally), topK };
}

export function pairwiseMatrix(ballots: Ballot[], candidateIds: string[]): PairwiseMatrix {
  const matrix: PairwiseMatrix = {};
  candidateIds.forEach((a) => {
    matrix[a] = {};
    candidateIds.forEach((b) => {
      matrix[a][b] = 0;
    });
  });

  ballots.forEach((b) => {
    const ranks: Record<string, number> = {};
    b.ranking.forEach((id, idx) => {
      ranks[id] = idx;
    });
    candidateIds.forEach((a) => {
      candidateIds.forEach((c) => {
        if (a === c) return;
        if (ranks[a] < ranks[c]) {
          matrix[a][c] += 1;
        }
      });
    });
  });

  return matrix;
}

export function condorcetWinner(matrix: PairwiseMatrix): string | null {
  const ids = Object.keys(matrix);
  for (const id of ids) {
    let beatsAll = true;
    for (const opponent of ids) {
      if (id === opponent) continue;
      if (matrix[id][opponent] <= matrix[opponent][id]) {
        beatsAll = false;
        break;
      }
    }
    if (beatsAll) return id;
  }
  return null;
}

export function irv(ballots: Ballot[]): { rounds: IRVRound[]; winner: string } {
  const rounds: IRVRound[] = [];
  let remaining = Array.from(new Set(ballots.flatMap((b) => b.ranking)));

  const nextRound = () => {
    const tally: Record<string, number> = {};
    remaining.forEach((id) => (tally[id] = 0));

    ballots.forEach((b) => {
      const choice = b.ranking.find((id) => remaining.includes(id));
      if (choice) tally[choice] += 1;
    });

    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    const [leader, leaderVotes] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    if (leaderVotes > total / 2 || remaining.length === 1) {
      rounds.push({ tally, remaining: [...remaining] });
      return { winner: leader, finished: true };
    }

    const minVotes = Math.min(...Object.values(tally));
    const losers = Object.entries(tally)
      .filter(([, v]) => v === minVotes)
      .map(([id]) => id)
      .sort();
    const eliminated = losers[0]; // deterministic tie-break
    rounds.push({ tally, eliminated, remaining: [...remaining] });
    remaining = remaining.filter((id) => id !== eliminated);
    return { finished: false };
  };

  while (true) {
    const res = nextRound();
    if (res.finished) {
      return { rounds, winner: res.winner! };
    }
  }
}

export function simulateElection(
  candidates: Candidate[],
  voters: Voter[],
  topK: number
): RuleResults {
  const ballots = computeBallots(voters, candidates);
  const pluralityResult = plurality(ballots);
  const approvalResult = approval(ballots, Math.max(1, Math.min(topK, candidates.length)));
  const matrix = pairwiseMatrix(ballots, candidates.map((c) => c.id));
  const condorcet = condorcetWinner(matrix);
  const irvResult = irv(ballots);

  return {
    plurality: pluralityResult,
    approval: approvalResult,
    condorcet: { matrix, winner: condorcet },
    irv: irvResult
  };
}

function winnersFromTally(tally: Record<string, number>): string[] {
  const max = Math.max(...Object.values(tally));
  return Object.entries(tally)
    .filter(([, v]) => v === max)
    .map(([id]) => id)
    .sort();
}

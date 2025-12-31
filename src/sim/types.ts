export type Cluster = {
  id: string;
  x: number;
  y: number;
  weight: number; // 0..1 relative weight
  spread: number; // std deviation
};

export type Candidate = {
  id: string;
  label: string;
  x: number;
  y: number;
};

export type Voter = {
  x: number;
  y: number;
};

export type Ballot = {
  ranking: string[]; // candidate ids sorted by preference
};

export type PairwiseMatrix = Record<string, Record<string, number>>;

export type IRVRound = {
  tally: Record<string, number>;
  eliminated?: string;
  remaining: string[];
};

export type RuleResults = {
  plurality: { tally: Record<string, number>; winners: string[] };
  approval: { tally: Record<string, number>; winners: string[]; topK: number };
  condorcet: { matrix: PairwiseMatrix; winner: string | null };
  irv: { rounds: IRVRound[]; winner: string };
};

import { create } from "zustand";
import { Candidate, Cluster, IRVRound, RuleResults, Voter } from "../sim/types";
import { LcgRng } from "../sim/rng";
import { sampleVoters, WORLD_MAX, WORLD_MIN } from "../sim/sampling";
import { simulateElection } from "../sim/voting";
import { Scenario, presets } from "./presets";

export type Selection =
  | { type: "cluster"; id: string }
  | { type: "candidate"; id: string }
  | null;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const defaultClusters: Cluster[] = [
  { id: "c1", x: -1.5, y: -1.0, weight: 0.45, spread: 0.6 },
  { id: "c2", x: 2.0, y: 1.5, weight: 0.35, spread: 0.7 }
];

const defaultCandidates: Candidate[] = [
  { id: "A", label: "A", x: -1.0, y: -1.0 },
  { id: "B", label: "B", x: 1.6, y: 1.2 }
];

export type AppState = {
  clusters: Cluster[];
  candidates: Candidate[];
  voters: Voter[];
  results: RuleResults | null;
  selection: Selection;
  nVoters: number;
  approvalK: number;
  densityMode: boolean;
  rngSeed: number;
  irvRoundIndex: number;
  irvRounds: IRVRound[];
  addCluster: (x: number, y: number) => void;
  addCandidate: (x: number, y: number) => void;
  select: (sel: Selection) => void;
  updateCluster: (id: string, patch: Partial<Cluster>) => void;
  updateCandidate: (id: string, patch: Partial<Candidate>) => void;
  deleteSelection: () => void;
  setNVoters: (n: number) => void;
  setApprovalK: (k: number) => void;
  setDensityMode: (d: boolean) => void;
  resample: (seed?: number) => void;
  setIrvRound: (idx: number | ((current: number) => number)) => void;
  loadScenario: (scenario: Scenario) => void;
};

function nextCandidateLabel(existing: Candidate[]): string {
  const used = new Set(existing.map((c) => c.label));
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < alphabet.length; i++) {
    const label = alphabet[i];
    if (!used.has(label)) return label;
  }
  return `C${existing.length + 1}`;
}

function runSimulation(
  clusters: Cluster[],
  candidates: Candidate[],
  nVoters: number,
  seed: number,
  approvalK = 2
) {
  const rng = new LcgRng(seed);
  const voters = sampleVoters(clusters, nVoters, rng);
  const results = candidates.length ? simulateElection(candidates, voters, approvalK) : null;
  return { voters, results };
}

export const useAppStore = create<AppState>((set, get) => ({
  clusters: defaultClusters,
  candidates: defaultCandidates,
  voters: [],
  results: null,
  selection: null,
  nVoters: 1200,
  approvalK: 2,
  densityMode: false,
  rngSeed: 42,
  irvRoundIndex: 0,
  irvRounds: [],

  addCluster: (x, y) =>
    set((state) => {
      const cluster: Cluster = {
        id: `cl-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        x: clamp(x, WORLD_MIN, WORLD_MAX),
        y: clamp(y, WORLD_MIN, WORLD_MAX),
        weight: 0.4,
        spread: 0.6
      };
      const { voters, results } = runSimulation(
        [...state.clusters, cluster],
        state.candidates,
        state.nVoters,
        state.rngSeed,
        state.approvalK
      );
      return {
        clusters: [...state.clusters, cluster],
        voters,
        results,
        irvRounds: results?.irv.rounds ?? [],
        irvRoundIndex: 0,
        selection: { type: "cluster", id: cluster.id }
      };
    }),

  addCandidate: (x, y) =>
    set((state) => {
      const candidate: Candidate = {
        id: nextCandidateLabel(state.candidates),
        label: nextCandidateLabel(state.candidates),
        x: clamp(x, WORLD_MIN, WORLD_MAX),
        y: clamp(y, WORLD_MIN, WORLD_MAX)
      };
      const { voters, results } = runSimulation(
        state.clusters,
        [...state.candidates, candidate],
        state.nVoters,
        state.rngSeed,
        state.approvalK
      );
      return {
        candidates: [...state.candidates, candidate],
        voters,
        results,
        irvRounds: results?.irv.rounds ?? [],
        irvRoundIndex: 0,
        selection: { type: "candidate", id: candidate.id }
      };
    }),

  select: (sel) => set({ selection: sel }),

  updateCluster: (id, patch) =>
    set((state) => {
      const clusters = state.clusters.map((c) =>
        c.id === id
          ? {
              ...c,
              ...patch,
              x: clamp(patch.x ?? c.x, WORLD_MIN, WORLD_MAX),
              y: clamp(patch.y ?? c.y, WORLD_MIN, WORLD_MAX),
              weight: clamp(patch.weight ?? c.weight, 0, 1),
              spread: clamp(patch.spread ?? c.spread, 0.05, 3)
            }
          : c
      );
      const { voters, results } = runSimulation(
        clusters,
        state.candidates,
        state.nVoters,
        state.rngSeed,
        state.approvalK
      );
      return { clusters, voters, results, irvRounds: results?.irv.rounds ?? [], irvRoundIndex: 0 };
    }),

  updateCandidate: (id, patch) =>
    set((state) => {
      const candidates = state.candidates.map((c) =>
        c.id === id
          ? {
              ...c,
              ...patch,
              x: clamp(patch.x ?? c.x, WORLD_MIN, WORLD_MAX),
              y: clamp(patch.y ?? c.y, WORLD_MIN, WORLD_MAX)
            }
          : c
      );
      const { voters, results } = runSimulation(
        state.clusters,
        candidates,
        state.nVoters,
        state.rngSeed,
        state.approvalK
      );
      return { candidates, voters, results, irvRounds: results?.irv.rounds ?? [], irvRoundIndex: 0 };
    }),

  deleteSelection: () =>
    set((state) => {
      if (!state.selection) return state;
      let clusters = state.clusters;
      let candidates = state.candidates;
      if (state.selection.type === "cluster") {
        clusters = clusters.filter((c) => c.id !== state.selection!.id);
      } else {
        candidates = candidates.filter((c) => c.id !== state.selection!.id);
      }
      const { voters, results } = runSimulation(
        clusters,
        candidates,
        state.nVoters,
        state.rngSeed,
        state.approvalK
      );
      return {
        clusters,
        candidates,
        selection: null,
        voters,
        results,
        irvRounds: results?.irv.rounds ?? [],
        irvRoundIndex: 0
      };
    }),

  setNVoters: (n) =>
    set((state) => {
      const { voters, results } = runSimulation(state.clusters, state.candidates, n, state.rngSeed, state.approvalK);
      return { nVoters: n, voters, results, irvRounds: results?.irv.rounds ?? [], irvRoundIndex: 0 };
    }),

  setApprovalK: (k) =>
    set((state) => {
      const boundedK = Math.max(1, Math.min(k, state.candidates.length || 1));
      const results = state.candidates.length
        ? simulateElection(state.candidates, state.voters, boundedK)
        : null;
      return { approvalK: boundedK, results, irvRounds: results?.irv.rounds ?? state.irvRounds };
    }),

  setDensityMode: (d) => set({ densityMode: d }),

  resample: (seed) =>
    set((state) => {
      const newSeed = seed ?? Math.floor(Math.random() * 100000);
      const { voters, results } = runSimulation(
        state.clusters,
        state.candidates,
        state.nVoters,
        newSeed,
        state.approvalK
      );
      return { rngSeed: newSeed, voters, results, irvRounds: results?.irv.rounds ?? [], irvRoundIndex: 0 };
    }),

  setIrvRound: (idx) =>
    set((state) => ({
      irvRoundIndex: typeof idx === "function" ? idx(state.irvRoundIndex) : idx
    })),

  loadScenario: (scenario) =>
    set((state) => {
      const seed = scenario.seed ?? state.rngSeed;
      const { voters, results } = runSimulation(
        scenario.clusters,
        scenario.candidates,
        state.nVoters,
        seed,
        state.approvalK
      );
      return {
        clusters: scenario.clusters,
        candidates: scenario.candidates,
        rngSeed: seed,
        voters,
        results,
        selection: null,
        irvRounds: results?.irv.rounds ?? [],
        irvRoundIndex: 0
      };
    })
}));

// prime initial sample once store is created
const { clusters, candidates, nVoters, rngSeed } = useAppStore.getState();
const initSim = runSimulation(clusters, candidates, nVoters, rngSeed);
useAppStore.setState({
  voters: initSim.voters,
  results: initSim.results,
  irvRounds: initSim.results?.irv.rounds ?? [],
  irvRoundIndex: 0
});

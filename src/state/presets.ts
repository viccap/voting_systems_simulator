import { Candidate, Cluster } from "../sim/types";

export type Scenario = {
  name: string;
  description: string;
  clusters: Cluster[];
  candidates: Candidate[];
  seed?: number;
};

export const presets: Scenario[] = [
  {
    name: "Plurality Split",
    description: "Two similar contenders split a majority cluster, letting an outsider win under plurality.",
    clusters: [
      { id: "c1", x: -0.5, y: 0.2, weight: 0.65, spread: 0.5 },
      { id: "c2", x: 3.0, y: 0.5, weight: 0.25, spread: 0.6 },
      { id: "c3", x: -3.0, y: -2.0, weight: 0.1, spread: 0.4 }
    ],
    candidates: [
      { id: "A", label: "A", x: -0.3, y: 0.25 },
      { id: "B", label: "B", x: 0.2, y: 0.3 },
      { id: "C", label: "C", x: 3.2, y: 0.3 }
    ],
    seed: 1337
  },
  {
    name: "IRV vs Condorcet",
    description: "Middle candidate is Condorcet winner but is eliminated early in IRV.",
    clusters: [
      { id: "c1", x: -3.0, y: 0.0, weight: 0.38, spread: 0.5 },
      { id: "c2", x: 3.0, y: 0.0, weight: 0.37, spread: 0.5 },
      { id: "c3", x: 0.0, y: 0.0, weight: 0.25, spread: 0.7 }
    ],
    candidates: [
      { id: "A", label: "A", x: -2.5, y: 0 },
      { id: "B", label: "B", x: 2.5, y: 0 },
      { id: "C", label: "C", x: 0, y: 0 }
    ],
    seed: 9
  },
  {
    name: "Approval Compromise",
    description: "Approval (top-2) favors a centrist compromise over polarized plurality leader.",
    clusters: [
      { id: "c1", x: -2.5, y: 0.5, weight: 0.45, spread: 0.55 },
      { id: "c2", x: 2.5, y: -0.3, weight: 0.35, spread: 0.55 },
      { id: "c3", x: 0.0, y: 0.0, weight: 0.2, spread: 0.6 }
    ],
    candidates: [
      { id: "A", label: "A", x: -2.2, y: 0.4 },
      { id: "B", label: "B", x: 2.4, y: -0.2 },
      { id: "C", label: "C", x: 0.0, y: 0.1 }
    ],
    seed: 2024
  }
];

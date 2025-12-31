import { useMemo, CSSProperties } from "react";
import { useAppStore } from "../state/store";
import { RuleResults } from "../sim/types";

export default function ResultsPanel() {
  const results = useAppStore((s) => s.results);
  const candidates = useAppStore((s) => s.candidates);

  const name = (id: string) => candidates.find((c) => c.id === id)?.label ?? id;

  if (!results || candidates.length === 0) {
    return (
      <div className="panel">
        <h2>Results</h2>
        <p>Add candidates to see election results.</p>
      </div>
    );
  }

  const summary = summarize(results, name);

  return (
    <div className="panel">
      <h2>Results</h2>
      <div className="mini-grid">
        {summary.map((row) => (
          <div key={row.title} className="list-item">
            <div>
              <div className="badge">{row.title}</div>
              <div>{row.detail}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <strong>{row.winners}</strong>
            </div>
          </div>
        ))}
      </div>
      <PairwiseTable results={results} name={name} />
    </div>
  );
}

function summarize(results: RuleResults, name: (id: string) => string) {
  return [
    {
      title: "Plurality",
      winners: results.plurality.winners.map(name).join(", "),
      detail: formatTally(results.plurality.tally, name)
    },
    {
      title: `Approval k=${results.approval.topK}`,
      winners: results.approval.winners.map(name).join(", "),
      detail: formatTally(results.approval.tally, name)
    },
    {
      title: "Condorcet",
      winners: results.condorcet.winner ? name(results.condorcet.winner) : "None",
      detail: "Pairwise matrix"
    },
    {
      title: "IRV",
      winners: name(results.irv.winner),
      detail: `${results.irv.rounds.length} rounds`
    }
  ];
}

function formatTally(tally: Record<string, number>, name: (id: string) => string) {
  return Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .map(([id, v]) => `${name(id)} ${v}`)
    .join(" · ");
}

function PairwiseTable({ results, name }: { results: RuleResults; name: (id: string) => string }) {
  const ids = useMemo(() => Object.keys(results.condorcet.matrix), [results]);
  if (!ids.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      <div className="badge">Condorcet pairwise</div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", marginTop: 6 }}>
          <thead>
            <tr>
              <th></th>
              {ids.map((id) => (
                <th key={id} style={cellStyle}>
                  {name(id)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ids.map((row) => (
              <tr key={row}>
                <th style={cellStyle}>{name(row)}</th>
                {ids.map((col) => (
                  <td key={col} style={cellStyle}>
                    {row === col ? "—" : results.condorcet.matrix[row][col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellStyle: CSSProperties = {
  padding: "4px 8px",
  border: "1px solid #e2e8f0",
  textAlign: "center"
};

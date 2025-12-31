import { useAppStore } from "../state/store";
import { Candidate, RuleResults } from "../sim/types";
import { colorForCandidate } from "../render/colors";

export default function ControlsPanel() {
  const nVoters = useAppStore((s) => s.nVoters);
  const densityMode = useAppStore((s) => s.densityMode);
  const approvalK = useAppStore((s) => s.approvalK);
  const candidates = useAppStore((s) => s.candidates);
  const results = useAppStore((s) => s.results);
  const setNVoters = useAppStore((s) => s.setNVoters);
  const setDensityMode = useAppStore((s) => s.setDensityMode);
  const setApprovalK = useAppStore((s) => s.setApprovalK);
  const resample = useAppStore((s) => s.resample);
  const rngSeed = useAppStore((s) => s.rngSeed);

  return (
    <div className="panel">
      <h2>Live Preview</h2>
      <div className="row">
        <label>nVoters</label>
        <input
          className="slider"
          type="range"
          min={200}
          max={20000}
          step={100}
          value={nVoters}
          onChange={(e) => setNVoters(Number(e.target.value))}
        />
        <span>{nVoters}</span>
      </div>
      <div className="row">
        <label>Approval top-k</label>
        <input
          type="number"
          min={1}
          max={Math.max(1, candidates.length)}
          value={approvalK}
          onChange={(e) => setApprovalK(Number(e.target.value))}
          style={{ width: 80 }}
        />
      </div>
      <div className="row">
        <label>Density mode</label>
        <input type="checkbox" checked={densityMode} onChange={(e) => setDensityMode(e.target.checked)} />
      </div>
      <div className="row">
        <label>Seed</label>
        <span className="badge">#{rngSeed}</span>
        <button onClick={() => resample()}>Resample</button>
      </div>
      <VoteBars results={results} candidates={candidates} />
    </div>
  );
}

function VoteBars({ results, candidates }: { results: RuleResults | null; candidates: Candidate[] }) {
  if (!results || !candidates.length) {
    return <p style={{ marginTop: 8, color: "#64748b" }}>Add candidates to see vote totals.</p>;
  }

  const tally = results.plurality.tally;
  const maxVotes = Math.max(...Object.values(tally), 1);
  const maxBarHeight = 170; // px

  return (
    <div style={{ marginTop: 12 }}>
      <div className="badge">Plurality counts</div>
      <div className="bar-chart">
        {candidates.map((c) => {
          const votes = tally[c.id] ?? 0;
          const heightPx = (votes / maxVotes) * maxBarHeight;
          return (
            <div key={c.id} className="bar-column">
              <div
                className="bar"
                style={{
                  height: Math.max(6, heightPx),
                  background: `linear-gradient(135deg, ${colorForCandidate(c.id, candidates)}, #0f172a)`
                }}
                title={`${c.label}: ${votes} votes`}
              >
                <span className="bar-value">{votes}</span>
              </div>
              <div className="bar-label">{c.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

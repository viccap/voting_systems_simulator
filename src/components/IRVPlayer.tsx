import { useEffect, useState } from "react";
import { useAppStore } from "../state/store";
import { IRVRound } from "../sim/types";

export default function IRVPlayer() {
  const rounds = useAppStore((s) => s.irvRounds);
  const idx = useAppStore((s) => s.irvRoundIndex);
  const setIdx = useAppStore((s) => s.setIrvRound);
  const candidates = useAppStore((s) => s.candidates);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // rounds per second

  useEffect(() => {
    setIdx(0);
    setPlaying(false);
  }, [rounds.length, setIdx]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setIdx((curr) => {
        if (curr >= rounds.length - 1) {
          setPlaying(false);
          return curr;
        }
        return curr + 1;
      });
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [playing, speed, rounds.length, setIdx]);

  if (!rounds.length || candidates.length === 0) {
    return (
      <div className="panel">
        <h2>IRV Animation</h2>
        <p>Add candidates to animate IRV rounds.</p>
      </div>
    );
  }

  const round = rounds[idx];
  const name = (id: string) => candidates.find((c) => c.id === id)?.label ?? id;

  return (
    <div className="panel">
      <h2>IRV Animation</h2>
      <div className="row">
        <button onClick={() => setPlaying((p) => !p)} className="primary">
          {playing ? "Pause" : "Play"}
        </button>
        <button onClick={() => setIdx(Math.max(0, idx - 1))}>Prev</button>
        <button onClick={() => setIdx(Math.min(rounds.length - 1, idx + 1))}>Next</button>
        <div>
          Round {idx + 1} / {rounds.length}
        </div>
      </div>
      <div className="row">
        <label>Speed</label>
        <input
          type="range"
          min={0.25}
          max={4}
          step={0.25}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
        <span>{speed.toFixed(2)}x</span>
      </div>
      <RoundTable
        round={round}
        name={name}
        next={idx < rounds.length - 1 ? rounds[idx + 1] : undefined}
        remaining={round.remaining}
      />
    </div>
  );
}

function RoundTable({
  round,
  next,
  name,
  remaining
}: {
  round: IRVRound;
  next?: IRVRound;
  remaining: string[];
  name: (id: string) => string;
}) {
  const entries = Object.entries(round.tally).sort((a, b) => b[1] - a[1]);
  const redistribution =
    next && round.eliminated
      ? remaining
          .filter((id) => id !== round.eliminated)
          .map((id) => ({ id, delta: (next.tally[id] ?? 0) - (round.tally[id] ?? 0) }))
      : [];

  return (
    <div className="list" style={{ marginTop: 8 }}>
      {entries.map(([id, v]) => (
        <div key={id} className="list-item">
          <div>
            <span className="badge">{name(id)}</span>
          </div>
          <div>{v}</div>
        </div>
      ))}
      {round.eliminated && (
        <div>
          Eliminated: <strong>{name(round.eliminated)}</strong>
        </div>
      )}
      {redistribution.length > 0 && (
        <div>
          Redistribution to remaining:
          {redistribution.map((r) => (
            <span key={r.id} style={{ marginLeft: 6 }}>
              {name(r.id)} {r.delta >= 0 ? "+" : ""}
              {r.delta}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

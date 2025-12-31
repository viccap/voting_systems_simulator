import { useRef } from "react";
import { presets, Scenario } from "../state/presets";
import { useAppStore } from "../state/store";

export default function PresetsPanel() {
  const loadScenario = useAppStore((s) => s.loadScenario);
  const clusters = useAppStore((s) => s.clusters);
  const candidates = useAppStore((s) => s.candidates);
  const rngSeed = useAppStore((s) => s.rngSeed);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const saveScenario = () => {
    const payload: Scenario = {
      name: "custom",
      description: "Saved from the UI",
      clusters,
      candidates,
      seed: rngSeed
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scenario.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Scenario;
        loadScenario(data);
      } catch (err) {
        alert("Invalid scenario JSON");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="panel">
      <h2>Scenarios</h2>
      <div className="list">
        {presets.map((p) => (
          <div key={p.name} className="list-item">
            <div>
              <div className="badge">{p.name}</div>
              <div>{p.description}</div>
            </div>
            <button onClick={() => loadScenario(p)}>Load</button>
          </div>
        ))}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <button onClick={saveScenario}>Save scenario</button>
        <button onClick={() => fileInput.current?.click()}>Load from file</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleLoad}
        />
      </div>
    </div>
  );
}

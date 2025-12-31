import CanvasBoard from "./render/CanvasBoard";
import ControlsPanel from "./components/ControlsPanel";
import SelectionPanel from "./components/SelectionPanel";
import ResultsPanel from "./components/ResultsPanel";
import IRVPlayer from "./components/IRVPlayer";
import PresetsPanel from "./components/PresetsPanel";

export default function App() {
  return (
    <div className="app-shell">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <CanvasBoard />
        <ControlsPanel />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SelectionPanel />
        <ResultsPanel />
        <IRVPlayer />
        <PresetsPanel />
      </div>
    </div>
  );
}

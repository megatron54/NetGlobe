import { GlobeView } from "./components/GlobeView";
import { ConnectionPanel } from "./components/ConnectionPanel";
import { StatsOverlay } from "./components/StatsOverlay";
import { useTraffic } from "./hooks/useTraffic";

function App() {
  const { connections, origin, stats, selectedConnection, setSelectedConnection } = useTraffic();

  return (
    <div className="w-screen h-screen bg-[#050810] overflow-hidden relative">
      {/* 3D Globe (background) */}
      <GlobeView
        connections={connections}
        origin={origin}
        selectedConnection={selectedConnection}
        onSelectConnection={setSelectedConnection}
      />

      {/* Left Sidebar */}
      <ConnectionPanel
        connections={connections}
        selected={selectedConnection}
        onSelect={setSelectedConnection}
      />

      {/* Stats HUD */}
      <StatsOverlay stats={stats} origin={origin} />
    </div>
  );
}

export default App;

import { Globe } from "./components/Globe";
import { ConnectionPanel } from "./components/ConnectionPanel";
import { StatsOverlay } from "./components/StatsOverlay";
import { useTraffic } from "./hooks/useTraffic";

function App() {
  const { connections, origin, stats, selectedConnection, setSelectedConnection } = useTraffic();

  return (
    <div className="w-screen h-screen bg-[#0a0e17] overflow-hidden relative font-mono">
      {/* Left Sidebar */}
      <ConnectionPanel
        connections={connections}
        selected={selectedConnection}
        onSelect={setSelectedConnection}
      />

      {/* 3D Globe */}
      <Globe
        connections={connections}
        origin={origin}
        selectedConnection={selectedConnection}
        onSelectConnection={setSelectedConnection}
      />

      {/* Stats HUD */}
      <StatsOverlay stats={stats} origin={origin} />
    </div>
  );
}

export default App;

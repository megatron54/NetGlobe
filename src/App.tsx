import GlobeView from './components/GlobeView';
import ConnectionList from './components/ConnectionList';
import StatsPanel from './components/StatsPanel';
import { useTraffic } from './hooks/useTraffic';

export default function App() {
  const { connections, origin, stats, captureActive, error } = useTraffic();

  return (
    <div className="w-screen h-screen bg-[#040810] overflow-hidden relative">
      {/* 3D Globe */}
      <GlobeView connections={connections} origin={origin} />

      {/* UI Overlays */}
      <ConnectionList connections={connections} />
      <StatsPanel stats={stats} origin={origin} captureActive={captureActive} />

      {/* Error banner */}
      {error && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
          <span className="text-red-400 text-xs">{error}</span>
        </div>
      )}
    </div>
  );
}

import GlobeView from './components/GlobeView';
import ConnectionList from './components/ConnectionList';
import StatsPanel from './components/StatsPanel';
import { useTraffic } from './hooks/useTraffic';

export default function App() {
  const { connections, origin, stats } = useTraffic();

  return (
    <div className="w-screen h-screen bg-[#040810] overflow-hidden relative">
      {/* 3D Globe */}
      <GlobeView connections={connections} origin={origin} />

      {/* UI Overlays */}
      <ConnectionList connections={connections} />
      <StatsPanel stats={stats} origin={origin} />
    </div>
  );
}

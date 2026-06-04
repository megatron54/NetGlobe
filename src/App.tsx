import GlobeView from './components/GlobeView';
import ConnectionList from './components/ConnectionList';
import StatsPanel from './components/StatsPanel';
import { useTraffic } from './hooks/useTraffic';

export default function App() {
  const { connections, origin, stats } = useTraffic();

  return (
    <div className="w-screen h-screen bg-[#040810] overflow-hidden relative">
      {/* Globe layer (background) */}
      <div className="absolute inset-0 z-0">
        <GlobeView connections={connections} origin={origin} />
      </div>

      {/* UI layer (foreground) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <ConnectionList connections={connections} />
        </div>
        <div className="pointer-events-auto">
          <StatsPanel stats={stats} origin={origin} />
        </div>
      </div>
    </div>
  );
}

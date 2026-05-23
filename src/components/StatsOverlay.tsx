import { Stats, OriginLocation } from "../types";

interface StatsOverlayProps {
  stats: Stats;
  origin: OriginLocation | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StatsOverlay({ stats, origin }: StatsOverlayProps) {
  return (
    <div className="absolute top-4 right-4 z-10 pointer-events-none">
      <div className="bg-[#0a0e17]/80 backdrop-blur-xl border border-cyan-500/20 rounded-lg p-4 min-w-[200px]">
        {/* Origin info */}
        {origin && (
          <div className="mb-3 pb-3 border-b border-cyan-500/10">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Origin</div>
            <div className="text-cyan-400 text-xs font-mono mt-0.5">{origin.ip}</div>
            <div className="text-gray-400 text-[10px]">
              {origin.city}, {origin.country}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="space-y-2">
          <StatRow label="Active" value={stats.activeConnections.toString()} color="text-cyan-400" />
          <StatRow label="Total" value={stats.totalConnections.toString()} color="text-gray-300" />
          <StatRow label="Bandwidth" value={formatBytes(stats.totalBytes)} color="text-amber-400" />
          <StatRow label="Packets/s" value={stats.packetsPerSecond.toString()} color="text-green-400" />
        </div>

        {/* Top Countries */}
        {stats.topCountries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-cyan-500/10">
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
              Top Destinations
            </div>
            {stats.topCountries.map((tc) => (
              <div key={tc.country} className="flex justify-between text-[10px] py-0.5">
                <span className="text-gray-400">{tc.country}</span>
                <span className="text-cyan-400">{tc.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-[10px] uppercase">{label}</span>
      <span className={`${color} text-xs font-mono`}>{value}</span>
    </div>
  );
}

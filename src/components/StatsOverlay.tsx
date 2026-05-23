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
    <div className="absolute top-4 right-4 z-20">
      <div className="rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-2xl shadow-2xl shadow-black/50 p-5 min-w-[220px]">
        {/* Origin info */}
        {origin && (
          <div className="mb-4 pb-4 border-b border-white/[0.06]">
            <div className="text-[10px] text-white/30 uppercase tracking-widest font-medium">Origin</div>
            <div className="text-cyan-400 text-xs font-mono mt-1">{origin.ip}</div>
            <div className="text-white/40 text-[11px] mt-0.5">
              {origin.city}, {origin.country}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="space-y-3">
          <StatRow label="Active" value={stats.activeConnections.toString()} color="text-cyan-400" />
          <StatRow label="Total" value={stats.totalConnections.toString()} color="text-white/70" />
          <StatRow label="Traffic" value={formatBytes(stats.totalBytes)} color="text-amber-400" />
          <StatRow label="Pkts/s" value={stats.packetsPerSecond.toString()} color="text-green-400" />
        </div>

        {/* Top Countries */}
        {stats.topCountries.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <div className="text-[10px] text-white/30 uppercase tracking-widest font-medium mb-2">
              Top Destinations
            </div>
            {stats.topCountries.map((tc) => (
              <div key={tc.country} className="flex justify-between items-center py-0.5">
                <span className="text-white/50 text-[11px]">{tc.country}</span>
                <span className="text-cyan-400/70 text-[11px] font-mono">{tc.count}</span>
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
      <span className="text-white/30 text-[10px] uppercase tracking-wider">{label}</span>
      <span className={`${color} text-sm font-mono font-medium`}>{value}</span>
    </div>
  );
}

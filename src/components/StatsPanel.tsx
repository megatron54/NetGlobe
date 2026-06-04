import type { TrafficStats, OriginLocation } from '../types';
import { formatBytes } from '../lib/protocol';

interface StatsPanelProps {
  stats: TrafficStats;
  origin: OriginLocation | null;
}

export default function StatsPanel({ stats, origin }: StatsPanelProps) {
  return (
    <div className="absolute top-4 right-4 z-20 w-[240px]">
      <div className="rounded-xl border border-white/[0.07] bg-[#0a0e18]/80 backdrop-blur-xl overflow-hidden">
        {/* Origin */}
        {origin && (
          <div className="px-5 pt-4 pb-3 border-b border-white/[0.05]">
            <div className="text-[9px] text-white/30 uppercase tracking-[0.15em] font-medium">Origin</div>
            <div className="text-sky-400 text-xs font-mono mt-1.5">{origin.ip}</div>
            <div className="text-white/35 text-[11px] mt-0.5">
              {origin.city}, {origin.country}
            </div>
          </div>
        )}

        {/* Status */}
        <div className="px-5 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/40">Live simulation</span>
        </div>

        {/* Metrics */}
        <div className="px-5 py-4 space-y-3">
          <MetricRow label="Active" value={String(stats.activeConnections)} accent="text-sky-400" />
          <MetricRow label="Total" value={String(stats.totalConnections)} accent="text-white/60" />
          <MetricRow label="Traffic" value={formatBytes(stats.totalBytes)} accent="text-amber-400" />
          <MetricRow label="Pkts/sec" value={String(stats.packetsPerSecond)} accent="text-emerald-400" />
        </div>

        {/* Top destinations */}
        {stats.topCountries.length > 0 && (
          <div className="px-5 pb-4 pt-1 border-t border-white/[0.05]">
            <div className="text-[9px] text-white/25 uppercase tracking-[0.15em] font-medium mb-2.5">
              Top destinations
            </div>
            <div className="space-y-1.5">
              {stats.topCountries.map((tc) => (
                <div key={tc.country} className="flex justify-between items-center">
                  <span className="text-white/40 text-[11px]">{tc.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-[3px] rounded-full bg-sky-500/30" style={{ width: `${Math.min(60, tc.count * 8)}px` }} />
                    <span className="text-sky-400/60 text-[10px] font-mono w-4 text-right">{tc.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/25 text-[10px] uppercase tracking-wider">{label}</span>
      <span className={`${accent} text-sm font-mono font-medium`}>{value}</span>
    </div>
  );
}

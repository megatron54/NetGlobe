import type { Connection } from '../types';
import { getProtocolLabel, getProtocolHex, formatBytes, formatTimeAgo } from '../lib/protocol';

interface ConnectionListProps {
  connections: Connection[];
}

export default function ConnectionList({ connections }: ConnectionListProps) {
  return (
    <div className="absolute left-4 top-4 bottom-4 w-[340px] z-20 flex flex-col rounded-xl overflow-hidden border border-white/[0.07] bg-[#0a0e18]/80 backdrop-blur-xl">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-sky-400" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-sky-400 animate-ping opacity-40" />
          </div>
          <h1 className="text-white text-[13px] font-semibold tracking-wide">NetGlobe</h1>
        </div>
        <p className="text-white/30 text-[11px] mt-1.5 ml-5">
          {connections.length > 0
            ? `${connections.length} active connections`
            : 'Monitoring network traffic'}
        </p>
      </div>

      {/* Protocol legend */}
      <div className="px-5 py-2.5 border-b border-white/[0.04] flex items-center gap-3 text-[10px]">
        <LegendDot color="#38bdf8" label="HTTPS" />
        <LegendDot color="#fbbf24" label="DNS" />
        <LegendDot color="#a78bfa" label="UDP" />
        <LegendDot color="#34d399" label="TCP" />
      </div>

      {/* Connection list */}
      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/20 text-xs gap-3">
            <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400/40 animate-pulse" />
            </div>
            <span>Listening for packets...</span>
          </div>
        ) : (
          <div className="py-1">
            {connections.map((conn) => (
              <ConnectionRow key={conn.id} conn={conn} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
        <span className="text-[10px] text-white/25">
          {connections.reduce((sum, c) => sum + c.packets, 0)} packets captured
        </span>
        <span className="text-[10px] text-white/25">
          {formatBytes(connections.reduce((sum, c) => sum + c.bytes, 0))}
        </span>
      </div>
    </div>
  );
}

function ConnectionRow({ conn }: { conn: Connection }) {
  const color = getProtocolHex(conn.protocol, conn.port);
  const label = getProtocolLabel(conn.protocol, conn.port);
  const city = conn.location.city !== 'Unknown' ? conn.location.city : '';
  const location = city ? `${city}, ${conn.location.country}` : conn.location.country;

  return (
    <div className="group px-4 py-2.5 hover:bg-white/[0.03] transition-colors duration-100 border-l-2 border-transparent hover:border-l-sky-500/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="text-white/75 text-[11px] font-mono truncate">{conn.dst_ip}</span>
        </div>
        <span className="text-[10px] font-mono shrink-0 ml-2" style={{ color }}>{label}</span>
      </div>
      <div className="flex items-center justify-between mt-1 ml-[14px]">
        <span className="text-white/25 text-[10px] truncate">{location}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-white/30 text-[10px] font-mono">{formatBytes(conn.bytes)}</span>
          <span className="text-white/20 text-[9px]">{formatTimeAgo(conn.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-white/40">{label}</span>
    </div>
  );
}

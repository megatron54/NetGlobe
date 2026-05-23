import { Connection } from "../types";

interface ConnectionPanelProps {
  connections: Connection[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getProtocolBadgeColor(protocol: string, port: number): string {
  if (port === 443 || port === 80) return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
  if (port === 53) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  if (protocol === "UDP") return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  return "bg-green-500/20 text-green-400 border-green-500/30";
}

export function ConnectionPanel({ connections, selected, onSelect }: ConnectionPanelProps) {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-80 z-10 flex flex-col pointer-events-auto">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-500/20 bg-[#0a0e17]/90 backdrop-blur-xl">
        <h1 className="text-cyan-400 text-sm font-bold tracking-wider uppercase">
          NetGlobe
        </h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Live Network Traffic
        </p>
      </div>

      {/* Connection List */}
      <div className="flex-1 overflow-y-auto bg-[#0a0e17]/80 backdrop-blur-xl border-r border-cyan-500/10 scrollbar-thin">
        {connections.length === 0 ? (
          <div className="p-4 text-gray-600 text-xs text-center">
            Waiting for connections...
          </div>
        ) : (
          connections.map((conn) => (
            <div
              key={conn.id}
              onClick={() => onSelect(conn.id === selected ? null : conn.id)}
              className={`px-3 py-2 border-b border-white/5 cursor-pointer transition-colors hover:bg-cyan-500/5 ${
                conn.id === selected ? "bg-cyan-500/10 border-l-2 border-l-cyan-400" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-xs font-mono truncate max-w-[140px]">
                  {conn.dst_ip}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border ${getProtocolBadgeColor(
                    conn.protocol,
                    conn.port
                  )}`}
                >
                  {conn.port === 443 ? "HTTPS" : conn.port === 80 ? "HTTP" : conn.port === 53 ? "DNS" : `${conn.protocol}:${conn.port}`}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-500 text-[10px] truncate">
                  {conn.location.city}, {conn.location.country}
                </span>
                <span className="text-gray-500 text-[10px]">
                  {formatBytes(conn.bytes)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

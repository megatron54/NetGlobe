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

function getProtocolLabel(protocol: string, port: number): string {
  if (port === 443) return "HTTPS";
  if (port === 80) return "HTTP";
  if (port === 53) return "DNS";
  return `${protocol}:${port}`;
}

function getProtocolDotColor(protocol: string, port: number): string {
  if (port === 443 || port === 80) return "bg-cyan-400";
  if (port === 53) return "bg-amber-400";
  if (protocol === "UDP") return "bg-purple-400";
  return "bg-green-400";
}

export function ConnectionPanel({ connections, selected, onSelect }: ConnectionPanelProps) {
  return (
    <div className="absolute left-4 top-4 bottom-4 w-[320px] z-20 flex flex-col rounded-2xl overflow-hidden border border-white/[0.06] bg-black/40 backdrop-blur-2xl shadow-2xl shadow-black/50">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(79,195,247,0.8)]" />
          <h1 className="text-white text-sm font-semibold tracking-wide">
            NetGlobe
          </h1>
        </div>
        <p className="text-white/40 text-[11px] mt-1 ml-[18px]">
          Real-time network traffic
        </p>
      </div>

      {/* Connection List */}
      <div className="flex-1 overflow-y-auto">
        {connections.length === 0 ? (
          <div className="p-6 text-white/30 text-xs text-center">
            <div className="w-8 h-8 mx-auto mb-3 rounded-full border border-white/10 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-cyan-400/50 animate-pulse" />
            </div>
            Waiting for connections...
          </div>
        ) : (
          <div className="py-1">
            {connections.map((conn) => (
              <div
                key={conn.id}
                onClick={() => onSelect(conn.id === selected ? null : conn.id)}
                className={`px-4 py-2.5 cursor-pointer transition-all duration-150 border-l-2 ${
                  conn.id === selected
                    ? "bg-white/[0.06] border-l-cyan-400"
                    : "border-l-transparent hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${getProtocolDotColor(conn.protocol, conn.port)}`} />
                    <span className="text-white/80 text-[11px] font-mono">
                      {conn.dst_ip}
                    </span>
                  </div>
                  <span className="text-white/40 text-[10px] font-mono">
                    {getProtocolLabel(conn.protocol, conn.port)}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 ml-[14px]">
                  <span className="text-white/30 text-[10px]">
                    {conn.location.city !== "Unknown" ? `${conn.location.city}, ` : ""}{conn.location.country}
                  </span>
                  <span className="text-white/30 text-[10px] font-mono">
                    {formatBytes(conn.bytes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06] text-[10px] text-white/20 text-center">
        {connections.length} connections tracked
      </div>
    </div>
  );
}

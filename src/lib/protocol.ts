import type { ProtocolType } from '../types';

/** Classifies a connection into a protocol type for consistent color coding. */
export function classifyProtocol(protocol: string, port: number): ProtocolType {
  if (port === 443) return 'https';
  if (port === 80) return 'http';
  if (port === 53) return 'dns';
  if (protocol === 'UDP') return 'udp';
  if (protocol === 'TCP') return 'tcp';
  return 'other';
}

/** Protocol-to-color mapping (RGBA strings for globe.gl). */
const PROTOCOL_COLORS: Record<ProtocolType, string> = {
  https: 'rgba(56, 189, 248, 0.85)',   // sky-400
  http:  'rgba(56, 189, 248, 0.6)',    // sky-400 dimmer
  dns:   'rgba(251, 191, 36, 0.85)',   // amber-400
  udp:   'rgba(167, 139, 250, 0.85)',  // violet-400
  tcp:   'rgba(52, 211, 153, 0.85)',   // emerald-400
  other: 'rgba(148, 163, 184, 0.7)',   // slate-400
};

const PROTOCOL_HEX: Record<ProtocolType, string> = {
  https: '#38bdf8',
  http:  '#38bdf8',
  dns:   '#fbbf24',
  udp:   '#a78bfa',
  tcp:   '#34d399',
  other: '#94a3b8',
};

export function getProtocolColor(protocol: string, port: number): string {
  return PROTOCOL_COLORS[classifyProtocol(protocol, port)];
}

export function getProtocolHex(protocol: string, port: number): string {
  return PROTOCOL_HEX[classifyProtocol(protocol, port)];
}

/** Human-readable protocol label. */
export function getProtocolLabel(protocol: string, port: number): string {
  if (port === 443) return 'HTTPS';
  if (port === 80) return 'HTTP';
  if (port === 53) return 'DNS';
  if (port === 8080) return 'HTTP-ALT';
  if (protocol === 'UDP') return `UDP:${port}`;
  return `TCP:${port}`;
}

/** Format bytes to human-readable. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

/** Format a relative timestamp (seconds ago). */
export function formatTimeAgo(timestamp: number): string {
  const delta = Math.floor(Date.now() / 1000) - timestamp;
  if (delta < 5) return 'now';
  if (delta < 60) return `${delta}s ago`;
  if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
  return `${Math.floor(delta / 3600)}h ago`;
}

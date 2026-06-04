import { useState, useEffect, useRef, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { Connection, OriginLocation, TrafficStats } from '../types';

const CONNECTION_TTL_SECONDS = 30;
const STATS_INTERVAL_MS = 1000;

export function useTraffic() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [origin, setOrigin] = useState<OriginLocation | null>(null);
  const [stats, setStats] = useState<TrafficStats>({
    totalConnections: 0,
    activeConnections: 0,
    totalBytes: 0,
    packetsPerSecond: 0,
    topCountries: [],
    topProtocols: [],
  });
  const [captureActive, setCaptureActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionMap = useRef<Map<string, Connection>>(new Map());
  const ppsAccumulator = useRef(0);

  // Resolve origin IP on mount
  useEffect(() => {
    invoke<OriginLocation>('get_origin_location')
      .then((loc) => {
        setOrigin(loc);
      })
      .catch((e) => {
        console.warn('Origin resolution failed:', e);
        setOrigin({ ip: '0.0.0.0', lat: 40.42, lng: -3.70, city: 'Unknown', country: '--' });
      });
  }, []);

  // Subscribe to Rust backend events
  useEffect(() => {
    const unlistenConnections = listen<Connection[]>('connections', (event) => {
      setCaptureActive(true);
      const batch = event.payload;
      const map = connectionMap.current;

      for (const conn of batch) {
        map.set(conn.id, conn);
        ppsAccumulator.current += conn.packets;
      }

      pruneStale(map);
      setConnections(Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp));
    });

    const unlistenError = listen<string>('capture-error', (event) => {
      setError(event.payload);
    });

    return () => {
      unlistenConnections.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, []);

  // Compute stats on interval
  useEffect(() => {
    const interval = setInterval(() => {
      const all = Array.from(connectionMap.current.values());
      const now = Math.floor(Date.now() / 1000);
      const active = all.filter((c) => now - c.timestamp < 5);

      const countryMap: Record<string, number> = {};
      const protocolMap: Record<string, number> = {};
      let totalBytes = 0;

      for (const conn of all) {
        countryMap[conn.location.country] = (countryMap[conn.location.country] || 0) + 1;
        const proto = conn.port === 443 ? 'HTTPS' : conn.port === 53 ? 'DNS' : conn.protocol;
        protocolMap[proto] = (protocolMap[proto] || 0) + 1;
        totalBytes += conn.bytes;
      }

      setStats({
        totalConnections: all.length,
        activeConnections: active.length,
        totalBytes,
        packetsPerSecond: ppsAccumulator.current,
        topCountries: Object.entries(countryMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([country, count]) => ({ country, count })),
        topProtocols: Object.entries(protocolMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 4)
          .map(([protocol, count]) => ({ protocol, count })),
      });

      ppsAccumulator.current = 0;
    }, STATS_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Mock data fallback for development / when capture fails
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!captureActive && connectionMap.current.size === 0) {
        startMockFeed();
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [captureActive]);

  const startMockFeed = useCallback(() => {
    let idx = 0;
    const interval = setInterval(() => {
      const conn = generateMock(idx++);
      const map = connectionMap.current;
      map.set(conn.id, conn);

      // Simulate activity on existing connections
      const now = Math.floor(Date.now() / 1000);
      for (const [, c] of map) {
        if (Math.random() > 0.6) {
          c.bytes += Math.floor(Math.random() * 8000) + 500;
          c.packets += Math.floor(Math.random() * 15) + 1;
          c.timestamp = now;
        }
      }

      pruneStale(map);
      ppsAccumulator.current += Math.floor(Math.random() * 60) + 20;
      setConnections(Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp));
    }, 600);

    return () => clearInterval(interval);
  }, []);

  return { connections, origin, stats, captureActive, error };
}

function pruneStale(map: Map<string, Connection>) {
  const now = Math.floor(Date.now() / 1000);
  for (const [key, conn] of map) {
    if (now - conn.timestamp > CONNECTION_TTL_SECONDS) {
      map.delete(key);
    }
  }
}

// --- Mock data for dev/demo ---

const MOCK_DESTINATIONS = [
  { ip: '142.250.185.14', lat: 37.41, lng: -122.08, country: 'United States', city: 'Mountain View', port: 443, protocol: 'TCP' },
  { ip: '104.244.42.65', lat: 37.77, lng: -122.42, country: 'United States', city: 'San Francisco', port: 443, protocol: 'TCP' },
  { ip: '52.84.225.100', lat: 47.61, lng: -122.33, country: 'United States', city: 'Seattle', port: 443, protocol: 'TCP' },
  { ip: '185.199.108.153', lat: 52.37, lng: 4.90, country: 'Netherlands', city: 'Amsterdam', port: 443, protocol: 'TCP' },
  { ip: '151.101.1.140', lat: 51.51, lng: -0.13, country: 'United Kingdom', city: 'London', port: 443, protocol: 'TCP' },
  { ip: '172.217.16.206', lat: 50.11, lng: 8.68, country: 'Germany', city: 'Frankfurt', port: 443, protocol: 'TCP' },
  { ip: '13.107.42.14', lat: 47.67, lng: -122.12, country: 'United States', city: 'Redmond', port: 443, protocol: 'TCP' },
  { ip: '157.240.1.35', lat: 37.48, lng: -122.15, country: 'United States', city: 'Menlo Park', port: 443, protocol: 'TCP' },
  { ip: '198.41.128.1', lat: 34.05, lng: -118.24, country: 'United States', city: 'Los Angeles', port: 53, protocol: 'UDP' },
  { ip: '1.1.1.1', lat: -33.87, lng: 151.21, country: 'Australia', city: 'Sydney', port: 53, protocol: 'UDP' },
  { ip: '8.8.8.8', lat: 37.39, lng: -122.08, country: 'United States', city: 'Mountain View', port: 53, protocol: 'UDP' },
  { ip: '103.235.46.39', lat: 35.68, lng: 139.65, country: 'Japan', city: 'Tokyo', port: 443, protocol: 'TCP' },
  { ip: '31.13.72.36', lat: 19.43, lng: -99.13, country: 'Mexico', city: 'Mexico City', port: 443, protocol: 'TCP' },
  { ip: '200.174.62.1', lat: -23.55, lng: -46.63, country: 'Brazil', city: 'Sao Paulo', port: 443, protocol: 'TCP' },
  { ip: '41.63.96.0', lat: -26.20, lng: 28.05, country: 'South Africa', city: 'Johannesburg', port: 443, protocol: 'TCP' },
  { ip: '103.4.96.2', lat: 1.35, lng: 103.82, country: 'Singapore', city: 'Singapore', port: 443, protocol: 'TCP' },
  { ip: '182.161.64.1', lat: 37.57, lng: 126.98, country: 'South Korea', city: 'Seoul', port: 8080, protocol: 'TCP' },
  { ip: '5.135.0.1', lat: 48.86, lng: 2.35, country: 'France', city: 'Paris', port: 443, protocol: 'TCP' },
  { ip: '94.130.110.1', lat: 49.45, lng: 11.08, country: 'Germany', city: 'Nuremberg', port: 3478, protocol: 'UDP' },
  { ip: '45.33.32.156', lat: 40.83, lng: -74.13, country: 'United States', city: 'Newark', port: 80, protocol: 'TCP' },
];

function generateMock(index: number): Connection {
  const dest = MOCK_DESTINATIONS[index % MOCK_DESTINATIONS.length]!;
  return {
    id: `${dest.ip}:${dest.protocol}:${dest.port}`,
    dst_ip: dest.ip,
    protocol: dest.protocol,
    port: dest.port,
    location: { lat: dest.lat, lng: dest.lng, country: dest.country, city: dest.city },
    bytes: Math.floor(Math.random() * 60000) + 2000,
    packets: Math.floor(Math.random() * 120) + 10,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

import { useState, useEffect, useRef } from 'react';
import type { Connection, OriginLocation, TrafficStats } from '../types';

const STATS_INTERVAL_MS = 1000;
const TICK_INTERVAL_MS = 500;
const MAX_CONNECTIONS = 30;

/**
 * Simulates realistic network traffic patterns for visualization.
 * Connections appear gradually, update their byte/packet counts, and expire.
 */
export function useTraffic() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [origin] = useState<OriginLocation>({
    ip: '83.45.128.72',
    lat: 39.47,
    lng: -0.38,
    city: 'Valencia',
    country: 'Spain',
  });
  const [stats, setStats] = useState<TrafficStats>({
    totalConnections: 0,
    activeConnections: 0,
    totalBytes: 0,
    packetsPerSecond: 0,
    topCountries: [],
    topProtocols: [],
  });

  const connectionMap = useRef<Map<string, Connection>>(new Map());
  const tickRef = useRef(0);
  const ppsAccumulator = useRef(0);

  // Simulation loop: add new connections, update existing ones, expire old ones
  useEffect(() => {
    const interval = setInterval(() => {
      const map = connectionMap.current;
      const now = Math.floor(Date.now() / 1000);
      tickRef.current++;

      // Add 1-2 new connections every few ticks
      if (tickRef.current % 2 === 0 && map.size < MAX_CONNECTIONS) {
        const count = Math.random() > 0.6 ? 2 : 1;
        for (let i = 0; i < count; i++) {
          const conn = generateConnection(now);
          map.set(conn.id, conn);
        }
      }

      // Update existing connections (simulate ongoing traffic)
      for (const [, conn] of map) {
        if (Math.random() > 0.4) {
          const byteDelta = Math.floor(Math.random() * 12000) + 500;
          const packetDelta = Math.floor(Math.random() * 20) + 1;
          conn.bytes += byteDelta;
          conn.packets += packetDelta;
          conn.timestamp = now;
          ppsAccumulator.current += packetDelta;
        }
      }

      // Expire old connections
      for (const [key, conn] of map) {
        if (now - conn.timestamp > 15 + Math.random() * 10) {
          map.delete(key);
        }
      }

      setConnections(
        Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp),
      );
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Stats computation
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

  return { connections, origin, stats };
}

// --- Destination pool ---

const DESTINATIONS = [
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
  { ip: '176.34.135.167', lat: 53.35, lng: -6.26, country: 'Ireland', city: 'Dublin', port: 443, protocol: 'TCP' },
  { ip: '54.239.28.85', lat: 1.28, lng: 103.85, country: 'Singapore', city: 'Singapore', port: 443, protocol: 'TCP' },
  { ip: '23.215.0.138', lat: 59.33, lng: 18.07, country: 'Sweden', city: 'Stockholm', port: 443, protocol: 'TCP' },
  { ip: '162.125.66.1', lat: 37.39, lng: -122.08, country: 'United States', city: 'San Jose', port: 443, protocol: 'TCP' },
];

let connCounter = 0;

function generateConnection(timestamp: number): Connection {
  const dest = DESTINATIONS[connCounter % DESTINATIONS.length]!;
  connCounter++;
  return {
    id: `${dest.ip}:${dest.protocol}:${dest.port}-${connCounter}`,
    dst_ip: dest.ip,
    protocol: dest.protocol,
    port: dest.port,
    location: { lat: dest.lat, lng: dest.lng, country: dest.country, city: dest.city },
    bytes: Math.floor(Math.random() * 30000) + 2000,
    packets: Math.floor(Math.random() * 80) + 5,
    timestamp,
  };
}

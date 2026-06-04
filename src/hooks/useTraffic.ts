import { useState, useEffect, useRef, useCallback } from 'react';
import type { Connection, OriginLocation, TrafficStats } from '../types';

const TICK_MS = 350;
const MAX_CONNECTIONS = 50;
const INITIAL_BURST = 15;

/**
 * Aggressive real-time network traffic simulation.
 * Dozens of connections cycling constantly across the globe.
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


  const spawnConnections = useCallback((count: number) => {
    const map = connectionMap.current;
    const now = Math.floor(Date.now() / 1000);
    for (let i = 0; i < count; i++) {
      if (map.size >= MAX_CONNECTIONS) break;
      const conn = generateConnection(now);
      map.set(conn.id, conn);
    }
  }, []);

  // Initial burst — immediately fill the globe with activity
  useEffect(() => {
    spawnConnections(INITIAL_BURST);
    setConnections(Array.from(connectionMap.current.values()));
  }, [spawnConnections]);

  // Main simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      const map = connectionMap.current;
      const now = Math.floor(Date.now() / 1000);
      tickRef.current++;

      // Spawn 2-4 connections every tick
      const spawnCount = map.size < 20 ? 4 : map.size < 35 ? 3 : 2;
      if (map.size < MAX_CONNECTIONS) {
        for (let i = 0; i < spawnCount; i++) {
          if (map.size >= MAX_CONNECTIONS) break;
          const conn = generateConnection(now);
          map.set(conn.id, conn);
        }
      }

      // Simulate ongoing data transfer
      for (const [, conn] of map) {
        if (Math.random() > 0.25) {
          const byteDelta = Math.floor(Math.random() * 50000) + 2000;
          const packetDelta = Math.floor(Math.random() * 40) + 3;
          conn.bytes += byteDelta;
          conn.packets += packetDelta;
          conn.timestamp = now;
          ppsAccumulator.current += packetDelta;
        }
      }

      // Expire connections (lifespan 8-18 seconds for fast cycling)
      for (const [key, conn] of map) {
        const age = now - conn.timestamp;
        const lifespan = 8 + (hashCode(conn.id) % 10);
        if (age > lifespan) {
          map.delete(key);
        }
      }

      setConnections(
        Array.from(map.values()).sort((a, b) => b.timestamp - a.timestamp),
      );
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  // Stats
  useEffect(() => {
    const interval = setInterval(() => {
      const all = Array.from(connectionMap.current.values());
      const now = Math.floor(Date.now() / 1000);
      const active = all.filter((c) => now - c.timestamp < 5);

      const countryMap: Record<string, number> = {};
      const protocolMap: Record<string, number> = {};
      let totalBytes = 0;

      for (const conn of all) {
        countryMap[conn.location.country] =
          (countryMap[conn.location.country] || 0) + 1;
        const proto =
          conn.port === 443
            ? 'HTTPS'
            : conn.port === 80
              ? 'HTTP'
              : conn.port === 53
                ? 'DNS'
                : conn.protocol;
        protocolMap[proto] = (protocolMap[proto] || 0) + 1;
        totalBytes += conn.bytes;
      }

      setStats({
        totalConnections: totalGeneratedCounter,
        activeConnections: active.length,
        totalBytes,
        packetsPerSecond: Math.round(ppsAccumulator.current * (1000 / 800)),
        topCountries: Object.entries(countryMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([country, count]) => ({ country, count })),
        topProtocols: Object.entries(protocolMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([protocol, count]) => ({ protocol, count })),
      });

      ppsAccumulator.current = 0;
    }, 800);

    return () => clearInterval(interval);
  }, []);

  return { connections, origin, stats };
}

// --- Destination pool: 40 servers worldwide for diverse coverage ---

const DESTINATIONS = [
  // North America
  { ip: '142.250.185.14', lat: 37.41, lng: -122.08, country: 'United States', city: 'Mountain View', port: 443, protocol: 'TCP' },
  { ip: '104.244.42.65', lat: 37.77, lng: -122.42, country: 'United States', city: 'San Francisco', port: 443, protocol: 'TCP' },
  { ip: '52.84.225.100', lat: 47.61, lng: -122.33, country: 'United States', city: 'Seattle', port: 443, protocol: 'TCP' },
  { ip: '13.107.42.14', lat: 47.67, lng: -122.12, country: 'United States', city: 'Redmond', port: 443, protocol: 'TCP' },
  { ip: '157.240.1.35', lat: 37.48, lng: -122.15, country: 'United States', city: 'Menlo Park', port: 443, protocol: 'TCP' },
  { ip: '198.41.128.1', lat: 34.05, lng: -118.24, country: 'United States', city: 'Los Angeles', port: 53, protocol: 'UDP' },
  { ip: '8.8.8.8', lat: 37.39, lng: -122.08, country: 'United States', city: 'Mountain View', port: 53, protocol: 'UDP' },
  { ip: '45.33.32.156', lat: 40.83, lng: -74.13, country: 'United States', city: 'Newark', port: 80, protocol: 'TCP' },
  { ip: '162.125.66.1', lat: 37.39, lng: -122.08, country: 'United States', city: 'San Jose', port: 443, protocol: 'TCP' },
  { ip: '35.186.224.47', lat: 33.75, lng: -84.39, country: 'United States', city: 'Atlanta', port: 443, protocol: 'TCP' },
  { ip: '99.84.191.2', lat: 39.96, lng: -83.00, country: 'United States', city: 'Columbus', port: 443, protocol: 'TCP' },
  { ip: '205.251.242.103', lat: 45.50, lng: -73.57, country: 'Canada', city: 'Montreal', port: 443, protocol: 'TCP' },
  // Europe
  { ip: '185.199.108.153', lat: 52.37, lng: 4.90, country: 'Netherlands', city: 'Amsterdam', port: 443, protocol: 'TCP' },
  { ip: '151.101.1.140', lat: 51.51, lng: -0.13, country: 'United Kingdom', city: 'London', port: 443, protocol: 'TCP' },
  { ip: '172.217.16.206', lat: 50.11, lng: 8.68, country: 'Germany', city: 'Frankfurt', port: 443, protocol: 'TCP' },
  { ip: '94.130.110.1', lat: 49.45, lng: 11.08, country: 'Germany', city: 'Nuremberg', port: 3478, protocol: 'UDP' },
  { ip: '5.135.0.1', lat: 48.86, lng: 2.35, country: 'France', city: 'Paris', port: 443, protocol: 'TCP' },
  { ip: '176.34.135.167', lat: 53.35, lng: -6.26, country: 'Ireland', city: 'Dublin', port: 443, protocol: 'TCP' },
  { ip: '23.215.0.138', lat: 59.33, lng: 18.07, country: 'Sweden', city: 'Stockholm', port: 443, protocol: 'TCP' },
  { ip: '195.22.26.248', lat: 41.89, lng: 12.48, country: 'Italy', city: 'Rome', port: 443, protocol: 'TCP' },
  { ip: '82.114.67.1', lat: 55.76, lng: 37.62, country: 'Russia', city: 'Moscow', port: 443, protocol: 'TCP' },
  { ip: '89.187.161.15', lat: 50.08, lng: 14.44, country: 'Czech Republic', city: 'Prague', port: 443, protocol: 'TCP' },
  { ip: '213.180.204.62', lat: 60.17, lng: 24.94, country: 'Finland', city: 'Helsinki', port: 443, protocol: 'TCP' },
  // Asia
  { ip: '103.235.46.39', lat: 35.68, lng: 139.65, country: 'Japan', city: 'Tokyo', port: 443, protocol: 'TCP' },
  { ip: '182.161.64.1', lat: 37.57, lng: 126.98, country: 'South Korea', city: 'Seoul', port: 8080, protocol: 'TCP' },
  { ip: '103.4.96.2', lat: 1.35, lng: 103.82, country: 'Singapore', city: 'Singapore', port: 443, protocol: 'TCP' },
  { ip: '54.239.28.85', lat: 1.28, lng: 103.85, country: 'Singapore', city: 'Singapore', port: 443, protocol: 'TCP' },
  { ip: '14.215.177.38', lat: 23.13, lng: 113.26, country: 'China', city: 'Guangzhou', port: 443, protocol: 'TCP' },
  { ip: '49.51.36.176', lat: 22.28, lng: 114.16, country: 'Hong Kong', city: 'Hong Kong', port: 443, protocol: 'TCP' },
  { ip: '115.127.235.1', lat: 28.61, lng: 77.21, country: 'India', city: 'New Delhi', port: 443, protocol: 'TCP' },
  { ip: '202.89.233.100', lat: 19.08, lng: 72.88, country: 'India', city: 'Mumbai', port: 443, protocol: 'TCP' },
  // Middle East
  { ip: '185.70.41.130', lat: 25.20, lng: 55.27, country: 'UAE', city: 'Dubai', port: 443, protocol: 'TCP' },
  { ip: '82.137.200.1', lat: 32.09, lng: 34.78, country: 'Israel', city: 'Tel Aviv', port: 443, protocol: 'TCP' },
  // South America
  { ip: '200.174.62.1', lat: -23.55, lng: -46.63, country: 'Brazil', city: 'Sao Paulo', port: 443, protocol: 'TCP' },
  { ip: '31.13.72.36', lat: 19.43, lng: -99.13, country: 'Mexico', city: 'Mexico City', port: 443, protocol: 'TCP' },
  { ip: '190.124.28.1', lat: -34.60, lng: -58.38, country: 'Argentina', city: 'Buenos Aires', port: 443, protocol: 'TCP' },
  // Africa
  { ip: '41.63.96.0', lat: -26.20, lng: 28.05, country: 'South Africa', city: 'Johannesburg', port: 443, protocol: 'TCP' },
  { ip: '196.216.2.1', lat: -1.29, lng: 36.82, country: 'Kenya', city: 'Nairobi', port: 443, protocol: 'TCP' },
  // Oceania
  { ip: '1.1.1.1', lat: -33.87, lng: 151.21, country: 'Australia', city: 'Sydney', port: 53, protocol: 'UDP' },
  { ip: '103.25.56.1', lat: -36.85, lng: 174.76, country: 'New Zealand', city: 'Auckland', port: 443, protocol: 'TCP' },
];

let connCounter = 0;

function generateConnection(timestamp: number): Connection {
  // Pick a random destination (not just sequential) for more visual variety
  const idx = Math.floor(Math.random() * DESTINATIONS.length);
  const dest = DESTINATIONS[idx]!;
  connCounter++;
  totalGeneratedCounter++;
  return {
    id: `conn-${connCounter}-${dest.ip}:${dest.port}`,
    dst_ip: dest.ip,
    protocol: dest.protocol,
    port: dest.port,
    location: { lat: dest.lat, lng: dest.lng, country: dest.country, city: dest.city },
    bytes: Math.floor(Math.random() * 80000) + 5000,
    packets: Math.floor(Math.random() * 150) + 10,
    timestamp,
  };
}

let totalGeneratedCounter = 0;

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

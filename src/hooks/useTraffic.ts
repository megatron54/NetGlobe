import { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Connection, OriginLocation, Stats } from "../types";

// Mock connections for visual testing / fallback when capture isn't working
const MOCK_DESTINATIONS = [
  { ip: "142.250.185.14", lat: 37.4056, lng: -122.0775, country: "United States", city: "Mountain View", port: 443, protocol: "TCP" },
  { ip: "104.244.42.65", lat: 37.7749, lng: -122.4194, country: "United States", city: "San Francisco", port: 443, protocol: "TCP" },
  { ip: "52.84.225.100", lat: 47.6062, lng: -122.3321, country: "United States", city: "Seattle", port: 443, protocol: "TCP" },
  { ip: "185.199.108.153", lat: 52.3676, lng: 4.9041, country: "Netherlands", city: "Amsterdam", port: 443, protocol: "TCP" },
  { ip: "151.101.1.140", lat: 51.5074, lng: -0.1278, country: "United Kingdom", city: "London", port: 443, protocol: "TCP" },
  { ip: "172.217.16.206", lat: 50.1109, lng: 8.6821, country: "Germany", city: "Frankfurt", port: 443, protocol: "TCP" },
  { ip: "13.107.42.14", lat: 47.6732, lng: -122.1215, country: "United States", city: "Redmond", port: 443, protocol: "TCP" },
  { ip: "157.240.1.35", lat: 37.4848, lng: -122.1484, country: "United States", city: "Menlo Park", port: 443, protocol: "TCP" },
  { ip: "198.41.128.1", lat: 34.0522, lng: -118.2437, country: "United States", city: "Los Angeles", port: 53, protocol: "UDP" },
  { ip: "1.1.1.1", lat: -33.8688, lng: 151.2093, country: "Australia", city: "Sydney", port: 53, protocol: "UDP" },
  { ip: "8.8.8.8", lat: 37.386, lng: -122.0838, country: "United States", city: "Mountain View", port: 53, protocol: "UDP" },
  { ip: "103.235.46.39", lat: 35.6762, lng: 139.6503, country: "Japan", city: "Tokyo", port: 443, protocol: "TCP" },
  { ip: "31.13.72.36", lat: 19.4326, lng: -99.1332, country: "Mexico", city: "Mexico City", port: 443, protocol: "TCP" },
  { ip: "200.174.62.1", lat: -23.5505, lng: -46.6333, country: "Brazil", city: "São Paulo", port: 443, protocol: "TCP" },
  { ip: "41.63.96.0", lat: -26.2041, lng: 28.0473, country: "South Africa", city: "Johannesburg", port: 443, protocol: "TCP" },
  { ip: "103.4.96.2", lat: 1.3521, lng: 103.8198, country: "Singapore", city: "Singapore", port: 443, protocol: "TCP" },
  { ip: "182.161.64.1", lat: 37.5665, lng: 126.978, country: "South Korea", city: "Seoul", port: 443, protocol: "TCP" },
  { ip: "5.135.0.1", lat: 48.8566, lng: 2.3522, country: "France", city: "Paris", port: 443, protocol: "TCP" },
];

function generateMockConnection(index: number): Connection {
  const dest = MOCK_DESTINATIONS[index % MOCK_DESTINATIONS.length];
  return {
    id: `mock-${dest.ip}:${dest.protocol}:${dest.port}`,
    dst_ip: dest.ip,
    protocol: dest.protocol,
    port: dest.port,
    location: {
      lat: dest.lat,
      lng: dest.lng,
      country: dest.country,
      city: dest.city,
    },
    bytes: Math.floor(Math.random() * 50000) + 1000,
    packets: Math.floor(Math.random() * 100) + 5,
    timestamp: Math.floor(Date.now() / 1000),
  };
}

export function useTraffic() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [origin, setOrigin] = useState<OriginLocation | null>({
    ip: "detecting...",
    lat: 39.4699,
    lng: -0.3763,
    city: "Valencia",
    country: "ES",
  });
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalConnections: 0,
    activeConnections: 0,
    totalBytes: 0,
    packetsPerSecond: 0,
    topCountries: [],
  });

  const connectionsRef = useRef<Map<string, Connection>>(new Map());
  const ppsCounter = useRef<number>(0);
  const hasRealData = useRef<boolean>(false);

  // Get origin location on mount
  useEffect(() => {
    invoke<OriginLocation>("get_origin_location")
      .then(setOrigin)
      .catch((e) => {
        console.error("Failed to get origin:", e);
        // Fallback origin (Valencia, Spain)
        setOrigin({
          ip: "0.0.0.0",
          lat: 39.4699,
          lng: -0.3763,
          city: "Valencia",
          country: "ES",
        });
      });
  }, []);

  // Listen to connection events from Rust
  useEffect(() => {
    const unlisten = listen<Connection[]>("connections", (event) => {
      hasRealData.current = true;
      const batch = event.payload;
      const map = connectionsRef.current;

      for (const conn of batch) {
        map.set(conn.id, conn);
        ppsCounter.current += conn.packets;
      }

      // Keep only connections from last 30 seconds
      const now = Math.floor(Date.now() / 1000);
      for (const [key, conn] of map) {
        if (now - conn.timestamp > 30) {
          map.delete(key);
        }
      }

      const allConns = Array.from(map.values()).sort(
        (a, b) => b.timestamp - a.timestamp
      );
      setConnections(allConns);
    });

    // Listen for capture errors
    const unlistenError = listen<string>("capture-error", (event) => {
      console.error("Capture error:", event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenError.then((fn) => fn());
    };
  }, []);

  // Mock data generator - adds connections gradually if no real data after 3s
  useEffect(() => {
    let mockInterval: ReturnType<typeof setInterval> | null = null;
    let mockIndex = 0;

    const timeout = setTimeout(() => {
      if (!hasRealData.current) {
        console.log("No real capture data, using mock connections");
        mockInterval = setInterval(() => {
          const conn = generateMockConnection(mockIndex++);
          const map = connectionsRef.current;
          map.set(conn.id, conn);

          // Update existing mock connections with new timestamps
          const now = Math.floor(Date.now() / 1000);
          for (const [key, c] of map) {
            if (now - c.timestamp > 20) {
              map.delete(key);
            }
          }

          // Randomly update existing connections
          for (const [, c] of map) {
            if (Math.random() > 0.7) {
              c.bytes += Math.floor(Math.random() * 5000);
              c.packets += Math.floor(Math.random() * 10);
              c.timestamp = now;
            }
          }

          ppsCounter.current += Math.floor(Math.random() * 50) + 10;
          const allConns = Array.from(map.values()).sort(
            (a, b) => b.timestamp - a.timestamp
          );
          setConnections(allConns);
        }, 800);
      }
    }, 1000);

    return () => {
      clearTimeout(timeout);
      if (mockInterval) clearInterval(mockInterval);
    };
  }, []);

  // Update stats every second
  useEffect(() => {
    const interval = setInterval(() => {
      const allConns = Array.from(connectionsRef.current.values());
      const now = Math.floor(Date.now() / 1000);
      const active = allConns.filter((c) => now - c.timestamp < 5);

      // Top countries
      const countryMap: Record<string, number> = {};
      for (const conn of allConns) {
        const country = conn.location.country;
        countryMap[country] = (countryMap[country] || 0) + 1;
      }
      const topCountries = Object.entries(countryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([country, count]) => ({ country, count }));

      setStats({
        totalConnections: allConns.length,
        activeConnections: active.length,
        totalBytes: allConns.reduce((sum, c) => sum + c.bytes, 0),
        packetsPerSecond: ppsCounter.current,
        topCountries,
      });

      ppsCounter.current = 0;
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { connections, origin, stats, selectedConnection, setSelectedConnection };
}

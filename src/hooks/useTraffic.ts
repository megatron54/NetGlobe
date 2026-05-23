import { useState, useEffect, useRef } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { Connection, OriginLocation, Stats } from "../types";

export function useTraffic() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [origin, setOrigin] = useState<OriginLocation | null>(null);
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

  // Get origin location on mount
  useEffect(() => {
    invoke<OriginLocation>("get_origin_location")
      .then(setOrigin)
      .catch((e) => console.error("Failed to get origin:", e));
  }, []);

  // Listen to connection events from Rust
  useEffect(() => {
    const unlisten = listen<Connection[]>("connections", (event) => {
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

    return () => {
      unlisten.then((fn) => fn());
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

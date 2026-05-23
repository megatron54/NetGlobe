import { useEffect, useRef, useState } from "react";
import Globe from "globe.gl";
import { Connection, OriginLocation } from "../types";

interface GlobeViewProps {
  connections: Connection[];
  origin: OriginLocation | null;
  selectedConnection: string | null;
  onSelectConnection: (id: string | null) => void;
}

export function GlobeView({ connections, origin, selectedConnection }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // Initialize globe after container is mounted and has dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    // Wait for next frame to ensure container has dimensions
    const timer = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;

      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;

      console.log(`Initializing globe: ${w}x${h}`);

      try {
        const globe = Globe()(el)
          .width(w)
          .height(h)
          .globeImageUrl("/earth-night-hq.jpg")
          .bumpImageUrl("/earth-topology.png")
          .backgroundImageUrl("/night-sky.png")
          .showAtmosphere(true)
          .atmosphereColor("#4fc3f7")
          .atmosphereAltitude(0.25)
          .animateIn(true)
          // Arc settings
          .arcColor("color")
          .arcStroke(0.8)
          .arcDashLength(0.5)
          .arcDashGap(0.2)
          .arcDashAnimateTime(1500)
          .arcAltitudeAutoScale(0.4)
          .arcsTransitionDuration(0)
          // Point settings
          .pointColor("color")
          .pointAltitude(0.01)
          .pointRadius("size")
          .pointsMerge(false)
          .pointsTransitionDuration(0)
          // Ring settings
          .ringColor(() => (t: number) => `rgba(79, 195, 247, ${1 - t})`)
          .ringMaxRadius(3)
          .ringPropagationSpeed(2)
          .ringRepeatPeriod(1500);

        // Camera
        globe.pointOfView({ lat: 30, lng: 0, altitude: 2.2 });

        // Controls
        const controls = globe.controls() as any;
        if (controls) {
          controls.enableDamping = true;
          controls.dampingFactor = 0.1;
          controls.rotateSpeed = 0.5;
          controls.zoomSpeed = 0.8;
        }

        globeRef.current = globe;
        setReady(true);
        console.log("Globe initialized successfully");

        // Show test arcs immediately
        globe.arcsData([
          { startLat: 39.47, startLng: -0.38, endLat: 37.77, endLng: -122.42, color: "rgba(30, 220, 255, 0.8)" },
          { startLat: 39.47, startLng: -0.38, endLat: 51.51, endLng: -0.13, color: "rgba(255, 190, 40, 0.8)" },
          { startLat: 39.47, startLng: -0.38, endLat: 35.68, endLng: 139.65, color: "rgba(180, 80, 255, 0.8)" },
          { startLat: 39.47, startLng: -0.38, endLat: -33.87, endLng: 151.21, color: "rgba(60, 255, 130, 0.8)" },
          { startLat: 39.47, startLng: -0.38, endLat: 52.37, endLng: 4.90, color: "rgba(30, 220, 255, 0.8)" },
        ]);
        globe.pointsData([
          { lat: 39.47, lng: -0.38, color: "#ffffff", size: 0.8 },
          { lat: 37.77, lng: -122.42, color: "#1edcff", size: 0.5 },
          { lat: 51.51, lng: -0.13, color: "#ffbe28", size: 0.5 },
          { lat: 35.68, lng: 139.65, color: "#b450ff", size: 0.5 },
          { lat: -33.87, lng: 151.21, color: "#3cff82", size: 0.5 },
          { lat: 52.37, lng: 4.90, color: "#1edcff", size: 0.5 },
        ]);
        globe.ringsData([{ lat: 39.47, lng: -0.38 }]);
      } catch (e) {
        console.error("Globe initialization failed:", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && globeRef.current) {
        globeRef.current.width(containerRef.current.clientWidth);
        globeRef.current.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update arcs
  useEffect(() => {
    if (!globeRef.current || !origin || !ready) return;

    const arcsData = connections
      .filter((c) => c.location.lat !== 0 || c.location.lng !== 0)
      .slice(0, 80)
      .map((conn) => ({
        startLat: origin.lat,
        startLng: origin.lng,
        endLat: conn.location.lat,
        endLng: conn.location.lng,
        color: getArcColor(conn.protocol, conn.port, conn.id === selectedConnection),
        id: conn.id,
      }));

    globeRef.current.arcsData(arcsData);
  }, [connections, origin, selectedConnection, ready]);

  // Update points
  useEffect(() => {
    if (!globeRef.current || !origin || !ready) return;

    const pointsData: any[] = [
      {
        lat: origin.lat,
        lng: origin.lng,
        color: "#ffffff",
        size: 0.8,
      },
    ];

    const seen = new Set<string>();
    for (const conn of connections) {
      const key = `${conn.location.lat.toFixed(2)},${conn.location.lng.toFixed(2)}`;
      if (seen.has(key) || (conn.location.lat === 0 && conn.location.lng === 0)) continue;
      seen.add(key);
      pointsData.push({
        lat: conn.location.lat,
        lng: conn.location.lng,
        color: getPointColor(conn.protocol, conn.port),
        size: 0.4,
      });
    }

    globeRef.current.pointsData(pointsData);
  }, [connections, origin, ready]);

  // Rings
  useEffect(() => {
    if (!globeRef.current || !origin || !ready) return;
    globeRef.current.ringsData([{ lat: origin.lat, lng: origin.lng }]);
  }, [origin, ready]);

  // Auto-rotate to origin
  useEffect(() => {
    if (!globeRef.current || !origin || !ready) return;
    globeRef.current.pointOfView({ lat: origin.lat, lng: origin.lng, altitude: 2.0 }, 2000);
  }, [origin, ready]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        background: "#050810",
      }}
    />
  );
}

function getArcColor(protocol: string, port: number, isSelected: boolean): string {
  const alpha = isSelected ? 1.0 : 0.7;
  if (port === 443 || port === 80) return `rgba(30, 220, 255, ${alpha})`;
  if (port === 53) return `rgba(255, 190, 40, ${alpha})`;
  if (protocol === "UDP") return `rgba(180, 80, 255, ${alpha})`;
  return `rgba(60, 255, 130, ${alpha})`;
}

function getPointColor(protocol: string, port: number): string {
  if (port === 443 || port === 80) return "#1edcff";
  if (port === 53) return "#ffbe28";
  if (protocol === "UDP") return "#b450ff";
  return "#3cff82";
}

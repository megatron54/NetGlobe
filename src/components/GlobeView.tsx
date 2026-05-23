import { useEffect, useRef } from "react";
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
  const initializedRef = useRef(false);

  // Initialize globe
  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const globe = Globe()(containerRef.current)
      .globeImageUrl("/earth-night.jpg")
      .bumpImageUrl("/earth-topology.png")
      .backgroundImageUrl("/night-sky.png")
      .showAtmosphere(true)
      .atmosphereColor("#4fc3f7")
      .atmosphereAltitude(0.25)
      .animateIn(true)
      // Arc settings
      .arcColor((d: any) => d.color)
      .arcStroke(0.6)
      .arcDashLength(0.6)
      .arcDashGap(0.3)
      .arcDashAnimateTime(1500)
      .arcAltitudeAutoScale(0.4)
      .arcsTransitionDuration(300)
      // Point settings
      .pointColor((d: any) => d.color)
      .pointAltitude(0.01)
      .pointRadius((d: any) => d.size)
      .pointsMerge(false)
      .pointsTransitionDuration(300)
      // Ring settings (pulse effect at origin)
      .ringColor(() => (t: number) => `rgba(79, 195, 247, ${1 - t})`)
      .ringMaxRadius(3)
      .ringPropagationSpeed(2)
      .ringRepeatPeriod(1500);

    // Camera position
    globe.pointOfView({ lat: 30, lng: 0, altitude: 2.2 });

    // Styling
    const controls = globe.controls() as any;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 0.8;
    controls.minDistance = 120;
    controls.maxDistance = 500;

    globeRef.current = globe;

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && globeRef.current) {
        globeRef.current.width(containerRef.current.clientWidth);
        globeRef.current.height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Update arcs when connections change
  useEffect(() => {
    if (!globeRef.current || !origin) return;

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
  }, [connections, origin, selectedConnection]);

  // Update points (destinations + origin)
  useEffect(() => {
    if (!globeRef.current || !origin) return;

    const pointsData: any[] = [
      // Origin point
      {
        lat: origin.lat,
        lng: origin.lng,
        color: "#ffffff",
        size: 0.8,
        label: `Origin: ${origin.city}, ${origin.country}`,
      },
    ];

    // Destination points
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
        label: `${conn.location.city}, ${conn.location.country}`,
      });
    }

    globeRef.current.pointsData(pointsData);
  }, [connections, origin]);

  // Update rings (origin pulse)
  useEffect(() => {
    if (!globeRef.current || !origin) return;
    globeRef.current.ringsData([
      { lat: origin.lat, lng: origin.lng },
    ]);
  }, [origin]);

  // Auto-rotate to origin on first load
  useEffect(() => {
    if (!globeRef.current || !origin) return;
    globeRef.current.pointOfView({ lat: origin.lat, lng: origin.lng, altitude: 2.0 }, 2000);
  }, [origin]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ background: "#050810" }}
    />
  );
}

function getArcColor(protocol: string, port: number, isSelected: boolean): string {
  const alpha = isSelected ? 1.0 : 0.7;
  if (port === 443 || port === 80) return `rgba(30, 220, 255, ${alpha})`; // cyan
  if (port === 53) return `rgba(255, 190, 40, ${alpha})`; // amber
  if (protocol === "UDP") return `rgba(180, 80, 255, ${alpha})`; // purple
  return `rgba(60, 255, 130, ${alpha})`; // green
}

function getPointColor(protocol: string, port: number): string {
  if (port === 443 || port === 80) return "#1edcff";
  if (port === 53) return "#ffbe28";
  if (protocol === "UDP") return "#b450ff";
  return "#3cff82";
}

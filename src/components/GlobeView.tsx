import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import type { Connection, OriginLocation } from '../types';
import { getProtocolColor, getProtocolHex } from '../lib/protocol';

const BASE = import.meta.env.BASE_URL;

interface GlobeViewProps {
  connections: Connection[];
  origin: OriginLocation | null;
}

export default function GlobeView({ connections, origin }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  // Initialize globe with delayed mount to ensure container is sized
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Wait for next frame so layout is computed
    const raf = requestAnimationFrame(() => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;

      const globe = Globe()(el)
        .width(w)
        .height(h)
        .globeImageUrl(`${BASE}earth-night-hq.jpg`)
        .bumpImageUrl(`${BASE}earth-topology.png`)
        .backgroundImageUrl(`${BASE}night-sky.png`)
        .showAtmosphere(true)
        .atmosphereColor('#1e88e5')
        .atmosphereAltitude(0.18)
        .animateIn(true)
        // Arcs
        .arcColor('color')
        .arcStroke(0.6)
        .arcDashLength(0.6)
        .arcDashGap(0.3)
        .arcDashAnimateTime(2000)
        .arcAltitudeAutoScale(0.35)
        .arcsTransitionDuration(300)
        // Points
        .pointColor('color')
        .pointAltitude(0.008)
        .pointRadius('size')
        .pointsMerge(false)
        .pointsTransitionDuration(300)
        // Rings
        .ringColor(() => (t: number) => `rgba(30, 136, 229, ${1 - t})`)
        .ringMaxRadius(2.5)
        .ringPropagationSpeed(1.5)
        .ringRepeatPeriod(2000);

      // Camera
      globe.pointOfView({ lat: 30, lng: 10, altitude: 2.4 });

      const controls = globe.controls() as any;
      if (controls) {
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.rotateSpeed = 0.4;
        controls.zoomSpeed = 0.7;
        controls.minDistance = 150;
        controls.maxDistance = 600;
      }

      globeRef.current = globe;
      setReady(true);
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  // Resize
  useEffect(() => {
    const onResize = () => {
      if (containerRef.current && globeRef.current) {
        globeRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Pan to origin
  useEffect(() => {
    if (!ready || !globeRef.current || !origin) return;
    globeRef.current.pointOfView(
      { lat: origin.lat, lng: origin.lng, altitude: 2.2 },
      1800,
    );
  }, [origin, ready]);

  // Arcs
  useEffect(() => {
    if (!ready || !globeRef.current || !origin) return;

    const arcs = connections
      .filter((c) => c.location.lat !== 0 || c.location.lng !== 0)
      .slice(0, 100)
      .map((conn) => ({
        startLat: origin.lat,
        startLng: origin.lng,
        endLat: conn.location.lat,
        endLng: conn.location.lng,
        color: getProtocolColor(conn.protocol, conn.port),
      }));

    globeRef.current.arcsData(arcs);
  }, [connections, origin, ready]);

  // Points
  useEffect(() => {
    if (!ready || !globeRef.current || !origin) return;

    const points: any[] = [
      { lat: origin.lat, lng: origin.lng, color: '#ffffff', size: 0.7 },
    ];

    const seen = new Set<string>();
    for (const conn of connections) {
      const key = `${conn.location.lat.toFixed(1)},${conn.location.lng.toFixed(1)}`;
      if (seen.has(key) || (conn.location.lat === 0 && conn.location.lng === 0)) continue;
      seen.add(key);
      points.push({
        lat: conn.location.lat,
        lng: conn.location.lng,
        color: getProtocolHex(conn.protocol, conn.port),
        size: 0.35,
      });
    }

    globeRef.current.pointsData(points);
  }, [connections, origin, ready]);

  // Origin ring
  useEffect(() => {
    if (!ready || !globeRef.current || !origin) return;
    globeRef.current.ringsData([{ lat: origin.lat, lng: origin.lng }]);
  }, [origin, ready]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ background: '#040810', zIndex: 1 }}
    />
  );
}

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

  // Initialize globe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Double rAF to guarantee layout is computed
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
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
          .atmosphereAltitude(0.2)
          .animateIn(false)
          // Arcs — thick and bright
          .arcColor((d: any) => d.color)
          .arcStroke((d: any) => d.stroke)
          .arcDashLength(0.9)
          .arcDashGap(0.4)
          .arcDashAnimateTime((d: any) => d.animTime)
          .arcAltitudeAutoScale(0.4)
          .arcsTransitionDuration(200)
          // Points
          .pointColor((d: any) => d.color)
          .pointAltitude(0.01)
          .pointRadius((d: any) => d.size)
          .pointsMerge(false)
          .pointsTransitionDuration(200)
          // Rings (origin pulse)
          .ringColor(() => (t: number) => `rgba(56, 189, 248, ${1 - t})`)
          .ringMaxRadius(3)
          .ringPropagationSpeed(2)
          .ringRepeatPeriod(1500);

        // Camera position — show Europe/Africa in view with Valencia visible
        globe.pointOfView({ lat: 25, lng: 10, altitude: 2.2 });

        const controls = globe.controls() as any;
        if (controls) {
          controls.enableDamping = true;
          controls.dampingFactor = 0.1;
          controls.rotateSpeed = 0.5;
          controls.zoomSpeed = 0.8;
          controls.minDistance = 140;
          controls.maxDistance = 550;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.3;
        }

        globeRef.current = globe;
        setReady(true);
      });
    });

    return () => cancelAnimationFrame(raf);
  }, []);

  // Resize handler
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

  // Update arcs
  useEffect(() => {
    if (!ready || !globeRef.current || !origin) return;

    const arcs = connections
      .filter((c) => c.location.lat !== 0 || c.location.lng !== 0)
      .map((conn) => ({
        startLat: origin.lat,
        startLng: origin.lng,
        endLat: conn.location.lat,
        endLng: conn.location.lng,
        color: getProtocolColor(conn.protocol, conn.port),
        stroke: 0.4 + Math.min(conn.bytes / 100000, 1.8),
        animTime: 1200 + Math.random() * 1500,
      }));

    globeRef.current.arcsData(arcs);
  }, [connections, origin, ready]);

  // Update points
  useEffect(() => {
    if (!ready || !globeRef.current || !origin) return;

    const points: any[] = [
      { lat: origin.lat, lng: origin.lng, color: '#ffffff', size: 0.8 },
    ];

    const seen = new Set<string>();
    for (const conn of connections) {
      const key = `${conn.location.lat.toFixed(1)},${conn.location.lng.toFixed(1)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      points.push({
        lat: conn.location.lat,
        lng: conn.location.lng,
        color: getProtocolHex(conn.protocol, conn.port),
        size: 0.4,
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

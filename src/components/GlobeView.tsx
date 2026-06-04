import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';
import type { Connection, OriginLocation } from '../types';
import { getProtocolColor, getProtocolHex } from '../lib/protocol';

interface GlobeViewProps {
  connections: Connection[];
  origin: OriginLocation | null;
}

export default function GlobeView({ connections, origin }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<ReturnType<typeof Globe> | null>(null);
  const initRef = useRef(false);

  // Initialize globe
  useEffect(() => {
    if (!containerRef.current || initRef.current) return;
    initRef.current = true;

    const el = containerRef.current;
    const globe = Globe()(el)
      .globeImageUrl('/earth-night-hq.jpg')
      .bumpImageUrl('/earth-topology.png')
      .backgroundImageUrl('/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#1e88e5')
      .atmosphereAltitude(0.18)
      .animateIn(true)
      .width(el.clientWidth)
      .height(el.clientHeight)
      // Arc config
      .arcColor('color')
      .arcStroke(0.6)
      .arcDashLength(0.6)
      .arcDashGap(0.3)
      .arcDashAnimateTime(2000)
      .arcAltitudeAutoScale(0.35)
      .arcsTransitionDuration(300)
      // Points config
      .pointColor('color')
      .pointAltitude(0.008)
      .pointRadius('size')
      .pointsMerge(false)
      .pointsTransitionDuration(300)
      // Rings config
      .ringColor(() => (t: number) => `rgba(30, 136, 229, ${1 - t})`)
      .ringMaxRadius(2.5)
      .ringPropagationSpeed(1.5)
      .ringRepeatPeriod(2000);

    // Camera defaults
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

    return () => { initRef.current = false; };
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && globeRef.current) {
        globeRef.current
          .width(containerRef.current.clientWidth)
          .height(containerRef.current.clientHeight);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pan to origin when it arrives
  useEffect(() => {
    if (!globeRef.current || !origin) return;
    globeRef.current.pointOfView(
      { lat: origin.lat, lng: origin.lng, altitude: 2.2 },
      1800,
    );
  }, [origin]);

  // Update arcs
  useEffect(() => {
    if (!globeRef.current || !origin) return;

    const arcsData = connections
      .filter((c) => c.location.lat !== 0 || c.location.lng !== 0)
      .slice(0, 100)
      .map((conn) => ({
        startLat: origin.lat,
        startLng: origin.lng,
        endLat: conn.location.lat,
        endLng: conn.location.lng,
        color: getProtocolColor(conn.protocol, conn.port),
      }));

    globeRef.current.arcsData(arcsData);
  }, [connections, origin]);

  // Update points
  useEffect(() => {
    if (!globeRef.current || !origin) return;

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
  }, [connections, origin]);

  // Update origin ring
  useEffect(() => {
    if (!globeRef.current || !origin) return;
    globeRef.current.ringsData([{ lat: origin.lat, lng: origin.lng }]);
  }, [origin]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: '#040810' }}
    />
  );
}

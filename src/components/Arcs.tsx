import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Connection, OriginLocation } from "../types";

interface ArcsProps {
  connections: Connection[];
  origin: OriginLocation;
  selectedConnection: string | null;
}

function latLngToVector3(lat: number, lng: number, radius: number = 1.01): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function getProtocolColor(protocol: string, port: number): THREE.Color {
  if (port === 443 || port === 80) return new THREE.Color(0.1, 0.8, 1.0); // cyan - HTTPS/HTTP
  if (port === 53) return new THREE.Color(1.0, 0.7, 0.1); // amber - DNS
  if (protocol === "UDP") return new THREE.Color(0.6, 0.3, 1.0); // purple - UDP
  return new THREE.Color(0.1, 1.0, 0.5); // green - other TCP
}

function createArcCurve(start: THREE.Vector3, end: THREE.Vector3): THREE.CubicBezierCurve3 {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const distance = start.distanceTo(end);
  mid.normalize().multiplyScalar(1.0 + distance * 0.4);

  const ctrl1 = new THREE.Vector3().lerpVectors(start, mid, 0.33);
  ctrl1.normalize().multiplyScalar(1.0 + distance * 0.25);

  const ctrl2 = new THREE.Vector3().lerpVectors(end, mid, 0.33);
  ctrl2.normalize().multiplyScalar(1.0 + distance * 0.25);

  return new THREE.CubicBezierCurve3(start, ctrl1, ctrl2, end);
}

function Arc({ connection, origin, isSelected }: { connection: Connection; origin: OriginLocation; isSelected: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const timeRef = useRef(Math.random() * 100); // Random offset so arcs don't sync

  const { geometry, color } = useMemo(() => {
    const start = latLngToVector3(origin.lat, origin.lng);
    const end = latLngToVector3(connection.location.lat, connection.location.lng);
    const curve = createArcCurve(start, end);
    const points = curve.getPoints(64);
    const geo = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      64,
      isSelected ? 0.006 : 0.003,
      8,
      false
    );
    const col = getProtocolColor(connection.protocol, connection.port);
    return { geometry: geo, color: col };
  }, [connection.id, origin.lat, origin.lng, isSelected]);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = timeRef.current;
    }
  });

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      color: { value: color },
      opacity: { value: isSelected ? 1.0 : 0.7 },
    }),
    [color, isSelected]
  );

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent={true}
        depthWrite={false}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float time;
          uniform vec3 color;
          uniform float opacity;
          varying vec2 vUv;
          
          void main() {
            // Animated dash traveling along the arc
            float pulse = sin((vUv.x - time * 0.5) * 20.0) * 0.5 + 0.5;
            pulse = smoothstep(0.3, 1.0, pulse);
            
            // Fade at ends
            float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
            
            float alpha = (0.4 + pulse * 0.6) * edgeFade * opacity;
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
}

function DestinationNode({ connection }: { connection: Connection }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(
    () => latLngToVector3(connection.location.lat, connection.location.lng, 1.02),
    [connection.location.lat, connection.location.lng]
  );

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + connection.bytes * 0.001) * 0.3;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const color = getProtocolColor(connection.protocol, connection.port);

  return (
    <mesh ref={meshRef} position={pos}>
      <sphereGeometry args={[0.012, 16, 16]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function OriginNode({ origin }: { origin: OriginLocation }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pos = useMemo(
    () => latLngToVector3(origin.lat, origin.lng, 1.02),
    [origin.lat, origin.lng]
  );

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef} position={pos}>
      <sphereGeometry args={[0.02, 16, 16]} />
      <meshBasicMaterial color={new THREE.Color(1.0, 1.0, 1.0)} transparent opacity={0.95} />
    </mesh>
  );
}

export function Arcs({ connections, origin, selectedConnection }: ArcsProps) {
  // Limit visible arcs for performance
  const visibleConnections = useMemo(() => {
    return connections
      .filter((c) => c.location.lat !== 0 || c.location.lng !== 0)
      .slice(0, 100);
  }, [connections]);

  return (
    <group>
      <OriginNode origin={origin} />
      {visibleConnections.map((conn) => (
        <group key={conn.id}>
          <Arc
            connection={conn}
            origin={origin}
            isSelected={conn.id === selectedConnection}
          />
          <DestinationNode connection={conn} />
        </group>
      ))}
    </group>
  );
}

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GLOBE_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLOBE_FRAGMENT_SHADER = `
  uniform float time;
  varying vec3 vNormal;
  varying vec3 vPosition;
  
  void main() {
    // Base dark color
    vec3 baseColor = vec3(0.02, 0.04, 0.08);
    
    // Subtle grid lines
    float lat = asin(vPosition.y) * 10.0;
    float lng = atan(vPosition.z, vPosition.x) * 10.0;
    float grid = smoothstep(0.95, 1.0, abs(sin(lat))) + smoothstep(0.95, 1.0, abs(sin(lng)));
    grid *= 0.1;
    
    // Edge glow (fresnel-like)
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = 1.0 - max(dot(vNormal, viewDir), 0.0);
    fresnel = pow(fresnel, 3.0);
    
    vec3 glowColor = vec3(0.1, 0.6, 0.9);
    vec3 color = baseColor + glowColor * grid + glowColor * fresnel * 0.3;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function GlobeMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
    }),
    []
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={GLOBE_VERTEX_SHADER}
        fragmentShader={GLOBE_FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent={false}
      />
    </mesh>
  );
}

import * as THREE from "three";

const ATMOSPHERE_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT = `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  
  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - dot(vNormal, viewDir);
    fresnel = pow(fresnel, 3.0);
    
    vec3 atmosphereColor = vec3(0.1, 0.7, 1.0);
    float alpha = fresnel * 0.6;
    
    gl_FragColor = vec4(atmosphereColor, alpha);
  }
`;

export function Atmosphere() {
  return (
    <mesh scale={[1.15, 1.15, 1.15]}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={ATMOSPHERE_VERTEX}
        fragmentShader={ATMOSPHERE_FRAGMENT}
        transparent={true}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

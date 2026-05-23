import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Connection, OriginLocation } from "../types";
import { GlobeMesh } from "./GlobeMesh";
import { Arcs } from "./Arcs";
import { Atmosphere } from "./Atmosphere";

interface GlobeProps {
  connections: Connection[];
  origin: OriginLocation | null;
  selectedConnection: string | null;
  onSelectConnection: (id: string | null) => void;
}

export function Globe({ connections, origin, selectedConnection }: GlobeProps) {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "#0a0e17" }}
      >
        <color attach="background" args={["#0a0e17"]} />
        <ambientLight intensity={0.1} />
        <directionalLight position={[5, 3, 5]} intensity={0.3} color="#4fc3f7" />

        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />

        <GlobeMesh />
        <Atmosphere />

        {origin && (
          <Arcs
            connections={connections}
            origin={origin}
            selectedConnection={selectedConnection}
          />
        )}

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={1.5}
          maxDistance={8}
          rotateSpeed={0.5}
          zoomSpeed={0.8}
          enableDamping={true}
          dampingFactor={0.05}
        />

        <EffectComposer>
          <Bloom
            intensity={1.5}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}

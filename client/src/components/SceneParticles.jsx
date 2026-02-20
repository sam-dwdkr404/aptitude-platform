import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useMemo, useRef } from "react";

function FloatingIcos({ position, scale }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x += 0.002;
    ref.current.rotation.y += 0.0015;
    ref.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.0008;
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#ffd700"
        emissive="#ffd700"
        emissiveIntensity={0.35}
        metalness={0.2}
        roughness={0.4}
        transparent
        opacity={0.75}
      />
    </mesh>
  );
}

function SceneParticles() {
  const shapes = useMemo(
    () =>
      new Array(14).fill(null).map(() => ({
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 10,
        ],
        scale: 0.25 + Math.random() * 0.35,
      })),
    []
  );

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 50 }}
      className="pointer-events-none absolute inset-0"
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 3, 5]} intensity={1.2} />
      <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.6}>
        {shapes.map((shape, index) => (
          <FloatingIcos
            key={`icosa-${index}`}
            position={shape.position}
            scale={shape.scale}
          />
        ))}
      </Float>
    </Canvas>
  );
}

export default SceneParticles;

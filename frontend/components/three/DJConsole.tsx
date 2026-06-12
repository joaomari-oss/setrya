"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function Turntable({ isPlaying }: { isPlaying: boolean }) {
  const diskRef = useRef<THREE.Mesh>(null);
  const armRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (diskRef.current && isPlaying) {
      diskRef.current.rotation.y += delta * 2.5;
    }
    if (armRef.current) {
      armRef.current.rotation.z = THREE.MathUtils.lerp(
        armRef.current.rotation.z,
        isPlaying ? -0.3 : -0.6,
        0.05
      );
    }
  });

  return (
    <group>
      {/* Platter base */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <cylinderGeometry args={[2.2, 2.2, 0.12, 64]} />
        <meshStandardMaterial color="#111111" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Vinyl record */}
      <mesh ref={diskRef} position={[0, 0, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.0, 2.0, 0.06, 128]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Record grooves (torus rings) */}
      {[0.6, 0.9, 1.2, 1.5, 1.8].map((r, i) => (
        <mesh key={i} position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.008, 8, 128]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.7} />
        </mesh>
      ))}

      {/* Center label */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.02, 64]} />
        <meshStandardMaterial color="#b4f47a" emissive="#b4f47a" emissiveIntensity={0.3} />
      </mesh>

      {/* Tonearm */}
      <group ref={armRef} position={[1.8, 0.3, 1.0]}>
        <mesh rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.03, 0.02, 1.6, 8]} />
          <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[-0.6, -0.7, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#b4f47a" emissive="#b4f47a" emissiveIntensity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function Mixer() {
  return (
    <group position={[0, 0, 0]}>
      {/* Mixer body */}
      <mesh position={[0, -0.1, 0]} castShadow>
        <boxGeometry args={[2.8, 0.2, 2.0]} />
        <meshStandardMaterial color="#111111" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Faders */}
      {[-0.8, -0.3, 0.3, 0.8].map((x, i) => (
        <group key={i} position={[x, 0.06, 0]}>
          <mesh>
            <boxGeometry args={[0.08, 0.06, 0.8]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 0.05, -0.1 + Math.random() * 0.2]}>
            <boxGeometry args={[0.1, 0.04, 0.12]} />
            <meshStandardMaterial color="#b4f47a" emissive="#b4f47a" emissiveIntensity={0.2} />
          </mesh>
        </group>
      ))}

      {/* Knobs */}
      {[-0.9, -0.3, 0.3, 0.9].map((x, i) => (
        <mesh key={`k${i}`} position={[x, 0.12, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.08, 32]} />
          <meshStandardMaterial color="#333" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}

      {/* Crossfader */}
      <mesh position={[0, 0.06, 0.6]}>
        <boxGeometry args={[2.0, 0.06, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.2, 0.11, 0.6]}>
        <boxGeometry args={[0.14, 0.04, 0.14]} />
        <meshStandardMaterial color="#4af4f4" emissive="#4af4f4" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function AmbientParticles() {
  const count = 120;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.04;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#b4f47a" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

interface Props {
  isPlaying?: boolean;
  interactive?: boolean;
}

export default function DJConsole({ isPlaying = false, interactive = true }: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 5, 10], fov: 45 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
      <pointLight position={[0, 2, 0]} color="#b4f47a" intensity={2} distance={8} />
      <pointLight position={[-4, 1, 0]} color="#4af4f4" intensity={1} distance={6} />
      <pointLight position={[4, 1, 0]} color="#a855f7" intensity={1} distance={6} />

      <AmbientParticles />

      <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
        <group>
          <group position={[-3.5, 0, 0]}>
            <Turntable isPlaying={isPlaying} />
          </group>
          <group position={[0, 0, 0]} scale={0.75}>
            <Mixer />
          </group>
          <group position={[3.5, 0, 0]}>
            <Turntable isPlaying={isPlaying} />
          </group>
        </group>
      </Float>

      {interactive && (
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.5}
        />
      )}
    </Canvas>
  );
}

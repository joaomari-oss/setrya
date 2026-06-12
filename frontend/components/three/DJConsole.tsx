"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const LIME = "#b4f47a";
const CYAN = "#4af4f4";
const ORANGE = "#f97316";
const RED = "#f43f5e";
const YELLOW = "#eab308";

const BODY = { color: "#101010", metalness: 0.55, roughness: 0.45 };
const PANEL = { color: "#161616", metalness: 0.4, roughness: 0.55 };
const KNOB = { color: "#262626", metalness: 0.75, roughness: 0.3 };
const SLOT = { color: "#070707", metalness: 0.2, roughness: 0.8 };

/* ---------- Deck (platter + pads + transport) ---------- */

function Deck({ isPlaying, mirrored = false }: { isPlaying: boolean; mirrored?: boolean }) {
  const platterRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (platterRef.current && isPlaying) {
      platterRef.current.rotation.y += delta * 1.6;
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isPlaying
        ? 0.9 + Math.sin(state.clock.elapsedTime * 3) * 0.25
        : 0.35;
    }
  });

  const side = mirrored ? -1 : 1;

  return (
    <group>
      {/* Jog wheel outer rim */}
      <mesh position={[0, 0.1, -0.25]}>
        <cylinderGeometry args={[1.52, 1.56, 0.14, 96]} />
        <meshStandardMaterial color="#1c1c1c" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Ring light */}
      <mesh ref={ringRef} position={[0, 0.18, -0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.44, 0.022, 16, 96]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.6} />
      </mesh>

      {/* Spinning platter */}
      <mesh ref={platterRef} position={[0, 0.165, -0.25]}>
        <cylinderGeometry args={[1.36, 1.36, 0.04, 96]} />
        <meshStandardMaterial color="#0b0b0b" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Platter grooves */}
      {[0.55, 0.78, 1.0, 1.22].map((r) => (
        <mesh key={r} position={[0, 0.19, -0.25]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.004, 8, 96]} />
          <meshStandardMaterial color="#222222" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}

      {/* Center hub */}
      <mesh position={[0, 0.19, -0.25]}>
        <cylinderGeometry args={[0.34, 0.34, 0.03, 48]} />
        <meshStandardMaterial color={LIME} emissive={LIME} emissiveIntensity={isPlaying ? 0.7 : 0.25} />
      </mesh>
      <mesh position={[0, 0.215, -0.25]}>
        <cylinderGeometry args={[0.05, 0.05, 0.025, 24]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Performance pads — 2 x 4 grid */}
      {Array.from({ length: 8 }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const lit = isPlaying && (i === 0 || i === 5);
        return (
          <group key={i} position={[-0.66 + col * 0.44, 0.1, 1.42 + row * 0.42]}>
            <mesh>
              <boxGeometry args={[0.34, 0.05, 0.32]} />
              <meshStandardMaterial
                color={lit ? LIME : "#1b1b1b"}
                emissive={LIME}
                emissiveIntensity={lit ? 0.8 : 0.06}
                metalness={0.3}
                roughness={0.5}
              />
            </mesh>
          </group>
        );
      })}

      {/* Transport: cue + play */}
      <group position={[side * -1.62, 0.1, 1.62]}>
        <mesh position={[0, 0, -0.42]}>
          <cylinderGeometry args={[0.17, 0.17, 0.06, 32]} />
          <meshStandardMaterial color="#1b1b1b" emissive={ORANGE} emissiveIntensity={0.35} />
        </mesh>
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 32]} />
          <meshStandardMaterial
            color={isPlaying ? LIME : "#1b1b1b"}
            emissive={LIME}
            emissiveIntensity={isPlaying ? 1.0 : 0.25}
          />
        </mesh>
      </group>

      {/* Tempo fader */}
      <group position={[side * 1.78, 0.1, 0.6]}>
        <mesh>
          <boxGeometry args={[0.05, 0.012, 1.5]} />
          <meshStandardMaterial {...SLOT} />
        </mesh>
        <mesh position={[0, 0.045, 0.18]}>
          <boxGeometry args={[0.2, 0.07, 0.12]} />
          <meshStandardMaterial color="#2e2e2e" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------- Mixer (4 channels + VU + crossfader) ---------- */

function Knob({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.085, 0.095, 0.08, 32]} />
        <meshStandardMaterial {...KNOB} />
      </mesh>
      {/* indicator line */}
      <mesh position={[0, 0.045, -0.05]}>
        <boxGeometry args={[0.018, 0.012, 0.06]} />
        <meshStandardMaterial color="#e5e5e5" />
      </mesh>
    </group>
  );
}

function VUColumn({ position, level }: { position: [number, number, number]; level: number }) {
  const colors = [LIME, LIME, LIME, YELLOW, RED];
  return (
    <group position={position}>
      {colors.map((c, i) => (
        <mesh key={i} position={[0, 0, -i * 0.13]}>
          <boxGeometry args={[0.09, 0.025, 0.09]} />
          <meshStandardMaterial
            color={i < level ? c : "#181818"}
            emissive={c}
            emissiveIntensity={i < level ? 0.9 : 0.04}
          />
        </mesh>
      ))}
    </group>
  );
}

function Mixer({ isPlaying }: { isPlaying: boolean }) {
  const faderPos = [0.28, 0.05, 0.32, 0.14]; // deterministic, looks like a real mix
  const channelX = [-0.78, -0.26, 0.26, 0.78];

  return (
    <group>
      {/* Raised mixer panel */}
      <mesh position={[0, 0.06, 0.1]}>
        <boxGeometry args={[2.3, 0.07, 4.0]} />
        <meshStandardMaterial {...PANEL} />
      </mesh>

      {channelX.map((x, ch) => (
        <group key={ch} position={[x, 0.13, 0]}>
          {/* gain + 3-band EQ, aligned column */}
          <Knob position={[0, 0, -1.55]} />
          <Knob position={[0, 0, -1.15]} />
          <Knob position={[0, 0, -0.75]} />
          <Knob position={[0, 0, -0.35]} />

          {/* line fader slot + handle */}
          <mesh position={[0, -0.01, 0.85]}>
            <boxGeometry args={[0.045, 0.012, 1.1]} />
            <meshStandardMaterial {...SLOT} />
          </mesh>
          <mesh position={[0, 0.035, 0.85 - faderPos[ch] * 0.9 + 0.45]}>
            <boxGeometry args={[0.2, 0.06, 0.11]} />
            <meshStandardMaterial color="#303030" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      ))}

      {/* VU meters between the two center channels */}
      <VUColumn position={[-0.06, 0.14, -0.35]} level={isPlaying ? 4 : 1} />
      <VUColumn position={[0.06, 0.14, -0.35]} level={isPlaying ? 3 : 1} />

      {/* Crossfader */}
      <mesh position={[0, 0.12, 1.7]}>
        <boxGeometry args={[1.1, 0.012, 0.05]} />
        <meshStandardMaterial {...SLOT} />
      </mesh>
      <mesh position={[0.08, 0.16, 1.7]}>
        <boxGeometry args={[0.13, 0.06, 0.18]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.45} metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ---------- Ambient particles ---------- */

function AmbientParticles() {
  const count = 90;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color={LIME} transparent opacity={0.35} sizeAttenuation />
    </points>
  );
}

/* ---------- Console ---------- */

interface Props {
  isPlaying?: boolean;
  interactive?: boolean;
}

export default function DJConsole({ isPlaying = false, interactive = true }: Props) {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 6.2, 8.8], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 9, 5]} intensity={1.4} castShadow />
      <pointLight position={[0, 3, 0]} color={LIME} intensity={1.6} distance={9} />
      <pointLight position={[-5, 2, 1]} color={CYAN} intensity={0.9} distance={7} />
      <pointLight position={[5, 2, 1]} color="#a855f7" intensity={0.9} distance={7} />

      <AmbientParticles />

      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.25}>
        <group rotation={[0.06, 0, 0]} position={[0, -0.4, 0]}>
          {/* One-piece chassis */}
          <mesh position={[0, -0.06, 0.1]}>
            <boxGeometry args={[10.6, 0.22, 4.6]} />
            <meshStandardMaterial {...BODY} />
          </mesh>
          {/* Beveled front edge strip with subtle accent */}
          <mesh position={[0, -0.02, 2.42]}>
            <boxGeometry args={[10.6, 0.04, 0.05]} />
            <meshStandardMaterial color={LIME} emissive={LIME} emissiveIntensity={0.18} />
          </mesh>

          <group position={[-3.55, 0, 0]}>
            <Deck isPlaying={isPlaying} />
          </group>
          <group position={[3.55, 0, 0]}>
            <Deck isPlaying={isPlaying} mirrored />
          </group>
          <Mixer isPlaying={isPlaying} />
        </group>
      </Float>

      {interactive && (
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4.5}
          maxPolarAngle={Math.PI / 2.15}
          autoRotate
          autoRotateSpeed={0.4}
        />
      )}
    </Canvas>
  );
}

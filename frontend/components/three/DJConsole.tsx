"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

/* ---------- Palette ---------- */
const LIME = "#b4f47a";
const CYAN = "#4af4f4";
const ORANGE = "#f97316";
const RED = "#f43f5e";
const YELLOW = "#eab308";

const CHASSIS = { color: "#0c0c0e", metalness: 0.85, roughness: 0.35 };
const SURFACE = { color: "#161619", metalness: 0.6, roughness: 0.45 };
const PANEL = { color: "#1c1c20", metalness: 0.45, roughness: 0.55 };
const KNOB = { color: "#242428", metalness: 0.7, roughness: 0.35 };
const SLOT = { color: "#050506", metalness: 0.2, roughness: 0.85 };

/* ---------- Small helpers ---------- */

function Label({
  text,
  position,
  rotation = [-Math.PI / 2, 0, 0],
  size = 0.06,
  color = "#5a5a62",
}: {
  text: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: number;
  color?: string;
}) {
  return (
    <Text
      position={position}
      rotation={rotation}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
      letterSpacing={0.05}
    >
      {text}
    </Text>
  );
}

function Knob({
  position,
  label,
  accent = CYAN,
}: {
  position: [number, number, number];
  label?: string;
  accent?: string;
}) {
  return (
    <group position={position}>
      {label && <Label text={label} position={[0, 0.02, -0.21]} size={0.052} />}
      {/* recessed base */}
      <mesh position={[0, -0.04, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.03, 32]} />
        <meshStandardMaterial color="#070708" metalness={0.3} roughness={0.8} />
      </mesh>
      {/* body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.13, 40]} />
        <meshStandardMaterial {...KNOB} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.092, 0.1, 0.015, 40]} />
        <meshStandardMaterial color="#37373d" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* indicator */}
      <mesh position={[0, 0.072, -0.06]}>
        <boxGeometry args={[0.018, 0.012, 0.07]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Fader({
  position,
  length = 1.3,
  value = 0.5,
  accent = CYAN,
}: {
  position: [number, number, number];
  length?: number;
  value?: number;
  accent?: string;
}) {
  const travel = (value - 0.5) * (length - 0.25);
  return (
    <group position={position}>
      {/* slot */}
      <mesh>
        <boxGeometry args={[0.07, 0.025, length]} />
        <meshStandardMaterial {...SLOT} />
      </mesh>
      {/* cap */}
      <mesh position={[0, 0.06, travel]} castShadow>
        <boxGeometry args={[0.24, 0.09, 0.16]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.3} />
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.026, 0.012, 0.16]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.1} toneMapped={false} />
        </mesh>
      </mesh>
    </group>
  );
}

/* ---------- Deck (jog wheel + screen + pads + transport) ---------- */

function Deck({ isPlaying, mirrored = false }: { isPlaying: boolean; mirrored?: boolean }) {
  const platterRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.MeshStandardMaterial>(null);
  const padRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (platterRef.current && isPlaying) platterRef.current.rotation.y = t * 1.4;
    if (ringRef.current) {
      ringRef.current.emissiveIntensity = isPlaying ? 1.1 + Math.sin(t * 4) * 0.45 : 0.35;
    }
    // chase animation on pads
    const active = isPlaying ? Math.floor((t * 4) % 8) : -1;
    padRefs.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = i === active ? 1.6 : 0.12;
    });
  });

  return (
    <group>
      <Label text={mirrored ? "DECK B" : "DECK A"} position={[0, 0.2, -1.55]} size={0.1} color={mirrored ? LIME : CYAN} />

      {/* jog wheel housing */}
      <mesh position={[0, 0.06, -0.35]} castShadow>
        <cylinderGeometry args={[1.32, 1.36, 0.16, 96]} />
        <meshStandardMaterial color="#0d0d0f" metalness={0.9} roughness={0.18} />
      </mesh>

      {/* neon ring */}
      <mesh position={[0, 0.15, -0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.24, 0.022, 16, 160]} />
        <meshStandardMaterial ref={ringRef} color={CYAN} emissive={CYAN} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      {/* spinning platter */}
      <group ref={platterRef} position={[0, 0.14, -0.35]}>
        <mesh castShadow>
          <cylinderGeometry args={[1.18, 1.18, 0.05, 128]} />
          <meshStandardMaterial color="#0a0a0b" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* grooves */}
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} position={[0, 0.026, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42 + i * 0.082, 0.0025, 6, 128]} />
            <meshStandardMaterial color="#202024" transparent opacity={0.5} />
          </mesh>
        ))}
        {/* spin marker */}
        <mesh position={[0.7, 0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.5, 0.03]} />
          <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.8} toneMapped={false} />
        </mesh>
      </group>

      {/* center LCD */}
      <group position={[0, 0.18, -0.35]}>
        <mesh>
          <cylinderGeometry args={[0.4, 0.42, 0.05, 64]} />
          <meshStandardMaterial color="#070708" metalness={0.9} roughness={0.15} />
        </mesh>
        <group position={[0, 0.027, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <circleGeometry args={[0.36, 64]} />
            <meshStandardMaterial color="#040810" emissive="#05121f" emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
          <Text position={[0, 0.08, 0.01]} rotation={[0, 0, 0]} fontSize={0.085} color={CYAN} anchorX="center" anchorY="middle">
            124.0
          </Text>
          <Text position={[0, -0.02, 0.01]} fontSize={0.04} color="#5a5a62" anchorX="center" anchorY="middle">
            BPM
          </Text>
          <Text position={[0, -0.13, 0.01]} fontSize={0.055} color={LIME} anchorX="center" anchorY="middle">
            03:42
          </Text>
        </group>
      </group>

      {/* performance pads 2x4 */}
      <group position={[0, 0.1, 1.25]}>
        <RoundedBox args={[1.85, 0.06, 1.05]} radius={0.03} smoothness={4} position={[0, -0.01, 0]}>
          <meshStandardMaterial {...PANEL} />
        </RoundedBox>
        {Array.from({ length: 8 }).map((_, i) => {
          const col = i % 4;
          const row = Math.floor(i / 4);
          return (
            <mesh key={i} position={[-0.6 + col * 0.4, 0.04, -0.24 + row * 0.48]} castShadow>
              <boxGeometry args={[0.32, 0.05, 0.32]} />
              <meshStandardMaterial
                ref={(m) => {
                  if (m) padRefs.current[i] = m;
                }}
                color="#15150f"
                emissive={LIME}
                emissiveIntensity={0.12}
                roughness={0.3}
                toneMapped={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* transport: cue + play */}
      <group position={[0, 0.1, 0.78]}>
        <group position={[-0.45, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.2, 0.1, 40]} />
            <meshStandardMaterial color="#1a1410" emissive={ORANGE} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
          <Label text="CUE" position={[0, 0.06, 0]} size={0.05} color="#cfcfd6" />
        </group>
        <group position={[0.45, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.2, 0.22, 0.1, 40]} />
            <meshStandardMaterial
              color={isPlaying ? "#1a200f" : "#141416"}
              emissive={LIME}
              emissiveIntensity={isPlaying ? 1.3 : 0.4}
              toneMapped={false}
            />
          </mesh>
          <Label text="PLAY" position={[0, 0.06, 0]} size={0.05} color="#cfcfd6" />
        </group>
      </group>

      {/* tempo fader on outer edge */}
      <Fader position={[mirrored ? -1.55 : 1.55, 0.1, 0.5]} length={1.6} value={0.62} accent={LIME} />
    </group>
  );
}

/* ---------- VU meter ---------- */

function VUColumn({ position, peak }: { position: [number, number, number]; peak: number }) {
  const segs = [LIME, LIME, LIME, LIME, YELLOW, YELLOW, ORANGE, RED];
  const refs = useRef<THREE.MeshStandardMaterial[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const level = peak > 0 ? Math.floor((Math.sin(t * 6 + position[0]) * 0.5 + 0.5) * peak + 1) : 1;
    refs.current.forEach((m, i) => {
      if (m) m.emissiveIntensity = i < level ? 1.2 : 0.05;
    });
  });
  return (
    <group position={position}>
      {segs.map((c, i) => (
        <mesh key={i} position={[0, 0, -i * 0.1]}>
          <boxGeometry args={[0.09, 0.03, 0.08]} />
          <meshStandardMaterial
            ref={(m) => {
              if (m) refs.current[i] = m;
            }}
            color={c}
            emissive={c}
            emissiveIntensity={0.05}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- Mixer (2 channels + master VU + crossfader) ---------- */

function Mixer({ isPlaying }: { isPlaying: boolean }) {
  const channelX = [-0.55, 0.55];
  return (
    <group>
      {/* raised panel */}
      <RoundedBox args={[2.0, 0.14, 3.6]} radius={0.05} smoothness={4} position={[0, 0.08, 0]} castShadow receiveShadow>
        <meshStandardMaterial {...PANEL} />
      </RoundedBox>

      <Label text="SETRYA PRO" position={[0, 0.16, -1.55]} size={0.11} color="#e8e8ee" />

      {channelX.map((x, ch) => (
        <group key={ch} position={[x, 0.16, 0]}>
          <Knob position={[0, 0, -1.15]} label="TRIM" accent={ch === 0 ? CYAN : LIME} />
          <Knob position={[0, 0, -0.78]} label="HI" accent={ch === 0 ? CYAN : LIME} />
          <Knob position={[0, 0, -0.41]} label="MID" accent={ch === 0 ? CYAN : LIME} />
          <Knob position={[0, 0, -0.04]} label="LOW" accent={ch === 0 ? CYAN : LIME} />
          <Fader position={[0, 0, 0.95]} length={1.15} value={ch === 0 ? 0.7 : 0.55} accent={ch === 0 ? CYAN : LIME} />
        </group>
      ))}

      {/* master VU between channels */}
      <group position={[0, 0.18, -0.5]}>
        <VUColumn position={[-0.1, 0, 0]} peak={isPlaying ? 6 : 0} />
        <VUColumn position={[0.1, 0, 0]} peak={isPlaying ? 5 : 0} />
        <Label text="MASTER" position={[0, 0, 0.18]} size={0.05} />
      </group>

      {/* crossfader */}
      <group position={[0, 0.16, 1.45]}>
        <Label text="A" position={[-0.6, 0, 0.16]} size={0.06} color={CYAN} />
        <Label text="B" position={[0.6, 0, 0.16]} size={0.06} color={LIME} />
        <mesh>
          <boxGeometry args={[1.15, 0.025, 0.08]} />
          <meshStandardMaterial {...SLOT} />
        </mesh>
        <mesh position={[0.08, 0.06, 0]} castShadow>
          <boxGeometry args={[0.2, 0.1, 0.22]} />
          <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.3} />
          <mesh position={[0, 0.052, 0]}>
            <boxGeometry args={[0.024, 0.012, 0.22]} />
            <meshStandardMaterial color="#e8e8ee" emissive="#ffffff" emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
        </mesh>
      </group>
    </group>
  );
}

/* ---------- Ambient particles ---------- */

function AmbientParticles() {
  const count = 90;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 11;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.04;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color={CYAN} transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
}

/* ---------- Console root ---------- */

interface Props {
  isPlaying?: boolean;
  interactive?: boolean;
}

export default function DJConsole({ isPlaying = false, interactive = true }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 7, 9.5], fov: 38 }}
      gl={{ antialias: true, alpha: true, stencil: false, premultipliedAlpha: false }}
      style={{ background: "transparent" }}
    >
      {/* NOTE: no <color attach="background"> — keeps the canvas transparent over the page */}
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#2a2a3a", "#050505", 0.4]} />
      <spotLight position={[8, 14, 6]} angle={0.35} penumbra={1} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-9, 4, -4]} color={CYAN} intensity={1.4} distance={22} />
      <pointLight position={[9, 4, -4]} color={LIME} intensity={1.4} distance={22} />
      <pointLight position={[0, 5, 9]} color="#ffffff" intensity={0.4} />

      <AmbientParticles />

      <Float speed={1.3} rotationIntensity={0.08} floatIntensity={0.25}>
        <group rotation={[0.12, 0, 0]} position={[0, -0.4, 0]}>
          {/* chassis */}
          <RoundedBox args={[9.2, 0.4, 4.2]} radius={0.12} smoothness={4} position={[0, -0.12, 0]} castShadow receiveShadow>
            <meshStandardMaterial {...CHASSIS} />
          </RoundedBox>
          <RoundedBox args={[9.0, 0.12, 4.0]} radius={0.08} smoothness={4} position={[0, 0.08, 0]} receiveShadow>
            <meshStandardMaterial {...SURFACE} />
          </RoundedBox>

          {/* edge accent strips */}
          <mesh position={[-4.55, -0.02, 0]}>
            <boxGeometry args={[0.06, 0.34, 4.2]} />
            <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.35} toneMapped={false} />
          </mesh>
          <mesh position={[4.55, -0.02, 0]}>
            <boxGeometry args={[0.06, 0.34, 4.2]} />
            <meshStandardMaterial color={LIME} emissive={LIME} emissiveIntensity={0.35} toneMapped={false} />
          </mesh>

          {/* decks + mixer */}
          <group position={[-3.0, 0.14, 0]}>
            <Deck isPlaying={isPlaying} />
          </group>
          <group position={[3.0, 0.14, 0]}>
            <Deck isPlaying={isPlaying} mirrored />
          </group>
          <group position={[0, 0.14, 0]}>
            <Mixer isPlaying={isPlaying} />
          </group>
        </group>
      </Float>

      {interactive && (
        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={6}
          maxDistance={14}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.3}
          autoRotate={!isPlaying}
          autoRotateSpeed={0.45}
        />
      )}
    </Canvas>
  );
}

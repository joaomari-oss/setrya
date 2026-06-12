"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls, Text, MeshWobbleMaterial } from "@react-three/drei";
import * as THREE from "three";

const LIME = "#b4f47a";
const CYAN = "#4af4f4";
const ORANGE = "#f97316";
const RED = "#f43f5e";
const YELLOW = "#eab308";

const BODY = { color: "#0a0a0a", metalness: 0.7, roughness: 0.2 };
const PANEL = { color: "#121212", metalness: 0.4, roughness: 0.6 };
const KNOB = { color: "#1a1a1a", metalness: 0.8, roughness: 0.3 };
const SLOT = { color: "#050505", metalness: 0.1, roughness: 0.9 };

/* ---------- UI Helpers ---------- */

function Label({ text, position, rotation = [-Math.PI / 2, 0, 0], size = 0.06, color = "#555" }: any) {
  return (
    <Text
      position={position}
      rotation={rotation}
      fontSize={size}
      color={color}
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
}

/* ---------- Deck (platter + pads + transport) ---------- */

function Deck({ isPlaying, mirrored = false }: { isPlaying: boolean; mirrored?: boolean }) {
  const platterRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const screenRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (platterRef.current && isPlaying) {
      platterRef.current.rotation.y += delta * 1.6;
    }
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = isPlaying
        ? 1.2 + Math.sin(state.clock.elapsedTime * 4) * 0.4
        : 0.4;
    }
    if (screenRef.current && isPlaying) {
      screenRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  const side = mirrored ? -1 : 1;

  return (
    <group>
      {/* Deck Label */}
      <Label text={mirrored ? "DECK 2" : "DECK 1"} position={[0, 0.22, -2.0]} size={0.12} color={LIME} />

      {/* Jog wheel outer rim - textured */}
      <mesh position={[0, 0.1, -0.25]}>
        <cylinderGeometry args={[1.55, 1.58, 0.18, 96]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Ring light - neon effect */}
      <mesh ref={ringRef} position={[0, 0.2, -0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.46, 0.025, 16, 128]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.8} />
      </mesh>

      {/* Spinning platter - with realistic grooves */}
      <group ref={platterRef} position={[0, 0.18, -0.25]}>
        <mesh>
          <cylinderGeometry args={[1.4, 1.4, 0.06, 128]} />
          <meshStandardMaterial color="#080808" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Grooves */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} position={[0, 0.031, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.4 + i * 0.08, 0.003, 8, 128]} />
            <meshStandardMaterial color="#1a1a1a" transparent opacity={0.6} />
          </mesh>
        ))}
      </group>

      {/* Center hub with "LCD Screen" */}
      <group position={[0, 0.22, -0.25]}>
        <mesh>
          <cylinderGeometry args={[0.42, 0.42, 0.04, 64]} />
          <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Screen Content */}
        <group position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} ref={screenRef}>
          <mesh>
            <circleGeometry args={[0.38, 64]} />
            <meshStandardMaterial color="#050505" emissive="#001122" emissiveIntensity={0.5} />
          </mesh>
          <Text position={[0, 0.08, 0.01]} fontSize={0.07} color={CYAN}>124.0</Text>
          <Text position={[0, -0.02, 0.01]} fontSize={0.04} color="#777">BPM</Text>
          <Text position={[0, -0.12, 0.01]} fontSize={0.05} color={LIME}>03:42</Text>
        </group>
      </group>

      {/* Performance pads section */}
      <mesh position={[0, 0.08, 1.5]} >
         <boxGeometry args={[2.0, 0.05, 1.2]} />
         <meshStandardMaterial {...PANEL} />
      </mesh>
      
      {Array.from({ length: 8 }).map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const lit = isPlaying && i === Math.floor((Date.now() / 1000) % 8);
        return (
          <group key={i} position={[-0.7 + col * 0.46, 0.12, 1.25 + row * 0.48]}>
            <mesh>
              <boxGeometry args={[0.38, 0.08, 0.38]} />
              <meshStandardMaterial
                color={lit ? LIME : "#222"}
                emissive={LIME}
                emissiveIntensity={lit ? 1.5 : 0.1}
                roughness={0.2}
              />
            </mesh>
            <mesh position={[0, -0.02, 0]}>
              <boxGeometry args={[0.42, 0.04, 0.42]} />
              <meshStandardMaterial color="#000" />
            </mesh>
          </group>
        );
      })}

      {/* Transport: cue + play */}
      <group position={[side * -1.6, 0.1, 1.7]}>
        {/* CUE */}
        <group position={[0, 0, -0.5]}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.22, 0.1, 32]} />
            <meshStandardMaterial color="#222" emissive={ORANGE} emissiveIntensity={0.4} />
          </mesh>
          <Label text="CUE" position={[0, 0.06, 0]} size={0.06} color="#aaa" />
        </group>
        {/* PLAY */}
        <group>
          <mesh>
            <cylinderGeometry args={[0.25, 0.25, 0.1, 32]} />
            <meshStandardMaterial
              color={isPlaying ? LIME : "#222"}
              emissive={LIME}
              emissiveIntensity={isPlaying ? 1.2 : 0.3}
            />
          </mesh>
          <Label text="PLAY" position={[0, 0.06, 0]} size={0.06} color={isPlaying ? "#000" : "#aaa"} />
        </group>
      </group>

      {/* Tempo fader - detailed */}
      <group position={[side * 1.85, 0.1, 0.5]}>
        <mesh>
          <boxGeometry args={[0.08, 0.02, 2.0]} />
          <meshStandardMaterial {...SLOT} />
        </mesh>
        {/* Fader Scale */}
        {[-0.8, -0.4, 0, 0.4, 0.8].map((z) => (
          <mesh key={z} position={[0.1, 0.01, z]}>
             <boxGeometry args={[0.05, 0.005, 0.01]} />
             <meshStandardMaterial color="#444" />
          </mesh>
        ))}
        <mesh position={[0, 0.06, 0.2]}>
          <boxGeometry args={[0.22, 0.1, 0.15]} />
          <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
          <mesh position={[0, 0.051, 0]}>
             <boxGeometry args={[0.02, 0.01, 0.15]} />
             <meshStandardMaterial color={LIME} emissive={LIME} />
          </mesh>
        </mesh>
      </group>
    </group>
  );
}

/* ---------- Mixer (4 channels + VU + crossfader) ---------- */

function Knob({ position, label }: { position: [number, number, number]; label?: string }) {
  return (
    <group position={position}>
      {label && <Label text={label} position={[0, 0.12, -0.2]} size={0.05} />}
      <mesh>
        <cylinderGeometry args={[0.09, 0.11, 0.12, 32]} />
        <meshStandardMaterial {...KNOB} />
      </mesh>
      {/* indicator line */}
      <mesh position={[0, 0.06, -0.07]}>
        <boxGeometry args={[0.02, 0.015, 0.08]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.5} />
      </mesh>
      {/* Base ring */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.13, 0.13, 0.02, 32]} />
        <meshStandardMaterial color="#000" />
      </mesh>
    </group>
  );
}

function VUColumn({ position, level }: { position: [number, number, number]; level: number }) {
  const colors = [LIME, LIME, LIME, YELLOW, RED];
  return (
    <group position={position}>
      {colors.map((c, i) => (
        <mesh key={i} position={[0, 0, -i * 0.15]}>
          <boxGeometry args={[0.1, 0.04, 0.12]} />
          <meshStandardMaterial
            color={i < level ? c : "#111"}
            emissive={c}
            emissiveIntensity={i < level ? 1.2 : 0.05}
          />
        </mesh>
      ))}
    </group>
  );
}

function Mixer({ isPlaying }: { isPlaying: boolean }) {
  const faderPos = [0.28, 0.05, 0.32, 0.14];
  const channelX = [-0.85, -0.28, 0.28, 0.85];

  return (
    <group>
      {/* Raised mixer panel with texture */}
      <mesh position={[0, 0.08, 0.1]}>
        <boxGeometry args={[2.5, 0.12, 4.4]} />
        <meshStandardMaterial {...PANEL} />
      </mesh>
      
      {/* Mixer Branding */}
      <Label text="SETRYA PRO" position={[0, 0.15, -1.9]} size={0.15} color="#fff" />

      {channelX.map((x, ch) => (
        <group key={ch} position={[x, 0.16, 0]}>
          <Label text={(ch + 1).toString()} position={[0, 0, -1.8]} size={0.1} color="#666" />
          
          {/* gain + 3-band EQ */}
          <Knob position={[0, 0, -1.5]} label="GAIN" />
          <Knob position={[0, 0, -1.1]} label="HI" />
          <Knob position={[0, 0, -0.7]} label="MID" />
          <Knob position={[0, 0, -0.3]} label="LOW" />

          {/* line fader slot */}
          <mesh position={[0, -0.02, 0.9]}>
            <boxGeometry args={[0.06, 0.02, 1.4]} />
            <meshStandardMaterial {...SLOT} />
          </mesh>
          <mesh position={[0, 0.05, 0.9 - faderPos[ch] * 1.2 + 0.6]}>
            <boxGeometry args={[0.22, 0.08, 0.15]} />
            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
            <mesh position={[0, 0.041, 0]}>
               <boxGeometry args={[0.02, 0.01, 0.15]} />
               <meshStandardMaterial color={CYAN} emissive={CYAN} />
            </mesh>
          </mesh>
        </group>
      ))}

      {/* VU meters - Master */}
      <group position={[0, 0.16, -0.8]}>
         <VUColumn position={[-0.1, 0, 0]} level={isPlaying ? 4 : 1} />
         <VUColumn position={[0.1, 0, 0]} level={isPlaying ? 3 : 1} />
         <Label text="MASTER" position={[0, 0, 0.3]} size={0.06} />
      </group>

      {/* Crossfader section */}
      <group position={[0, 0.16, 1.8]}>
        <mesh>
          <boxGeometry args={[1.4, 0.02, 0.08]} />
          <meshStandardMaterial {...SLOT} />
        </mesh>
        <mesh position={[0.1, 0.05, 0]}>
          <boxGeometry args={[0.18, 0.1, 0.22]} />
          <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
          <mesh position={[0, 0.051, 0]}>
             <boxGeometry args={[0.02, 0.01, 0.22]} />
             <meshStandardMaterial color={CYAN} emissive={CYAN} />
          </mesh>
        </mesh>
      </group>
    </group>
  );
}

/* ---------- Ambient particles ---------- */

function AmbientParticles() {
  const count = 120;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={CYAN} transparent opacity={0.4} sizeAttenuation />
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
      camera={{ position: [0, 8, 10], fov: 40 }}
      gl={{ antialias: true, alpha: true, stencil: false, depth: true }}
      style={{ background: "transparent" }}
    >
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 10, 25]} />
      
      <ambientLight intensity={0.2} />
      <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, 5, -5]} color={CYAN} intensity={1.5} />
      <pointLight position={[10, 5, -5]} color={LIME} intensity={1.5} />
      <pointLight position={[0, 5, 10]} color="#fff" intensity={0.5} />

      <AmbientParticles />

      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
        <group rotation={[0.1, 0, 0]} position={[0, -0.5, 0]}>
          {/* Main Chassis */}
          <group>
            {/* Bottom Base */}
            <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
              <boxGeometry args={[11, 0.3, 5]} />
              <meshStandardMaterial {...BODY} />
            </mesh>
            {/* Top Deck Surface */}
            <mesh position={[0, 0.05, 0]} receiveShadow>
              <boxGeometry args={[10.8, 0.1, 4.8]} />
              <meshStandardMaterial color="#0f0f0f" metalness={0.5} roughness={0.5} />
            </mesh>
            {/* Side Accents */}
            <mesh position={[-5.45, -0.05, 0]}>
              <boxGeometry args={[0.1, 0.4, 5.1]} />
              <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.2} />
            </mesh>
            <mesh position={[5.45, -0.05, 0]}>
              <boxGeometry args={[0.1, 0.4, 5.1]} />
              <meshStandardMaterial color={LIME} emissive={LIME} emissiveIntensity={0.2} />
            </mesh>
          </group>

          <group position={[-3.6, 0.1, 0]}>
            <Deck isPlaying={isPlaying} />
          </group>
          <group position={[3.6, 0.1, 0]}>
            <Deck isPlaying={isPlaying} mirrored />
          </group>
          <Mixer isPlaying={isPlaying} />
        </group>
      </Float>

      {interactive && (
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={5}
          maxDistance={15}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          autoRotate={!isPlaying}
          autoRotateSpeed={0.5}
        />
      )}
    </Canvas>
  );
}


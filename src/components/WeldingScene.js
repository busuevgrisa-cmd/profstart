// src/components/WeldingScene.js — Welding Post Practice Scene
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const MAT = {
  steel:       { color: '#8a9099', metalness: 0.9, roughness: 0.15 },
  darkSteel:   { color: '#3a3f4a', metalness: 0.85, roughness: 0.2 },
  brightSteel: { color: '#c0c4cc', metalness: 0.95, roughness: 0.08 },
  black:       { color: '#1a1c22', metalness: 0.3, roughness: 0.6 },
  darkGray:    { color: '#2a2e38', metalness: 0.2, roughness: 0.7 },
  gray:        { color: '#6a7080', metalness: 0.4, roughness: 0.5 },
  lightGray:   { color: '#b8bcc4', metalness: 0.2, roughness: 0.6 },
  red:         { color: '#cc2200', metalness: 0.3, roughness: 0.5 },
  yellow:      { color: '#f0c020', metalness: 0.2, roughness: 0.5 },
  orange:      { color: '#d05010', metalness: 0.2, roughness: 0.5 },
  green:       { color: '#228844', metalness: 0.3, roughness: 0.5 },
  rubber:      { color: '#111111', metalness: 0.0, roughness: 0.95 },
  copper:      { color: '#b87333', metalness: 0.85, roughness: 0.2 },
  welding:     { color: '#1a2a3a', metalness: 0.6, roughness: 0.4 },
  weld:        { color: '#8a6030', metalness: 0.7, roughness: 0.35 },
  concrete:    { color: '#888c90', metalness: 0.0, roughness: 0.9 },
  helmet:      { color: '#222', metalness: 0.3, roughness: 0.5 },
  visor:       { color: '#1a0a00', metalness: 0.1, roughness: 0.3 },
  table:       { color: '#444a52', metalness: 0.5, roughness: 0.4 },
  workpiece:   { color: '#7a8090', metalness: 0.8, roughness: 0.25 },
};

function M({ m = 'steel', pos, rot, scale, castShadow, receiveShadow, onClick, children }) {
  const mat = MAT[m] || MAT.steel;
  return (
    <mesh position={pos} rotation={rot} scale={scale} castShadow={castShadow} receiveShadow={receiveShadow} onClick={onClick}>
      {children}
      <meshStandardMaterial color={mat.color} metalness={mat.metalness} roughness={mat.roughness} />
    </mesh>
  );
}

function Hl({ on, color = '#ffaa33', children }) {
  const grp = useRef();
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt * 2.5;
    const intensity = on ? 0.16 + Math.abs(Math.sin(t.current)) * 0.24 : 0;
    grp.current?.traverse(o => {
      if (o.isMesh && o.material) {
        o.material.emissive?.set(on ? color : '#000000');
        o.material.emissiveIntensity = intensity;
      }
    });
  });
  return <group ref={grp}>{children}</group>;
}

function Label3D({ pos, text, on }) {
  if (!on) return null;
  return (
    <Html position={pos} center>
      <div style={{ background: 'rgba(10,20,40,0.9)', color: '#ffd060', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(255,200,80,0.5)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
        {text}
      </div>
    </Html>
  );
}

// Arc flash effect
function ArcFlash({ active }) {
  const meshRef = useRef();
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (meshRef.current) {
      meshRef.current.material.emissiveIntensity = active
        ? 1.5 + Math.sin(t.current * 40) * 0.8 + Math.random() * 0.5
        : 0;
      meshRef.current.scale.setScalar(active ? 0.8 + Math.random() * 0.4 : 0);
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0.06, 0.35]}>
      <sphereGeometry args={[0.05, 8, 8]} />
      <meshStandardMaterial color="#ffffff" emissive="#ffee88" emissiveIntensity={0} transparent opacity={0.85} />
    </mesh>
  );
}

// Dynamic arc light
function ArcLight({ active }) {
  const lightRef = useRef();
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt;
    if (lightRef.current) {
      lightRef.current.intensity = active ? 3.5 + Math.sin(t.current * 35) * 1.5 + Math.random() * 1.0 : 0;
    }
  });
  return <pointLight ref={lightRef} position={[0, 0.8, 0.35]} color="#aaccff" intensity={0} distance={4} />;
}

// Spark particles
function Sparks({ active }) {
  const sparks = useRef([]);
  const grpRef = useRef();
  const t = useRef(0);

  useFrame((_, dt) => {
    t.current += dt;
    if (!grpRef.current || !active) return;
    grpRef.current.children.forEach((s, i) => {
      if (!sparks.current[i]) sparks.current[i] = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 0 };
      const sp = sparks.current[i];
      sp.life -= dt;
      if (sp.life <= 0) {
        sp.x = (Math.random() - 0.5) * 0.05;
        sp.y = 0.06;
        sp.z = 0.35;
        sp.vx = (Math.random() - 0.5) * 1.2;
        sp.vy = Math.random() * 0.8 + 0.3;
        sp.vz = Math.random() * 0.6 - 0.1;
        sp.maxLife = 0.3 + Math.random() * 0.4;
        sp.life = sp.maxLife;
      }
      sp.vy -= dt * 2.5;
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.z += sp.vz * dt;
      s.position.set(sp.x, sp.y, sp.z);
      const fade = sp.life / sp.maxLife;
      s.material.opacity = fade * 0.95;
      s.scale.setScalar(fade * 0.6);
    });
  });

  if (!active) return null;
  return (
    <group ref={grpRef}>
      {Array.from({ length: 18 }, (_, i) => (
        <mesh key={i} position={[0, 0.06, 0.35]}>
          <sphereGeometry args={[0.007, 4, 4]} />
          <meshStandardMaterial color="#ffcc44" emissive="#ffcc44" emissiveIntensity={2} transparent opacity={1} />
        </mesh>
      ))}
    </group>
  );
}

// Welding machine / inverter
function WeldingMachine({ hl, onClick }) {
  return (
    <group position={[-1.2, -0.55, -0.5]} onClick={onClick}>
      <Hl on={hl} color="#00aaff">
        {/* Main body */}
        <M m="welding" castShadow>
          <boxGeometry args={[0.55, 0.62, 0.38]} />
        </M>
        {/* Front panel */}
        <M m="darkGray" pos={[0, 0, 0.2]}>
          <boxGeometry args={[0.5, 0.58, 0.01]} />
        </M>
        {/* Display */}
        <mesh position={[0.08, 0.12, 0.205]}>
          <boxGeometry args={[0.22, 0.12, 0.003]} />
          <meshStandardMaterial color="#001a00" emissive="#002200" emissiveIntensity={0.5} />
        </mesh>
        {/* Current knob */}
        <M m="brightSteel" pos={[-0.12, 0.08, 0.205]}>
          <cylinderGeometry args={[0.045, 0.045, 0.025, 16]} />
        </M>
        <M m="darkGray" pos={[-0.12, 0.08, 0.218]} rot={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.018, 6]} />
        </M>
        {/* Power button */}
        <mesh position={[-0.12, -0.1, 0.206]}>
          <cylinderGeometry args={[0.022, 0.022, 0.018, 12]} />
          <meshStandardMaterial color="#cc2200" emissive="#cc2200" emissiveIntensity={0.4} />
        </mesh>
        {/* Indicator LED */}
        <mesh position={[0.08, -0.08, 0.206]}>
          <cylinderGeometry args={[0.008, 0.008, 0.01, 12]} />
          <meshStandardMaterial color="#22ee44" emissive="#22ee44" emissiveIntensity={0.9} />
        </mesh>
        {/* Ventilation grille */}
        {Array.from({ length: 5 }, (_, i) => (
          <M key={i} m="black" pos={[0, -0.2 + i * 0.05, 0.2]}>
            <boxGeometry args={[0.44, 0.012, 0.005]} />
          </M>
        ))}
        {/* Output terminals */}
        <M m="red" pos={[-0.1, -0.22, 0.205]}>
          <cylinderGeometry args={[0.018, 0.018, 0.025, 12]} />
        </M>
        <M m="black" pos={[0.1, -0.22, 0.205]}>
          <cylinderGeometry args={[0.018, 0.018, 0.025, 12]} />
        </M>
        {/* Handle top */}
        <M m="rubber" pos={[0, 0.32, 0]}>
          <boxGeometry args={[0.28, 0.04, 0.06]} />
        </M>
        {/* Wheels */}
        {[[-0.2, -0.32, -0.12], [0.2, -0.32, -0.12], [-0.2, -0.32, 0.12], [0.2, -0.32, 0.12]].map((p, i) => (
          <M key={i} m="rubber" pos={p} rot={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.025, 12]} />
          </M>
        ))}
      </Hl>
      <Label3D pos={[0, 0.5, 0.3]} text="Сварочный инвертор" on={hl} />
    </group>
  );
}

// Welding cable and electrode holder
function ElectrodeHolder({ hl, onClick, welding }) {
  return (
    <group onClick={onClick}>
      {/* Cable from machine */}
      <mesh position={[-0.8, -0.35, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.012, 0.012, 1.5, 8]} />
        <meshStandardMaterial color="#cc2200" />
      </mesh>
      {/* Holder body */}
      <group position={[0, 0.05, 0.25]}>
        <Hl on={hl} color="#ffaa00">
          <M m="darkGray" castShadow>
            <cylinderGeometry args={[0.025, 0.022, 0.22, 10]} />
          </M>
          <M m="rubber" pos={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.08, 10]} />
          </M>
          {/* Clamp jaw */}
          <M m="brightSteel" pos={[0, 0.12, 0]} rot={[0, 0, 0.3]}>
            <boxGeometry args={[0.045, 0.06, 0.018]} />
          </M>
          <M m="brightSteel" pos={[0, 0.12, 0]} rot={[0, 0, -0.3]}>
            <boxGeometry args={[0.045, 0.06, 0.018]} />
          </M>
          {/* Electrode */}
          <M m="gray" pos={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.3, 6]} />
          </M>
          <M m="orange" pos={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.006, 0.002, 0.08, 6]} />
          </M>
        </Hl>
        <ArcFlash active={welding} />
        <Sparks active={welding} />
        <ArcLight active={welding} />
      </group>
      <Label3D pos={[0, 0.5, 0.3]} text="Электрододержатель" on={hl} />
    </group>
  );
}

// Ground clamp / Обратный кабель
function GroundClamp({ hl, onClick }) {
  return (
    <group position={[0.4, -0.68, 0.1]} onClick={onClick}>
      <Hl on={hl} color="#00ff88">
        {/* Cable */}
        <mesh position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 8]}>
          <cylinderGeometry args={[0.01, 0.01, 1.0, 8]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* Clamp body */}
        <M m="brightSteel" castShadow>
          <boxGeometry args={[0.08, 0.035, 0.025]} />
        </M>
        <M m="brightSteel" pos={[0, 0.02, 0]} rot={[0, 0, 0.5]}>
          <boxGeometry args={[0.06, 0.012, 0.022]} />
        </M>
        <M m="brightSteel" pos={[0, -0.02, 0]} rot={[0, 0, -0.5]}>
          <boxGeometry args={[0.06, 0.012, 0.022]} />
        </M>
        <M m="rubber" pos={[-0.055, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.03, 8]} />
        </M>
      </Hl>
      <Label3D pos={[0, 0.1, 0.05]} text="Обратный кабель (масса)" on={hl} />
    </group>
  );
}

// Welding table
function WeldingTable({ hl, onClick }) {
  return (
    <group position={[0, -0.68, 0.2]} onClick={onClick}>
      <Hl on={hl} color="#4488ff">
        {/* Table top */}
        <M m="table" castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.06, 0.9]} />
        </M>
        {/* Grid slots */}
        {Array.from({ length: 5 }, (_, i) => (
          <M key={`gx${i}`} m="darkSteel" pos={[-0.4 + i * 0.2, 0.032, 0]}>
            <boxGeometry args={[0.012, 0.01, 0.88]} />
          </M>
        ))}
        {Array.from({ length: 4 }, (_, i) => (
          <M key={`gz${i}`} m="darkSteel" pos={[0, 0.032, -0.3 + i * 0.2]}>
            <boxGeometry args={[1.18, 0.01, 0.012]} />
          </M>
        ))}
        {/* Legs */}
        {[[-0.54, -0.35, -0.38], [0.54, -0.35, -0.38], [-0.54, -0.35, 0.38], [0.54, -0.35, 0.38]].map((p, i) => (
          <M key={i} m="darkSteel" pos={p} castShadow>
            <boxGeometry args={[0.06, 0.64, 0.06]} />
          </M>
        ))}
        {/* Shelf */}
        <M m="table" pos={[0, -0.55, 0]}>
          <boxGeometry args={[1.1, 0.03, 0.82]} />
        </M>
      </Hl>
      <Label3D pos={[0, 0.18, 0.5]} text="Сварочный стол" on={hl} />
    </group>
  );
}

// Workpiece - metal plates to weld
function Workpiece({ hl, onClick, weldDone }) {
  return (
    <group position={[0, -0.62, 0.18]} onClick={onClick}>
      <Hl on={hl} color="#aaddff">
        {/* Base plate */}
        <M m="workpiece" castShadow>
          <boxGeometry args={[0.55, 0.014, 0.22]} />
        </M>
        {/* Second plate angled */}
        <M m="workpiece" pos={[0, 0.04, -0.02]} rot={[0.15, 0, 0]} castShadow>
          <boxGeometry args={[0.55, 0.014, 0.22]} />
        </M>
        {/* Weld seam if done */}
        {weldDone && (
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.54, 0.012, 0.025]} />
            <meshStandardMaterial color="#6a4020" metalness={0.6} roughness={0.55} />
          </mesh>
        )}
        {/* Clamps holding workpiece */}
        {[-0.22, 0.22].map((x, i) => (
          <group key={i} position={[x, 0.04, 0.04]}>
            <M m="brightSteel">
              <boxGeometry args={[0.055, 0.065, 0.022]} />
            </M>
            <M m="steel" pos={[0, -0.045, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.05, 8]} />
            </M>
          </group>
        ))}
      </Hl>
      <Label3D pos={[0, 0.14, 0.25]} text="Заготовка" on={hl} />
    </group>
  );
}

// PPE — helmet, gloves, mask
function PPE({ hl, onClick }) {
  return (
    <group position={[1.3, -0.3, -0.2]} onClick={onClick}>
      <Hl on={hl} color="#ff6600">
        {/* Welding helmet */}
        <group position={[0, 0.35, 0]}>
          <M m="helmet" castShadow>
            <sphereGeometry args={[0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
          </M>
          <M m="helmet" pos={[0, -0.08, 0.08]}>
            <boxGeometry args={[0.28, 0.2, 0.06]} />
          </M>
          <M m="visor" pos={[0, -0.08, 0.11]}>
            <boxGeometry args={[0.24, 0.14, 0.01]} />
          </M>
        </group>
        {/* Gloves on shelf */}
        <group position={[0, 0.05, 0]}>
          <M m="orange" pos={[-0.07, 0, 0]} rot={[0, 0.3, 0.2]} castShadow>
            <boxGeometry args={[0.07, 0.2, 0.04]} />
          </M>
          <M m="orange" pos={[-0.05, -0.06, 0.01]} rot={[0, 0, 0.1]}>
            <boxGeometry args={[0.035, 0.06, 0.035]} />
          </M>
          <M m="orange" pos={[0.07, 0, 0]} rot={[0, -0.3, -0.2]} castShadow>
            <boxGeometry args={[0.07, 0.2, 0.04]} />
          </M>
          <M m="orange" pos={[0.05, -0.06, 0.01]} rot={[0, 0, -0.1]}>
            <boxGeometry args={[0.035, 0.06, 0.035]} />
          </M>
        </group>
        {/* Safety jacket hanging */}
        <M m="yellow" pos={[0, -0.3, -0.05]} castShadow>
          <boxGeometry args={[0.35, 0.5, 0.04]} />
        </M>
      </Hl>
      <Label3D pos={[0, 0.6, 0.1]} text="СИЗ (каска, перчатки, куртка)" on={hl} />
    </group>
  );
}

// Electrode box
function ElectrodeBox({ hl, onClick }) {
  return (
    <group position={[-0.5, -0.62, -0.3]} onClick={onClick}>
      <Hl on={hl} color="#ff9900">
        <M m="yellow" castShadow>
          <boxGeometry args={[0.2, 0.08, 0.12]} />
        </M>
        <M m="orange" pos={[0, 0.044, 0]}>
          <boxGeometry args={[0.18, 0.01, 0.1]} />
        </M>
        {/* Electrodes sticking out */}
        {[-0.04, 0, 0.04].map((z, i) => (
          <M key={i} m="gray" pos={[0.12, 0.04, z]}>
            <cylinderGeometry args={[0.004, 0.004, 0.18, 6]} />
          </M>
        ))}
      </Hl>
      <Label3D pos={[0, 0.12, 0.1]} text="Электроды МР-3 Ø3мм" on={hl} />
    </group>
  );
}

// Current control dial display
function CurrentDisplay({ current, hl, onClick }) {
  return (
    <group position={[-1.2, -0.1, -0.3]} onClick={onClick}>
      <Hl on={hl} color="#00ccff">
        <M m="black" castShadow>
          <boxGeometry args={[0.25, 0.18, 0.04]} />
        </M>
        <mesh position={[0, 0.02, 0.022]}>
          <boxGeometry args={[0.2, 0.1, 0.002]} />
          <meshStandardMaterial color="#001a00" emissive="#002200" emissiveIntensity={0.6} />
        </mesh>
        <Html position={[0, 0.02, 0.03]} center>
          <div style={{ color: '#00ff88', fontSize: 16, fontWeight: 900, fontFamily: 'monospace', pointerEvents: 'none' }}>
            {current}A
          </div>
        </Html>
      </Hl>
      <Label3D pos={[0, 0.18, 0.06]} text="Ток сварки" on={hl} />
    </group>
  );
}

// Angle grinder for seam cleaning
function AngleGrinder({ hl, onClick }) {
  return (
    <group position={[0.5, -0.62, -0.3]} onClick={onClick}>
      <Hl on={hl} color="#ff4400">
        <M m="darkGray" rot={[0, 0, Math.PI / 4]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, 0.28, 10]} />
        </M>
        <M m="black" pos={[0.08, -0.08, 0]} rot={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.06, 0.06, 0.012, 16]} />
        </M>
        <M m="brightSteel" pos={[0.08, -0.08, 0.007]} rot={[0, 0, Math.PI / 4]}>
          <cylinderGeometry args={[0.058, 0.058, 0.002, 16]} />
        </M>
        <M m="gray" pos={[0.03, -0.03, 0]}>
          <boxGeometry args={[0.04, 0.04, 0.08]} />
        </M>
      </Hl>
      <Label3D pos={[0, 0.12, 0.08]} text="УШМ (болгарка)" on={hl} />
    </group>
  );
}

// Exhaust ventilation hood
function VentHood({ hl, onClick }) {
  return (
    <group position={[0, 2.0, -0.1]} onClick={onClick}>
      <Hl on={hl} color="#88aaff">
        <M m="brightSteel" pos={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.7, 0.06, 0.5]} />
        </M>
        <M m="steel" pos={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.34, 12]} />
        </M>
        {/* Slats */}
        {Array.from({ length: 4 }, (_, i) => (
          <M key={i} m="gray" pos={[-0.2 + i * 0.14, -0.04, 0]}>
            <boxGeometry args={[0.06, 0.02, 0.44]} />
          </M>
        ))}
        {/* Duct going up */}
        <M m="lightGray" pos={[0, 0.55, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.7, 12]} />
        </M>
      </Hl>
      <Label3D pos={[0, 0.4, 0.3]} text="Вытяжная вентиляция" on={hl} />
    </group>
  );
}

// Workshop environment
function Room() {
  return (
    <group>
      {/* Concrete floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.35, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#5a5e64" metalness={0.05} roughness={0.92} />
      </mesh>
      {/* Floor grid lines */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={`gx${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[-4 + i, -1.349, 0]}>
          <planeGeometry args={[0.012, 14]} />
          <meshStandardMaterial color="#3e4148" />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`gz${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.349, -3 + i]}>
          <planeGeometry args={[18, 0.012]} />
          <meshStandardMaterial color="#3e4148" />
        </mesh>
      ))}
      {/* Back wall */}
      <mesh position={[0, 1.2, -1.8]} receiveShadow>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial color="#c0c4c8" roughness={0.95} />
      </mesh>
      {/* Left wall */}
      <mesh position={[-5.5, 1.2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 8]} />
        <meshStandardMaterial color="#b8bcc0" roughness={0.95} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3.8, 0]}>
        <planeGeometry args={[18, 14]} />
        <meshStandardMaterial color="#d4d8dc" roughness={1} />
      </mesh>
      {/* Ceiling lights */}
      {[[-2, 3.72, 0], [0, 3.72, 0], [2, 3.72, 0]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <boxGeometry args={[0.9, 0.055, 0.3]} />
            <meshStandardMaterial color="#888" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.82, 0.02, 0.24]} />
            <meshStandardMaterial color="#fff9e8" emissive="#fff9e8" emissiveIntensity={1.1} />
          </mesh>
        </group>
      ))}
      {/* Gas cylinders */}
      <group position={[4.5, -0.5, -1.5]}>
        {[{ x: 0, c: '#2244cc' }, { x: 0.28, c: '#cc2200' }].map((cyl, i) => (
          <group key={i} position={[cyl.x, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.1, 0.1, 1.5, 14]} />
              <meshStandardMaterial color={cyl.c} metalness={0.4} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.78, 0]}>
              <cylinderGeometry args={[0.07, 0.1, 0.1, 14]} />
              <meshStandardMaterial color={cyl.c} />
            </mesh>
            <mesh position={[0, 0.88, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 0.08, 10]} />
              <meshStandardMaterial color="#888" metalness={0.8} />
            </mesh>
          </group>
        ))}
        {/* Safety chain */}
        <mesh position={[0.14, 0.2, 0]}>
          <torusGeometry args={[0.18, 0.008, 6, 14, Math.PI]} />
          <meshStandardMaterial color="#f0c020" metalness={0.5} />
        </mesh>
      </group>
      {/* Fire extinguisher */}
      <group position={[-5.2, -0.5, -1.5]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.065, 0.55, 12]} />
          <meshStandardMaterial color="#cc2000" metalness={0.3} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.06, 12]} />
          <meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2} />
        </mesh>
      </group>
      {/* Tool rack */}
      <group position={[4.2, 0.3, -1.72]}>
        <mesh castShadow>
          <boxGeometry args={[1.4, 1.6, 0.08]} />
          <meshStandardMaterial color="#3a4050" />
        </mesh>
        {[0.5, 0.1, -0.3].map((y, i) => (
          <mesh key={i} position={[0, y, 0.05]}>
            <boxGeometry args={[1.2, 0.02, 0.02]} />
            <meshStandardMaterial color="#666" metalness={0.7} />
          </mesh>
        ))}
      </group>
      {/* Safety warning sign on wall */}
      <group position={[-5.4, 2.2, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.6, 0.4, 0.01]} />
          <meshStandardMaterial color="#f0c020" />
        </mesh>
        <mesh position={[0, 0, 0.007]}>
          <boxGeometry args={[0.52, 0.34, 0.002]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
}

export default function WeldingScene({ currentStep, onObjectClick, completedSteps, welding, weldDone, current = 120 }) {
  const is = obj => currentStep?.object === obj;
  const click = obj => e => { e.stopPropagation(); onObjectClick(obj); };

  return (
    <div className="scene-container">
      <Canvas
        style={{ flex: 1, minHeight: 0 }}
        camera={{ position: [2.2, 1.8, 4.5], fov: 46 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: welding ? 0.85 : 1.1 }}
      >
        <ambientLight intensity={welding ? 0.18 : 0.35} />
        <directionalLight position={[5, 9, 4]} intensity={welding ? 0.7 : 1.3} castShadow
          shadow-mapSize={[2048, 2048]} shadow-camera-near={0.5} shadow-camera-far={28}
          shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
        {[[-2, 3.6, 0], [0, 3.6, 0], [2, 3.6, 0]].map(([x, y, z], i) => (
          <pointLight key={i} position={[x, y, z]} intensity={0.65} color="#fff8e0" distance={12} />
        ))}

        <Room />

        {/* Welding post content */}
        <WeldingMachine hl={is('welder')} onClick={click('welder')} />
        <ElectrodeHolder hl={is('electrode_holder')} onClick={click('electrode_holder')} welding={welding} />
        <GroundClamp hl={is('ground_clamp')} onClick={click('ground_clamp')} />
        <WeldingTable hl={is('welding_table')} onClick={click('welding_table')} />
        <Workpiece hl={is('workpiece')} onClick={click('workpiece')} weldDone={weldDone} />
        <PPE hl={is('ppe')} onClick={click('ppe')} />
        <ElectrodeBox hl={is('electrode_box')} onClick={click('electrode_box')} />
        <CurrentDisplay current={current} hl={is('current_control')} onClick={click('current_control')} />
        <AngleGrinder hl={is('grinder')} onClick={click('grinder')} />
        <VentHood hl={is('ventilation')} onClick={click('ventilation')} />

        <OrbitControls enablePan enableDamping dampingFactor={0.07}
          maxPolarAngle={Math.PI / 1.88} minDistance={2} maxDistance={12} target={[0, 0, 0]} />
      </Canvas>

      {/* Completed steps overlay */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: '55%' }}>
        {completedSteps?.map((s, i) => (
          <span key={i} style={{ background: 'rgba(22,163,74,.9)', color: '#fff', fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 600, backdropFilter: 'blur(4px)' }}>✓ {s}</span>
        ))}
      </div>

      {/* Welding active indicator */}
      {welding && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(220,120,20,.92)', color: '#fff', fontSize: 12, padding: '5px 13px', borderRadius: 8, fontWeight: 700, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 8px #ffaa00' }} />
          ДУГА ГОРИТ · {current}А
        </div>
      )}

      {weldDone && !welding && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(22,120,60,.92)', color: '#fff', fontSize: 12, padding: '5px 13px', borderRadius: 8, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
          ✓ ШОВ ВЫПОЛНЕН
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,.55)', color: '#d1d5db', fontSize: 11, padding: '5px 11px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
        ЛКМ вращать · ПКМ сдвигать · Колесо зум · Клик на объект
      </div>
    </div>
  );
}

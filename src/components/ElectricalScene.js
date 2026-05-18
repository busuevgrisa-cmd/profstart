// src/components/ElectricalScene.js — Electrical Panel Practice Scene
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const MAT = {
  panelGray:    { color: '#b0b8c4', metalness: 0.4, roughness: 0.5 },
  darkGray:     { color: '#3a3f4a', metalness: 0.5, roughness: 0.4 },
  lightGray:    { color: '#d8dce4', metalness: 0.2, roughness: 0.6 },
  steel:        { color: '#8a9099', metalness: 0.9, roughness: 0.15 },
  black:        { color: '#1a1c22', metalness: 0.3, roughness: 0.6 },
  white:        { color: '#f0f2f5', metalness: 0.1, roughness: 0.7 },
  red:          { color: '#cc2200', metalness: 0.4, roughness: 0.4 },
  green:        { color: '#22aa44', metalness: 0.4, roughness: 0.35 },
  yellow:       { color: '#f0c020', metalness: 0.3, roughness: 0.5 },
  blue:         { color: '#2244cc', metalness: 0.3, roughness: 0.5 },
  orange:       { color: '#e06010', metalness: 0.3, roughness: 0.5 },
  copper:       { color: '#b87333', metalness: 0.85, roughness: 0.2 },
  dinRail:      { color: '#707880', metalness: 0.8, roughness: 0.2 },
  insulator:    { color: '#e8e0d0', metalness: 0.0, roughness: 0.8 },
  rubber:       { color: '#1a1a1a', metalness: 0.0, roughness: 0.95 },
  plastic:      { color: '#2a2e38', metalness: 0.1, roughness: 0.8 },
  wallConcrete: { color: '#c8ccd0', metalness: 0.0, roughness: 0.9 },
};

function M({ m = 'steel', em, ei = 0.5, pos, rot, scale, castShadow, receiveShadow, onClick, children }) {
  const mat = MAT[m] || MAT.steel;
  return (
    <mesh position={pos} rotation={rot} scale={scale} castShadow={castShadow} receiveShadow={receiveShadow} onClick={onClick}>
      {children}
      <meshStandardMaterial color={mat.color} metalness={mat.metalness} roughness={mat.roughness}
        emissive={em || '#000000'} emissiveIntensity={em ? ei : 0} />
    </mesh>
  );
}

function Hl({ on, color = '#33ff88', children }) {
  const grp = useRef();
  const t = useRef(0);
  useFrame((_, dt) => {
    t.current += dt * 2.5;
    const intensity = on ? 0.14 + Math.abs(Math.sin(t.current)) * 0.22 : 0;
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
      <div style={{ background: 'rgba(10,20,40,0.9)', color: '#60d4ff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(96,212,255,0.5)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
        {text}
      </div>
    </Html>
  );
}

// Panel cabinet body
function PanelCabinet() {
  return (
    <group>
      {/* Back wall of cabinet */}
      <M m="panelGray" pos={[0, 0, -0.08]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 2.4, 0.06]} />
      </M>
      {/* Left side */}
      <M m="darkGray" pos={[-0.81, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 2.4, 0.22]} />
      </M>
      {/* Right side */}
      <M m="darkGray" pos={[0.81, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 2.4, 0.22]} />
      </M>
      {/* Top */}
      <M m="darkGray" pos={[0, 1.22, 0]} castShadow>
        <boxGeometry args={[1.68, 0.04, 0.22]} />
      </M>
      {/* Bottom */}
      <M m="darkGray" pos={[0, -1.22, 0]} castShadow>
        <boxGeometry args={[1.68, 0.04, 0.22]} />
      </M>
      {/* Frame edge detail */}
      <M m="lightGray" pos={[0, 0, 0.06]}>
        <boxGeometry args={[1.58, 2.38, 0.01]} />
      </M>
    </group>
  );
}

// DIN Rail
function DinRail({ hl, onClick, posY }) {
  return (
    <group position={[0, posY, 0]} onClick={onClick}>
      <Hl on={hl} color="#00aaff">
        <M m="dinRail" pos={[0, 0, 0]}>
          <boxGeometry args={[1.3, 0.035, 0.035]} />
        </M>
        <M m="steel" pos={[0, 0.02, 0]}>
          <boxGeometry args={[1.3, 0.01, 0.012]} />
        </M>
        {Array.from({ length: 7 }, (_, i) => (
          <M key={i} m="steel" pos={[-0.54 + i * 0.18, 0, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.04, 8]} />
          </M>
        ))}
      </Hl>
      <Label3D pos={[0, 0.12, 0.1]} text="DIN-рейка" on={hl} />
    </group>
  );
}

// Circuit breaker
function Breaker({ hl, onClick, posX, posY, color = 'black', label = '25A', on = false }) {
  return (
    <group position={[posX, posY, 0.018]} onClick={onClick}>
      <Hl on={hl} color="#ffaa00">
        <M m={color === 'black' ? 'black' : 'plastic'} castShadow>
          <boxGeometry args={[0.08, 0.165, 0.065]} />
        </M>
        {/* Toggle handle */}
        <M m="white" pos={[0, on ? 0.035 : -0.035, 0.034]}>
          <boxGeometry args={[0.04, 0.04, 0.015]} />
        </M>
        {/* Status indicator */}
        <mesh position={[0, 0.065, 0.034]}>
          <cylinderGeometry args={[0.008, 0.008, 0.008, 12]} />
          <meshStandardMaterial color={on ? '#22ee44' : '#888'} emissive={on ? '#22ee44' : '#000'} emissiveIntensity={on ? 0.8 : 0} />
        </mesh>
        {/* Terminal top */}
        <M m="steel" pos={[0, 0.088, 0]}>
          <boxGeometry args={[0.028, 0.015, 0.045]} />
        </M>
        {/* Terminal bottom */}
        <M m="steel" pos={[0, -0.088, 0]}>
          <boxGeometry args={[0.028, 0.015, 0.045]} />
        </M>
        {/* Label area */}
        <M m="lightGray" pos={[0, -0.02, 0.034]}>
          <boxGeometry args={[0.06, 0.06, 0.002]} />
        </M>
      </Hl>
    </group>
  );
}

// RCD / УЗО
function RCD({ hl, onClick, posX, posY }) {
  return (
    <group position={[posX, posY, 0.018]} onClick={onClick}>
      <Hl on={hl} color="#ff6600">
        <M m="plastic" castShadow>
          <boxGeometry args={[0.14, 0.175, 0.07]} />
        </M>
        {/* Test button */}
        <M m="red" pos={[0.03, 0.06, 0.037]}>
          <cylinderGeometry args={[0.012, 0.012, 0.012, 12]} />
        </M>
        {/* Reset button */}
        <M m="white" pos={[-0.02, 0.06, 0.037]}>
          <cylinderGeometry args={[0.010, 0.010, 0.010, 12]} />
        </M>
        {/* Toggle */}
        <M m="white" pos={[0, -0.01, 0.037]}>
          <boxGeometry args={[0.06, 0.05, 0.015]} />
        </M>
        <M m="steel" pos={[-0.04, 0.09, 0]}>
          <boxGeometry args={[0.025, 0.015, 0.05]} />
        </M>
        <M m="steel" pos={[0.04, 0.09, 0]}>
          <boxGeometry args={[0.025, 0.015, 0.05]} />
        </M>
        <M m="steel" pos={[-0.04, -0.095, 0]}>
          <boxGeometry args={[0.025, 0.015, 0.05]} />
        </M>
        <M m="steel" pos={[0.04, -0.095, 0]}>
          <boxGeometry args={[0.025, 0.015, 0.05]} />
        </M>
      </Hl>
      <Label3D pos={[0, 0.2, 0.1]} text="УЗО" on={hl} />
    </group>
  );
}

// Neutral bus bar (нулевая шина)
function NeutralBus({ hl, onClick, posY }) {
  return (
    <group position={[0.45, posY, 0.015]} onClick={onClick}>
      <Hl on={hl} color="#4488ff">
        <M m="insulator" pos={[0, 0, -0.008]}>
          <boxGeometry args={[0.32, 0.04, 0.025]} />
        </M>
        <M m="copper" pos={[0, 0, 0.008]}>
          <boxGeometry args={[0.28, 0.022, 0.018]} />
        </M>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i} position={[-0.13 + i * 0.052, 0, 0.02]}>
            <M m="steel">
              <cylinderGeometry args={[0.004, 0.004, 0.03, 8]} />
            </M>
          </group>
        ))}
      </Hl>
      <Label3D pos={[0, 0.08, 0.1]} text="Нулевая шина (N)" on={hl} />
    </group>
  );
}

// PE / Ground bus bar
function GroundBus({ hl, onClick, posY }) {
  return (
    <group position={[-0.45, posY, 0.015]} onClick={onClick}>
      <Hl on={hl} color="#00ff88">
        <M m="insulator" pos={[0, 0, -0.008]}>
          <boxGeometry args={[0.32, 0.04, 0.025]} />
        </M>
        <M m="copper" pos={[0, 0, 0.008]}>
          <boxGeometry args={[0.28, 0.022, 0.018]} />
        </M>
        {Array.from({ length: 6 }, (_, i) => (
          <group key={i} position={[-0.13 + i * 0.052, 0, 0.02]}>
            <M m="steel">
              <cylinderGeometry args={[0.004, 0.004, 0.03, 8]} />
            </M>
          </group>
        ))}
        {/* Green-yellow stripe indicator */}
        <M m="yellow" pos={[0.15, 0.024, 0.008]}>
          <boxGeometry args={[0.06, 0.003, 0.016]} />
        </M>
        <M m="green" pos={[0.18, 0.024, 0.008]}>
          <boxGeometry args={[0.04, 0.003, 0.016]} />
        </M>
      </Hl>
      <Label3D pos={[0, 0.08, 0.1]} text="Шина заземления (PE)" on={hl} />
    </group>
  );
}

// Wiring cables
function Cables({ phase, neutral, ground, connected }) {
  return (
    <group>
      {phase && (
        <>
          {/* Phase wires red */}
          {[-0.3, -0.15, 0, 0.15, 0.3].map((x, i) => (
            <mesh key={i} position={[x, -0.4, 0.05]}>
              <cylinderGeometry args={[0.003, 0.003, 0.6, 6]} />
              <meshStandardMaterial color="#cc2200" />
            </mesh>
          ))}
        </>
      )}
      {neutral && (
        <>
          {/* Neutral wires blue */}
          {[-0.1, 0.1, 0.3].map((x, i) => (
            <mesh key={i} position={[x, -0.6, 0.04]}>
              <cylinderGeometry args={[0.003, 0.003, 0.3, 6]} />
              <meshStandardMaterial color="#2244cc" />
            </mesh>
          ))}
        </>
      )}
      {ground && (
        <>
          {/* Ground wires green-yellow */}
          {[-0.3, -0.1].map((x, i) => (
            <mesh key={i} position={[x, -0.7, 0.04]}>
              <cylinderGeometry args={[0.003, 0.003, 0.1, 6]} />
              <meshStandardMaterial color="#f0c020" />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

// Voltmeter / panel meter
function PanelMeter({ hl, onClick, posY, voltage = 0 }) {
  return (
    <group position={[0, posY, 0.02]} onClick={onClick}>
      <Hl on={hl} color="#ffcc00">
        <M m="black" castShadow>
          <boxGeometry args={[0.22, 0.12, 0.06]} />
        </M>
        <mesh position={[0, 0.01, 0.031]}>
          <boxGeometry args={[0.18, 0.08, 0.001]} />
          <meshStandardMaterial color={voltage > 0 ? '#001a00' : '#111'} emissive={voltage > 0 ? '#002200' : '#000'} emissiveIntensity={voltage > 0 ? 1 : 0} />
        </mesh>
        {voltage > 0 && (
          <Html position={[0, 0.01, 0.045]} center>
            <div style={{ color: '#00ff44', fontSize: 14, fontWeight: 900, fontFamily: 'monospace', pointerEvents: 'none' }}>
              {voltage}V
            </div>
          </Html>
        )}
        <M m="steel" pos={[-0.06, -0.07, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.02, 8]} />
        </M>
        <M m="steel" pos={[0.06, -0.07, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.02, 8]} />
        </M>
      </Hl>
      <Label3D pos={[0, 0.12, 0.1]} text="Вольтметр" on={hl} />
    </group>
  );
}

// Incoming cable / кабельный ввод
function CableEntry({ hl, onClick }) {
  return (
    <group position={[0, -1.05, 0]} onClick={onClick}>
      <Hl on={hl} color="#ff4400">
        <M m="darkGray" pos={[0, 0, 0]}>
          <boxGeometry args={[0.18, 0.12, 0.05]} />
        </M>
        <M m="rubber" pos={[0, -0.07, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.08, 12]} />
        </M>
        {/* Incoming wires */}
        {[{ x: -0.04, c: '#cc2200' }, { x: 0, c: '#2244cc' }, { x: 0.04, c: '#111' }].map((w, i) => (
          <mesh key={i} position={[w.x, -0.14, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.1, 6]} />
            <meshStandardMaterial color={w.c} />
          </mesh>
        ))}
        <M m="steel" pos={[-0.07, 0, 0.025]}>
          <cylinderGeometry args={[0.006, 0.006, 0.02, 8]} />
        </M>
        <M m="steel" pos={[0.07, 0, 0.025]}>
          <cylinderGeometry args={[0.006, 0.006, 0.02, 8]} />
        </M>
      </Hl>
      <Label3D pos={[0, -0.15, 0.1]} text="Кабельный ввод" on={hl} />
    </group>
  );
}

// Room / workshop environment
function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color="#5a5e64" metalness={0.05} roughness={0.92} />
      </mesh>
      {/* Concrete wall behind */}
      <mesh position={[0, 0, -1.5]} receiveShadow>
        <planeGeometry args={[20, 10]} />
        <meshStandardMaterial color="#c0c4c8" roughness={0.95} />
      </mesh>
      {/* Side wall left */}
      <mesh position={[-6, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[14, 10]} />
        <meshStandardMaterial color="#b8bcc0" roughness={0.95} />
      </mesh>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 4.5, 0]}>
        <planeGeometry args={[20, 14]} />
        <meshStandardMaterial color="#d4d8dc" roughness={1} />
      </mesh>
      {/* Ceiling lights */}
      {[[-2, 4.42, 1], [2, 4.42, 1], [0, 4.42, -1]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <boxGeometry args={[0.8, 0.05, 0.28]} />
            <meshStandardMaterial color="#888" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <boxGeometry args={[0.72, 0.02, 0.22]} />
            <meshStandardMaterial color="#fff9e8" emissive="#fff9e8" emissiveIntensity={1.0} />
          </mesh>
        </group>
      ))}
      {/* Tool cabinet */}
      <group position={[4.5, -0.5, -1.2]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 2.0, 0.65]} />
          <meshStandardMaterial color="#1a4a5c" metalness={0.3} roughness={0.6} />
        </mesh>
        {[0.5, 0.1, -0.3, -0.7].map((y, i) => (
          <mesh key={i} position={[0, y, 0.33]}>
            <boxGeometry args={[1.0, 0.3, 0.02]} />
            <meshStandardMaterial color="#111" metalness={0.5} />
          </mesh>
        ))}
      </group>
      {/* Workbench */}
      <group position={[-4.5, -1.6, -0.8]}>
        <mesh castShadow>
          <boxGeometry args={[2.2, 0.08, 0.9]} />
          <meshStandardMaterial color="#8b6914" roughness={0.85} />
        </mesh>
        {[[-0.9, -0.45, -0.35], [-0.9, -0.45, 0.35], [0.9, -0.45, -0.35], [0.9, -0.45, 0.35]].map((p, i) => (
          <mesh key={i} position={p} castShadow>
            <boxGeometry args={[0.07, 0.82, 0.07]} />
            <meshStandardMaterial color="#5a4010" />
          </mesh>
        ))}
        {/* Tools on bench */}
        <mesh position={[0.4, 0.07, 0]}>
          <boxGeometry args={[0.18, 0.05, 0.12]} />
          <meshStandardMaterial color="#cc3300" />
        </mesh>
        <mesh position={[-0.2, 0.07, 0.1]} rotation={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.25, 6]} />
          <meshStandardMaterial color="#888" metalness={0.8} />
        </mesh>
      </group>
      {/* Safety sign */}
      <group position={[-5.5, 2.0, -1.48]}>
        <mesh>
          <boxGeometry args={[0.55, 0.38, 0.01]} />
          <meshStandardMaterial color="#f0c020" />
        </mesh>
        <mesh position={[0, 0, 0.007]}>
          <boxGeometry args={[0.48, 0.32, 0.002]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>
    </group>
  );
}

export default function ElectricalScene({ currentStep, onObjectClick, completedSteps, powered }) {
  const is = obj => currentStep?.object === obj;
  const click = obj => e => { e.stopPropagation(); onObjectClick(obj); };

  return (
    <div className="scene-container">
      <Canvas
        style={{ flex: 1, minHeight: 0 }}
        camera={{ position: [0, 0.5, 4.5], fov: 50 }}
        shadows
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[4, 8, 4]} intensity={1.2} castShadow
          shadow-mapSize={[2048, 2048]} shadow-camera-near={0.5} shadow-camera-far={30}
          shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
        {[[-2, 4.3, 1], [2, 4.3, 1], [0, 4.3, -1]].map(([x, y, z], i) => (
          <pointLight key={i} position={[x, y, z]} intensity={0.6} color="#fff8e0" distance={12} />
        ))}
        <pointLight position={[0, 1, 3]} intensity={0.3} color="#c8e8ff" distance={8} />

        <Room />

        {/* Panel mounted on wall at center */}
        <group position={[0, 0.3, -1.38]}>
          {/* Wall mounting plate */}
          <M m="lightGray" pos={[0, 0, -0.02]}>
            <boxGeometry args={[1.9, 2.6, 0.03]} />
          </M>
          <PanelCabinet />

          {/* Row 1 — Incoming/master breaker + cable entry */}
          <CableEntry hl={is('cable_entry')} onClick={click('cable_entry')} />
          <Breaker hl={is('main_breaker')} onClick={click('main_breaker')} posX={0} posY={0.75} label="63A" on={powered} />

          {/* Row 2 — DIN rails */}
          <DinRail hl={is('din_rail')} onClick={click('din_rail')} posY={0.4} />

          {/* Row 3 — RCD */}
          <RCD hl={is('rcd')} onClick={click('rcd')} posX={-0.3} posY={0.1} />

          {/* Row 3 — Circuit breakers */}
          {[{ x: 0.08, y: 0.1 }, { x: 0.18, y: 0.1 }, { x: 0.28, y: 0.1 }, { x: 0.38, y: 0.1 }].map((b, i) => (
            <Breaker key={i}
              hl={is('breakers')} onClick={click('breakers')}
              posX={b.x} posY={b.y}
              label={`${[16, 16, 10, 10][i]}A`}
              on={powered && i < 2}
            />
          ))}

          {/* Bus bars */}
          <NeutralBus hl={is('neutral_bus')} onClick={click('neutral_bus')} posY={-0.45} />
          <GroundBus hl={is('ground_bus')} onClick={click('ground_bus')} posY={-0.45} />

          {/* Panel voltmeter */}
          <PanelMeter hl={is('voltmeter')} onClick={click('voltmeter')} posY={-0.75} voltage={powered ? 220 : 0} />

          {/* Wiring */}
          <Cables phase={true} neutral={true} ground={true} connected={true} />

          {/* DIN rail row 2 */}
          <DinRail hl={false} onClick={null} posY={-0.15} />
        </group>

        {/* Multimeter on workbench */}
        <group position={[-1.5, -1.5, 0.8]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.06, 0.3]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 0.034, 0.04]}>
            <boxGeometry args={[0.14, 0.005, 0.14]} />
            <meshStandardMaterial color={powered ? '#001a00' : '#111'} emissive={powered ? '#003300' : '#000'} emissiveIntensity={powered ? 1 : 0} />
          </mesh>
        </group>

        <OrbitControls enablePan enableDamping dampingFactor={0.07}
          maxPolarAngle={Math.PI / 1.75} minDistance={1.5} maxDistance={10} target={[0, 0.3, -1.38]} />
      </Canvas>

      {/* Completed steps overlay */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: '55%' }}>
        {completedSteps?.map((s, i) => (
          <span key={i} style={{ background: 'rgba(22,163,74,.9)', color: '#fff', fontSize: 11, padding: '3px 9px', borderRadius: 10, fontWeight: 600, backdropFilter: 'blur(4px)' }}>✓ {s}</span>
        ))}
      </div>

      {/* Power status indicator */}
      {powered && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(34,170,68,.88)', color: '#fff', fontSize: 12, padding: '5px 13px', borderRadius: 8, fontWeight: 700, backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px #fff' }} />
          СЕТЬ ПОДКЛЮЧЕНА · 220В
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,.55)', color: '#d1d5db', fontSize: 11, padding: '5px 11px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
        ЛКМ вращать · ПКМ сдвигать · Колесо зум · Клик на элемент
      </div>
    </div>
  );
}

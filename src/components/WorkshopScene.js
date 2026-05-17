// src/components/WorkshopScene.js — ENHANCED v2
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const MAT = {
  bedGray:      { color: '#5a6270', metalness: 0.6,  roughness: 0.4  },
  castIron:     { color: '#3d4450', metalness: 0.5,  roughness: 0.55 },
  darkMetal:    { color: '#2a2f38', metalness: 0.7,  roughness: 0.35 },
  steel:        { color: '#8a9099', metalness: 0.9,  roughness: 0.15 },
  brightSteel:  { color: '#b8bec7', metalness: 0.95, roughness: 0.08 },
  chrome:       { color: '#d0d8e0', metalness: 1.0,  roughness: 0.05 },
  brass:        { color: '#c8a84b', metalness: 0.8,  roughness: 0.2  },
  rubber:       { color: '#1a1a1a', metalness: 0.0,  roughness: 0.95 },
  paintTeal:    { color: '#1a4a5c', metalness: 0.3,  roughness: 0.6  },
  red:          { color: '#cc2200', metalness: 0.4,  roughness: 0.4  },
  greenBtn:     { color: '#22aa44', metalness: 0.4,  roughness: 0.35 },
  yellow:       { color: '#f0c020', metalness: 0.3,  roughness: 0.5  },
  workpiece:    { color: '#b0b8c0', metalness: 0.85, roughness: 0.2  },
  workpieceCut: { color: '#dde4ea', metalness: 0.92, roughness: 0.08 },
  carbide:      { color: '#4a4a55', metalness: 0.8,  roughness: 0.3  },
  wood:         { color: '#8b6914', metalness: 0.0,  roughness: 0.85 },
};

function M({ m='steel', em, ei=0.5, pos, rot, scale, castShadow, receiveShadow, onClick, children }) {
  const mat = MAT[m] || MAT.steel;
  return (
    <mesh position={pos} rotation={rot} scale={scale} castShadow={castShadow} receiveShadow={receiveShadow} onClick={onClick}>
      {children}
      <meshStandardMaterial color={mat.color} metalness={mat.metalness} roughness={mat.roughness}
        emissive={em||'#000000'} emissiveIntensity={em?ei:0}/>
    </mesh>
  );
}

function Hl({ on, color='#33ff88', children }) {
  const grp = useRef();
  const t = useRef(0);
  useFrame((_,dt)=>{
    t.current += dt*2.5;
    const intensity = on ? 0.14+Math.abs(Math.sin(t.current))*0.22 : 0;
    grp.current?.traverse(o=>{
      if(o.isMesh&&o.material){
        o.material.emissive?.set(on?color:'#000000');
        o.material.emissiveIntensity=intensity;
      }
    });
  });
  return <group ref={grp}>{children}</group>;
}

function Label3D({ pos, text, on }) {
  if(!on) return null;
  return (
    <Html position={pos} center>
      <div style={{background:'rgba(10,20,40,0.9)',color:'#60d4ff',fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:5,border:'1px solid rgba(96,212,255,0.5)',whiteSpace:'nowrap',pointerEvents:'none'}}>
        {text}
      </div>
    </Html>
  );
}

function LatheBed({ hl, onClick }) {
  return (
    <group onClick={onClick}>
      <Hl on={hl}>
        <M m="bedGray" pos={[0,0,0]} castShadow receiveShadow><boxGeometry args={[5.6,0.22,1.12]}/></M>
        <M m="brightSteel" pos={[-0.2,0.12,-0.3]}><boxGeometry args={[5.1,0.065,0.09]}/></M>
        <M m="brightSteel" pos={[-0.2,0.12,0.3]}><boxGeometry args={[5.1,0.065,0.09]}/></M>
        <M m="brightSteel" pos={[-0.2,0.09,-0.41]} rot={[0.5,0,0]}><boxGeometry args={[5.1,0.04,0.04]}/></M>
        <M m="brightSteel" pos={[-0.2,0.09,0.41]} rot={[-0.5,0,0]}><boxGeometry args={[5.1,0.04,0.04]}/></M>
        <M m="steel" pos={[-0.2,0.11,0]}><boxGeometry args={[5.1,0.04,0.2]}/></M>
        <M m="darkMetal" pos={[-2.0,-0.38,0]} castShadow><boxGeometry args={[0.65,0.55,1.0]}/></M>
        <M m="castIron" pos={[-1.69,-0.38,0.02]}><boxGeometry args={[0.01,0.44,0.82]}/></M>
        <M m="chrome" pos={[-1.685,-0.38,0.26]}><cylinderGeometry args={[0.015,0.015,0.07,8]}/></M>
        <M m="darkMetal" pos={[1.8,-0.38,0]} castShadow><boxGeometry args={[0.55,0.55,1.0]}/></M>
        <M m="castIron" pos={[-0.2,-0.12,0]}><boxGeometry args={[4.8,0.04,0.88]}/></M>
        <M m="castIron" pos={[-0.2,-0.125,0.44]}><boxGeometry args={[4.8,0.03,0.03]}/></M>
        <M m="castIron" pos={[-0.2,-0.125,-0.44]}><boxGeometry args={[4.8,0.03,0.03]}/></M>
        {[[-2.2,-0.68,-0.38],[-2.2,-0.68,0.38],[1.6,-0.68,-0.38],[1.6,-0.68,0.38]].map((p,i)=>(
          <M key={i} m="rubber" pos={p}><boxGeometry args={[0.14,0.05,0.14]}/></M>
        ))}
        {[[-2.2,-0.63,-0.38],[-2.2,-0.63,0.38],[1.6,-0.63,-0.38],[1.6,-0.63,0.38]].map((p,i)=>(
          <M key={'lb'+i} m="steel" pos={p}><cylinderGeometry args={[0.018,0.018,0.08,8]}/></M>
        ))}
        <M m="brass" pos={[2.0,-0.1,0.35]}><cylinderGeometry args={[0.025,0.025,0.06,8]}/></M>
        <M m="castIron" pos={[-0.2,-0.04,0]}><boxGeometry args={[5.0,0.12,0.08]}/></M>
      </Hl>
      <Label3D pos={[-0.2,0.4,0.8]} text="Станина (направляющие)" on={hl}/>
    </group>
  );
}

function Headstock({ hl, onClick }) {
  return (
    <group onClick={onClick}>
      <Hl on={hl}>
        <M m="castIron" pos={[-2.35,0.52,0]} castShadow><boxGeometry args={[0.88,1.06,1.1]}/></M>
        <M m="bedGray" pos={[-2.35,1.08,0]}><boxGeometry args={[0.85,0.06,1.04]}/></M>
        <M m="brass" pos={[-2.35,1.12,0.2]}><cylinderGeometry args={[0.038,0.038,0.05,10]}/></M>
        <M m="darkMetal" pos={[-1.9,0.52,0]}><boxGeometry args={[0.02,1.02,1.06]}/></M>
        <M m="darkMetal" pos={[-1.88,0.52,0]} rot={[0,0,Math.PI/2]}><cylinderGeometry args={[0.09,0.09,0.04,20]}/></M>
        <M m="steel" pos={[-2.6,0.88,-0.4]}><cylinderGeometry args={[0.065,0.07,0.09,16]}/></M>
        <M m="chrome" pos={[-2.6,0.936,-0.4]}><sphereGeometry args={[0.034,12,8]}/></M>
        <M m="steel" pos={[-2.6,0.65,-0.4]}><cylinderGeometry args={[0.055,0.06,0.08,16]}/></M>
        <M m="chrome" pos={[-2.6,0.696,-0.4]}><sphereGeometry args={[0.026,10,6]}/></M>
        <M m="steel" pos={[-2.1,0.78,-0.52]}><cylinderGeometry args={[0.022,0.022,0.07,10]}/></M>
        <M m="rubber" pos={[-2.1,0.822,-0.52]}><sphereGeometry args={[0.02,8,6]}/></M>
        <M m="darkMetal" pos={[-1.88,0.72,-0.28]}><boxGeometry args={[0.01,0.18,0.3]}/></M>
        <M m="chrome" pos={[-2.05,0.28,-0.48]}><cylinderGeometry args={[0.038,0.038,0.022,12]}/></M>
        <mesh position={[-2.03,0.28,-0.48]}>
          <cylinderGeometry args={[0.032,0.032,0.012,12]}/>
          <meshStandardMaterial color="#88ccff" transparent opacity={0.65}/>
        </mesh>
        <M m="bedGray" pos={[-2.35,0.52,-0.58]}><boxGeometry args={[0.55,0.92,0.06]}/></M>
        <M m="steel" pos={[-2.35,0.92,-0.555]}><cylinderGeometry args={[0.012,0.012,0.35,6]} rotation={[0,0,Math.PI/2]}/></M>
        <M m="rubber" pos={[-2.35,0.62,-0.5]} rot={[0,0,0.15]}><boxGeometry args={[0.06,0.55,0.025]}/></M>
        <M m="castIron" pos={[-2.35,0.52,-0.52]} rot={[Math.PI/2,0,0]}><cylinderGeometry args={[0.12,0.12,0.06,24]}/></M>
        <M m="brass" pos={[-1.89,0.25,0.32]}><boxGeometry args={[0.01,0.09,0.22]}/></M>
        <M m="darkMetal" pos={[-2.8,0.52,0]}><boxGeometry args={[0.02,1.0,1.0]}/></M>
        <M m="yellow" pos={[-1.88,0.72,0.42]}><cylinderGeometry args={[0.022,0.022,0.025,10]}/></M>
      </Hl>
      <Label3D pos={[-2.35,1.5,0]} text="Шпиндельная бабка" on={hl}/>
    </group>
  );
}

function Chuck({ hl, onClick, spinning, hasWorkpiece }) {
  const ref = useRef();
  useFrame((_,dt)=>{ if(spinning&&ref.current) ref.current.rotation.x += dt*10; });
  const jawR = hasWorkpiece ? 0.1 : 0.22;
  return (
    <group ref={ref} pos={[-1.88,0.52,0]} rot={[0,0,Math.PI/2]} onClick={onClick}>
      <Hl on={hl} color="#00ff88">
        <M m="steel" castShadow><cylinderGeometry args={[0.33,0.33,0.2,40]}/></M>
        {[0.07,0.15,0.22].map((r,i)=>(
          <mesh key={i}><torusGeometry args={[r,0.007,6,40]}/><meshStandardMaterial color="#1a1f26" metalness={0.5} roughness={0.7}/></mesh>
        ))}
        <M m="darkMetal" pos={[-0.01,0,0]}><cylinderGeometry args={[0.2,0.2,0.02,36]}/></M>
        <M m="darkMetal" pos={[0.12,0,0]}><cylinderGeometry args={[0.29,0.29,0.06,40]}/></M>
        <M m="castIron" pos={[0.17,0,0]}><cylinderGeometry args={[0.25,0.25,0.04,32]}/></M>
        <M m="darkMetal" pos={[-0.04,0,0]}><cylinderGeometry args={[0.056,0.056,0.30,16]}/></M>
        {[0,1,2].map(i=>{
          const ang=(i*2*Math.PI)/3;
          return (
            <group key={i} rot={[ang,0,0]}>
              <M m="darkMetal" pos={[0,jawR,0]}><boxGeometry args={[0.18,0.09,0.076]}/></M>
              <M m="brightSteel" pos={[0,jawR+0.05,0]}><boxGeometry args={[0.16,0.022,0.06]}/></M>
              {[0,1,2].map(j=>(
                <M key={j} m="steel" pos={[-0.04+j*0.04,jawR+0.056,0]}><boxGeometry args={[0.01,0.006,0.056]}/></M>
              ))}
              <M m="steel" pos={[0,jawR-0.022,0]}><boxGeometry args={[0.03,0.06,0.065]}/></M>
              <M m="darkMetal" pos={[-0.04,jawR,0.043]}><cylinderGeometry args={[0.012,0.012,0.08,8]}/></M>
            </group>
          );
        })}
        {[0,1,2].map(i=>{
          const ang=(i*2*Math.PI/3)+Math.PI/6;
          return <M key={i} m="darkMetal" pos={[0.045,Math.sin(ang)*0.2,Math.cos(ang)*0.2]}><cylinderGeometry args={[0.018,0.018,0.04,8]}/></M>;
        })}
        {[0,1,2].map(i=>{
          const ang=(i*2*Math.PI/3)+Math.PI;
          return <M key={'bh'+i} m="darkMetal" pos={[-0.06,Math.sin(ang)*0.26,Math.cos(ang)*0.26]}><cylinderGeometry args={[0.025,0.025,0.04,10]}/></M>;
        })}
      </Hl>
      <Label3D pos={[0,0.55,0]} text="3-кулачковый патрон" on={hl}/>
    </group>
  );
}

function Workpiece({ visible, spinning, isMachined }) {
  const ref = useRef();
  useFrame((_,dt)=>{ if(spinning&&ref.current) ref.current.rotation.x += dt*10; });
  if(!visible) return null;
  return (
    <group ref={ref} pos={[-0.8,0.52,0]} rot={[0,0,Math.PI/2]}>
      <M m="workpiece" pos={[0.32,0,0]}><cylinderGeometry args={[0.13,0.13,0.65,32]}/></M>
      <M m="darkMetal" pos={[0.655,0,0]}><cylinderGeometry args={[0.02,0.02,0.04,12]}/></M>
      <M m="workpieceCut" pos={[-0.18,0,0]}>
        <cylinderGeometry args={[isMachined?0.095:0.13,isMachined?0.095:0.13,0.38,32]}/>
      </M>
      {isMachined&&<M m="workpieceCut" pos={[0.01,0,0]}><cylinderGeometry args={[0.095,0.13,0.04,32]}/></M>}
      {isMachined&&<M m="darkMetal" pos={[-0.34,0,0]}><cylinderGeometry args={[0.07,0.07,0.018,24]}/></M>}
      <M m="brightSteel" pos={[-0.38,0,0]}>
        <cylinderGeometry args={[isMachined?0.095:0.13,isMachined?0.095:0.13,0.01,32]}/>
      </M>
    </group>
  );
}

function Chips({ visible }) {
  const data = useMemo(()=>Array.from({length:40},()=>({
    pos:[-0.7+(Math.random()-.5)*.7,0.12+Math.random()*.06,(Math.random()-.5)*.35],
    rot:[Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI],
    s:0.012+Math.random()*.018,
  })),[]);
  if(!visible) return null;
  return (
    <group>
      {data.map((c,i)=>(
        <mesh key={i} position={c.pos} rotation={c.rot} scale={c.s}>
          <torusGeometry args={[1,0.3,4,8]}/>
          <meshStandardMaterial color="#c8a84b" metalness={0.8} roughness={0.2}/>
        </mesh>
      ))}
    </group>
  );
}

function Carriage({ hl, onClick, posX }) {
  return (
    <group position={[posX,0,0]} onClick={onClick}>
      <Hl on={hl}>
        <M m="castIron" pos={[0,0.1,0]} castShadow><boxGeometry args={[0.56,0.12,1.08]}/></M>
        <M m="brightSteel" pos={[0,0.062,-0.52]}><boxGeometry args={[0.52,0.03,0.03]}/></M>
        <M m="brightSteel" pos={[0,0.062,0.52]}><boxGeometry args={[0.52,0.03,0.03]}/></M>
        <M m="brightSteel" pos={[0,0.05,0]}><boxGeometry args={[0.5,0.018,0.85]}/></M>
        <M m="bedGray" pos={[0,0.21,0]} castShadow><boxGeometry args={[0.5,0.1,0.78]}/></M>
        <M m="brightSteel" pos={[0,0.158,-0.37]}><boxGeometry args={[0.46,0.026,0.026]}/></M>
        <M m="brightSteel" pos={[0,0.158,0.37]}><boxGeometry args={[0.46,0.026,0.026]}/></M>
        {[-0.06,0.06].map((z,i)=>(
          <M key={i} m="darkMetal" pos={[0,0.262,z]}><boxGeometry args={[0.44,0.03,0.015]}/></M>
        ))}
        <M m="castIron" pos={[0,0.31,0.1]} castShadow><boxGeometry args={[0.37,0.09,0.46]}/></M>
        <M m="darkMetal" pos={[0,0.357,0.1]}><cylinderGeometry args={[0.18,0.18,0.007,36]}/></M>
        <mesh position={[0,0.362,0.1]}><torusGeometry args={[0.16,0.01,6,36]}/><meshStandardMaterial color="#b8bec7" metalness={0.95} roughness={0.08}/></mesh>
        <M m="brightSteel" pos={[0,0.362,0.1]}><boxGeometry args={[0.32,0.008,0.28]}/></M>
        <M m="steel" pos={[0,0.41,0.06]} castShadow><boxGeometry args={[0.23,0.08,0.23]}/></M>
        <M m="chrome" pos={[0,0.47,0.06]}><cylinderGeometry args={[0.038,0.038,0.018,6]}/></M>
        <M m="steel" pos={[0,0.21,0.54]} rot={[Math.PI/2,0,0]}><cylinderGeometry args={[0.078,0.078,0.022,20]}/></M>
        <mesh position={[0,0.21,0.556]} rotation={[Math.PI/2,0,0]}>
          <torusGeometry args={[0.068,0.013,8,20]}/>
          <meshStandardMaterial color="#2a2f38" metalness={0.7} roughness={0.35}/>
        </mesh>
        <M m="chrome" pos={[0,0.21+0.068,0.556]}><cylinderGeometry args={[0.009,0.009,0.06,8]}/></M>
        <M m="rubber" pos={[0,0.21+0.068+0.034,0.556]}><sphereGeometry args={[0.018,8,8]}/></M>
        <M m="steel" pos={[0,0.21,0.52]}><cylinderGeometry args={[0.035,0.035,0.032,16]}/></M>
        <M m="chrome" pos={[0,0.21,0.518]}><cylinderGeometry args={[0.032,0.032,0.036,16]}/></M>
        <M m="steel" pos={[0,0.31,0.4]}><cylinderGeometry args={[0.072,0.072,0.022,20]}/></M>
        <mesh position={[0,0.31,0.413]}>
          <torusGeometry args={[0.062,0.012,8,20]}/>
          <meshStandardMaterial color="#2a2f38" metalness={0.7} roughness={0.35}/>
        </mesh>
        <M m="chrome" pos={[0,0.31+0.062,0.413]}><cylinderGeometry args={[0.008,0.008,0.055,8]}/></M>
        <M m="rubber" pos={[0,0.31+0.062+0.03,0.413]}><sphereGeometry args={[0.016,8,8]}/></M>
        <M m="brass" pos={[0,0.065,-0.31]}><boxGeometry args={[0.12,0.062,0.1]}/></M>
        <M m="brass" pos={[0.24,0.12,0.32]}><cylinderGeometry args={[0.018,0.018,0.06,8]}/></M>
      </Hl>
      <Label3D pos={[0,0.65,0.7]} text="Суппорт" on={hl}/>
    </group>
  );
}

function Apron({ posX }) {
  return (
    <group position={[posX,0,0]}>
      <M m="castIron" pos={[0,0.22,0.62]} castShadow><boxGeometry args={[0.52,0.47,0.15]}/></M>
      <M m="darkMetal" pos={[0,0.22,0.698]}><boxGeometry args={[0.50,0.45,0.008]}/></M>
      <M m="steel" pos={[-0.1,0.36,0.7]}><cylinderGeometry args={[0.018,0.018,0.03,10]}/></M>
      <M m="chrome" pos={[-0.1,0.39,0.7]} rot={[Math.PI/2,0,0]}><cylinderGeometry args={[0.01,0.01,0.07,8]}/></M>
      <M m="rubber" pos={[-0.1,0.39,0.74]}><sphereGeometry args={[0.017,8,8]}/></M>
      <M m="steel" pos={[0.12,0.38,0.704]}><cylinderGeometry args={[0.028,0.028,0.026,12]}/></M>
      <M m="chrome" pos={[0.12,0.408,0.704]}><cylinderGeometry args={[0.01,0.01,0.04,8]}/></M>
      <M m="steel" pos={[0.12,0.25,0.704]}><cylinderGeometry args={[0.025,0.025,0.026,12]}/></M>
      <M m="steel" pos={[0,0.175,0.705]}><cylinderGeometry args={[0.092,0.092,0.026,20]}/></M>
      <mesh position={[0,0.175,0.72]}>
        <torusGeometry args={[0.082,0.013,8,20]}/>
        <meshStandardMaterial color="#2a2f38" metalness={0.7} roughness={0.35}/>
      </mesh>
      {[0,1,2,3].map(i=>(
        <M key={i} m="steel" pos={[0,0.175,0.72]} rot={[0,0,i*Math.PI/4]}><boxGeometry args={[0.004,0.16,0.008]}/></M>
      ))}
      <M m="chrome" pos={[0,0.175+0.082,0.72]}><cylinderGeometry args={[0.009,0.009,0.065,8]}/></M>
      <M m="rubber" pos={[0,0.175+0.082+0.036,0.72]}><sphereGeometry args={[0.018,8,8]}/></M>
      <M m="chrome" pos={[0,0.175,0.69]}><cylinderGeometry args={[0.04,0.04,0.04,20]}/></M>
      <M m="brass" pos={[-0.2,0.44,0.702]}><cylinderGeometry args={[0.01,0.01,0.02,6]}/></M>
    </group>
  );
}

function ToolHolder({ hl, onClick, posX }) {
  return (
    <group position={[posX,0,0]} onClick={onClick}>
      <Hl on={hl}>
        <M m="steel" pos={[0,0.5,0.06]} castShadow><boxGeometry args={[0.2,0.13,0.2]}/></M>
        <M m="darkMetal" pos={[0,0.576,0.06]}><boxGeometry args={[0.172,0.042,0.172]}/></M>
        <M m="chrome" pos={[0,0.604,0.06]}><cylinderGeometry args={[0.025,0.025,0.028,6]}/></M>
        <M m="castIron" pos={[-0.08,0.478,0.04]}><boxGeometry args={[0.22,0.05,0.11]}/></M>
        {[0,1].map(i=>(<M key={i} m="chrome" pos={[-0.04+i*0.08,0.506,0.04]}><cylinderGeometry args={[0.01,0.01,0.03,6]}/></M>))}
        <M m="brightSteel" pos={[-0.23,0.472,0.04]}><boxGeometry args={[0.3,0.04,0.04]}/></M>
        <M m="brightSteel" pos={[-0.23,0.458,0.04]}><boxGeometry args={[0.28,0.006,0.038]}/></M>
        <M m="darkMetal" pos={[-0.39,0.474,0.04]}><boxGeometry args={[0.044,0.05,0.05]}/></M>
        <M m="carbide" pos={[-0.414,0.478,0.04]}><boxGeometry args={[0.01,0.014,0.048]}/></M>
        <M m="chrome" pos={[-0.395,0.494,0.04]}><cylinderGeometry args={[0.006,0.006,0.018,6]}/></M>
        {[-0.04,0.04].map((z,i)=>(<M key={i} m="brightSteel" pos={[0.09,0.458,z+0.06]}><boxGeometry args={[0.018,0.01,0.01]}/></M>))}
      </Hl>
      <Label3D pos={[0,0.72,0.06]} text="Резцедержатель (QCTP)" on={hl}/>
    </group>
  );
}

function Tailstock({ hl, onClick }) {
  return (
    <group onClick={onClick}>
      <Hl on={hl}>
        <M m="castIron" pos={[2.15,0.1,0]} castShadow><boxGeometry args={[0.5,0.15,1.04]}/></M>
        <M m="brass" pos={[2.15,-0.01,0]}><cylinderGeometry args={[0.03,0.03,0.06,10]}/></M>
        <M m="bedGray" pos={[2.15,0.44,0]} castShadow><boxGeometry args={[0.42,0.46,0.7]}/></M>
        <M m="darkMetal" pos={[2.17,0.44,-0.18]}><cylinderGeometry args={[0.072,0.072,0.74,20]}/></M>
        <M m="brightSteel" pos={[2.17,0.44,-0.1]}><cylinderGeometry args={[0.064,0.064,0.55,20]}/></M>
        <M m="steel" pos={[2.38,0.44,0.0]}><boxGeometry args={[0.04,0.04,0.12]}/></M>
        <M m="rubber" pos={[2.38,0.44,-0.072]}><sphereGeometry args={[0.02,8,8]}/></M>
        <M m="brightSteel" pos={[2.17,0.44,-0.57]}><cylinderGeometry args={[0.04,0.004,0.15,16]}/></M>
        <M m="chrome" pos={[2.17,0.44,-0.648]}><cylinderGeometry args={[0.004,0.001,0.02,8]}/></M>
        <M m="steel" pos={[2.15,0.44,0.44]}><cylinderGeometry args={[0.1,0.1,0.026,20]}/></M>
        <mesh position={[2.15,0.44,0.456]}>
          <torusGeometry args={[0.088,0.014,8,20]}/>
          <meshStandardMaterial color="#2a2f38" metalness={0.7} roughness={0.35}/>
        </mesh>
        {[0,1,2,3].map(i=>(<M key={i} m="steel" pos={[2.15,0.44,0.456]} rot={[0,0,i*Math.PI/4]}><boxGeometry args={[0.004,0.17,0.008]}/></M>))}
        <M m="chrome" pos={[2.15,0.44+0.088,0.456]}><cylinderGeometry args={[0.009,0.009,0.06,8]}/></M>
        <M m="rubber" pos={[2.15,0.44+0.088+0.034,0.456]}><sphereGeometry args={[0.017,8,8]}/></M>
        <M m="chrome" pos={[2.36,0.44,-0.06]}><boxGeometry args={[0.01,0.024,0.3]}/></M>
        <M m="brass" pos={[2.37,0.18,0]} rot={[0,0,Math.PI/2]}><cylinderGeometry args={[0.02,0.02,0.08,8]}/></M>
        <M m="steel" pos={[2.15,0.04,-0.46]}><cylinderGeometry args={[0.018,0.018,0.05,8]}/></M>
      </Hl>
      <Label3D pos={[2.15,1.1,0]} text="Задняя бабка" on={hl}/>
    </group>
  );
}

function LeadScrew() {
  return (
    <group>
      <M m="brightSteel" pos={[-0.2,-0.01,-0.4]} rot={[0,0,Math.PI/2]}><cylinderGeometry args={[0.022,0.022,5.1,12]}/></M>
      {Array.from({length:36},(_,i)=>(<M key={i} m="steel" pos={[-2.3+i*0.148,-0.01,-0.4]} rot={[Math.PI/4,0,Math.PI/2]}><boxGeometry args={[0.006,0.042,0.006]}/></M>))}
      <M m="steel" pos={[-0.2,-0.01,-0.3]} rot={[0,0,Math.PI/2]}><cylinderGeometry args={[0.015,0.015,5.1,8]}/></M>
      <M m="darkMetal" pos={[-0.2,-0.01,-0.3]} rot={[0,0,Math.PI/2]}><boxGeometry args={[5.0,0.01,0.025]}/></M>
      <M m="castIron" pos={[-2.7,-0.01,-0.4]}><cylinderGeometry args={[0.04,0.04,0.05,12]}/></M>
      <M m="castIron" pos={[2.35,-0.01,-0.4]}><cylinderGeometry args={[0.04,0.04,0.05,12]}/></M>
    </group>
  );
}

function FeedGearbox() {
  return (
    <group>
      <M m="castIron" pos={[-1.8,0.28,-0.52]} castShadow><boxGeometry args={[0.75,0.52,0.15]}/></M>
      <M m="darkMetal" pos={[-1.8,0.28,-0.446]}><boxGeometry args={[0.72,0.50,0.008]}/></M>
      <M m="steel" pos={[-1.8,0.28,-0.44]}><boxGeometry args={[0.55,0.32,0.005]}/></M>
      {[0,1,2,3,4].map(i=>(<M key={i} m="darkMetal" pos={[-2.06+i*0.16,0.28,-0.436]}><boxGeometry args={[0.01,0.28,0.002]}/></M>))}
      {[-0.24,-0.1,0.04,0.18].map((x,i)=>(
        <group key={i}>
          <M m="steel" pos={[x+(-1.8),0.36,-0.44]}><cylinderGeometry args={[0.018,0.018,0.026,8]}/></M>
          <M m="chrome" pos={[x+(-1.8),0.392,-0.44]} rot={[i%2===0?0.4:-0.4,0,0]}><cylinderGeometry args={[0.008,0.008,0.06,8]}/></M>
        </group>
      ))}
      <M m="brightSteel" pos={[-1.8,0.16,-0.5]} rot={[Math.PI/2,0,0]}><cylinderGeometry args={[0.02,0.02,0.08,10]}/></M>
      <M m="brass" pos={[-1.45,0.49,-0.44]}><cylinderGeometry args={[0.012,0.012,0.03,8]}/></M>
    </group>
  );
}

function ControlPanel({ hl, onClick }) {
  return (
    <group onClick={onClick}>
      <Hl on={hl}>
        <M m="darkMetal" pos={[-2.65,0.84,-0.54]} castShadow><boxGeometry args={[0.4,0.55,0.11]}/></M>
        <M m="castIron" pos={[-2.65,0.84,-0.485]}><boxGeometry args={[0.37,0.51,0.01]}/></M>
        <mesh position={[-2.65,0.75,-0.478]}>
          <boxGeometry args={[0.19,0.065,0.005]}/>
          <meshStandardMaterial color="#001800" emissive="#00ee44" emissiveIntensity={0.7}/>
        </mesh>
        {[-0.06,-0.02,0.02,0.06].map((x,i)=>(
          <mesh key={i} position={[-2.65+x,0.75,-0.477]}>
            <boxGeometry args={[0.025,0.04,0.003]}/>
            <meshStandardMaterial color="#004000" emissive="#00cc33" emissiveIntensity={0.6}/>
          </mesh>
        ))}
        <M m="steel" pos={[-2.65,0.88,-0.479]}><cylinderGeometry args={[0.028,0.028,0.03,12]}/></M>
        <M m="chrome" pos={[-2.65,0.912,-0.479]}><cylinderGeometry args={[0.01,0.01,0.044,8]}/></M>
        {[['#ff3300',-0.09],['#ffcc00',0],['#00ee44',0.09]].map(([c,x],i)=>(
          <mesh key={i} position={[x+(-2.65),0.67,-0.478]}>
            <cylinderGeometry args={[0.014,0.014,0.01,8]}/>
            <meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.85}/>
          </mesh>
        ))}
        {[['#ff3300',-0.09],['#ffcc00',0],['#00ee44',0.09]].map(([c,x],i)=>(
          <M key={'b'+i} m="darkMetal" pos={[x+(-2.65),0.675,-0.475]}><cylinderGeometry args={[0.018,0.018,0.005,10]}/></M>
        ))}
        <M m="steel" pos={[-2.65,0.56,-0.48]}><cylinderGeometry args={[0.025,0.025,0.022,12]}/></M>
        <M m="chrome" pos={[-2.65,0.582,-0.48]}><cylinderGeometry args={[0.008,0.008,0.04,8]}/></M>
        <M m="rubber" pos={[-2.65,0.6,-0.5]} rot={[Math.PI/2,0,0]}><cylinderGeometry args={[0.026,0.026,0.06,8]}/></M>
        <M m="darkMetal" pos={[-2.65,0.32,-0.52]}><boxGeometry args={[0.06,0.54,0.06]}/></M>
        <M m="steel" pos={[-2.65,0.09,-0.52]}><cylinderGeometry args={[0.04,0.04,0.04,12]}/></M>
        <M m="yellow" pos={[-2.82,0.88,-0.48]}><cylinderGeometry args={[0.03,0.024,0.022,12]}/></M>
        <M m="yellow" pos={[-2.82,0.904,-0.48]}><cylinderGeometry args={[0.022,0.022,0.012,12]}/></M>
      </Hl>
      <Label3D pos={[-2.65,1.6,-0.54]} text="Панель управления" on={hl}/>
    </group>
  );
}

function StartButton({ hl, onClick }) {
  return (
    <group position={[-2.72,1.07,-0.48]} onClick={onClick}>
      <Hl on={hl} color="#00ff44">
        <M m="darkMetal"><cylinderGeometry args={[0.04,0.036,0.022,12]}/></M>
        <M m="greenBtn"><cylinderGeometry args={[0.033,0.029,0.034,12]}/></M>
        <M m="greenBtn" pos={[0,0.027,0]}><sphereGeometry args={[0.024,10,6]}/></M>
        <M m="chrome" pos={[0,-0.013,0]}><torusGeometry args={[0.037,0.004,6,12]}/></M>
      </Hl>
    </group>
  );
}

function StopButton({ hl, onClick }) {
  return (
    <group position={[-2.57,1.07,-0.48]} onClick={onClick}>
      <Hl on={hl} color="#ff2200">
        <M m="darkMetal"><cylinderGeometry args={[0.065,0.055,0.022,16]}/></M>
        <M m="red"><cylinderGeometry args={[0.056,0.042,0.042,16]}/></M>
        <M m="red" pos={[0,0.042,0]}><sphereGeometry args={[0.04,12,8]}/></M>
        <M m="chrome" pos={[0,-0.013,0]}><torusGeometry args={[0.06,0.004,6,16]}/></M>
      </Hl>
    </group>
  );
}

function CoolantSystem({ on }) {
  return (
    <group>
      <M m="darkMetal" pos={[0.9,-0.38,0]}><boxGeometry args={[1.3,0.28,0.92]}/></M>
      <M m="brass" pos={[1.1,-0.23,0]}><cylinderGeometry args={[0.04,0.04,0.04,10]}/></M>
      <M m="castIron" pos={[1.45,-0.2,0]}><cylinderGeometry args={[0.1,0.1,0.3,12]}/></M>
      <M m="chrome" pos={[1.45,-0.04,0.1]} rot={[Math.PI/2,0,0]}><cylinderGeometry args={[0.02,0.02,0.1,8]}/></M>
      <M m="chrome" pos={[-0.45,0.72,0.52]} rot={[-0.7,0,0]}><cylinderGeometry args={[0.013,0.011,0.44,8]}/></M>
      <M m="chrome" pos={[-0.45,0.53,0.74]} rot={[-0.35,0,0]}><cylinderGeometry args={[0.013,0.009,0.09,8]}/></M>
      <M m="brass" pos={[-0.45,0.48,0.79]}><cylinderGeometry args={[0.015,0.009,0.04,8]}/></M>
      <M m="darkMetal" pos={[-0.45,0.75,0.46]}><cylinderGeometry args={[0.025,0.025,0.03,10]}/></M>
      <M m="rubber" pos={[0.5,-0.08,0.45]} rot={[-0.5,0,0.2]}><cylinderGeometry args={[0.012,0.012,0.85,6]}/></M>
      {on&&(
        <mesh position={[-0.45,0.42,0.83]}>
          <cylinderGeometry args={[0.011,0.003,0.16,8]}/>
          <meshStandardMaterial color="#88ccff" transparent opacity={0.78} roughness={0}/>
        </mesh>
      )}
      {on&&[0,1,2].map(i=>(
        <mesh key={i} position={[-0.45+Math.sin(i*2.1)*0.05,0.34,0.83+Math.cos(i*2.1)*0.04]}>
          <sphereGeometry args={[0.008,4,4]}/>
          <meshStandardMaterial color="#a0d8f0" transparent opacity={0.6}/>
        </mesh>
      ))}
    </group>
  );
}

function MeasuringTools() {
  return (
    <group>
      <group position={[0.8,0.68,0.58]}>
        <M m="darkMetal" pos={[0,0,0]}><boxGeometry args={[0.06,0.03,0.06]}/></M>
        <M m="chrome" pos={[0,0.04,0]} rot={[0,0,0.3]}><cylinderGeometry args={[0.006,0.006,0.08,6]}/></M>
        <M m="steel" pos={[0.025,0.09,0]}><cylinderGeometry args={[0.025,0.025,0.04,16]}/></M>
        <mesh position={[0.025,0.112,0]}>
          <cylinderGeometry args={[0.022,0.022,0.005,16]}/>
          <meshStandardMaterial color="#f0f0f0" emissive="#cccccc" emissiveIntensity={0.1}/>
        </mesh>
        <M m="red" pos={[0.025,0.114,0]} rot={[0,0,0.6]}><boxGeometry args={[0.018,0.002,0.002]}/></M>
        <M m="chrome" pos={[0.025,0.068,0]}><cylinderGeometry args={[0.003,0.003,0.03,6]}/></M>
      </group>
    </group>
  );
}

function Workshop() {
  return (
    <group>
      <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.68,0]} receiveShadow>
        <planeGeometry args={[22,16]}/><meshStandardMaterial color="#52555e" metalness={0.05} roughness={0.92}/>
      </mesh>
      {Array.from({length:11},(_,i)=>(
        <mesh key={'gx'+i} rotation={[-Math.PI/2,0,0]} position={[-5+i,-0.679,0]}>
          <planeGeometry args={[0.014,16]}/><meshStandardMaterial color="#3e4148"/>
        </mesh>
      ))}
      {Array.from({length:8},(_,i)=>(
        <mesh key={'gz'+i} rotation={[-Math.PI/2,0,0]} position={[0,-0.679,-3.5+i]}>
          <planeGeometry args={[22,0.014]}/><meshStandardMaterial color="#3e4148"/>
        </mesh>
      ))}
      <mesh position={[0,2.5,-5.2]} receiveShadow><planeGeometry args={[24,8]}/><meshStandardMaterial color="#c4c8d0" roughness={0.95}/></mesh>
      <mesh position={[-7.5,2.5,0]} rotation={[0,Math.PI/2,0]} receiveShadow><planeGeometry args={[16,8]}/><meshStandardMaterial color="#bbbfc8" roughness={0.95}/></mesh>
      <mesh rotation={[Math.PI/2,0,0]} position={[0,5.5,0]}><planeGeometry args={[24,16]}/><meshStandardMaterial color="#d8dae0" roughness={1}/></mesh>
      {[[-3,5.38,-1],[0,5.38,-1],[3,5.38,-1],[-3,5.38,2],[0,5.38,2],[3,5.38,2]].map((pos,i)=>(
        <group key={i} position={pos}>
          <mesh><cylinderGeometry args={[0.24,0.17,0.2,16]}/><meshStandardMaterial color="#888" metalness={0.6} roughness={0.4}/></mesh>
          <mesh position={[0,-0.11,0]}><cylinderGeometry args={[0.2,0.2,0.04,16]}/><meshStandardMaterial color="#fff9e8" emissive="#fff9e8" emissiveIntensity={1.1}/></mesh>
          <mesh position={[0,0.32,0]}><cylinderGeometry args={[0.009,0.009,0.54,6]}/><meshStandardMaterial color="#333"/></mesh>
          <mesh position={[0,0.6,0]}><cylinderGeometry args={[0.004,0.004,0.36,4]}/><meshStandardMaterial color="#222"/></mesh>
        </group>
      ))}
      <group position={[4.5,0.52,-4.2]}>
        <mesh castShadow><boxGeometry args={[1.1,1.82,0.58]}/><meshStandardMaterial color="#1a4a5c" metalness={0.3} roughness={0.6}/></mesh>
        {[0.52,0.22,-0.08,-0.38,-0.68].map((y,i)=>(
          <group key={i}>
            <mesh position={[0,y,0.3]}><boxGeometry args={[0.96,0.25,0.02]}/><meshStandardMaterial color="#111" metalness={0.5} roughness={0.5}/></mesh>
            <mesh position={[0,y,0.312]}><boxGeometry args={[0.22,0.045,0.016]}/><meshStandardMaterial color="#c8c8c8" metalness={1} roughness={0.05}/></mesh>
          </group>
        ))}
        <mesh position={[0,0.915,0.1]}><boxGeometry args={[1.0,0.01,0.38]}/><meshStandardMaterial color="#1e5060"/></mesh>
        <M m="brightSteel" pos={[0.1,0.922,0.05]} rot={[0,0.3,0]}><boxGeometry args={[0.35,0.008,0.025]}/></M>
        <M m="steel" pos={[-0.15,0.922,0.18]} rot={[0,0.8,0]}><cylinderGeometry args={[0.02,0.018,0.12,10]}/></M>
      </group>
      <group position={[-5.5,2.1,-4.8]}>
        <mesh castShadow><boxGeometry args={[1.6,0.06,0.42]}/><meshStandardMaterial color="#3a3a3a" metalness={0.5} roughness={0.4}/></mesh>
        <M m="brightSteel" pos={[-0.5,0.08,0]}><boxGeometry args={[0.2,0.06,0.06]}/></M>
        <M m="steel" pos={[-0.1,0.08,0]}><cylinderGeometry args={[0.04,0.04,0.12,12]}/></M>
        <M m="brass" pos={[0.3,0.08,0]}><boxGeometry args={[0.12,0.09,0.06]}/></M>
        <M m="darkMetal" pos={[-0.7,0,-0.17]}><boxGeometry args={[0.04,0.36,0.04]}/></M>
        <M m="darkMetal" pos={[0.7,0,-0.17]}><boxGeometry args={[0.04,0.36,0.04]}/></M>
      </group>
      <group position={[-6.8,2.5,-4.0]}>
        <mesh><boxGeometry args={[0.01,1.0,0.7]}/><meshStandardMaterial color="#f0f0e8" roughness={0.95}/></mesh>
        <mesh position={[0.01,0.3,0]}><boxGeometry args={[0.008,0.18,0.55]}/><meshStandardMaterial color="#e03030" roughness={0.9}/></mesh>
        <mesh position={[0.01,0,0]}><boxGeometry args={[0.008,0.35,0.55]}/><meshStandardMaterial color="#f0a020" roughness={0.9}/></mesh>
        <mesh position={[0.01,-0.25,0]}><boxGeometry args={[0.008,0.25,0.55]}/><meshStandardMaterial color="#20a040" roughness={0.9}/></mesh>
      </group>
      <group position={[5.8,0.4,-1.8]} scale={0.78} rotation={[0,-0.25,0]}>
        <mesh castShadow><boxGeometry args={[4.4,0.22,1.0]}/><meshStandardMaterial color="#1a4050" metalness={0.3} roughness={0.6}/></mesh>
        <mesh position={[-1.75,0.55,0]} castShadow><boxGeometry args={[0.72,1.0,0.95]}/><meshStandardMaterial color="#152e38" metalness={0.3} roughness={0.6}/></mesh>
        <mesh position={[0.5,0.22,0]}><boxGeometry args={[0.5,0.32,0.85]}/><meshStandardMaterial color="#1e3c4a" metalness={0.3} roughness={0.6}/></mesh>
        <mesh position={[1.55,0.38,0]}><boxGeometry args={[0.4,0.45,0.64]}/><meshStandardMaterial color="#152e38" metalness={0.3} roughness={0.6}/></mesh>
      </group>
      <group position={[-4.2,0,-0.2]}>
        <mesh castShadow><boxGeometry args={[0.6,0.85,0.62]}/><meshStandardMaterial color="#f0c020" metalness={0.25} roughness={0.5}/></mesh>
        <mesh position={[0,0.43,0]}><boxGeometry args={[0.58,0.04,0.6]}/><meshStandardMaterial color="#2a2f38" metalness={0.7} roughness={0.35}/></mesh>
        <mesh position={[0,0.25,0]}><boxGeometry args={[0.5,0.35,0.52]}/><meshStandardMaterial color="#c8a84b" metalness={0.7} roughness={0.3}/></mesh>
      </group>
      {[
        [[-1.4,-0.674,0],[0,0,0],[0.08,3.6]],
        [[2.9,-0.674,0],[0,0,0],[0.08,3.6]],
        [[0.75,-0.674,-1.8],[0,0,0],[4.5,0.08]],
        [[0.75,-0.674,1.8],[0,0,0],[4.5,0.08]],
      ].map(([pos,rot,size],i)=>(
        <mesh key={i} position={pos} rotation={[-Math.PI/2,...rot]}>
          <planeGeometry args={size}/><meshStandardMaterial color="#f0c020"/>
        </mesh>
      ))}
      {Array.from({length:18},(_,i)=>(
        <mesh key={'hs'+i} position={[-1.44+i*0.16,-0.6735,-1.8]} rotation={[-Math.PI/2,0,Math.PI/4]}>
          <planeGeometry args={[0.06,0.08]}/><meshStandardMaterial color={i%2===0?'#f0c020':'#111111'}/>
        </mesh>
      ))}
      <group position={[-6.2,1.6,-5.1]}>
        <mesh castShadow><boxGeometry args={[0.95,1.22,0.27]}/><meshStandardMaterial color="#1a4a5c" metalness={0.3} roughness={0.6}/></mesh>
        <mesh position={[0,0,0.145]}><boxGeometry args={[0.85,1.12,0.01]}/><meshStandardMaterial color="#111" metalness={0.5} roughness={0.5}/></mesh>
        <mesh position={[0.22,0.2,0.152]}><boxGeometry args={[0.14,0.2,0.04]}/><meshStandardMaterial color="#888" metalness={0.8} roughness={0.2}/></mesh>
        <mesh position={[-0.1,0.1,0.152]}><cylinderGeometry args={[0.032,0.032,0.026,12]}/><meshStandardMaterial color="#ff3300" emissive="#ff3300" emissiveIntensity={0.5}/></mesh>
        {[0.3,0.18,0.06,-0.06,-0.18].map((y,i)=>(
          <mesh key={i} position={[-0.28,y,0.152]}><boxGeometry args={[0.05,0.08,0.03]}/><meshStandardMaterial color={i===0?'#22aa44':'#2a2f38'} metalness={0.5}/></mesh>
        ))}
      </group>
      <group position={[-0.3,4.8,0]}>
        <mesh><boxGeometry args={[2.4,0.09,1.05]}/><meshStandardMaterial color="#2a2f38" metalness={0.7} roughness={0.35}/></mesh>
        <mesh position={[0,-0.52,0]}><boxGeometry args={[1.85,0.88,0.88]}/><meshStandardMaterial color="#2a2f38" metalness={0.7} roughness={0.35}/></mesh>
        <mesh position={[0,-0.08,0]}><cylinderGeometry args={[0.13,0.13,0.82,10]}/><meshStandardMaterial color="#333" metalness={0.7} roughness={0.4}/></mesh>
        {Array.from({length:8},(_,i)=>(
          <mesh key={i} position={[0,-0.08+i*0.1,0]}><torusGeometry args={[0.13,0.012,6,16]}/><meshStandardMaterial color="#555" metalness={0.5}/></mesh>
        ))}
      </group>
      <group position={[-6.5,0.5,-4.5]}>
        <mesh castShadow><cylinderGeometry args={[0.07,0.065,0.52,12]}/><meshStandardMaterial color="#cc2000" metalness={0.3} roughness={0.4}/></mesh>
        <mesh position={[0,0.29,0]}><cylinderGeometry args={[0.05,0.07,0.06,12]}/><meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2}/></mesh>
        <mesh position={[0,0.35,0]}><cylinderGeometry args={[0.03,0.03,0.04,10]}/><meshStandardMaterial color="#c0c0c0" metalness={0.7} roughness={0.2}/></mesh>
      </group>
      <group position={[6.2,0.0,-3.8]}>
        <mesh castShadow><boxGeometry args={[2.0,0.07,0.8]}/><meshStandardMaterial color="#8b6914" metalness={0} roughness={0.85}/></mesh>
        {[[-0.85,-0.38,-0.32],[-0.85,-0.38,0.32],[0.85,-0.38,-0.32],[0.85,-0.38,0.32]].map((p,i)=>(
          <mesh key={i} position={p} castShadow><boxGeometry args={[0.06,0.68,0.06]}/><meshStandardMaterial color="#5a4010"/></mesh>
        ))}
        <mesh position={[0,-0.5,0]}><boxGeometry args={[1.9,0.04,0.7]}/><meshStandardMaterial color="#7a5810"/></mesh>
        <group position={[-0.5,0.06,0.1]}>
          <mesh castShadow><boxGeometry args={[0.25,0.15,0.18]}/><meshStandardMaterial color="#3a3a3a" metalness={0.6} roughness={0.4}/></mesh>
          <mesh position={[-0.14,0.04,0]}><boxGeometry args={[0.04,0.1,0.16]}/><meshStandardMaterial color="#444" metalness={0.5} roughness={0.5}/></mesh>
          <mesh position={[-0.25,0,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.012,0.012,0.3,8]}/><meshStandardMaterial color="#888" metalness={0.8} roughness={0.2}/></mesh>
        </group>
      </group>
    </group>
  );
}

export default function WorkshopScene({ currentStep, onObjectClick, completedSteps, spinning, workpieceVisible }) {
  const [carriageX, setCarriageX] = useState(0.65);
  const [isMachined, setIsMachined] = useState(false);

  useEffect(()=>{
    if(!spinning) return;
    let x=carriageX;
    const id=setInterval(()=>{
      x-=0.007;
      if(x<=-0.55){clearInterval(id);setIsMachined(true);return;}
      setCarriageX(x);
    },30);
    return ()=>clearInterval(id);
  },[spinning]);

  const is=obj=>currentStep?.object===obj;
  const click=obj=>e=>{e.stopPropagation();onObjectClick(obj);};

  return (
    <div className="scene-container">
      <Canvas camera={{position:[1.8,2.6,5.8],fov:44}} shadows
        gl={{antialias:true,toneMapping:THREE.ACESFilmicToneMapping,toneMappingExposure:1.15}}>
        <ambientLight intensity={0.32}/>
        <directionalLight position={[6,10,4]} intensity={1.5} castShadow
          shadow-mapSize={[2048,2048]} shadow-camera-near={0.5} shadow-camera-far={32}
          shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9}/>
        {[[-3,5.3,-1],[0,5.3,-1],[3,5.3,-1],[0,5.3,2]].map(([x,y,z],i)=>(
          <pointLight key={i} position={[x,y,z]} intensity={0.75} color="#fff8e0" distance={13}/>
        ))}
        <pointLight position={[-6,2.5,2]} intensity={0.25} color="#c8e8ff" distance={16}/>
        <pointLight position={[-3,1.5,1]} intensity={0.18} color="#ffe8c0" distance={5}/>
        <Workshop/>
        <group position={[0,0.68,0]}>
          <LatheBed    hl={is('lathe_body')}    onClick={click('lathe_body')}/>
          <Headstock   hl={is('lathe_body')}    onClick={click('lathe_body')}/>
          <FeedGearbox/>
          <LeadScrew/>
          <Chuck       hl={is('chuck')}         onClick={click('chuck')}         spinning={spinning} hasWorkpiece={workpieceVisible}/>
          <Carriage    hl={is('carriage')}      onClick={click('carriage')}      posX={carriageX}/>
          <Apron       posX={carriageX}/>
          <ToolHolder  hl={is('tool_holder')}   onClick={click('tool_holder')}   posX={carriageX}/>
          <Tailstock   hl={is('stop_button')}   onClick={click('stop_button')}/>
          <ControlPanel hl={is('control_panel')} onClick={click('control_panel')}/>
          <StartButton  hl={is('start_button')}  onClick={click('start_button')}/>
          <StopButton   hl={is('stop_button')}   onClick={click('stop_button')}/>
          <Workpiece   visible={workpieceVisible} spinning={spinning} isMachined={isMachined}/>
          <Chips       visible={spinning&&workpieceVisible}/>
          <CoolantSystem on={spinning}/>
          <MeasuringTools/>
        </group>
        <OrbitControls enablePan enableDamping dampingFactor={0.07}
          maxPolarAngle={Math.PI/1.88} minDistance={2} maxDistance={15} target={[0,1.0,0]}/>
      </Canvas>
      <div style={{position:'absolute',top:12,left:12,display:'flex',gap:6,flexWrap:'wrap',maxWidth:'55%'}}>
        {completedSteps?.map((s,i)=>(
          <span key={i} style={{background:'rgba(22,163,74,.9)',color:'#fff',fontSize:11,padding:'3px 9px',borderRadius:10,fontWeight:600,backdropFilter:'blur(4px)'}}>✓ {s}</span>
        ))}
      </div>
      {spinning&&(
        <div style={{position:'absolute',top:12,right:12,background:'rgba(220,38,38,.88)',color:'#fff',fontSize:12,padding:'5px 13px',borderRadius:8,fontWeight:700,backdropFilter:'blur(4px)',display:'flex',alignItems:'center',gap:7}}>
          <span style={{display:'inline-block',width:8,height:8,borderRadius:'50%',background:'#fff',boxShadow:'0 0 6px #fff'}}/>
          ШПИНДЕЛЬ РАБОТАЕТ
        </div>
      )}
      <div style={{position:'absolute',bottom:12,right:12,background:'rgba(0,0,0,.55)',color:'#d1d5db',fontSize:11,padding:'5px 11px',borderRadius:8,backdropFilter:'blur(4px)'}}>
        ЛКМ вращать · ПКМ сдвигать · Колесо зум · Клик на деталь
      </div>
    </div>
  );
}

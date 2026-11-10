'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, OrbitControls, Stars } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

export type Mode = 'tower' | 'facade' | 'pavilion' | 'roof';
export type Parameters = { floors: number; twist: number; density: number; curve: number };

function Tower({ params }: { params: Parameters }) {
  const levels = Math.min(45, Math.max(8, Math.round(params.floors)));
  const floorHeight = 0.255;
  const width = 4.4;
  const depth = 3.55;
  const center = ((levels - 1) * floorHeight) / 2;
  const mats = useMemo(() => ({
    glass: new THREE.MeshPhysicalMaterial({ color: '#6b96af', metalness: .36, roughness: .2, transparent: true, opacity: .7, clearcoat: 1 }),
    edge: new THREE.MeshStandardMaterial({ color: '#b8deea', metalness: .88, roughness: .23 }),
    slab: new THREE.MeshStandardMaterial({ color: '#243a48', metalness: .7, roughness: .3 }),
    accent: new THREE.LineBasicMaterial({ color: '#9cedef', transparent: true, opacity: .59 }),
  }), []);
  const matrix = useMemo(() => {
    const m = new THREE.Matrix4(); const o = new THREE.Object3D();
    return (mesh: THREE.InstancedMesh | null, kind: 'glass' | 'slab') => {
      if (!mesh) return;
      for (let i = 0; i < levels; i++) {
        o.position.set(0, i * floorHeight - center, 0);
        o.rotation.set(0, THREE.MathUtils.degToRad(i * params.twist), 0);
        o.scale.set(kind === 'glass' ? width * .97 : width, kind === 'glass' ? floorHeight * .91 : .045, kind === 'glass' ? depth * .97 : depth);
        o.updateMatrix(); m.copy(o.matrix); mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
    };
  }, [levels, params.twist]);
  const glass = useRef<THREE.InstancedMesh>(null);
  const slab = useRef<THREE.InstancedMesh>(null);
  const linePositions = useMemo(() => {
    const pts: number[] = [];
    const count = Math.max(2, Math.min(16, Math.round(params.density / 9)));
    const perimeter = (t: number) => {
      const s = (t % 1 + 1) % 1 * 4;
      if (s < 1) return [(-.5 + s) * width, -depth / 2];
      if (s < 2) return [width / 2, (-.5 + s - 1) * depth];
      if (s < 3) return [(.5 - (s - 2)) * width, depth / 2];
      return [-width / 2, (.5 - (s - 3)) * depth];
    };
    for (let j = 0; j < count * 4; j++) {
      const t = j / (count * 4);
      for (let i = 0; i < levels - 1; i++) {
        const segment = (idx: number, offset: number) => {
          const [x,z] = perimeter(t + offset);
          const a = THREE.MathUtils.degToRad(idx * params.twist);
          return [x * Math.cos(a) - z * Math.sin(a), idx * floorHeight - center, x * Math.sin(a) + z * Math.cos(a)];
        };
        pts.push(...segment(i, 0), ...segment(i + 1, j % 2 ? .008 : -.008));
      }
    }
    return new Float32Array(pts);
  }, [levels, params.twist, params.density, center]);
  return <group>
    <instancedMesh ref={(node) => { glass.current = node; matrix(node, 'glass'); }} args={[undefined, mats.glass, levels]} castShadow receiveShadow><boxGeometry args={[1,1,1]}/></instancedMesh>
    <instancedMesh ref={(node) => { slab.current = node; matrix(node, 'slab'); }} args={[undefined, mats.slab, levels]} castShadow><boxGeometry args={[1,1,1]}/></instancedMesh>
    <lineSegments material={mats.accent}><bufferGeometry><bufferAttribute attach="attributes-position" args={[linePositions, 3]} /></bufferGeometry></lineSegments>
    <mesh position={[0, -center - .2, 0]} receiveShadow><cylinderGeometry args={[3.65, 3.95, .16, 6]}/><meshStandardMaterial color="#263746" metalness={.8} roughness={.28}/></mesh>
    <mesh position={[0, center + .12, 0]}><boxGeometry args={[width * .96, .08, depth * .96]}/><meshStandardMaterial color="#d9f4f4" metalness={.9} roughness={.18}/></mesh>
  </group>;
}

function Facade({ params }: { params: Parameters }) {
  const lines = useMemo(() => {
    const p: number[] = [];
    const cols = Math.round(9 + params.density / 12);
    const rows = 14;
    const w = 8, h = 7;
    for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
      const x0 = (x / cols - .5) * w; const x1 = ((x+1) / cols - .5) * w;
      const y0 = (y / rows - .5) * h; const y1 = ((y+1) / rows - .5) * h;
      const bend = (xx: number, yy: number) => .7 * Math.sin(xx * .65) + .35 * Math.cos(yy * .8);
      const xm=(x0+x1)/2, ym=(y0+y1)/2;
      const center = [xm,ym,bend(xm,ym)+.42];
      const corners = [[x0,y0,bend(x0,y0)],[x1,y0,bend(x1,y0)],[x1,y1,bend(x1,y1)],[x0,y1,bend(x0,y1)]];
      for (let k=0;k<4;k++) p.push(...corners[k],...center,...center,...corners[(k+1)%4]);
    }
    return new Float32Array(p);
  }, [params.density]);
  return <group rotation={[0,-.28,0]}>
    <mesh position={[0,0,-.38]}><boxGeometry args={[8.1,7.15,.36]}/><meshPhysicalMaterial color="#385363" metalness={.75} roughness={.25} transparent opacity={.66}/></mesh>
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[lines,3]}/></bufferGeometry><lineBasicMaterial color="#c2faff" transparent opacity={.86}/></lineSegments>
    <mesh position={[0,-3.75,0]}><boxGeometry args={[8.5,.22,1.2]}/><meshStandardMaterial color="#314b5b" metalness={.8}/></mesh>
  </group>;
}

function Pavilion({ params }: { params: Parameters }) {
  const ribs = useMemo(() => {
    const count = Math.round(11 + params.density / 7); const arr: THREE.CatmullRomCurve3[]=[];
    for(let i=0;i<count;i++){
      const x=(i/(count-1)-.5)*9;
      const pts:THREE.Vector3[]=[];
      for(let j=0;j<=26;j++){
        const t=j/26; const z=(t-.5)*7;
        const y= Math.pow(Math.sin(t*Math.PI), .8) * (2.4 + params.curve/70) * (1-.2*Math.pow(x/5,2)) - .7;
        pts.push(new THREE.Vector3(x + .32*Math.sin(t*Math.PI*2+x), y, z));
      }
      arr.push(new THREE.CatmullRomCurve3(pts));
    }
    return arr;
  },[params.density,params.curve]);
  return <group rotation={[0,-.22,0]}>
    {ribs.map((curve,i)=><mesh key={i}><tubeGeometry args={[curve,42,.045,7,false]}/><meshStandardMaterial color={i%3===0?'#c8faff':'#80a8b8'} metalness={.8} roughness={.19}/></mesh>)}
    <mesh position={[0,-.82,0]}><boxGeometry args={[10,.12,8]}/><meshStandardMaterial color="#233c4c" metalness={.65}/></mesh>
  </group>;
}

function Roof({ params }: {params: Parameters}) {
 const geometry = useMemo(()=>{
  const verts:number[]=[]; const idx:number[]=[]; const u=32,v=20;
  for(let j=0;j<=v;j++) for(let i=0;i<=u;i++){
    const x=(i/u-.5)*9,z=(j/v-.5)*7;
    const y=.7+Math.sin(i/u*Math.PI*2)*1.15+Math.cos(j/v*Math.PI*2)*.8+(params.curve/100)*Math.sin(x*z*.15);
    verts.push(x,y,z);
  }
  for(let j=0;j<v;j++) for(let i=0;i<u;i++){
    const a=j*(u+1)+i,b=a+1,c=a+u+1,d=c+1; idx.push(a,b,c,b,d,c);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();return geo;
 },[params.curve]);
 return <group><mesh geometry={geometry}><meshPhysicalMaterial color="#668b9e" metalness={.7} roughness={.24} transparent opacity={.82} side={THREE.DoubleSide}/></mesh><lineSegments geometry={new THREE.EdgesGeometry(geometry,15)}><lineBasicMaterial color="#d4fcfa" transparent opacity={.6}/></lineSegments></group>;
}

function Model({ mode, params, motion }: {mode:Mode;params:Parameters;motion:boolean}) {
 const group=useRef<THREE.Group>(null);
 useFrame(({clock},dt)=>{
   if (!group.current) return;
   if (motion) group.current.rotation.y += dt*.047;
   group.current.position.y = motion ? Math.sin(clock.elapsedTime*.55)*.075 : 0;
 });
 return <group ref={group} scale={mode==='tower' ? .93 : .86}>
   {mode==='tower' && <Tower params={params}/>}
   {mode==='facade' && <Facade params={params}/>}
   {mode==='pavilion' && <Pavilion params={params}/>}
   {mode==='roof' && <Roof params={params}/>}
 </group>;
}

export default function ParametricScene({mode,params,compact=false,motion=true}:{mode:Mode;params:Parameters;compact?:boolean;motion?:boolean}) {
 return <div className="scene-canvas" aria-label={`Interactive parametric ${mode} 3D model`}>
  <Canvas dpr={[1,1.7]} camera={{position:compact?[12,8,15]:[13,9,16],fov:compact?38:34}} gl={{antialias:true,alpha:true,powerPreference:'high-performance'}}>
    <ambientLight intensity={1.45}/>
    <hemisphereLight intensity={1.4} groundColor="#0c1724" color="#b2ddf0"/>
    <directionalLight position={[7,13,8]} intensity={3.2} color="#d8fcff"/>
    <directionalLight position={[-9,5,-7]} intensity={2.2} color="#6086e5"/>
    <pointLight position={[5,4,-6]} intensity={33} color="#52ecfa" distance={17}/>
    <Model mode={mode} params={params} motion={motion}/>
    <ContactShadows opacity={.23} scale={18} blur={2.8} far={14} position={[0,-5.8,0]}/>
    <OrbitControls enablePan={false} enableZoom={false} autoRotate={false} maxPolarAngle={Math.PI*.72} minPolarAngle={Math.PI*.2}/>
  </Canvas>
 </div>;
}

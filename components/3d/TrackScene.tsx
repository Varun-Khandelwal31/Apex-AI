'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Monaco F1 Circuit 3D Curve points
const MONACO_TRACK_POINTS: [number, number, number][] = [
  [0, 0, -4],
  [2, 0.2, -3.5],   // Ste Devote
  [3.5, 0.8, -1],   // Beau Rivage climb
  [4, 1.2, 1],      // Massenet
  [3, 1.0, 2.5],    // Casino Square
  [1, 0.4, 3],      // Mirabeau
  [-0.5, 0.1, 3.2], // Fairmont Hairpin
  [-1.8, 0, 2.5],   // Portier
  [-2.5, -0.2, 0],  // Tunnel descent
  [-2.2, -0.1, -2], // Nouvelle Chicane
  [-1.5, 0, -3.2],  // Tabac
  [-0.8, 0, -3.8],  // Piscine
  [0, 0, -4],       // Rascasse & Pit Straight back to start
];

function CarSphere({ curve }: { curve: THREE.CatmullRomCurve3 }) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const progress = useRef(0);

  useFrame((state, delta) => {
    // Travel along the curve
    progress.current = (progress.current + delta * 0.18) % 1;
    const point = curve.getPointAt(progress.current);
    if (sphereRef.current) {
      sphereRef.current.position.set(point.x, point.y + 0.1, point.z);
    }
    if (lightRef.current) {
      lightRef.current.position.set(point.x, point.y + 0.3, point.z);
    }
  });

  return (
    <group>
      <mesh ref={sphereRef}>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial
          color="#E10600"
          emissive="#FF1E27"
          emissiveIntensity={3}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      <pointLight ref={lightRef} color="#FF1E27" intensity={8} distance={3} />
    </group>
  );
}

function TrackMesh() {
  const curve = useMemo(() => {
    const vectors = MONACO_TRACK_POINTS.map(
      (p) => new THREE.Vector3(p[0], p[1], p[2])
    );
    return new THREE.CatmullRomCurve3(vectors, true);
  }, []);

  const points = useMemo(() => {
    return curve.getPoints(200).map((v) => [v.x, v.y, v.z] as [number, number, number]);
  }, [curve]);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <group rotation={[0.4, 0.3, 0]}>
        {/* Main Neon Line */}
        <Line
          points={points}
          color="#E10600"
          lineWidth={4}
        />
        {/* Outer Glow Cyan Ribbon */}
        <Line
          points={points}
          color="#00F0FF"
          lineWidth={1.5}
          opacity={0.6}
          transparent
        />
        {/* Car traveling along track */}
        <CarSphere curve={curve} />
      </group>
    </Float>
  );
}

export default function TrackScene() {
  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 5, 9], fov: 45 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0A0A0A']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <pointLight position={[-10, -10, -10]} color="#00F0FF" intensity={2} />
        <TrackMesh />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
      </Canvas>
    </div>
  );
}

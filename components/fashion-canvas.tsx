"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh, Points } from "three";
import * as THREE from "three";

function FloatingFabric() {
  const mesh = useRef<Mesh>(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(4.4, 3.1, 72, 72), []);

  useFrame(({ clock, pointer }) => {
    const position = geometry.attributes.position;
    const time = clock.getElapsedTime();

    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i);
      const y = position.getY(i);
      const wave = Math.sin(x * 2.6 + time * 1.3) * 0.12 + Math.cos(y * 3.2 + time) * 0.08;
      position.setZ(i, wave);
    }

    position.needsUpdate = true;

    if (mesh.current) {
      mesh.current.rotation.x = -0.22 + pointer.y * 0.18;
      mesh.current.rotation.y = -0.35 + pointer.x * 0.32;
      mesh.current.position.y = Math.sin(time * 0.8) * 0.12;
    }
  });

  return (
    <mesh ref={mesh} geometry={geometry} position={[1.65, 0.1, 0]}>
      <meshStandardMaterial
        color="#7b2f3d"
        metalness={0.18}
        roughness={0.36}
        side={THREE.DoubleSide}
        wireframe={false}
      />
    </mesh>
  );
}

function Particles() {
  const points = useRef<Points>(null);
  const particles = useMemo(() => {
    const positions = new Float32Array(900);
    for (let i = 0; i < 300; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }
    return positions;
  }, []);

  useFrame(({ clock, pointer }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.04 + pointer.x * 0.08;
      points.current.rotation.x = pointer.y * 0.05;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#d7b56d" size={0.026} sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}

export default function FashionCanvas() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 opacity-90">
      <Canvas camera={{ position: [0, 0, 5.4], fov: 42 }} dpr={[1, 1.6]}>
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 3, 4]} intensity={2.2} color="#fff4d0" />
        <pointLight position={[-3, -2, 3]} intensity={1.4} color="#7b2f3d" />
        <Particles />
        <FloatingFabric />
      </Canvas>
    </div>
  );
}

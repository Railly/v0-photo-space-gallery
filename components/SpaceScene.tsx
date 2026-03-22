// @ts-nocheck
"use client"

import { useRef, useMemo, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import * as THREE from "three"
import { PHOTOS, type Photo } from "@/lib/photos"
import PhotoCard from "@/components/PhotoCard"

// Distribute cards in a loose spherical cloud, all facing roughly inward
function generateCardLayout(count: number) {
  const positions: [number, number, number][] = []
  const rotations: [number, number, number][] = []

  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const y = 1 - t * 2
    const rxy = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * i

    const spread = 13 + (i % 3) * 2.5
    const px = Math.cos(theta) * rxy * spread
    const py = y * 9 + (((i * 7919) % 100) / 100 - 0.5) * 5
    const pz = Math.sin(theta) * rxy * spread

    positions.push([px, py, pz])

    // Face toward origin + slight random tilt
    const yaw = Math.atan2(px, pz)
    const pitch = -Math.atan2(py, Math.sqrt(px * px + pz * pz)) * 0.4
    const roll = (((i * 2311) % 100) / 100 - 0.5) * 0.3

    rotations.push([pitch, yaw, roll])
  }

  return { positions, rotations }
}

interface SceneProps {
  onDownload: (photo: Photo) => void
}

function Scene({ onDownload }: SceneProps) {
  const { positions, rotations } = useMemo(() => generateCardLayout(PHOTOS.length), [])

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[12, 18, 12]} intensity={1.1} castShadow />
      <directionalLight position={[-12, -6, -12]} intensity={0.35} color="#3366ff" />
      <pointLight position={[0, 0, 0]} intensity={1.0} color="#70c8e0" distance={28} decay={2} />

      <Stars
        radius={110}
        depth={55}
        count={7000}
        factor={4.5}
        saturation={0.15}
        fade
        speed={0.3}
      />

      {PHOTOS.map((photo, i) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          position={positions[i]}
          rotation={rotations[i]}
          cardWidth={2.3}
          cardHeight={1.65}
          onDownload={onDownload}
        />
      ))}
    </>
  )
}

export default function SpaceScene({
  onDownload,
}: {
  onDownload: (photo: Photo) => void
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0, 24], fov: 58, near: 0.1, far: 600 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
    >
      <color attach="background" args={["#090b11"]} />
      <fog attach="fog" args={["#090b11", 38, 85]} />

      <Suspense fallback={null}>
        <Scene onDownload={onDownload} />
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate
        autoRotateSpeed={0.3}
        zoomSpeed={0.7}
        rotateSpeed={0.6}
        minDistance={3}
        maxDistance={50}
        dampingFactor={0.07}
        enableDamping
      />
    </Canvas>
  )
}

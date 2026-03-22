// @ts-nocheck
"use client"

import { useMemo, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Stars } from "@react-three/drei"
import * as THREE from "three"
import { useGalleryStore } from "@/lib/gallery-store"
import type { Photo } from "@/lib/photos"
import PhotoCard from "@/components/PhotoCard"

function generateCardLayout(
  count: number,
  spread: number,
  verticalRange: number,
  tiltAmount: number
) {
  const positions: [number, number, number][] = []
  const rotations: [number, number, number][] = []
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5
    const y = 1 - t * 2
    const rxy = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * i
    const jitter = (((i * 7919) % 100) / 100 - 0.5)

    const px = Math.cos(theta) * rxy * (spread + (i % 3) * 2.5)
    const py = y * verticalRange + jitter * 5
    const pz = Math.sin(theta) * rxy * (spread + (i % 3) * 2.5)

    positions.push([px, py, pz])

    const yaw = Math.atan2(px, pz)
    const pitch = -Math.atan2(py, Math.sqrt(px * px + pz * pz)) * 0.4
    const roll = (((i * 2311) % 100) / 100 - 0.5) * tiltAmount

    rotations.push([pitch, yaw, roll])
  }

  return { positions, rotations }
}

interface SceneProps {
  onDownload: (photo: Photo) => void
}

function Scene({ onDownload }: SceneProps) {
  const { photos, visibleCount, settings } = useGalleryStore()
  const visible = photos.slice(0, visibleCount)

  const { positions, rotations } = useMemo(
    () =>
      generateCardLayout(
        visible.length,
        settings.spread,
        settings.verticalRange,
        settings.tiltAmount
      ),
    [visible.length, settings.spread, settings.verticalRange, settings.tiltAmount]
  )

  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[12, 18, 12]} intensity={1.2} castShadow />
      <directionalLight position={[-12, -6, -12]} intensity={0.4} color="#ffffff" />
      <pointLight position={[0, 0, 0]} intensity={0.8} color="#ffffff" distance={28} decay={2} />

      <Stars radius={110} depth={55} count={5000} factor={3.5} saturation={0} fade speed={0.2} />

      {settings.fog && <fog attach="fog" args={["#0a0a0a", 38, 85]} />}

      {visible.map((photo, i) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          position={positions[i] ?? [0, 0, 0]}
          rotation={rotations[i] ?? [0, 0, 0]}
          cardWidth={2.3 * settings.cardScale}
          cardHeight={1.65 * settings.cardScale}
          floatSpeed={settings.floatSpeed}
          floatAmount={settings.floatAmount}
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
  const { settings } = useGalleryStore()

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
      <color attach="background" args={["#0a0a0a"]} />

      <Suspense fallback={null}>
        <Scene onDownload={onDownload} />
      </Suspense>

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate={settings.autoRotate}
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

// @ts-nocheck
"use client"

import { useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { useTexture } from "@react-three/drei"
import * as THREE from "three"
import type { Photo } from "@/lib/photos"

const CARD_PADDING = 0.06

interface PhotoCardProps {
  photo: Photo
  position: [number, number, number]
  rotation: [number, number, number]
  cardWidth: number
  cardHeight: number
  floatSpeed?: number
  floatAmount?: number
  onDownload: (photo: Photo) => void
}

export default function PhotoCard({
  photo,
  position,
  rotation,
  cardWidth,
  floatSpeed = 0.55,
  floatAmount = 0.09,
  onDownload,
}: PhotoCardProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const glowRef = useRef<THREE.Mesh>(null!)
  const [hovered, setHovered] = useState(false)
  const { camera } = useThree()

  const texture = useTexture(photo.src)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter

  const imgAspect = photo.width / photo.height
  const frameW = cardWidth
  const frameH = cardWidth / imgAspect
  const backW = frameW + CARD_PADDING * 2
  const backH = frameH + CARD_PADDING * 2 + 0.22

  useFrame((state) => {
    if (!groupRef.current) return

    // LOD anisotropy upgrade
    const worldPos = new THREE.Vector3()
    groupRef.current.getWorldPosition(worldPos)
    const dist = camera.position.distanceTo(worldPos)
    const aniso = dist < 8 ? 16 : dist < 16 ? 8 : 2
    if (texture.anisotropy !== aniso) {
      texture.anisotropy = aniso
      texture.needsUpdate = true
    }

    // Float bob
    groupRef.current.position.y =
      position[1] +
      Math.sin(state.clock.elapsedTime * floatSpeed + photo.id * 1.3) * floatAmount

    // Hover scale pop
    const targetScale = hovered ? 1.04 : 1.0
    groupRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1
    )

    // Glow pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      const targetOpacity = hovered ? 0.22 : 0
      mat.opacity += (targetOpacity - mat.opacity) * 0.1
    }
  })

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      onClick={() => onDownload(photo)}
      onPointerEnter={() => {
        setHovered(true)
        document.body.style.cursor = "pointer"
      }}
      onPointerLeave={() => {
        setHovered(false)
        document.body.style.cursor = "auto"
      }}
    >
      {/* Glow halo */}
      <mesh ref={glowRef} position={[0, 0, -0.005]}>
        <planeGeometry args={[backW + 0.3, backH + 0.3]} />
        <meshBasicMaterial color="#48d8e8" transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Polaroid backing */}
      <mesh castShadow>
        <planeGeometry args={[backW, backH]} />
        <meshStandardMaterial color="#f2ede6" roughness={0.75} metalness={0} />
      </mesh>

      {/* Photo image */}
      <mesh position={[0, backH / 2 - frameH / 2 - CARD_PADDING, 0.003]}>
        <planeGeometry args={[frameW, frameH]} />
        <meshStandardMaterial map={texture} roughness={0.35} metalness={0} toneMapped={false} />
      </mesh>

      {/* Drop shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.04, -(backH / 2 + 0.02), -0.1]}>
        <planeGeometry args={[backW * 0.9, 0.35]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} />
      </mesh>
    </group>
  )
}

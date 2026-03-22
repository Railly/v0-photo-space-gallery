"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import MobileGallery from "@/components/MobileGallery"
import Hud from "@/components/Hud"
import { PHOTOS, type Photo } from "@/lib/photos"

// Dynamic import so Three.js doesn't SSR
const SpaceScene = dynamic(() => import("@/components/SpaceScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-[#0a0c12] gap-4">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-accent/80 animate-bounce"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
      <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
        Loading space
      </p>
    </div>
  ),
})

function downloadPhoto(photo: Photo) {
  const link = document.createElement("a")
  link.href = photo.src
  link.download = `photo-space-${photo.id}-${photo.title.toLowerCase().replace(/\s+/g, "-")}.jpg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function PhotoSpaceClient() {
  const [isMobile, setIsMobile] = useState(false)
  const [lastDownloaded, setLastDownloaded] = useState<Photo | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  const handleDownload = useCallback((photo: Photo) => {
    downloadPhoto(photo)
    setLastDownloaded(photo)
  }, [])

  if (isMobile) {
    return (
      <div className="w-full min-h-screen bg-background overflow-x-hidden">
        <MobileGallery onDownload={handleDownload} />
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <SpaceScene onDownload={handleDownload} />
      <Hud lastDownloaded={lastDownloaded} />
    </div>
  )
}

"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import Sidebar from "@/components/Sidebar"
import MobileGallery from "@/components/MobileGallery"
import Hud from "@/components/Hud"
import GridView from "@/components/GridView"
import { useGalleryStore } from "@/lib/gallery-store"
import type { Photo } from "@/lib/photos"

const SpaceScene = dynamic(() => import("@/components/SpaceScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0c12] gap-4">
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
  const view = useGalleryStore((s) => s.view)

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

  // Mobile: no sidebar, just masonry gallery
  if (isMobile) {
    return (
      <div className="w-full min-h-screen bg-background overflow-x-hidden">
        <MobileGallery onDownload={handleDownload} />
      </div>
    )
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-background">
      {/* Left sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="relative flex-1 overflow-hidden">
        {view === "3d" ? (
          <>
            <SpaceScene onDownload={handleDownload} />
            <Hud lastDownloaded={lastDownloaded} />
          </>
        ) : (
          <GridView onDownload={handleDownload} />
        )}
      </div>
    </div>
  )
}

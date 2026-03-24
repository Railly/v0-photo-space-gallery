"use client"

import { useState, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { SidebarWrapper } from "@/components/Sidebar"
import MobileGallery from "@/components/MobileGallery"
import Hud from "@/components/Hud"
import GridView from "@/components/GridView"
import { useGalleryStore } from "@/lib/gallery-store"
import type { Photo } from "@/lib/photos"

const SpaceScene = dynamic(() => import("@/components/SpaceScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
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

  // Mobile: show MobileGallery for grid view, or SpaceScene for 3D
  if (isMobile) {
    if (view === "3d") {
      return (
        <div className="w-full h-screen bg-background overflow-hidden relative">
          <SpaceScene onDownload={handleDownload} />
          {/* Mobile 3D header with back button */}
          <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 pb-3 bg-gradient-to-b from-background via-background/80 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">Photo Space</h1>
                <p className="text-[10px] text-muted-foreground font-mono">3D View</p>
              </div>
              <button
                onClick={() => useGalleryStore.getState().setView("grid")}
                className="p-2 rounded-lg bg-secondary/80 text-foreground text-xs font-medium"
              >
                Exit 3D
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div className="w-full min-h-screen bg-background overflow-x-hidden">
        <MobileGallery onDownload={handleDownload} />
      </div>
    )
  }

  return (
    <SidebarWrapper>
      <div className="relative flex-1 overflow-hidden h-screen">
        {view === "3d" ? (
          <>
            <SpaceScene onDownload={handleDownload} />
            <Hud lastDownloaded={lastDownloaded} />
          </>
        ) : (
          <GridView onDownload={handleDownload} />
        )}
      </div>
    </SidebarWrapper>
  )
}

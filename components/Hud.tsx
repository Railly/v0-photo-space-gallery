"use client"

import { useState, useEffect } from "react"
import { Compass, RotateCcw, Download } from "lucide-react"
import { useGalleryStore } from "@/lib/gallery-store"
import type { Photo } from "@/lib/photos"

interface HudProps {
  onReset?: () => void
  lastDownloaded?: Photo | null
}

export default function Hud({ onReset, lastDownloaded }: HudProps) {
  const { visibleCount } = useGalleryStore()
  const [showTip, setShowTip] = useState(true)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowTip(false), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (lastDownloaded) {
      setShowToast(true)
      const t = setTimeout(() => setShowToast(false), 3000)
      return () => clearTimeout(t)
    }
  }, [lastDownloaded])

  return (
    <>
      {showTip && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border/60 rounded-full px-4 py-2 text-xs text-muted-foreground select-none pointer-events-none animate-in fade-in slide-in-from-top-2 duration-500">
          <Compass className="w-3 h-3 text-accent" />
          <span>Drag to orbit · Scroll to zoom · Click a photo to download</span>
        </div>
      )}

      <div className="absolute bottom-6 right-5 z-10 flex flex-col gap-2">
        <button
          onClick={onReset}
          className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-md border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-150"
          aria-label="Reset camera"
          title="Reset camera"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="absolute bottom-6 left-[calc(15rem+1.25rem)] z-10 select-none pointer-events-none">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground/70">
          <span className="w-1 h-1 rounded-full bg-accent/70 animate-pulse" />
          <span>{visibleCount} photo{visibleCount !== 1 ? "s" : ""} floating in space</span>
        </div>
      </div>

      {showToast && lastDownloaded && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-card/90 backdrop-blur-md border border-border/60 rounded-full px-4 py-2.5 text-sm text-foreground animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-lg">
          <Download className="w-3.5 h-3.5 text-accent" />
          <span>Downloading <strong>{lastDownloaded.title}</strong></span>
        </div>
      )}
    </>
  )
}

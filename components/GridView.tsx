"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useGalleryStore } from "@/lib/gallery-store"
import type { Photo } from "@/lib/photos"
import PhotoImage from "@/components/PhotoImage"

interface GridViewProps {
  onDownload: (photo: Photo) => void
}

export default function GridView({ onDownload }: GridViewProps) {
  const { photos, visibleCount } = useGalleryStore()
  const visible = photos.slice(0, visibleCount)

  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  
  // Scroll state for fade gradients
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(true)

  const updateScrollIndicators = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    
    const { scrollTop, scrollHeight, clientHeight } = container
    setCanScrollUp(scrollTop > 10)
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10)
  }, [])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    
    updateScrollIndicators()
    container.addEventListener("scroll", updateScrollIndicators)
    window.addEventListener("resize", updateScrollIndicators)
    return () => {
      container.removeEventListener("scroll", updateScrollIndicators)
      window.removeEventListener("resize", updateScrollIndicators)
    }
  }, [updateScrollIndicators])

  const open = useCallback(
    (photo: Photo) => {
      const idx = visible.findIndex((p) => p.id === photo.id)
      setLightboxIndex(Math.max(0, idx))
      setLightbox(photo)
    },
    [visible]
  )

  const close = useCallback(() => setLightbox(null), [])

  const prev = useCallback(() => {
    const idx = (lightboxIndex - 1 + visible.length) % visible.length
    setLightboxIndex(idx)
    setLightbox(visible[idx])
  }, [lightboxIndex, visible])

  const next = useCallback(() => {
    const idx = (lightboxIndex + 1) % visible.length
    setLightboxIndex(idx)
    setLightbox(visible[idx])
  }, [lightboxIndex, visible])

  return (
    <div ref={scrollRef} className="w-full h-full overflow-y-auto gallery-scroll bg-background p-6">
      {/* Dot pattern background */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
      
      {/* Top fade gradient - visible when content scrolled down */}
      <div
        aria-hidden
        className={`pointer-events-none fixed top-0 left-0 right-0 h-16 bg-gradient-to-b from-background to-transparent z-10 transition-opacity duration-200 ${
          canScrollUp ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Bottom fade gradient - visible when more content below */}
      <div
        aria-hidden
        className={`pointer-events-none fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent z-10 transition-opacity duration-200 ${
          canScrollDown ? "opacity-100" : "opacity-0"
        }`}
      />

      <div className="relative z-10 columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-3 [column-fill:balance]">
        {visible.map((photo) => (
          <div
            key={photo.id}
            className="break-inside-avoid mb-3 group relative overflow-hidden rounded-lg ring-1 ring-border/50 hover:ring-foreground/60 transition-all duration-200 cursor-pointer"
            onClick={() => open(photo)}
            role="button"
            tabIndex={0}
            aria-label={`View ${photo.title}`}
            onKeyDown={(e) => e.key === "Enter" && open(photo)}
          >
            <PhotoImage
              src={photo.src}
              alt={photo.title}
              width={photo.width}
              height={photo.height}
              className="w-full block"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors duration-200 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
              <p className="text-xs font-semibold text-foreground truncate">{photo.title}</p>
              <p className="text-[10px] text-muted-foreground truncate">{photo.description}</p>
            </div>
            {/* Download button on hover */}
            <button
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/70 backdrop-blur-sm flex items-center justify-center text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              onClick={(e) => {
                e.stopPropagation()
                onDownload(photo)
              }}
              aria-label={`Download ${photo.title}`}
            >
              <Download className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${lightbox.title}`}
        >
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div>
              <p className="text-sm font-semibold text-foreground">{lightbox.title}</p>
              <p className="text-xs text-muted-foreground">{lightbox.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
                onClick={() => onDownload(lightbox)}
                aria-label="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
                onClick={close}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="w-full h-full flex items-center justify-center px-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightbox.src}
              alt={lightbox.title}
              className="max-w-full max-h-screen object-contain select-none"
            />
          </div>

          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-secondary/70 hover:bg-secondary transition-colors"
            onClick={prev}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-secondary/70 hover:bg-secondary transition-colors"
            onClick={next}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-5 flex gap-1.5">
            {visible.map((_, i) => (
              <button
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === lightboxIndex ? "bg-primary w-4" : "bg-muted-foreground/50 w-1.5"
                }`}
                onClick={() => {
                  setLightboxIndex(i)
                  setLightbox(visible[i])
                }}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { PHOTOS, type Photo } from "@/lib/photos"

interface MobileGalleryProps {
  onDownload: (photo: Photo) => void
}

export default function MobileGallery({ onDownload }: MobileGalleryProps) {
  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = useCallback((photo: Photo) => {
    const idx = PHOTOS.findIndex((p) => p.id === photo.id)
    setLightboxIndex(idx)
    setLightbox(photo)
  }, [])

  const closeLightbox = useCallback(() => setLightbox(null), [])

  const prev = useCallback(() => {
    const idx = (lightboxIndex - 1 + PHOTOS.length) % PHOTOS.length
    setLightboxIndex(idx)
    setLightbox(PHOTOS[idx])
  }, [lightboxIndex])

  const next = useCallback(() => {
    const idx = (lightboxIndex + 1) % PHOTOS.length
    setLightboxIndex(idx)
    setLightbox(PHOTOS[idx])
  }, [lightboxIndex])

  // Split into 2 columns for masonry
  const col1 = PHOTOS.filter((_, i) => i % 2 === 0)
  const col2 = PHOTOS.filter((_, i) => i % 2 === 1)

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-20 px-5 pt-safe-top pb-3 pt-4 bg-gradient-to-b from-background to-transparent pointer-events-none">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Photo Space
          </h1>
          <span className="text-xs text-muted-foreground font-mono">{PHOTOS.length} images</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Tap to view · Long-press to download</p>
      </header>

      {/* Masonry grid */}
      <div
        className="min-h-screen overflow-y-auto gallery-scroll px-3 pb-10 pt-20"
        style={{ background: "oklch(0.08 0.01 260)" }}
      >
        {/* Starfield-style dot pattern */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(180,220,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="flex gap-3 relative z-10">
          {/* Column 1 */}
          <div className="flex-1 flex flex-col gap-3">
            {col1.map((photo) => (
              <button
                key={photo.id}
                className="group relative w-full overflow-hidden rounded-lg ring-1 ring-border/50 hover:ring-accent/60 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openLightbox(photo)}
                aria-label={`View ${photo.title}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.title}
                  width={photo.width}
                  height={photo.height}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 480px) 47vw, 33vw"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors duration-200 flex items-end p-2 opacity-0 group-hover:opacity-100">
                  <span className="text-xs font-medium text-foreground bg-background/70 backdrop-blur-sm px-2 py-0.5 rounded-full truncate">
                    {photo.title}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Column 2 (offset down slightly) */}
          <div className="flex-1 flex flex-col gap-3 mt-8">
            {col2.map((photo) => (
              <button
                key={photo.id}
                className="group relative w-full overflow-hidden rounded-lg ring-1 ring-border/50 hover:ring-accent/60 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => openLightbox(photo)}
                aria-label={`View ${photo.title}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.title}
                  width={photo.width}
                  height={photo.height}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 480px) 47vw, 33vw"
                />
                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors duration-200 flex items-end p-2 opacity-0 group-hover:opacity-100">
                  <span className="text-xs font-medium text-foreground bg-background/70 backdrop-blur-sm px-2 py-0.5 rounded-full truncate">
                    {photo.title}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${lightbox.title}`}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-4 z-10">
            <div>
              <p className="text-sm font-semibold text-foreground">{lightbox.title}</p>
              <p className="text-xs text-muted-foreground">{lightbox.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary text-foreground transition-colors"
                onClick={() => onDownload(lightbox)}
                aria-label="Download photo"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary/80 hover:bg-secondary text-foreground transition-colors"
                onClick={closeLightbox}
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div className="relative w-full h-full flex items-center justify-center px-12">
            <Image
              src={lightbox.src}
              alt={lightbox.title}
              width={lightbox.width}
              height={lightbox.height}
              className="max-w-full max-h-screen object-contain select-none"
              sizes="100vw"
              priority
            />
          </div>

          {/* Navigation */}
          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-secondary/70 hover:bg-secondary text-foreground transition-colors"
            onClick={prev}
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-secondary/70 hover:bg-secondary text-foreground transition-colors"
            onClick={next}
            aria-label="Next photo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 flex gap-1.5">
            {PHOTOS.map((_, i) => (
              <button
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  i === lightboxIndex ? "bg-primary w-4" : "bg-muted-foreground/50"
                }`}
                onClick={() => {
                  setLightboxIndex(i)
                  setLightbox(PHOTOS[i])
                }}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

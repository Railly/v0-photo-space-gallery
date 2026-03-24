"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { X, Download, Box, LayoutGrid } from "lucide-react"
import { useGalleryStore } from "@/lib/gallery-store"
import type { Photo } from "@/lib/photos"

interface MobileGalleryProps {
  onDownload: (photo: Photo) => void
}

export default function MobileGallery({ onDownload }: MobileGalleryProps) {
  const { photos, visibleCount, view, setView } = useGalleryStore()
  const visible = photos.slice(0, visibleCount)

  const [lightbox, setLightbox] = useState<Photo | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [direction, setDirection] = useState<"left" | "right" | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Touch/swipe state for lightbox
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchDelta, setTouchDelta] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  
  // Long press state
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const [longPressTarget, setLongPressTarget] = useState<Photo | null>(null)
  
  // Thumbnail strip scroll state
  const thumbContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [thumbDragStart, setThumbDragStart] = useState<number | null>(null)
  const [thumbScrollStart, setThumbScrollStart] = useState(0)
  const activeThumbRef = useRef<HTMLButtonElement>(null)

  const openLightbox = useCallback((photo: Photo) => {
    const idx = visible.findIndex((p) => p.id === photo.id)
    setLightboxIndex(Math.max(0, idx))
    setLightbox(photo)
    setDirection(null)
  }, [visible])

  const closeLightbox = useCallback(() => {
    setLightbox(null)
    setDirection(null)
  }, [])

  const navigateTo = useCallback((idx: number, dir: "left" | "right") => {
    if (isAnimating) return
    setIsAnimating(true)
    setDirection(dir)
    
    setTimeout(() => {
      setLightboxIndex(idx)
      setLightbox(visible[idx])
      setTimeout(() => {
        setIsAnimating(false)
        setDirection(null)
      }, 50)
    }, 150)
  }, [visible, isAnimating])

  const prev = useCallback(() => {
    const idx = (lightboxIndex - 1 + visible.length) % visible.length
    navigateTo(idx, "right")
  }, [lightboxIndex, visible.length, navigateTo])

  const next = useCallback(() => {
    const idx = (lightboxIndex + 1) % visible.length
    navigateTo(idx, "left")
  }, [lightboxIndex, visible.length, navigateTo])

  // Touch handlers for lightbox swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
    setTouchDelta(0)
    setIsDragging(false)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart) return
    const deltaX = e.touches[0].clientX - touchStart.x
    const deltaY = e.touches[0].clientY - touchStart.y
    
    // Only start dragging if horizontal movement is greater than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setIsDragging(true)
      setTouchDelta(deltaX)
    }
  }, [touchStart])

  const handleTouchEnd = useCallback(() => {
    if (isDragging && Math.abs(touchDelta) > 50) {
      if (touchDelta > 0) {
        prev()
      } else {
        next()
      }
    }
    setTouchStart(null)
    setTouchDelta(0)
    setIsDragging(false)
  }, [isDragging, touchDelta, prev, next])

  // Long press handlers for download
  const handleLongPressStart = useCallback((photo: Photo, e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    setLongPressTarget(photo)
    longPressTimer.current = setTimeout(() => {
      onDownload(photo)
      setLongPressTarget(null)
      // Haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50)
    }, 500)
  }, [onDownload])

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setLongPressTarget(null)
  }, [])

  // Thumbnail strip scroll detection
  const updateScrollIndicators = useCallback(() => {
    const container = thumbContainerRef.current
    if (!container) return
    
    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }, [])

  useEffect(() => {
    const container = thumbContainerRef.current
    if (!container) return
    
    updateScrollIndicators()
    container.addEventListener("scroll", updateScrollIndicators)
    return () => container.removeEventListener("scroll", updateScrollIndicators)
  }, [updateScrollIndicators, lightbox])

  // Scroll active thumbnail into view
  useEffect(() => {
    if (lightbox && activeThumbRef.current && thumbContainerRef.current) {
      const container = thumbContainerRef.current
      const thumb = activeThumbRef.current
      const containerRect = container.getBoundingClientRect()
      const thumbRect = thumb.getBoundingClientRect()
      
      const thumbCenter = thumbRect.left + thumbRect.width / 2
      const containerCenter = containerRect.left + containerRect.width / 2
      const offset = thumbCenter - containerCenter
      
      container.scrollBy({ left: offset, behavior: "smooth" })
    }
  }, [lightboxIndex, lightbox])

  // Thumbnail drag handlers
  const handleThumbDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    setThumbDragStart(clientX)
    setThumbScrollStart(thumbContainerRef.current?.scrollLeft || 0)
  }, [])

  const handleThumbDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (thumbDragStart === null || !thumbContainerRef.current) return
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const delta = thumbDragStart - clientX
    thumbContainerRef.current.scrollLeft = thumbScrollStart + delta
  }, [thumbDragStart, thumbScrollStart])

  const handleThumbDragEnd = useCallback(() => {
    setThumbDragStart(null)
  }, [])

  const col1 = visible.filter((_, i) => i % 2 === 0)
  const col2 = visible.filter((_, i) => i % 2 === 1)

  // If 3D view is selected on mobile, show a message
  if (view === "3d") {
    return (
      <div className="w-full min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <Box className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">3D View</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs">
          The immersive 3D space experience is optimized for larger screens. Switch to Grid view for the best mobile experience.
        </p>
        <button
          onClick={() => setView("grid")}
          className="px-6 py-3 bg-foreground text-background rounded-lg font-medium text-sm transition-colors active:bg-foreground/80"
        >
          Switch to Grid View
        </button>
        <button
          onClick={() => setView("3d")}
          className="mt-3 px-6 py-3 text-muted-foreground text-sm"
        >
          Try 3D anyway (experimental)
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Header with view toggle */}
      <header className="fixed top-0 left-0 right-0 z-20 px-4 pt-4 pb-3 bg-gradient-to-b from-background via-background/95 to-transparent pointer-events-none">
        <div className="flex items-center justify-between pointer-events-auto">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">Photo Space</h1>
            <p className="text-[10px] text-muted-foreground font-mono">{visible.length} images</p>
          </div>
          
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 bg-secondary/80 backdrop-blur-sm rounded-lg">
            <button
              onClick={() => setView("3d")}
              className={`p-2 rounded-md transition-colors ${
                view === "3d" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
              aria-label="3D View"
            >
              <Box className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`p-2 rounded-md transition-colors ${
                view === "grid" ? "bg-foreground text-background" : "text-muted-foreground"
              }`}
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 pointer-events-none">Tap to view · Hold to download</p>
      </header>

      {/* Gallery grid */}
      <div
        className="min-h-screen overflow-y-auto gallery-scroll px-3 pb-10 pt-24"
        style={{ background: "var(--background)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="flex gap-3 relative z-10">
          <div className="flex-1 flex flex-col gap-3">
            {col1.map((photo) => (
              <button
                key={photo.id}
                className={`group relative w-full overflow-hidden rounded-lg ring-1 ring-border/50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  longPressTarget?.id === photo.id ? "scale-95 ring-foreground/50" : ""
                }`}
                onClick={() => openLightbox(photo)}
                onTouchStart={(e) => handleLongPressStart(photo, e)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                onContextMenu={(e) => e.preventDefault()}
                aria-label={`View ${photo.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.title} className="w-full h-auto object-cover" loading="lazy" />
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col gap-3 mt-8">
            {col2.map((photo) => (
              <button
                key={photo.id}
                className={`group relative w-full overflow-hidden rounded-lg ring-1 ring-border/50 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  longPressTarget?.id === photo.id ? "scale-95 ring-foreground/50" : ""
                }`}
                onClick={() => openLightbox(photo)}
                onTouchStart={(e) => handleLongPressStart(photo, e)}
                onTouchEnd={handleLongPressEnd}
                onTouchCancel={handleLongPressEnd}
                onContextMenu={(e) => e.preventDefault()}
                aria-label={`View ${photo.title}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.title} className="w-full h-auto object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-background/98 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo: ${lightbox.title}`}
        >
          {/* Top bar with title and actions */}
          <div className="relative z-10 flex items-start justify-between px-4 pt-4 pb-2 safe-area-top">
            <div 
              className={`flex-1 transition-all duration-200 ${
                direction === "left" ? "translate-x-4 opacity-0" : 
                direction === "right" ? "-translate-x-4 opacity-0" : 
                "translate-x-0 opacity-100"
              }`}
            >
              <p className="text-base font-semibold text-foreground leading-tight">{lightbox.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{lightbox.description}</p>
              <p className="text-[10px] text-muted-foreground/70 font-mono mt-1">
                {lightboxIndex + 1} / {visible.length}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/80 text-foreground transition-colors active:bg-secondary"
                onClick={() => onDownload(lightbox)}
                aria-label="Download photo"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary/80 text-foreground transition-colors active:bg-secondary"
                onClick={closeLightbox}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main image area - swipeable */}
          <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className={`w-full h-full flex items-center justify-center px-4 transition-transform duration-200 ${
                isDragging ? "" : "transition-all"
              } ${
                direction === "left" ? "-translate-x-8 opacity-0" : 
                direction === "right" ? "translate-x-8 opacity-0" : 
                "opacity-100"
              }`}
              style={{ 
                transform: isDragging 
                  ? `translateX(${touchDelta}px)` 
                  : direction === "left" 
                    ? "translateX(-32px)" 
                    : direction === "right" 
                      ? "translateX(32px)" 
                      : "translateX(0)"
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightbox.src}
                alt={lightbox.title}
                className="max-w-full max-h-full object-contain select-none rounded-lg"
                draggable={false}
              />
            </div>
            
            {/* Swipe hint indicators */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-16 bg-foreground/10 rounded-full" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-16 bg-foreground/10 rounded-full" />
          </div>

          {/* Thumbnail strip */}
          <div className="relative safe-area-bottom pb-4">
            {/* Left fade gradient */}
            <div 
              className={`absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
                canScrollLeft ? "opacity-100" : "opacity-0"
              }`}
            />
            {/* Right fade gradient */}
            <div 
              className={`absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
                canScrollRight ? "opacity-100" : "opacity-0"
              }`}
            />
            
            <div
              ref={thumbContainerRef}
              className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              onTouchStart={handleThumbDragStart}
              onTouchMove={handleThumbDragMove}
              onTouchEnd={handleThumbDragEnd}
              onMouseDown={handleThumbDragStart}
              onMouseMove={handleThumbDragMove}
              onMouseUp={handleThumbDragEnd}
              onMouseLeave={handleThumbDragEnd}
            >
              {visible.map((photo, i) => (
                <button
                  key={photo.id}
                  ref={i === lightboxIndex ? activeThumbRef : null}
                  className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                    i === lightboxIndex 
                      ? "ring-2 ring-foreground scale-105" 
                      : "ring-1 ring-border/30 opacity-60"
                  }`}
                  onClick={() => {
                    const dir = i > lightboxIndex ? "left" : "right"
                    navigateTo(i, dir)
                  }}
                  aria-label={`Go to ${photo.title}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.thumb}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

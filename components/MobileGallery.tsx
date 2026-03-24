"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { X, Download, Box, LayoutGrid } from "lucide-react"
import { useGalleryStore } from "@/lib/gallery-store"
import type { Photo } from "@/lib/photos"
import PhotoImage from "@/components/PhotoImage"

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
  
  // Simple carousel state
  const thumbContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const THUMB_SIZE = 56
  const THUMB_GAP = 8
  
  // Main gallery vertical scroll state
  const galleryScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(true)

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

  // Update scroll indicators (for fade gradients)
  const updateScrollIndicators = useCallback(() => {
    const container = thumbContainerRef.current
    if (!container) return
    const { scrollLeft, scrollWidth, clientWidth } = container
    setCanScrollLeft(scrollLeft > 5)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5)
  }, [])

  // Scroll to index
  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    const container = thumbContainerRef.current
    if (!container) return
    const targetScroll = idx * (THUMB_SIZE + THUMB_GAP)
    container.scrollTo({ left: targetScroll, behavior: smooth ? "smooth" : "auto" })
  }, [THUMB_SIZE, THUMB_GAP])

  // Called when scroll has fully stopped (after snap completes)
  const handleScrollEnd = useCallback(() => {
    const container = thumbContainerRef.current
    if (!container) return
    
    const scrollPos = container.scrollLeft
    const idx = Math.round(scrollPos / (THUMB_SIZE + THUMB_GAP))
    const clampedIdx = Math.max(0, Math.min(visible.length - 1, idx))
    
    // Only update if different
    if (clampedIdx !== lightboxIndex && visible[clampedIdx]) {
      const dir = clampedIdx > lightboxIndex ? "left" : "right"
      setDirection(dir)
      setLightboxIndex(clampedIdx)
      setLightbox(visible[clampedIdx])
      setTimeout(() => setDirection(null), 150)
    }
    
    updateScrollIndicators()
  }, [visible, lightboxIndex, updateScrollIndicators, THUMB_SIZE, THUMB_GAP])

  // Main gallery vertical scroll detection
  const updateGalleryScrollIndicators = useCallback(() => {
    const container = galleryScrollRef.current
    if (!container) return
    
    const { scrollTop, scrollHeight, clientHeight } = container
    setCanScrollUp(scrollTop > 10)
    setCanScrollDown(scrollTop < scrollHeight - clientHeight - 10)
  }, [])

  useEffect(() => {
    const container = galleryScrollRef.current
    if (!container) return
    
    updateGalleryScrollIndicators()
    container.addEventListener("scroll", updateGalleryScrollIndicators)
    window.addEventListener("resize", updateGalleryScrollIndicators)
    return () => {
      container.removeEventListener("scroll", updateGalleryScrollIndicators)
      window.removeEventListener("resize", updateGalleryScrollIndicators)
    }
  }, [updateGalleryScrollIndicators])

  useEffect(() => {
    const container = thumbContainerRef.current
    if (!container) return
    
    updateScrollIndicators()
    
    // Use scrollend event - fires when scroll completely stops (after snap)
    container.addEventListener("scrollend", handleScrollEnd)
    container.addEventListener("scroll", updateScrollIndicators)
    
    return () => {
      container.removeEventListener("scrollend", handleScrollEnd)
      container.removeEventListener("scroll", updateScrollIndicators)
    }
  }, [updateScrollIndicators, handleScrollEnd, lightbox])

  // Scroll to active thumbnail when lightbox opens
  const prevLightboxRef = useRef<Photo | null>(null)
  useEffect(() => {
    if (lightbox && prevLightboxRef.current === null) {
      scrollToIndex(lightboxIndex, false)
    }
    prevLightboxRef.current = lightbox
  }, [lightbox, lightboxIndex, scrollToIndex])



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
        ref={galleryScrollRef}
        className="min-h-screen h-screen overflow-y-auto gallery-scroll px-3 pb-10 pt-24"
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
        
        {/* Top fade gradient - visible when content scrolled down */}
        <div
          aria-hidden
          className={`pointer-events-none fixed top-20 left-0 right-0 h-12 bg-gradient-to-b from-background to-transparent z-10 transition-opacity duration-200 ${
            canScrollUp ? "opacity-100" : "opacity-0"
          }`}
        />
        {/* Bottom fade gradient - visible when more content below */}
        <div
          aria-hidden
          className={`pointer-events-none fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent z-10 transition-opacity duration-200 ${
            canScrollDown ? "opacity-100" : "opacity-0"
          }`}
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
                <PhotoImage 
                  src={photo.src} 
                  alt={photo.title} 
                  width={photo.width} 
                  height={photo.height}
                  className="w-full"
                />
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
                <PhotoImage 
                  src={photo.src} 
                  alt={photo.title} 
                  width={photo.width} 
                  height={photo.height}
                  className="w-full"
                />
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

          {/* Snap-to-center thumbnail carousel */}
          <div className="relative safe-area-bottom pb-4">
            {/* Center selection frame - persistent square reticle */}
            <div 
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              style={{ marginTop: "10px" }}
            >
              <div 
                className="w-16 h-16 rounded-xl border-2 border-foreground/80 bg-transparent"
                style={{ boxShadow: "0 0 0 4px rgba(0,0,0,0.5)" }}
              />
            </div>
            
            {/* Left fade gradient */}
            <div 
              className={`absolute left-0 top-0 bottom-4 w-16 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
                canScrollLeft ? "opacity-100" : "opacity-0"
              }`}
            />
            {/* Right fade gradient */}
            <div 
              className={`absolute right-0 top-0 bottom-4 w-16 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none transition-opacity duration-200 ${
                canScrollRight ? "opacity-100" : "opacity-0"
              }`}
            />
            
            {/* Scroll hint text */}
            <p className="text-center text-[9px] text-muted-foreground/60 mb-1 font-mono">
              Scroll to select
            </p>
            
            <div
              ref={thumbContainerRef}
              className="flex gap-2 py-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
              style={{ 
                scrollbarWidth: "none", 
                msOverflowStyle: "none",
                paddingLeft: `calc(50% - ${THUMB_SIZE / 2}px)`,
                paddingRight: `calc(50% - ${THUMB_SIZE / 2}px)`,
              }}
            >
              {visible.map((photo) => (
                <div
                  key={photo.id}
                  className="flex-shrink-0 snap-center"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden ring-1 ring-border/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumb}
                      alt=""
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      )}
    </>
  )
}

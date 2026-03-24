"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import {
  Box,
  LayoutGrid,
  Upload,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  ChevronLeft,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  useGalleryStore,
  createPhotoFromFile,
  type ViewMode,
} from "@/lib/gallery-store"
import { PHOTOS } from "@/lib/photos"

function SidebarContentInner() {
  const {
    photos,
    visibleCount,
    view,
    settings,
    addPhotos,
    removePhoto,
    setVisibleCount,
    setView,
    updateSettings,
    setPhotos,
  } = useGalleryStore()

  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoListRef = useRef<HTMLDivElement>(null)
  const [canScrollPhotosUp, setCanScrollPhotosUp] = useState(false)
  const [canScrollPhotosDown, setCanScrollPhotosDown] = useState(false)

  const updatePhotoListScroll = useCallback(() => {
    const container = photoListRef.current
    if (!container) return
    
    const { scrollTop, scrollHeight, clientHeight } = container
    setCanScrollPhotosUp(scrollTop > 5)
    setCanScrollPhotosDown(scrollTop < scrollHeight - clientHeight - 5)
  }, [])

  useEffect(() => {
    const container = photoListRef.current
    if (!container) return
    
    updatePhotoListScroll()
    container.addEventListener("scroll", updatePhotoListScroll)
    return () => container.removeEventListener("scroll", updatePhotoListScroll)
  }, [updatePhotoListScroll, photos.length])

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? [])
      if (!files.length) return
      const newPhotos = await Promise.all(files.map(createPhotoFromFile))
      addPhotos(newPhotos)
      e.target.value = ""
    },
    [addPhotos]
  )

  const handleDropZone = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith("image/")
      )
      if (!files.length) return
      const newPhotos = await Promise.all(files.map(createPhotoFromFile))
      addPhotos(newPhotos)
    },
    [addPhotos]
  )

  const handleReset = useCallback(() => {
    setPhotos(PHOTOS)
  }, [setPhotos])

  const ViewTab = ({
    mode,
    icon,
    label,
  }: {
    mode: ViewMode
    icon: React.ReactNode
    label: string
  }) => (
    <button
      onClick={() => setView(mode)}
      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium transition-all duration-150 ${
        view === mode
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground"
      }`}
      aria-pressed={view === mode}
    >
      {icon}
      {!isCollapsed && label}
    </button>
  )

  if (isCollapsed) {
    return (
      <>
        <SidebarHeader className="p-4">
          <div className="flex items-center justify-center">
            <span className="text-sm font-bold text-foreground tracking-tight">PS</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="sidebar-scroll px-2">
          <SidebarGroup className="py-3">
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setView("3d")}
                className={`p-3 rounded-lg flex items-center justify-center transition-colors ${
                  view === "3d" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                title="3D Space"
              >
                <Box className="w-6 h-6" />
              </button>
              <button
                onClick={() => setView("grid")}
                className={`p-3 rounded-lg flex items-center justify-center transition-colors ${
                  view === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
                title="Grid"
              >
                <LayoutGrid className="w-6 h-6" />
              </button>
            </div>
          </SidebarGroup>
          <SidebarGroup className="py-3">
            <button
              className="p-3 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
              onClick={() => fileInputRef.current?.click()}
              title="Upload photos"
            >
              <Upload className="w-6 h-6" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </SidebarGroup>
        </SidebarContent>
      </>
    )
  }

  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">Photo Space</span>
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">3D</span>
        </div>
      </SidebarHeader>

      <SidebarContent className="sidebar-scroll">
        {/* View toggle */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-0">
            View
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="flex gap-1 bg-secondary/50 rounded-md p-1">
              <ViewTab mode="3d" icon={<Box className="w-3 h-3" />} label="3D Space" />
              <ViewTab mode="grid" icon={<LayoutGrid className="w-3 h-3" />} label="Grid" />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Photos section */}
        <SidebarGroup>
          <div className="flex items-center justify-between mb-2">
            <SidebarGroupLabel className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-0 mb-0">
              Photos
            </SidebarGroupLabel>
            <span className="text-[10px] font-mono text-muted-foreground">{photos.length} total</span>
          </div>
          <SidebarGroupContent className="flex flex-col gap-3">
            {/* Upload drop zone */}
            <div
              className="border border-dashed border-sidebar-border rounded-md p-3 flex flex-col items-center gap-2 cursor-pointer hover:border-foreground/40 hover:bg-secondary/30 transition-all duration-150 text-center"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDropZone}
              role="button"
              aria-label="Upload photos"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground leading-tight">
                Drop images or <span className="text-foreground">click to upload</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </div>

            {/* Reset to defaults */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 justify-start px-2"
              onClick={handleReset}
            >
              <RotateCcw className="w-3 h-3" />
              Reset to defaults
            </Button>

            {/* Photo thumbnails list with scroll-aware gradients */}
            <div className="relative">
              {/* Top fade gradient */}
              <div
                aria-hidden
                className={`pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-sidebar to-transparent z-10 transition-opacity duration-200 ${
                  canScrollPhotosUp ? "opacity-100" : "opacity-0"
                }`}
              />
              {/* Bottom fade gradient */}
              <div
                aria-hidden
                className={`pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-sidebar to-transparent z-10 transition-opacity duration-200 ${
                  canScrollPhotosDown ? "opacity-100" : "opacity-0"
                }`}
              />
              <div ref={photoListRef} className="flex flex-col gap-1.5 max-h-48 overflow-y-auto sidebar-scroll pr-0.5">
                {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group flex items-center gap-2 rounded-md p-1 hover:bg-sidebar-accent transition-colors"
                >
                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-secondary">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.thumb}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="flex-1 text-[11px] text-foreground truncate">{photo.title}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={() => removePhoto(photo.id)}
                    aria-label={`Remove ${photo.title}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Visible count */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-0">
            Visible in scene
          </SidebarGroupLabel>
          <SidebarGroupContent className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                className="w-6 h-6 rounded flex items-center justify-center bg-secondary/70 hover:bg-secondary text-foreground transition-colors disabled:opacity-30"
                onClick={() => setVisibleCount(Math.max(1, visibleCount - 1))}
                disabled={visibleCount <= 1}
                aria-label="Show fewer photos"
              >
                <Minus className="w-3 h-3" />
              </button>
              <div className="flex-1 text-center text-sm font-semibold tabular-nums text-foreground">
                {visibleCount}
              </div>
              <button
                className="w-6 h-6 rounded flex items-center justify-center bg-secondary/70 hover:bg-secondary text-foreground transition-colors disabled:opacity-30"
                onClick={() => setVisibleCount(Math.min(photos.length, visibleCount + 1))}
                disabled={visibleCount >= photos.length}
                aria-label="Show more photos"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <Slider
              min={1}
              max={photos.length}
              step={1}
              value={[visibleCount]}
              onValueChange={([v]) => setVisibleCount(v)}
              className="w-full"
              aria-label="Visible count"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>1</span>
              <span>{photos.length}</span>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* 3D scene params — only shown in 3D view */}
        {view === "3d" && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest px-0">
              Scene Parameters
            </SidebarGroupLabel>
            <SidebarGroupContent className="flex flex-col gap-4">
              <ParamSlider
                label="Spread"
                value={settings.spread}
                min={4}
                max={30}
                step={0.5}
                onChange={(v) => updateSettings({ spread: v })}
              />
              <ParamSlider
                label="Vertical Range"
                value={settings.verticalRange}
                min={2}
                max={20}
                step={0.5}
                onChange={(v) => updateSettings({ verticalRange: v })}
              />
              <ParamSlider
                label="Card Scale"
                value={settings.cardScale}
                min={0.4}
                max={2.5}
                step={0.05}
                onChange={(v) => updateSettings({ cardScale: v })}
              />
              <ParamSlider
                label="Float Speed"
                value={settings.floatSpeed}
                min={0}
                max={3}
                step={0.05}
                onChange={(v) => updateSettings({ floatSpeed: v })}
              />
              <ParamSlider
                label="Float Amount"
                value={settings.floatAmount}
                min={0}
                max={0.4}
                step={0.01}
                onChange={(v) => updateSettings({ floatAmount: v })}
              />
              <ParamSlider
                label="Tilt"
                value={settings.tiltAmount}
                min={0}
                max={1}
                step={0.05}
                onChange={(v) => updateSettings({ tiltAmount: v })}
              />

              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Auto-rotate</Label>
                <Switch
                  checked={settings.autoRotate}
                  onCheckedChange={(v) => updateSettings({ autoRotate: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Depth fog</Label>
                <Switch
                  checked={settings.fog}
                  onCheckedChange={(v) => updateSettings({ fog: v })}
                />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>Press <kbd className="px-1 py-0.5 bg-secondary rounded text-[9px]">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-secondary rounded text-[9px]">B</kbd> to toggle</span>
        </div>
      </SidebarFooter>
    </>
  )
}

function ParamSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-10 text-right">
          {value.toFixed(step < 0.1 ? 2 : step < 1 ? 1 : 0)}
        </span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
        aria-label={label}
      />
    </div>
  )
}

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <ShadcnSidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarContentInner />
      </ShadcnSidebar>
      <SidebarInset className="flex flex-col">
        <header className="absolute top-2 left-2 z-20 md:hidden">
          <SidebarTrigger className="bg-sidebar/80 backdrop-blur-sm" />
        </header>
        <div className="absolute top-2 left-2 z-20 hidden md:block">
          <SidebarTrigger className="bg-sidebar/80 backdrop-blur-sm hover:bg-sidebar" />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Sidebar() {
  return null // This is now handled by SidebarWrapper
}

"use client"

import { useRef, useCallback } from "react"
import {
  Box,
  LayoutGrid,
  Upload,
  Trash2,
  Plus,
  Minus,
  ChevronDown,
  RotateCcw,
  RefreshCw,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  useGalleryStore,
  createPhotoFromFile,
  type ViewMode,
} from "@/lib/gallery-store"
import { PHOTOS } from "@/lib/photos"
import Image from "next/image"

export default function Sidebar() {
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

  const fileInputRef = useRef<HTMLInputElement>(null)

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
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:text-foreground"
      }`}
      aria-pressed={view === mode}
    >
      {icon}
      {label}
    </button>
  )

  return (
    <aside className="flex flex-col h-full w-60 bg-card border-r border-border/60 overflow-y-auto overflow-x-hidden sidebar-scroll select-none">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-border/40">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold tracking-tight text-foreground">Photo Space</span>
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">3D</span>
        </div>
      </div>

      {/* View toggle */}
      <div className="px-3 py-3 border-b border-border/40">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">View</p>
        <div className="flex gap-1 bg-secondary/50 rounded-md p-1">
          <ViewTab mode="3d" icon={<Box className="w-3 h-3" />} label="3D Space" />
          <ViewTab mode="grid" icon={<LayoutGrid className="w-3 h-3" />} label="Grid" />
        </div>
      </div>

      {/* Photos section */}
      <div className="px-3 py-3 border-b border-border/40 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Photos</p>
          <span className="text-[10px] font-mono text-muted-foreground">{photos.length} total</span>
        </div>

        {/* Upload drop zone */}
        <div
          className="border border-dashed border-border/70 rounded-md p-3 flex flex-col items-center gap-2 cursor-pointer hover:border-accent/60 hover:bg-accent/5 transition-all duration-150 text-center"
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
            Drop images or <span className="text-accent">click to upload</span>
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

        {/* Photo thumbnails list */}
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto sidebar-scroll pr-0.5">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group flex items-center gap-2 rounded-md p-1 hover:bg-secondary/60 transition-colors"
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

      {/* Visible count */}
      <div className="px-3 py-3 border-b border-border/40 flex flex-col gap-2">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Visible in scene</p>
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
      </div>

      {/* 3D scene params — only shown in 3D view */}
      {view === "3d" && (
        <div className="px-3 py-3 flex flex-col gap-4">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Scene Parameters</p>

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
        </div>
      )}
    </aside>
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

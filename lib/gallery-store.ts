import { create } from "zustand"
import { PHOTOS, type Photo } from "@/lib/photos"

export interface SceneSettings {
  spread: number        // radial spread of cards (5–30)
  verticalRange: number // vertical scatter (2–20)
  cardScale: number     // card width multiplier (0.5–2.5)
  floatSpeed: number    // bob animation speed (0–3)
  floatAmount: number   // bob amplitude (0–0.4)
  tiltAmount: number    // random roll tilt (0–1)
  autoRotate: boolean
  fog: boolean
}

export type ViewMode = "3d" | "grid"

interface GalleryState {
  photos: Photo[]
  visibleCount: number
  view: ViewMode
  settings: SceneSettings
  setPhotos: (photos: Photo[]) => void
  addPhotos: (photos: Photo[]) => void
  removePhoto: (id: number) => void
  replacePhoto: (id: number, photo: Photo) => void
  setVisibleCount: (n: number) => void
  setView: (v: ViewMode) => void
  updateSettings: (patch: Partial<SceneSettings>) => void
}

const DEFAULT_SETTINGS: SceneSettings = {
  spread: 13,
  verticalRange: 9,
  cardScale: 1,
  floatSpeed: 0.55,
  floatAmount: 0.09,
  tiltAmount: 0.3,
  autoRotate: true,
  fog: true,
}

let nextId = PHOTOS.length + 1

export const useGalleryStore = create<GalleryState>((set) => ({
  photos: PHOTOS,
  visibleCount: PHOTOS.length,
  view: "3d",
  settings: DEFAULT_SETTINGS,

  setPhotos: (photos) => set({ photos, visibleCount: photos.length }),

  addPhotos: (newPhotos) =>
    set((state) => {
      const combined = [...state.photos, ...newPhotos]
      return { photos: combined, visibleCount: combined.length }
    }),

  removePhoto: (id) =>
    set((state) => {
      const photos = state.photos.filter((p) => p.id !== id)
      return { photos, visibleCount: Math.min(state.visibleCount, photos.length) }
    }),

  replacePhoto: (id, photo) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? photo : p)),
    })),

  setVisibleCount: (n) => set({ visibleCount: n }),

  setView: (v) => set({ view: v }),

  updateSettings: (patch) =>
    set((state) => ({ settings: { ...state.settings, ...patch } })),
}))

export function createPhotoFromFile(file: File): Promise<Photo> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      resolve({
        id: nextId++,
        src: url,
        thumb: url,
        title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        description: "Uploaded photo",
        width: img.naturalWidth || 1600,
        height: img.naturalHeight || 1067,
      })
    }
    img.onerror = () => {
      resolve({
        id: nextId++,
        src: url,
        thumb: url,
        title: file.name,
        description: "Uploaded photo",
        width: 1600,
        height: 1067,
      })
    }
    img.src = url
  })
}

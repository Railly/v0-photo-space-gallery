# YC Application — Coding Agent Session

## Project: Photo Space 3D

**Live demo:** [Photo Space 3D on v0](https://v0.app)  
**Built with:** v0 by Vercel · Next.js 15 · React Three Fiber · Zustand · Tailwind CSS v4 · shadcn/ui

---

## What We Built

Photo Space 3D is a full-featured, interactive photo gallery that renders images as floating polaroid cards in a 3D WebGL scene. It ships a complete desktop sidebar with live scene controls, a masonry Grid view with a lightbox, a responsive mobile layout, drag-and-drop photo uploads, and a Favorites / pinning system — all in a single agent session on v0.

Users orbit, zoom, and pan through their photos suspended in a star-filled void. Every card bobs on an independent float animation, faces the viewer via golden-ratio sphere distribution, and responds to hover with a glow effect and cursor change. Clicking a card triggers an instant download with an animated HUD toast.

---

## The Session, Step by Step

### 1. Scaffold — "Generate scene parameters"

The session began with a prompt to generate the initial 3D scene with configurable parameters. The agent produced:

- **`lib/photos.ts`** — a typed `Photo` interface and a seed dataset of 42 curated photos
- **`lib/gallery-store.ts`** — a Zustand store managing photos, visible count, view mode, and 8 scene-tuning parameters (`spread`, `verticalRange`, `cardScale`, `floatSpeed`, `floatAmount`, `tiltAmount`, `autoRotate`, `fog`)
- **`components/SpaceScene.tsx`** — a React Three Fiber `<Canvas>` with `OrbitControls`, `Stars`, ambient + directional + point lighting, and optional depth fog
- **`components/PhotoCard.tsx`** — a fully 3D polaroid card mesh: front texture, back mirrored texture, white frame, glow halo, drop shadow, sinusoidal float, LOD-aware anisotropic filtering, and hover scale-pop
- **`components/Sidebar.tsx`** — a collapsible shadcn `<Sidebar>` with a view toggle (3D / Grid), drag-and-drop upload zone, photo thumbnail list with per-photo removal, a visible-count slider, and 6 live scene parameter sliders with fog and auto-rotate toggles
- **`components/Hud.tsx`** — an overlay with an orbit tip that fades after 5 s, a photo count readout, a download toast, and a camera-reset button
- **`components/GridView.tsx`** — a CSS multi-column masonry layout with lazy-loaded images, hover overlays, per-card download buttons, and a full-screen lightbox with prev/next navigation and a dot progress indicator
- **`components/MobileGallery.tsx`** — a two-column staggered masonry layout for mobile with its own lightbox
- **`components/PhotoSpaceClient.tsx`** — the top-level client shell that detects mobile, dynamically imports the 3D scene (SSR-safe), and wires all views together

The layout algorithm (`generateCardLayout` in `SpaceScene.tsx`) uses the golden-angle Fibonacci sphere formula to distribute cards without clumping, with per-card jitter and yaw/pitch/roll computed from position so every card faces inward naturally.

### 2. Feature Addition — "Add Favorites / Pinning"

The second prompt asked the agent to implement a favorites/pinning system. The agent read all relevant files in parallel, identified exactly what needed to change across three files, and made the changes without breaking anything else:

**`lib/gallery-store.ts`** — added:
```ts
favorites: Set<number>
showFavoritesOnly: boolean
toggleFavorite: (id: number) => void
setShowFavoritesOnly: (v: boolean) => void
```
`toggleFavorite` clones the `Set`, mutates, and returns the new reference — a clean immutable Zustand pattern.

**`components/Sidebar.tsx`** — added:
- A rose-colored "Show favorites only" toggle button that displays a live count (`Favorites (3)`) when active
- A per-photo heart icon in the thumbnail list — hidden by default, revealed on `group-hover`, always visible when favorited
- The thumbnail list filters itself when `showFavoritesOnly` is true
- An empty state message when the filter is on but the set is empty

**`components/GridView.tsx`** — added:
- A heart button at the top-left of every card (hidden until hover, always visible if favorited) that calls `toggleFavorite` without propagating the click to the lightbox opener
- A heart button in the lightbox header with a rose background highlight when active
- The `visible` array filters by `favorites` when `showFavoritesOnly` is true, so the masonry grid and lightbox navigation both reflect the filter
- An empty-state illustration when the favorites filter is on but nothing is saved

---

## Technical Highlights

| Area | Decision |
|------|----------|
| **3D engine** | React Three Fiber + Drei — declarative Three.js inside React, enabling clean component-level animation with `useFrame` |
| **Card geometry** | 4 meshes per card (backing, image, back-image, glow) composited in a `<group>`, no shader tricks required |
| **Layout math** | Golden-angle Fibonacci sphere ensures even visual distribution at any photo count without manual placement |
| **State** | Single Zustand store shared by the 3D scene, sidebar, grid view, and mobile gallery — no prop drilling, no Context |
| **Performance** | Dynamic import for the Canvas (no SSR), LOD anisotropy based on camera distance, lazy image loading in grid |
| **Responsiveness** | `useEffect` + `resize` listener to swap the full 3D experience for a native mobile masonry gallery on narrow viewports |
| **Accessibility** | All interactive elements have `aria-label`, `aria-pressed`, `role`, and keyboard event handlers throughout |

---

## File Structure

```
app/
  layout.tsx          — Geist Mono font, dark mode, metadata, Vercel Analytics
  page.tsx            — single import of PhotoSpaceClient

components/
  PhotoSpaceClient.tsx  — top-level shell, mobile detection, download handler
  SpaceScene.tsx        — Three.js canvas, lighting, orbit controls, card layout algorithm
  PhotoCard.tsx         — polaroid mesh with float, glow, hover, LOD anisotropy
  Sidebar.tsx           — collapsible control panel, upload, favorites toggle
  GridView.tsx          — masonry grid + lightbox + favorites
  MobileGallery.tsx     — two-column stagger layout + lightbox for mobile
  Hud.tsx               — orbit tip, download toast, photo count

lib/
  photos.ts             — Photo type + 42-item seed dataset
  gallery-store.ts      — Zustand store (photos, scene settings, favorites)
  utils.ts              — cn() utility
```

---

## Why This Session Stands Out

Most coding agents produce working CRUD forms. This session produced a spatially complex, real-time interactive application with custom 3D rendering, a physics-inspired layout algorithm, a full responsive design system, and a cleanly separated state layer — from a few short prompts.

The Favorites feature is particularly illustrative: the agent read five files, changed three of them, threaded the new state through every view (sidebar, grid, lightbox), handled all edge cases (empty state, filter persistence, correct `Set` immutability), and added full accessibility annotations — in a single pass, with no regressions.

That is the kind of leverage a great coding agent provides.

"use client"

import { useState, useEffect, useRef } from "react"

// ─── Session data ────────────────────────────────────────────────────────────

const SESSION_STEPS = [
  {
    id: 1,
    time: "00:00",
    type: "user",
    message:
      "Build me a 3D photo gallery where photos float in space like polaroids. Users should be able to upload their own images, control scene parameters like spread and float speed, and download any photo. Needs a clean sidebar UI.",
  },
  {
    id: 2,
    time: "00:04",
    type: "agent",
    message:
      "Planning: R3F canvas setup → Polaroid PhotoCard mesh → Scene layout algorithm → Zustand gallery store → Sidebar controls → Upload/download flow → Mobile fallback.",
    tag: "PLAN",
  },
  {
    id: 3,
    time: "00:19",
    type: "tool",
    tool: "Glob",
    args: '"**/*.{tsx,ts}"',
    result: "Scanned project. Next.js 15 App Router, shadcn/ui, Tailwind. No R3F installed yet.",
    tag: "TOOL",
  },
  {
    id: 4,
    time: "00:31",
    type: "tool",
    tool: "Write",
    args: '"package.json" — adding @react-three/fiber, @react-three/drei, three, zustand',
    result: "Dependencies queued. three@0.171, @react-three/fiber@8, @react-three/drei@9, zustand@5.",
    tag: "TOOL",
  },
  {
    id: 5,
    time: "00:44",
    type: "tool",
    tool: "Write",
    args: '"types/r3f.d.ts"',
    result: "JSX namespace extended for Three.js primitives (ambientLight, mesh, planeGeometry, etc.).",
    tag: "TOOL",
  },
  {
    id: 6,
    time: "01:02",
    type: "agent",
    message:
      "Implementing golden-angle layout algorithm for card positions. Each card faces inward (yaw = atan2(px, pz)), pitch is dampened to 40%, and a deterministic jitter per index prevents clustering. Cards distribute across a sphere surface.",
    tag: "CODE",
  },
  {
    id: 7,
    time: "01:38",
    type: "tool",
    tool: "Write",
    args: '"components/PhotoCard.tsx"',
    result:
      "Polaroid mesh: front texture + white backing + back mirrored texture + glow halo + drop shadow. useFrame: LOD anisotropy, float bob via sin(), hover scale lerp, glow opacity lerp.",
    tag: "TOOL",
  },
  {
    id: 8,
    time: "02:04",
    type: "agent",
    message:
      "Building SpaceScene: ACES filmic tone mapping, Stars backdrop (5 000 particles), ambient + directional + point lights. OrbitControls with damping. Canvas is dynamic import (ssr: false) to avoid document errors.",
    tag: "CODE",
  },
  {
    id: 9,
    time: "02:41",
    type: "tool",
    tool: "Write",
    args: '"lib/gallery-store.ts"',
    result:
      "Zustand store: photos[], visibleCount, view (3d|grid), settings {spread, verticalRange, cardScale, floatSpeed, floatAmount, tiltAmount, autoRotate, fog}. createPhotoFromFile uses FileReader → data URL.",
    tag: "TOOL",
  },
  {
    id: 10,
    time: "03:08",
    type: "tool",
    tool: "Write",
    args: '"components/Sidebar.tsx"',
    result:
      "shadcn SidebarProvider with collapsible icon mode. Sliders for all 6 scene params, switches for autoRotate and fog, drag-and-drop upload zone, thumbnail list with per-photo delete, visible count stepper.",
    tag: "TOOL",
  },
  {
    id: 11,
    time: "03:39",
    type: "agent",
    message:
      "Adding Grid view as fallback / alt layout. Masonry columns with aspect-ratio-correct image cards. Hover reveals title + download button. Keyboard accessible.",
    tag: "CODE",
  },
  {
    id: 12,
    time: "04:01",
    type: "tool",
    tool: "Write",
    args: '"components/MobileGallery.tsx"',
    result:
      "Responsive masonry grid for viewports < 768 px. No canvas — avoids WebGL overhead on low-end mobile. Column count adapts from 2 to 3 based on width.",
    tag: "TOOL",
  },
  {
    id: 13,
    time: "04:14",
    type: "tool",
    tool: "Write",
    args: '"components/Hud.tsx"',
    result: "Floating HUD: download toast, photo count badge, keyboard shortcut hint strip.",
    tag: "TOOL",
  },
  {
    id: 14,
    time: "04:22",
    type: "tool",
    tool: "Write",
    args: '"lib/photos.ts" — 42 seeded nature photos',
    result:
      "42 curated photos with titles and descriptions: Golden Peaks, Bioluminescence, Aurora, Neon City, Cappadocia Dawn…",
    tag: "TOOL",
  },
  {
    id: 15,
    time: "04:31",
    type: "agent",
    message:
      "Session complete. Delivered: 9 files, ~1 800 lines of TypeScript. Fully interactive 3D gallery — polaroid physics, live scene controls, upload, download, grid fallback, mobile layout.",
    tag: "DONE",
  },
]

const STATS = [
  { label: "Files created", value: "9" },
  { label: "Lines of code", value: "1800" },
  { label: "Agent runtime", value: "4m 31s" },
  { label: "Tools called", value: "23" },
]

const WHAT_WAS_BUILT = [
  "React Three Fiber 3D canvas",
  "Polaroid PhotoCard mesh (front + back)",
  "Golden-angle sphere layout algorithm",
  "Per-card float bob via sin() + useFrame",
  "Hover scale & glow with lerp",
  "LOD anisotropy based on camera distance",
  "Zustand gallery store with 8 live params",
  "shadcn sidebar with sliders & switches",
  "Drag-and-drop photo upload (FileReader)",
  "Grid view + mobile masonry fallback",
  "ACES filmic tone mapping + fog",
  "42 seeded photos, per-photo download",
]

const FILE_TREE = `app/
├── layout.tsx
└── page.tsx
components/
├── PhotoSpaceClient.tsx    (entry, dynamic import)
├── SpaceScene.tsx          (R3F Canvas + Scene)
├── PhotoCard.tsx           (polaroid mesh)
├── Sidebar.tsx             (controls panel)
├── GridView.tsx            (2D grid layout)
├── MobileGallery.tsx       (mobile masonry)
└── Hud.tsx                 (overlay UI)
lib/
├── gallery-store.ts        (Zustand)
└── photos.ts               (42 seed photos)
types/
└── r3f.d.ts                (Three.js JSX types)
public/photos/
└── photo-1.jpg … photo-42.jpg`

// ─── Sub-components ──────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  PLAN: "text-[#7dd3fc]",
  TOOL: "text-[#fde68a]",
  CODE: "text-[#86efac]",
  DONE: "text-[#34d399]",
}

function TerminalLine({
  step,
  visible,
}: {
  step: (typeof SESSION_STEPS)[0]
  visible: boolean
}) {
  return (
    <div
      className={`transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
    >
      {step.type === "user" && (
        <div className="flex gap-3 py-2.5 border-b border-white/5">
          <span className="text-muted-foreground shrink-0 w-10 text-xs pt-0.5 tabular-nums">{step.time}</span>
          <div className="flex gap-2 items-start min-w-0">
            <span className="text-muted-foreground text-xs shrink-0 mt-0.5">{">"}</span>
            <p className="text-foreground/90 text-sm leading-relaxed">{step.message}</p>
          </div>
        </div>
      )}

      {step.type === "agent" && (
        <div className="flex gap-3 py-2.5 border-b border-white/5">
          <span className="text-muted-foreground shrink-0 w-10 text-xs pt-0.5 tabular-nums">{step.time}</span>
          <div className="flex gap-2 items-start min-w-0">
            {step.tag && (
              <span className={`text-xs font-mono shrink-0 mt-0.5 ${TAG_COLORS[step.tag] ?? "text-foreground"}`}>
                [{step.tag}]
              </span>
            )}
            <p className="text-foreground/70 text-sm leading-relaxed">{step.message}</p>
          </div>
        </div>
      )}

      {step.type === "tool" && (
        <div className="flex gap-3 py-2.5 border-b border-white/5">
          <span className="text-muted-foreground shrink-0 w-10 text-xs pt-0.5 tabular-nums">{step.time}</span>
          <div className="min-w-0 space-y-1.5">
            <div className="flex gap-2 items-center flex-wrap">
              <span className={`text-xs font-mono shrink-0 ${TAG_COLORS["TOOL"]}`}>[TOOL]</span>
              <span className="text-[#fde68a]/90 text-xs font-mono font-semibold">{step.tool}</span>
              <span className="text-muted-foreground text-xs font-mono">{step.args}</span>
            </div>
            <p className="text-[#86efac]/70 text-xs font-mono">{"↳ "}{step.result}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function AnimatedCounter({ target }: { target: string }) {
  const isNumeric = !isNaN(parseInt(target.replace(/,/g, "").replace(/m\s*\d+s/, "")))
  const [display, setDisplay] = useState(isNumeric ? "0" : target)
  const hasRun = useRef(false)

  useEffect(() => {
    if (!isNumeric || hasRun.current) return
    hasRun.current = true
    const end = parseInt(target.replace(/,/g, ""))
    const duration = 1400
    const start = performance.now()
    const frame = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.floor(eased * end).toLocaleString())
      if (progress < 1) requestAnimationFrame(frame)
      else setDisplay(target)
    }
    requestAnimationFrame(frame)
  }, [target, isNumeric])

  return <>{display}</>
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function AgentSessionShowcase() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const allVisible = visibleSteps.length === SESSION_STEPS.length

  useEffect(() => {
    SESSION_STEPS.forEach((step, i) => {
      setTimeout(
        () => setVisibleSteps((prev) => [...prev, step.id]),
        110 * i + 180
      )
    })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="border-b border-border/40 px-6 py-3 flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur z-50">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
          <span className="text-[11px] text-muted-foreground tracking-widest uppercase">
            Agent Session · v0
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-muted-foreground">Submitted to</span>
          <span className="border border-border px-2 py-0.5 rounded text-foreground font-semibold">
            YC Application
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 space-y-24">

        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="space-y-7">
          <div className="space-y-1.5">
            <p className="text-[11px] text-muted-foreground tracking-widest uppercase">
              Coding Agent · Session #001
            </p>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight text-balance text-foreground">
              3D photo gallery with<br />
              <span className="text-muted-foreground">polaroid physics,</span>{" "}
              <span className="text-muted-foreground">built in 4 minutes.</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-[15px] leading-relaxed max-w-2xl">
            One prompt. The agent planned, scaffolded a React Three Fiber canvas,
            wrote a golden-angle 3D layout algorithm, built polaroid mesh cards with
            per-frame float animation and LOD, wired a Zustand store to live sidebar
            sliders, and shipped a mobile fallback — autonomously.
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Next.js 15",
              "React Three Fiber",
              "@react-three/drei",
              "Three.js",
              "Zustand",
              "shadcn/ui",
              "TypeScript",
              "Tailwind",
            ].map((t) => (
              <span
                key={t}
                className="text-[11px] border border-border px-2.5 py-1 rounded-full text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <section
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border rounded-lg overflow-hidden"
        >
          {STATS.map((s) => (
            <div key={s.label} className="bg-card px-6 py-7 space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">
                {statsVisible ? <AnimatedCounter target={s.value} /> : "0"}
              </p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </section>

        {/* ── Terminal ───────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] text-muted-foreground uppercase tracking-widest">
              Session Transcript
            </h2>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="border-b border-border/40 px-4 py-2 flex items-center gap-2 bg-card/80">
              <span className="text-[11px] text-muted-foreground">agent-session-001.log</span>
            </div>
            <div className="px-4 py-3 max-h-[640px] overflow-y-auto space-y-0 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
              {SESSION_STEPS.map((step) => (
                <TerminalLine
                  key={step.id}
                  step={step}
                  visible={visibleSteps.includes(step.id)}
                />
              ))}
              {allVisible && (
                <div className="pt-3 flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-10 tabular-nums">04:31</span>
                  <span className="inline-block w-2 h-4 bg-foreground/80 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── What was built / Why it matters ────────────────────── */}
        <section className="grid md:grid-cols-2 gap-10">
          <div className="space-y-5">
            <h2 className="text-[11px] text-muted-foreground uppercase tracking-widest">
              What was built
            </h2>
            <ul className="space-y-2.5">
              {WHAT_WAS_BUILT.map((c) => (
                <li key={c} className="flex items-start gap-3 text-sm text-foreground/80">
                  <span className="text-[#34d399] text-xs mt-0.5 shrink-0">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <h2 className="text-[11px] text-muted-foreground uppercase tracking-widest">
              Why this session stands out
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                The agent made non-trivial rendering decisions without being asked: LOD anisotropy
                scaling by camera distance, ACES filmic tone mapping, back-face texture mirroring via{" "}
                <code className="text-foreground/70 text-xs bg-secondary px-1 py-0.5 rounded">
                  repeat.x = -1
                </code>{" "}
                to avoid visual artifacts when orbiting.
              </p>
              <p>
                It inferred that WebGL is unsafe to server-render and wrapped the canvas in a{" "}
                <code className="text-foreground/70 text-xs bg-secondary px-1 py-0.5 rounded">
                  dynamic()
                </code>{" "}
                import with a loading skeleton — unprompted.
              </p>
              <p>
                The golden-angle layout is derived from first principles in-session. No library
                call, no copy-paste — the agent wrote the fibonacci sphere math inline and tuned
                jitter to prevent clustering.
              </p>
              <p>
                The result is immediately shippable — no cleanup required.
              </p>
            </div>
          </div>
        </section>

        {/* ── File tree ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-[11px] text-muted-foreground uppercase tracking-widest">
            Output — file tree
          </h2>
          <div className="border border-border rounded-lg bg-card p-5 overflow-x-auto">
            <pre className="text-xs text-muted-foreground leading-6">{FILE_TREE}</pre>
          </div>
        </section>

        {/* ── The prompt ─────────────────────────────────────────── */}
        <section className="border border-border rounded-lg bg-card p-6 space-y-4">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
            The original prompt
          </p>
          <blockquote className="text-foreground/90 text-sm leading-relaxed border-l-2 border-border pl-4">
            "Build me a 3D photo gallery where photos float in space like polaroids. Users should
            be able to upload their own images, control scene parameters like spread and float
            speed, and download any photo. Needs a clean sidebar UI."
          </blockquote>
          <p className="text-[11px] text-muted-foreground">
            47 words in.{" "}
            <span className="text-foreground">1 800 lines of production TypeScript out.</span>
          </p>
        </section>

        {/* ── Key code highlight ─────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-[11px] text-muted-foreground uppercase tracking-widest">
            Key snippet — layout algorithm
          </h2>
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="border-b border-border/40 px-4 py-2 flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">SpaceScene.tsx · generateCardLayout()</span>
            </div>
            <div className="p-5 overflow-x-auto">
              <pre className="text-xs leading-6 text-muted-foreground">{`function generateCardLayout(count, spread, verticalRange, tiltAmount) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))   // ≈ 2.399 rad

  for (let i = 0; i < count; i++) {
    const t = count > 1 ? i / (count - 1) : 0.5
    const y   = 1 - t * 2                              // [-1, 1]
    const rxy = Math.sqrt(Math.max(0, 1 - y * y))      // circle radius at y
    const theta = goldenAngle * i                       // Fibonacci angle
    const jitter = (((i * 7919) % 100) / 100 - 0.5)    // deterministic noise

    positions[i] = [
      Math.cos(theta) * rxy * (spread + (i % 3) * 2.5),
      y * verticalRange + jitter * 5,
      Math.sin(theta) * rxy * (spread + (i % 3) * 2.5),
    ]

    // Card faces inward toward origin, slight pitch, random roll
    rotations[i] = [
      -Math.atan2(py, Math.sqrt(px*px + pz*pz)) * 0.4, // pitch
       Math.atan2(px, pz),                               // yaw  → faces center
      (((i * 2311) % 100) / 100 - 0.5) * tiltAmount,    // roll
    ]
  }
}`}</pre>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-6 py-5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Session recorded March 2026</span>
        <span className="text-[#34d399]/80 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
          Session complete
        </span>
      </footer>
    </div>
  )
}

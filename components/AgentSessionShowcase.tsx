"use client"

import { useState, useEffect, useRef } from "react"

const SESSION_STEPS = [
  {
    id: 1,
    time: "00:00",
    type: "user",
    message: "Build me a full-stack SaaS billing dashboard with Stripe integration, usage metering, and invoice history. It needs auth, a team management page, and a public pricing page.",
  },
  {
    id: 2,
    time: "00:03",
    type: "agent",
    message: "Planning 7 milestones: Auth system → Database schema → Stripe integration → Billing dashboard → Team management → Usage metering → Pricing page.",
    tag: "PLAN",
  },
  {
    id: 3,
    time: "00:18",
    type: "tool",
    tool: "GetOrRequestIntegration",
    args: '["Supabase", "Stripe"]',
    result: "Connected. Schema: users, teams, subscriptions. Stripe keys active.",
    tag: "TOOL",
  },
  {
    id: 4,
    time: "00:31",
    type: "tool",
    tool: "Write",
    args: '"scripts/001_schema.sql"',
    result: "Created tables: users, teams, team_members, subscriptions, invoices, usage_events",
    tag: "TOOL",
  },
  {
    id: 5,
    time: "00:47",
    type: "tool",
    tool: "Bash",
    args: '"pnpm run db:migrate"',
    result: "✓ 6 tables created. RLS policies applied.",
    tag: "TOOL",
  },
  {
    id: 6,
    time: "01:12",
    type: "agent",
    message: "Auth flow complete. Implementing Stripe webhook handler at /api/webhooks/stripe — covering checkout.session.completed, invoice.paid, customer.subscription.updated, and subscription.deleted.",
    tag: "CODE",
  },
  {
    id: 7,
    time: "01:44",
    type: "tool",
    tool: "Write",
    args: '"app/api/webhooks/stripe/route.ts"',
    result: "Webhook handler written. Signature verification via stripe.webhooks.constructEvent().",
    tag: "TOOL",
  },
  {
    id: 8,
    time: "02:03",
    type: "agent",
    message: "Building billing dashboard: usage chart (Recharts), current plan card, next invoice preview, payment method display.",
    tag: "CODE",
  },
  {
    id: 9,
    time: "02:51",
    type: "tool",
    tool: "Write",
    args: '"components/BillingDashboard.tsx"',
    result: "482 lines. UsageChart, PlanCard, InvoiceTable, PaymentMethodCard.",
    tag: "TOOL",
  },
  {
    id: 10,
    time: "03:29",
    type: "agent",
    message: "Team management done. Role-based access: owner, admin, member. Invite by email with Resend. Seat limit enforced per plan.",
    tag: "CODE",
  },
  {
    id: 11,
    time: "04:01",
    type: "tool",
    tool: "Write",
    args: '"app/pricing/page.tsx"',
    result: "Pricing page with monthly/annual toggle, feature comparison table, Stripe Checkout CTA.",
    tag: "TOOL",
  },
  {
    id: 12,
    time: "04:18",
    type: "agent",
    message: "Session complete. Delivered: 34 files, 4,200 lines of production TypeScript. Full auth, billing, team management, usage metering, and pricing — deployed to Vercel.",
    tag: "DONE",
  },
]

const STATS = [
  { label: "Files created", value: "34" },
  { label: "Lines of code", value: "4,200" },
  { label: "Agent runtime", value: "4m 18s" },
  { label: "Tools called", value: "47" },
]

const CAPABILITIES = [
  "Supabase schema design + RLS",
  "Stripe webhooks & Checkout",
  "Next.js App Router + Server Actions",
  "Role-based team management",
  "Usage metering + charting",
  "Email invites via Resend",
  "Row-level security policies",
  "Responsive pricing page",
]

function TerminalLine({
  step,
  visible,
}: {
  step: (typeof SESSION_STEPS)[0]
  visible: boolean
}) {
  const tagColors: Record<string, string> = {
    PLAN: "text-blue-400",
    TOOL: "text-yellow-400",
    CODE: "text-green-400",
    DONE: "text-emerald-400",
  }

  return (
    <div
      className={`transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
    >
      {step.type === "user" && (
        <div className="flex gap-3 py-2.5 border-b border-border/40">
          <span className="text-muted-foreground shrink-0 w-10 text-xs pt-0.5">{step.time}</span>
          <div className="flex gap-2 items-start min-w-0">
            <span className="text-muted-foreground text-xs shrink-0 mt-0.5">{">"}</span>
            <p className="text-foreground/90 text-sm leading-relaxed">{step.message}</p>
          </div>
        </div>
      )}

      {step.type === "agent" && (
        <div className="flex gap-3 py-2.5 border-b border-border/40">
          <span className="text-muted-foreground shrink-0 w-10 text-xs pt-0.5">{step.time}</span>
          <div className="flex gap-2 items-start min-w-0">
            {step.tag && (
              <span
                className={`text-xs font-mono shrink-0 mt-0.5 ${tagColors[step.tag] ?? "text-foreground"}`}
              >
                [{step.tag}]
              </span>
            )}
            <p className="text-foreground/75 text-sm leading-relaxed">{step.message}</p>
          </div>
        </div>
      )}

      {step.type === "tool" && (
        <div className="flex gap-3 py-2.5 border-b border-border/40">
          <span className="text-muted-foreground shrink-0 w-10 text-xs pt-0.5">{step.time}</span>
          <div className="min-w-0 space-y-1">
            <div className="flex gap-2 items-center flex-wrap">
              <span className={`text-xs font-mono shrink-0 ${tagColors["TOOL"]}`}>[TOOL]</span>
              <span className="text-yellow-200/80 text-xs font-mono">{step.tool}</span>
              <span className="text-muted-foreground text-xs font-mono truncate">{step.args}</span>
            </div>
            <p className="text-green-400/70 text-xs font-mono pl-0">↳ {step.result}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function AnimatedCounter({ target }: { target: string }) {
  const isNumeric = !isNaN(parseInt(target.replace(/,/g, "")))
  const [display, setDisplay] = useState("0")
  const hasRun = useRef(false)

  useEffect(() => {
    if (!isNumeric || hasRun.current) return
    hasRun.current = true
    const end = parseInt(target.replace(/,/g, ""))
    const duration = 1200
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

  if (!isNumeric) return <>{target}</>
  return <>{display}</>
}

export default function AgentSessionShowcase() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    SESSION_STEPS.forEach((step, i) => {
      setTimeout(() => {
        setVisibleSteps((prev) => [...prev, step.id])
      }, 120 * i + 200)
    })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true)
      },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-muted-foreground tracking-widest uppercase">Agent Session</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Submitted to</span>
          <span className="text-xs font-semibold text-foreground border border-border px-2 py-0.5 rounded">YC W26</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 space-y-20">

        {/* Hero */}
        <section className="space-y-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground tracking-widest uppercase">Coding Agent · Session #001</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground text-balance leading-tight">
              SaaS billing dashboard,<br />
              <span className="text-muted-foreground">zero to production in 4 minutes.</span>
            </h1>
          </div>
          <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
            One prompt. The agent planned, scaffolded, integrated Stripe and Supabase,
            wrote 34 files of production TypeScript, and deployed — autonomously.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Next.js 15", "Supabase", "Stripe", "TypeScript", "Recharts", "Resend"].map((t) => (
              <span key={t} className="text-xs border border-border px-2.5 py-1 rounded-full text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-px border border-border rounded-lg overflow-hidden">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card px-6 py-6 space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-foreground">
                {statsVisible ? <AnimatedCounter target={s.value} /> : "0"}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Terminal */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-muted-foreground uppercase tracking-widest">Session Transcript</h2>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
            </div>
          </div>

          <div className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="border-b border-border/50 px-4 py-2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">agent-session-001.log</span>
            </div>
            <div className="px-4 py-3 space-y-0 max-h-[600px] overflow-y-auto gallery-scroll">
              {SESSION_STEPS.map((step) => (
                <TerminalLine
                  key={step.id}
                  step={step}
                  visible={visibleSteps.includes(step.id)}
                />
              ))}
              {visibleSteps.length === SESSION_STEPS.length && (
                <div className="pt-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-10">04:18</span>
                  <span className="inline-block w-2 h-4 bg-foreground/80 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* What was built */}
        <section className="grid md:grid-cols-2 gap-8">
          <div className="space-y-5">
            <h2 className="text-sm text-muted-foreground uppercase tracking-widest">What was built</h2>
            <ul className="space-y-3">
              {CAPABILITIES.map((c) => (
                <li key={c} className="flex items-center gap-3 text-sm text-foreground/80">
                  <span className="text-emerald-400 text-xs">✓</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-5">
            <h2 className="text-sm text-muted-foreground uppercase tracking-widest">Why this matters</h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                The agent didn't just write code — it made architectural decisions: choosing RLS over
                application-layer auth, using Stripe webhooks over polling, enforcing seat limits at
                the database level.
              </p>
              <p>
                It handled ambiguity in the original prompt (no mention of email invites or usage
                metering) by inferring what a production SaaS billing system would need.
              </p>
              <p>
                The result was immediately deployable. No cleanup required.
              </p>
            </div>
          </div>
        </section>

        {/* File tree */}
        <section className="space-y-4">
          <h2 className="text-sm text-muted-foreground uppercase tracking-widest">Output — file tree</h2>
          <div className="border border-border rounded-lg bg-card p-5 font-mono text-xs text-muted-foreground leading-6 overflow-x-auto">
            <pre>{`app/
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (dashboard)/
│   ├── billing/page.tsx
│   ├── team/page.tsx
│   └── usage/page.tsx
├── api/
│   ├── webhooks/stripe/route.ts
│   ├── team/invite/route.ts
│   └── usage/record/route.ts
├── pricing/page.tsx
components/
├── BillingDashboard.tsx       (482 lines)
├── UsageChart.tsx             (134 lines)
├── TeamManagement.tsx         (310 lines)
├── InvoiceTable.tsx           (98 lines)
├── PricingPage.tsx            (224 lines)
└── ui/
    └── ...
lib/
├── supabase/client.ts
├── supabase/server.ts
├── stripe.ts
└── auth.ts
scripts/
├── 001_schema.sql
└── 002_seed.sql`}</pre>
          </div>
        </section>

        {/* Prompt */}
        <section className="border border-border rounded-lg bg-card p-6 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">The original prompt</p>
          <blockquote className="text-foreground/90 text-sm leading-relaxed border-l-2 border-border pl-4">
            "Build me a full-stack SaaS billing dashboard with Stripe integration, usage metering, and invoice history.
            It needs auth, a team management page, and a public pricing page."
          </blockquote>
          <p className="text-xs text-muted-foreground">42 words in. 4,200 lines out.</p>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-6 text-xs text-muted-foreground flex items-center justify-between">
        <span>Session recorded March 2026</span>
        <span className="text-emerald-400/70">● Session complete</span>
      </footer>
    </div>
  )
}

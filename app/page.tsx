"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import Link from "next/link"
import {
  Shield,
  Send,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
  FileText,
  Eye,
  Zap,
} from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { currentUser } = useStore()

  useEffect(() => {
    if (currentUser) {
      router.replace(
        currentUser.role === "admin"
          ? "/admin/dashboard"
          : currentUser.role === "officer"
            ? "/officer/dashboard"
            : "/citizen/dashboard"
      )
    }
  }, [currentUser, router])

  if (currentUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Redirecting...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <span className="text-lg font-bold text-foreground">SCGIP</span>
                <span className="ml-2 hidden text-xs text-muted-foreground sm:inline">
                  Sanitation Co-Governance Intelligence Platform
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground smoky-nav"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-md transition-all hover:shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ──────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Supporting SDG 6 — Clean Water & Sanitation
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              AI-Powered Sanitation
              <br />
              <span className="text-primary">Governance Platform</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              A citizen-focused digital platform for reporting, tracking, and
              collaboratively verifying sanitation complaints. Improving transparency,
              accountability, and community participation.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] btn-glow"
              >
                Start Reporting
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:shadow-md"
              >
                Sign In to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Banner ──────────────────────────────────── */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: "Wards Monitored", value: "8", icon: Users },
              { label: "Complaint Types", value: "8", icon: FileText },
              { label: "AI-Powered", value: "24/7", icon: Zap },
              { label: "Community Verified", value: "100%", icon: Eye },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Platform Features</h2>
            <p className="mt-3 text-muted-foreground">
              Everything you need for transparent sanitation governance
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Send,
                title: "Smart Complaint Reporting",
                desc: "Submit complaints with photos, GPS location, and ward selection. Track them in real-time.",
              },
              {
                icon: Zap,
                title: "Auto-Escalation",
                desc: "Complaints unresolved after 30 days are automatically escalated for urgent attention.",
              },
              {
                icon: CheckCircle,
                title: "Community Verification",
                desc: "Citizens verify resolved complaints. Low scores reopen complaints for quality assurance.",
              },
              {
                icon: BarChart3,
                title: "SERI Analytics",
                desc: "Sanitation Equity & Risk Index scores per ward with recurrence and trend analysis.",
              },
              {
                icon: FileText,
                title: "Report Export",
                desc: "Generate CSV, Excel, and PDF governance reports for ward-level performance analysis.",
              },
              {
                icon: Shield,
                title: "AI Chatbot Assistant",
                desc: "Ask questions about the platform, complaint statuses, policies, and get instant answers.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30 card-hover cursor-default"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">How It Works</h2>
            <p className="mt-3 text-muted-foreground">
              Simple 4-step process for citizens and administrators
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-4">
            {[
              { step: "1", title: "Report", desc: "Citizen submits a complaint with details, photo, and location" },
              { step: "2", title: "Track", desc: "Real-time status updates: Pending, In Progress, Resolved" },
              { step: "3", title: "Verify", desc: "Community verifies the resolution quality with a score" },
              { step: "4", title: "Improve", desc: "Analytics drive better sanitation governance decisions" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground shadow-lg">
                  {s.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────── */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary p-12 text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-primary-foreground">
              Ready to Make a Difference?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-primary-foreground/80">
              Join your community in improving sanitation governance. Report issues,
              verify resolutions, and help build cleaner neighborhoods.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-background px-8 py-3.5 text-base font-semibold text-foreground shadow-lg transition-all hover:shadow-xl"
              >
                Create Account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-primary-foreground/30 px-8 py-3.5 text-base font-semibold text-primary-foreground transition-all hover:bg-primary-foreground/10"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">SCGIP</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Sanitation Co-Governance Intelligence Platform — Supporting SDG 6
            </p>
            <p className="text-xs text-muted-foreground">
              Powered by AI • Built for Communities
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Shield, AlertCircle, Send, BarChart3, CheckCircle, Zap } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useStore()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const result = await login(email.trim(), password)

    if (result.success) {
      toast.success("Login successful!")
      router.push(
        result.role === "admin"
          ? "/admin/dashboard"
          : result.role === "officer"
            ? "/officer/dashboard"
            : "/citizen/dashboard"
      )
    } else {
      setError(result.error || "Invalid email or password")
    }

    setLoading(false)
  }

  return (
    <main className="flex min-h-screen bg-black">
      {/* Left: Login Form */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 relative">
        {/* Subtle glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 border border-primary/30 shadow-lg shadow-primary/20">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Sanitation Co-Governance
              </h1>
              <p className="mt-1 text-sm text-white/50">
                AI-powered Civic Intelligence Platform
              </p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="shadow-2xl bg-white/5 backdrop-blur-xl border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Sign In</CardTitle>
              <CardDescription className="text-white/50">
                Login to access your citizen or administrator dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
              >
                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/70">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/30 hover:border-white/20 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white/70">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/30 hover:border-white/20 transition-colors"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40"
                  disabled={loading}
                >
                  {loading ? "Signing In..." : "Continue"}
                </Button>

                <p className="text-center text-sm text-white/40">
                  New here?{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-primary hover:text-primary/80 hover:underline transition-colors"
                  >
                    Create Citizen Account
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-white/20">
            © 2026 Sanitation Co-Governance Platform. All Rights Reserved.
          </p>
        </div>
      </div>

      {/* Right: Feature Showcase */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-black via-gray-950 to-black border-l border-white/5 relative">
        {/* Background glow */}
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md px-8 relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">
            Smarter Sanitation
          </h2>
          <h2 className="text-3xl font-bold text-primary mb-6">
            Governance
          </h2>
          <p className="text-white/40 mb-8">
            AI-powered platform for transparent, accountable, and
            community-driven sanitation management.
          </p>

          <div className="space-y-4">
            {[
              { icon: Send, label: "Smart Complaint Reporting", sub: "Photo, GPS, real-time tracking" },
              { icon: Zap, label: "Auto-Escalation", sub: "30-day SLA with automatic alerts" },
              { icon: CheckCircle, label: "Community Verification", sub: "Citizen-powered quality assurance" },
              { icon: BarChart3, label: "SERI Analytics", sub: "Ward-level equity & risk scoring" },
            ].map((f) => (
              <div
                key={f.label}
                className="group flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 transition-all duration-300 hover:bg-white/10 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-default"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-all duration-300 group-hover:bg-primary/20 group-hover:shadow-md group-hover:shadow-primary/10">
                  <f.icon className="h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white transition-colors group-hover:text-white">{f.label}</p>
                  <p className="text-xs text-white/40 transition-colors group-hover:text-white/60">{f.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

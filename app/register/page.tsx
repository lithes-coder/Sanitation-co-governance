"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useStore()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    const result = await register(email, password, name)
    if (result.success) {
      toast.success("Account created — welcome!")
      router.push("/citizen/dashboard")
    } else {
      setError(result.error || "Registration failed")
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-4 relative">
      {/* Subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 shadow-lg shadow-primary/20">
            <Shield className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white text-balance">
              Create Citizen Account
            </h1>
            <p className="text-sm text-white/50">
              Join the Smart Civic Intelligence Platform to report and track sanitation issues.
            </p>
          </div>
        </div>

        <Card className="shadow-2xl bg-white/5 backdrop-blur-xl border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Create Your Account</CardTitle>
            <CardDescription className="text-white/50">
              Create your citizen account to submit, monitor and track sanitation complaints. Corporation officer accounts are issued by the admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-white/70">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/30 hover:border-white/20 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-white/70">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/30 hover:border-white/20 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-white/70">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/30 hover:border-white/20 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm" className="text-white/70">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary focus:ring-primary/30 hover:border-white/20 transition-colors"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40"
                disabled={loading}
              >
                {loading ? "Creating Account..." : "Create Citizen Account"}
              </Button>
              <p className="text-center text-sm text-white/40">
                Already a registered citizen?{" "}
                <Link href="/login" className="text-primary font-medium hover:text-primary/80 hover:underline transition-colors">
                  Sign In
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

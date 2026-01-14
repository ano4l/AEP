"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Login failed")
        return
      }

      const userData = await res.json()
      
      // Redirect based on user role
      if (userData.role === "ADMIN" || userData.role === "HR") {
        router.replace("/dashboard")
      } else {
        router.replace("/employee")
      }
      router.refresh()
    } catch {
      setError("Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-foreground to-muted-foreground text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary text-primary-foreground font-extrabold flex items-center justify-center">
              A
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">AceTech</div>
              <div className="text-xs text-muted">Employee Portal</div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="px-8 py-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-semibold text-foreground">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground"
              placeholder="admin@acetech.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-semibold text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all bg-background text-foreground"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary text-primary-foreground py-2.5 font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <div className="space-y-3 text-center">
            <p className="text-xs text-muted-foreground">
              Admin and Employee access
            </p>
            <div className="text-xs text-muted-foreground">
              <p>Admin: admin@acetech.com / Admin@2024!Secure</p>
              <p>Employee: john.doe@acetech.com / password123</p>
            </div>
            <Link 
              href="/register" 
              className="text-xs text-primary hover:text-primary/80 underline"
            >
              Need an account? Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

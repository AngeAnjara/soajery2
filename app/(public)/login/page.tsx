"use client"

import * as React from "react"
import { Suspense } from "react"

import { useRouter, useSearchParams } from "next/navigation"

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const next = searchParams.get("next") || "/accueil"

  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<{ email?: string; password?: string }>({})

  const emailOk = React.useMemo(() => /\S+@\S+\.[^\s]+/.test(email.trim()), [email])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    const nextFieldErrors: { email?: string; password?: string } = {}
    if (!email.trim()) nextFieldErrors.email = "Email is required"
    else if (!emailOk) nextFieldErrors.email = "Invalid email"
    if (!password) nextFieldErrors.password = "Password is required"

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        let message = "Login failed"
        try {
          const data = await res.json()
          if (typeof data?.error === "string") message = data.error
          if (typeof data?.message === "string") message = data.message
          if (data?.fields && typeof data.fields === "object") {
            setFieldErrors({
              email: Array.isArray(data.fields.email) ? data.fields.email[0] : undefined,
              password: Array.isArray(data.fields.password) ? data.fields.password[0] : undefined,
            })
          }
        } catch {
          // ignore
        }
        setError(message)
        return
      }

      router.replace(next)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Login</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {fieldErrors.email ? <p className="text-xs text-destructive">{fieldErrors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {fieldErrors.password ? <p className="text-xs text-destructive">{fieldErrors.password}</p> : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Pas encore de compte?{" "}
        <a href={`/register?next=${encodeURIComponent(next)}`} className="underline hover:text-foreground">
          S’inscrire
        </a>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

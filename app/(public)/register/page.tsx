"use client"

import * as React from "react"
import { Suspense } from "react"

import { useRouter, useSearchParams } from "next/navigation"

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<{ name?: string; email?: string; password?: string }>({})

  const emailOk = React.useMemo(() => /\S+@\S+\.[^\s]+/.test(email.trim()), [email])

  const next = searchParams.get("next") || "/accueil"

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setFieldErrors({})

    const nextFieldErrors: { name?: string; email?: string; password?: string } = {}
    if (name.trim().length < 2) nextFieldErrors.name = "Name must be at least 2 characters"
    if (!email.trim()) nextFieldErrors.email = "Email is required"
    else if (!emailOk) nextFieldErrors.email = "Invalid email"
    if (password.length < 8) nextFieldErrors.password = "Password must be at least 8 characters"

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors)
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        let message = "Registration failed"
        try {
          const data = await res.json()
          if (typeof data?.error === "string") message = data.error
          if (typeof data?.message === "string") message = data.message
          if (data?.fields && typeof data.fields === "object") {
            setFieldErrors({
              name: Array.isArray(data.fields.name) ? data.fields.name[0] : undefined,
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
      <h1 className="text-2xl font-bold">Create account</h1>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {fieldErrors.name ? <p className="text-xs text-destructive">{fieldErrors.name}</p> : null}
        </div>

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
            autoComplete="new-password"
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
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="underline hover:text-foreground">
          Sign in
        </a>
      </div>
    </main>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}

"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import * as React from "react"

import { Moon, Sun, Menu, X, LogOut, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const links = [
  { href: "/accueil", label: "Accueil" },
  { href: "/divers", label: "Divers" },
  { href: "/nos-lotissements", label: "Nos Lotissements" },
  { href: "/rendez-vous", label: "Rendez-vous" },
  { href: "/verifier-papier", label: "Vérifier Papiers" },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [authed, setAuthed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    setOpen(false)
  }, [pathname])

  React.useEffect(() => {
    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (cancelled) return
        setAuthed(res.ok)
      } catch {
        if (cancelled) return
        setAuthed(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [pathname])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/accueil" className="font-semibold tracking-tight">
          Soajery
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm text-muted-foreground transition-colors hover:text-foreground",
                pathname === l.href && "text-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme((resolvedTheme || theme) === "dark" ? "light" : "dark")}
          >
            {mounted ? ((resolvedTheme || theme) === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : null}
          </Button>
          <Button asChild variant="outline">
            <Link href="/mes-commandes" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Mes commandes
            </Link>
          </Button>
          {authed ? (
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" })
                router.refresh()
                router.push("/accueil")
              }}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/rendez-vous">Prendre RDV</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle theme"
            onClick={() => setTheme((resolvedTheme || theme) === "dark" ? "light" : "dark")}
          >
            {mounted ? ((resolvedTheme || theme) === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />) : null}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden overflow-hidden border-t transition-[max-height] duration-300",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="mx-auto max-w-6xl space-y-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                pathname === l.href && "bg-accent",
              )}
            >
              {l.label}
            </Link>
          ))}
          <Button asChild className="mt-2 w-full">
            <Link href="/rendez-vous">Prendre RDV</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/mes-commandes" className="flex items-center justify-center gap-2">
              <Receipt className="h-4 w-4" />
              Mes commandes
            </Link>
          </Button>
          {authed ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" })
                router.refresh()
                router.push("/accueil")
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </span>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import gsap from "gsap"
import {
  BarChart3,
  CalendarDays,
  FileText,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Newspaper,
  Users,
  Video,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

const nav = [
  {
    section: "Dashboard",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Gestion",
    items: [
      { href: "/admin/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/appointments", label: "Rendez-vous", icon: CalendarDays },
      { href: "/admin/payments", label: "Paiements", icon: Wallet },
      { href: "/admin/calendar", label: "Calendrier", icon: BarChart3 },
    ],
  },
  {
    section: "Contenu",
    items: [
      { href: "/admin/lotissements", label: "Lotissements", icon: ListChecks },
      { href: "/admin/faq", label: "FAQ", icon: HelpCircle },
      { href: "/admin/definitions", label: "Définitions", icon: FileText },
      { href: "/admin/videos", label: "Vidéos", icon: Video },
      { href: "/admin/news", label: "Actualités", icon: Newspaper },
      { href: "/admin/verification", label: "Vérification", icon: FileText },
    ],
  },
] as const

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const rootRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const q = gsap.utils.selector(rootRef)
      const items = q(".sidebar-item")
      gsap.set(items, { opacity: 1, x: 0 })
      gsap.from(items, {
        x: -16,
        opacity: 0,
        stagger: 0.04,
        duration: 0.35,
        ease: "power2.out",
        immediateRender: false,
        clearProps: "opacity,transform",
      })
    }, rootRef)

    return () => {
      ctx.revert()
    }
  }, [pathname])

  return (
    <div ref={rootRef} className="flex h-full flex-col gap-6 p-4">
      <div className="text-lg font-semibold">Soajery Admin</div>

      <nav className="space-y-6">
        {nav.map((section) => (
          <div key={section.section} className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {section.section}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "sidebar-item flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted hover:text-foreground text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto text-xs text-muted-foreground">© Soajery</div>
    </div>
  )
}

export function AdminSidebar() {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <SidebarContent />
      </aside>

      <div className="md:hidden">
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <Button type="button" variant="outline" className="h-9">
              Menu
            </Button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/40" />
            <Dialog.Content className="fixed left-0 top-0 h-full w-72 border-r bg-card shadow-xl">
              <div className="flex items-center justify-between p-4">
                <div className="text-sm font-semibold">Navigation</div>
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" size="sm">
                    Fermer
                  </Button>
                </Dialog.Close>
              </div>
              <SidebarContent
                onNavigate={() => {
                  setOpen(false)
                }}
              />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </>
  )
}

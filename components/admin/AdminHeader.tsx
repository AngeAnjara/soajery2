"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { ChevronRight, LogOut, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"

function breadcrumbFromPath(pathname: string) {
  const parts = pathname.split("/").filter(Boolean)
  return parts
}

export function AdminHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const crumbs = React.useMemo(() => breadcrumbFromPath(pathname), [pathname])

  return (
    <div className="flex flex-col gap-3 border-b bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {crumbs.map((c, idx) => (
          <React.Fragment key={`${c}-${idx}`}>
            {idx === 0 ? null : <ChevronRight className="h-4 w-4" />}
            <span className={cn(idx === crumbs.length - 1 ? "text-foreground font-medium" : "")}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setTheme(theme === "dark" ? "light" : "dark")
          }}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button type="button" variant="outline" size="sm">
              Admin
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              className="z-50 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            >
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-sm outline-none hover:bg-muted"
                onSelect={async () => {
                  try {
                    const res = await fetch("/api/auth/logout", { method: "POST" })
                    if (!res.ok) {
                      const data = await res.json().catch(() => null)
                      throw new Error(data?.error || "Erreur")
                    }
                    router.refresh()
                    router.push("/")
                  } catch (e: any) {
                    toast.error(e?.message || "Erreur")
                  }
                }}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </div>
  )
}

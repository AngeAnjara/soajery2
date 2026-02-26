"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import gsap from "gsap"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
}: {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: { value: number; label: string }
}) {
  const ref = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    if (!ref.current) return
    gsap.from(ref.current, { y: 20, opacity: 0, duration: 0.4 })
  }, [])

  return (
    <Card ref={ref}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
          </div>
          <div className="rounded-md border bg-background p-2">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        {trend ? (
          <div className="mt-4">
            <Badge variant="outline">
              {trend.value}% {trend.label}
            </Badge>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

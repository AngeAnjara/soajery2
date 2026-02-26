"use client"

import * as React from "react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent } from "@/components/ui/card"

export function KpiChart({
  type,
  data,
  title,
}: {
  type: "bar" | "line"
  data: { label: string; value: number }[]
  title: string
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <div className="text-sm font-semibold">{title}</div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {type === "bar" ? (
              <BarChart data={data}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

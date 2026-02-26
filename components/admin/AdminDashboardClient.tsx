"use client"

import { Users, CalendarDays, Wallet, Hourglass } from "lucide-react"

import { StatsCard } from "@/components/admin/StatsCard"
import { KpiChart } from "@/components/admin/KpiChart"
import { Button } from "@/components/ui/button"

export function AdminDashboardClient({
  totalRevenue,
  totalUsers,
  totalAppointments,
  pendingPayments,
  appointmentByStatus,
  revenueLine,
}: {
  totalRevenue: number
  totalUsers: number
  totalAppointments: number
  pendingPayments: number
  appointmentByStatus: { label: string; value: number }[]
  revenueLine: { label: string; value: number }[]
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" className="h-9">
          <a href="/admin/appointments">Rendez-vous</a>
        </Button>
        <Button asChild variant="outline" className="h-9">
          <a href="/admin/payments">Paiements</a>
        </Button>
        <Button asChild variant="outline" className="h-9">
          <a href="/admin/users">Utilisateurs</a>
        </Button>
        <Button asChild variant="outline" className="h-9">
          <a href="/admin/calendar">Calendrier</a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Users" value={totalUsers} icon={Users} />
        <StatsCard title="Total Appointments" value={totalAppointments} icon={CalendarDays} />
        <StatsCard title="Total Revenue (Ar)" value={totalRevenue.toLocaleString("fr-FR")} icon={Wallet} />
        <StatsCard title="Pending Payments" value={pendingPayments} icon={Hourglass} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <KpiChart type="bar" title="Appointments by status" data={appointmentByStatus} />
        <KpiChart type="line" title="Appointments last 7 days" data={revenueLine} />
      </div>

      <div>
        <a
          href="/api/admin/export?type=appointments"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Export CSV
        </a>
      </div>
    </div>
  )
}

import { cookies } from "next/headers"

import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient"

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")

  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/admin/stats`, {
    headers: {
      cookie: cookieHeader,
    },
    cache: "no-store",
  })

  const data = await res.json()

  const totalRevenue = Number(data?.totalRevenue || 0)
  const totalUsers = Number(data?.totalUsers || 0)

  const appointmentByStatus = (data?.appointmentByStatus || []).map((x: any) => ({
    label: String(x._id || "unknown"),
    value: Number(x.count || 0),
  }))

  const pendingPayments = Number(
    (data?.paymentByStatus || []).find((x: any) => x._id === "pending")?.count || 0,
  )

  const totalAppointments = appointmentByStatus.reduce((a: number, b: any) => a + b.value, 0)

  const revenueLine = (data?.appointmentsLast7Days || []).map((x: any) => ({
    label: String(x.label),
    value: Number(x.value || 0),
  }))

  return (
    <AdminDashboardClient
      totalRevenue={totalRevenue}
      totalUsers={totalUsers}
      totalAppointments={totalAppointments}
      pendingPayments={pendingPayments}
      appointmentByStatus={appointmentByStatus}
      revenueLine={revenueLine}
    />
  )
}

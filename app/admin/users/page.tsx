"use client"

import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/admin/DataTable"

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur")
      setUsers(data.users || [])
    } catch (e: any) {
      toast.error(e?.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Utilisateurs</div>

      {loading ? <div className="text-sm text-muted-foreground">Chargement...</div> : null}

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          {
            key: "role",
            label: "Role",
            render: (row) => <Badge variant="outline">{row.role}</Badge>,
          },
          {
            key: "createdAt",
            label: "Created At",
            render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleString() : ""),
          },
        ]}
        data={users}
        onEdit={async (row) => {
          try {
            const nextRole = row.role === "admin" ? "user" : "admin"
            const res = await fetch(`/api/admin/users/${row._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ role: nextRole }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || "Erreur")
            toast.success("Role updated")
            await load()
          } catch (e: any) {
            toast.error(e?.message || "Erreur")
          }
        }}
        onDelete={async (id) => {
          try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.error || "Erreur")
            toast.success("Deleted")
            await load()
          } catch (e: any) {
            toast.error(e?.message || "Erreur")
          }
        }}
      />

      <p className="text-xs text-muted-foreground">
        Note: le bouton "Edit" bascule le role entre admin/user.
      </p>
    </div>
  )
}

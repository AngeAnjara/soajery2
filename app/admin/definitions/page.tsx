"use client"

import * as React from "react"
import { toast } from "sonner"

import { CrudModal } from "@/components/admin/CrudModal"
import { DataTable } from "@/components/admin/DataTable"
import { Button } from "@/components/ui/button"

export default function AdminDefinitionsPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({ title: "", content: "" })

  const load = async () => {
    const res = await fetch("/api/admin/definitions")
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Erreur")
    setItems(data.definitions || [])
  }

  React.useEffect(() => {
    load().catch((e) => toast.error(e?.message || "Erreur"))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: "", content: "" })
    setOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ title: row.title || "", content: row.content || "" })
    setOpen(true)
  }

  const submit = async () => {
    try {
      const res = await fetch(editing ? `/api/admin/definitions/${editing._id}` : "/api/admin/definitions", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erreur")
      toast.success("Saved")
      setOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e?.message || "Erreur")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">Définitions</div>
        <Button type="button" onClick={openCreate}>
          Nouveau
        </Button>
      </div>

      <DataTable
        columns={[
          { key: "title", label: "Title" },
          {
            key: "content",
            label: "Content",
            render: (row) => String(row.content || "").slice(0, 80) + "...",
          },
        ]}
        data={items}
        onEdit={openEdit}
        onDelete={async (id) => {
          try {
            const res = await fetch(`/api/admin/definitions/${id}`, { method: "DELETE" })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.error || "Erreur")
            toast.success("Deleted")
            await load()
          } catch (e: any) {
            toast.error(e?.message || "Erreur")
          }
        }}
      />

      <CrudModal
        title={editing ? "Edit definition" : "Create definition"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Content</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
              className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </CrudModal>
    </div>
  )
}

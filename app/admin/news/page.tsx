"use client"

import * as React from "react"
import { toast } from "sonner"

import { CrudModal } from "@/components/admin/CrudModal"
import { DataTable } from "@/components/admin/DataTable"
import { Button } from "@/components/ui/button"

export default function AdminNewsPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({ title: "", description: "", image: "", facebookUrl: "" })

  const load = async () => {
    const res = await fetch("/api/admin/news")
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Erreur")
    setItems(data.news || [])
  }

  React.useEffect(() => {
    load().catch((e) => toast.error(e?.message || "Erreur"))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: "", description: "", image: "", facebookUrl: "" })
    setOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      title: row.title || "",
      description: row.description || "",
      image: row.image || "",
      facebookUrl: row.facebookUrl || "",
    })
    setOpen(true)
  }

  const submit = async () => {
    try {
      const res = await fetch(editing ? `/api/admin/news/${editing._id}` : "/api/admin/news", {
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
        <div className="text-lg font-semibold">Actualités</div>
        <Button type="button" onClick={openCreate}>
          Nouveau
        </Button>
      </div>

      <DataTable
        columns={[
          { key: "title", label: "Title" },
          {
            key: "description",
            label: "Description",
            render: (row) => String(row.description || "").slice(0, 80) + "...",
          },
        ]}
        data={items}
        onEdit={openEdit}
        onDelete={async (id) => {
          try {
            const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" })
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
        title={editing ? "Edit news" : "Create news"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      >
        <div className="space-y-3">
          {(
            [
              ["title", "Title"],
              ["description", "Description"],
              ["image", "Image"],
              ["facebookUrl", "Facebook URL"],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className="space-y-1">
              <label className="text-sm font-medium">{label}</label>
              {k === "description" ? (
                <textarea
                  value={(form as any)[k]}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                />
              ) : (
                <input
                  value={(form as any)[k]}
                  onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                />
              )}
            </div>
          ))}
        </div>
      </CrudModal>
    </div>
  )
}

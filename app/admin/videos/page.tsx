"use client"

import * as React from "react"
import { toast } from "sonner"

import { CrudModal } from "@/components/admin/CrudModal"
import { Button } from "@/components/ui/button"

export default function AdminVideosPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({ title: "", thumbnail: "", facebookUrl: "" })

  const load = async () => {
    const res = await fetch("/api/admin/videos")
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Erreur")
    setItems(data.videos || [])
  }

  React.useEffect(() => {
    load().catch((e) => toast.error(e?.message || "Erreur"))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ title: "", thumbnail: "", facebookUrl: "" })
    setOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ title: row.title || "", thumbnail: row.thumbnail || "", facebookUrl: row.facebookUrl || "" })
    setOpen(true)
  }

  const submit = async () => {
    try {
      const res = await fetch(editing ? `/api/admin/videos/${editing._id}` : "/api/admin/videos", {
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

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/videos/${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erreur")
      toast.success("Deleted")
      await load()
    } catch (e: any) {
      toast.error(e?.message || "Erreur")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">Vidéos</div>
        <Button type="button" onClick={openCreate}>
          Nouveau
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((v) => (
          <div key={v._id} className="rounded-lg border bg-card p-3">
            {v.thumbnail ? (
              <img src={v.thumbnail} alt={v.title} className="h-40 w-full rounded-md object-cover" />
            ) : null}
            <div className="mt-2 text-sm font-semibold">{v.title}</div>
            <a href={v.facebookUrl} target="_blank" className="mt-1 block text-xs text-primary underline">
              {v.facebookUrl}
            </a>
            <div className="mt-3 flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => openEdit(v)}>
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => remove(String(v._id))}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <CrudModal
        title={editing ? "Edit video" : "Create video"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      >
        <div className="space-y-3">
          {(
            [
              ["title", "Title"],
              ["thumbnail", "Thumbnail"],
              ["facebookUrl", "Facebook URL"],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className="space-y-1">
              <label className="text-sm font-medium">{label}</label>
              <input
                value={(form as any)[k]}
                onChange={(e) => setForm((p) => ({ ...p, [k]: e.target.value }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
          ))}
        </div>
      </CrudModal>
    </div>
  )
}

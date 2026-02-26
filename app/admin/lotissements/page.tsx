"use client"

import * as React from "react"
import { toast } from "sonner"

import { CrudModal } from "@/components/admin/CrudModal"
import { DataTable } from "@/components/admin/DataTable"
import { Button } from "@/components/ui/button"

export default function AdminLotissementsPage() {
  const [items, setItems] = React.useState<any[]>([])
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    location: "",
    googleMapLink: "",
    images: "",
  })

  const load = async () => {
    const res = await fetch("/api/admin/lotissements")
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Erreur")
    setItems(data.lotissements || [])
  }

  React.useEffect(() => {
    load().catch((e) => toast.error(e?.message || "Erreur"))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", description: "", location: "", googleMapLink: "", images: "" })
    setOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm({
      name: row.name || "",
      description: row.description || "",
      location: row.location || "",
      googleMapLink: row.googleMapLink || "",
      images: Array.isArray(row.images) ? row.images.join(",") : "",
    })
    setOpen(true)
  }

  const submit = async () => {
    try {
      const payload = {
        name: form.name,
        description: form.description,
        location: form.location,
        googleMapLink: form.googleMapLink,
        images: form.images
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }

      const res = await fetch(
        editing ? `/api/admin/lotissements/${editing._id}` : "/api/admin/lotissements",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )
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
        <div className="text-lg font-semibold">Lotissements</div>
        <Button type="button" onClick={openCreate}>
          Nouveau
        </Button>
      </div>

      <DataTable
        columns={[
          { key: "name", label: "Name" },
          { key: "location", label: "Location" },
          {
            key: "images",
            label: "Images",
            render: (row) => String((row.images || []).length),
          },
        ]}
        data={items}
        onEdit={openEdit}
        onDelete={async (id) => {
          try {
            const res = await fetch(`/api/admin/lotissements/${id}`, { method: "DELETE" })
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
        title={editing ? "Edit lotissement" : "Create lotissement"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      >
        <div className="space-y-3">
          {(
            [
              ["name", "Nom"],
              ["description", "Description"],
              ["location", "Location"],
              ["googleMapLink", "Google Map Link"],
              ["images", "Images (comma-separated)"],
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

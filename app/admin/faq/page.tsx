"use client"

import * as React from "react"
import { toast } from "sonner"

import { CrudModal } from "@/components/admin/CrudModal"
import { Button } from "@/components/ui/button"

export default function AdminFaqPage() {
  const [faqs, setFaqs] = React.useState<any[]>([])
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<any>(null)
  const [form, setForm] = React.useState({ question: "", answer: "" })

  const load = async () => {
    const res = await fetch("/api/admin/faq")
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Erreur")
    setFaqs(data.faqs || [])
  }

  React.useEffect(() => {
    load().catch((e) => toast.error(e?.message || "Erreur"))
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({ question: "", answer: "" })
    setOpen(true)
  }

  const openEdit = (row: any) => {
    setEditing(row)
    setForm({ question: row.question || "", answer: row.answer || "" })
    setOpen(true)
  }

  const submit = async () => {
    try {
      const res = await fetch(editing ? `/api/admin/faq/${editing._id}` : "/api/admin/faq", {
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
      const res = await fetch(`/api/admin/faq/${id}`, { method: "DELETE" })
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
        <div className="text-lg font-semibold">FAQ</div>
        <Button type="button" onClick={openCreate}>
          Nouveau
        </Button>
      </div>

      <div className="space-y-2">
        {faqs.map((f) => (
          <div key={f._id} className="rounded-md border bg-card p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">{f.question}</div>
                <div className="mt-1 text-sm text-muted-foreground">{f.answer}</div>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => openEdit(f)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={() => remove(String(f._id))}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <CrudModal
        title={editing ? "Edit FAQ" : "Create FAQ"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Question</label>
            <input
              value={form.question}
              onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Answer</label>
            <textarea
              value={form.answer}
              onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
              className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>
      </CrudModal>
    </div>
  )
}

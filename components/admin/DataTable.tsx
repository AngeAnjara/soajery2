"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"

export type ColumnDef<Row extends Record<string, any>> = {
  key: string
  label: string
  render?: (row: Row) => React.ReactNode
}

export function DataTable<Row extends Record<string, any>>({
  columns,
  data,
  onDelete,
  onEdit,
}: {
  columns: ColumnDef<Row>[]
  data: Row[]
  onDelete?: (id: string) => void
  onEdit?: (row: Row) => void
}) {
  const [search, setSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  const pageSize = 10

  const filtered = React.useMemo(() => {
    if (!search.trim()) return data
    const s = search.toLowerCase()
    return data.filter((row) => JSON.stringify(row).toLowerCase().includes(s))
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  const current = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page])

  React.useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="h-10 w-full rounded-md border bg-background px-3 text-sm sm:max-w-xs"
        />

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} / {totalPages}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Suivant
          </Button>
        </div>
      </div>

      <div className="w-full overflow-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
              {onEdit || onDelete ? <th className="px-4 py-3 font-medium">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {current.map((row, idx) => (
              <tr key={row._id || idx} className="border-t">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-top">
                    {c.render ? c.render(row) : String((row as any)[c.key] ?? "")}
                  </td>
                ))}
                {onEdit || onDelete ? (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {onEdit ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => onEdit(row)}>
                          Edit
                        </Button>
                      ) : null}
                      {onDelete ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-destructive/40 text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(String(row._id))}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

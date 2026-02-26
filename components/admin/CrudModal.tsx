"use client"

import * as React from "react"
import * as Dialog from "@radix-ui/react-dialog"

import { Button } from "@/components/ui/button"

export function CrudModal({
  title,
  open,
  onClose,
  onSubmit,
  children,
}: {
  title: string
  open: boolean
  onClose: () => void
  onSubmit: () => void
  children: React.ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => (!v ? onClose() : null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[95vw] max-w-xl -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2">
            <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <Button type="button" variant="outline" size="sm">
                Fermer
              </Button>
            </Dialog.Close>
          </div>

          <div className="mt-4 max-h-[70vh] overflow-auto pr-1">{children}</div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="button" onClick={onSubmit}>
              Enregistrer
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

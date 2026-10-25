'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SlideToConfirm } from '@/components/ui/slide-to-confirm'

/**
 * Diálogo de confirmación del sistema.
 *
 * Reemplaza a los `confirm()` nativos, que rompían la estética, no se podían
 * traducir ni estilar y bloqueaban el hilo. Es el único lugar donde aparece el
 * botón rojo relleno: acá ya no compite con el primario de marca.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  loading = false,
  destructive = true,
  deslizar = false,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  destructive?: boolean
  /** Pide deslizar en vez de un clic: para lo que no tiene vuelta atrás. */
  deslizar?: boolean
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {deslizar ? (
          <div className="space-y-3">
            <SlideToConfirm label={`Deslizá para ${confirmLabel.toLowerCase()}`} onConfirm={onConfirm} loading={loading} tone={destructive ? 'danger' : 'primary'} />
            <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelLabel}
            </Button>
          </div>
        ) : (
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger-solid' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

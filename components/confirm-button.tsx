'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Trash2 } from 'lucide-react'
import { useState, useTransition, type ReactNode } from 'react'
import type { ActionResult } from '@/app/actions'

type ConfirmButtonProps = {
  title: string
  description: ReactNode
  confirmLabel?: string
  /** Kalau diisi, aksi diblokir: dialog hanya menampilkan alasan ini. */
  blockedReason?: string
  onConfirm: () => Promise<ActionResult>
  className?: string
  'aria-label'?: string
  children: ReactNode
}

// Konfirmasi hapus memakai AlertDialog dari Base UI (tidak tertutup oleh klik di luar, fokus aman).
export function ConfirmButton({ title, description, confirmLabel = 'Hapus', blockedReason, onConfirm, className, children, ...rest }: ConfirmButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function confirm() {
    startTransition(async () => {
      const result = await onConfirm()
      if (result.ok) setOpen(false)
      else setError(result.error)
    })
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={next => { setOpen(next); if (!next) setError(null) }}>
      <AlertDialog.Trigger type="button" className={className} aria-label={rest['aria-label']}>
        {children}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="dialog-backdrop confirm-backdrop" />
        <AlertDialog.Viewport className="dialog-viewport confirm-viewport">
          <AlertDialog.Popup className="dialog confirm-dialog liquid-panel">
            <div className="dialog-icon danger"><Trash2 size={18} /></div>
            <AlertDialog.Title>{title}</AlertDialog.Title>
            <AlertDialog.Description>{blockedReason ?? description}</AlertDialog.Description>
            {error && <p className="form-status is-error" role="alert">{error}</p>}
            <div className="confirm-actions">
              <AlertDialog.Close className="ghost-button">{blockedReason ? 'Mengerti' : 'Batal'}</AlertDialog.Close>
              {!blockedReason && (
                <button type="button" className="danger-button" onClick={confirm} disabled={pending}>
                  <Trash2 size={14} />{pending ? 'Menghapus…' : confirmLabel}
                </button>
              )}
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}

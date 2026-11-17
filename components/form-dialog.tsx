'use client'

import { Dialog } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import type { ReactNode, RefObject } from 'react'

type FormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenChangeComplete?: (open: boolean) => void
  icon: ReactNode
  kicker: string
  title: string
  description?: ReactNode
  initialFocus?: RefObject<HTMLElement | null>
  wide?: boolean
  children: ReactNode
}

// Dialog dari Base UI: fokus terkunci di dalam dialog, Esc dan klik di luar menutup, aria otomatis.
export function FormDialog({ open, onOpenChange, onOpenChangeComplete, icon, kicker, title, description, initialFocus, wide, children }: FormDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={next => onOpenChange(next)} onOpenChangeComplete={onOpenChangeComplete}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop" />
        <Dialog.Viewport className="dialog-viewport">
          <Dialog.Popup className={`dialog liquid-panel${wide ? ' dialog-wide' : ''}`} initialFocus={initialFocus}>
            <Dialog.Close className="dialog-close" aria-label="Tutup">
              <X size={18} />
            </Dialog.Close>
            <div className="dialog-icon">{icon}</div>
            <div className="section-kicker">{kicker}</div>
            <Dialog.Title>{title}</Dialog.Title>
            {description && <Dialog.Description>{description}</Dialog.Description>}
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

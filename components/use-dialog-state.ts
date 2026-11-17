'use client'

import { useCallback, useState } from 'react'

// Status dialog yang menyimpan data terakhir sampai animasi tutup selesai,
// dan memberi `key` baru setiap dibuka supaya isi form selalu mulai bersih.
export function useDialogState<T>() {
  const [state, setState] = useState<{ data: T; key: number } | null>(null)
  const [open, setOpen] = useState(false)

  const show = useCallback((data: T) => {
    setState(current => ({ data, key: (current?.key ?? 0) + 1 }))
    setOpen(true)
  }, [])
  const hide = useCallback(() => setOpen(false), [])
  const onOpenChange = useCallback((next: boolean) => { if (!next) setOpen(false) }, [])
  const onOpenChangeComplete = useCallback((next: boolean) => { if (!next) setState(null) }, [])

  return { open, data: state?.data ?? null, key: state?.key ?? 0, show, hide, onOpenChange, onOpenChangeComplete }
}

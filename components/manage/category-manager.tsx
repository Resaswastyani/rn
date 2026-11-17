'use client'

import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, useTransition, type RefObject } from 'react'
import { addCategory, deleteCategory, updateCategory } from '@/app/actions'
import { ConfirmButton } from '@/components/confirm-button'
import { IconPicker } from '@/components/icon-picker'
import { iconFor } from '@/components/icons'
import { formatMoney, type Category, type IconName, type PlanItem } from '@/lib/rangkai'

export function CategoryManager({ categories, items, nameRef }: { categories: Category[]; items: PlanItem[]; nameRef?: RefObject<HTMLInputElement | null> }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<IconName>('sparkles')
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return setStatus({ error: true, text: 'Nama kategori wajib diisi.' })
    startTransition(async () => {
      const result = await addCategory({ name: name.trim(), icon })
      if (!result.ok) return setStatus({ error: true, text: result.error })
      setStatus({ error: false, text: `Kategori “${name.trim()}” ditambahkan.` })
      setName(''); setIcon('sparkles')
    })
  }

  return (
    <>
      <form onSubmit={submit}>
        <label>Nama kategori baru<input ref={nameRef} value={name} onChange={e => { setName(e.target.value); setStatus(null) }} placeholder="Mis. Bulan madu" maxLength={40} /></label>
        <IconPicker value={icon} onChange={setIcon} />
        {status && <p className={`form-status ${status.error ? 'is-error' : ''}`} role="status">{status.text}</p>}
        <button className="primary-button dialog-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? 'Menyimpan…' : 'Tambah kategori'}</button>
      </form>

      <div className="manage-section-title">SEMUA KATEGORI · {categories.length}</div>
      {categories.length === 0 ? (
        <p className="form-hint">Belum ada kategori.</p>
      ) : (
        <ul className="manage-list">
          {categories.map(category => {
            const used = items.filter(item => item.category === category.name)
            return <CategoryRow key={category.id} category={category} usedCount={used.length} usedTarget={used.reduce((sum, item) => sum + item.target, 0)} />
          })}
        </ul>
      )}
    </>
  )
}

function CategoryRow({ category, usedCount, usedTarget }: { category: Category; usedCount: number; usedTarget: number }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [icon, setIcon] = useState(category.icon)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const Icon = iconFor(category.icon)

  function startEditing() {
    setName(category.name); setIcon(category.icon); setError(null)
    setEditing(true)
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return setError('Nama kategori wajib diisi.')
    startTransition(async () => {
      const result = await updateCategory({ id: category.id, name: name.trim(), icon })
      if (!result.ok) return setError(result.error)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <li className="manage-row editing">
        <form className="inline-form" onSubmit={save}>
          <label>Nama kategori<input value={name} onChange={e => setName(e.target.value)} maxLength={40} autoFocus /></label>
          <IconPicker value={icon} onChange={setIcon} />
          {usedCount > 0 && <p className="form-hint">Nama dan ikon baru langsung berlaku untuk {usedCount} kebutuhan di kategori ini.</p>}
          {error && <p className="form-status is-error" role="alert">{error}</p>}
          <div className="inline-actions">
            <button type="button" className="ghost-button" onClick={() => setEditing(false)}><X size={14} />Batal</button>
            <button type="submit" className="primary-button small-button" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan'}</button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="manage-row">
      <span className={`manage-icon need-icon ${category.icon}`}><Icon size={15} /></span>
      <div className="manage-main">
        <strong>{category.name}</strong>
        <small>{usedCount} rencana · {formatMoney(usedTarget)}</small>
      </div>
      <div className="manage-actions">
        <button type="button" className="mini-button" onClick={startEditing} aria-label={`Ubah kategori ${category.name}`}><Pencil size={13} /></button>
        <ConfirmButton
          className="mini-button danger"
          aria-label={`Hapus kategori ${category.name}`}
          title={usedCount > 0 ? 'Kategori masih dipakai' : 'Hapus kategori ini?'}
          description={`Kategori “${category.name}” akan dihapus.`}
          blockedReason={usedCount > 0 ? `“${category.name}” masih dipakai ${usedCount} kebutuhan. Pindahkan kebutuhan itu ke kategori lain atau hapus dulu, baru kategori bisa dihapus.` : undefined}
          confirmLabel="Hapus kategori"
          onConfirm={() => deleteCategory({ id: category.id })}
        >
          <Trash2 size={13} />
        </ConfirmButton>
      </div>
    </li>
  )
}

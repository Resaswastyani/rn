'use client'

import { Plus, Save, Trash2, Wallet } from 'lucide-react'
import { useState, useTransition, type RefObject } from 'react'
import { addPlanItem, deletePlanItem, updatePlanItem } from '@/app/actions'
import { ConfirmButton } from '@/components/confirm-button'
import { MoneyInput } from '@/components/money-input'
import { formatMoney, type Category, type PlanItem } from '@/lib/rangkai'

type ItemFormProps = {
  /** null = tambah baru, selain itu = ubah item ini */
  item: PlanItem | null
  categories: Category[]
  depositCount: number
  nameRef?: RefObject<HTMLInputElement | null>
  onDone: () => void
  onManageDeposits?: () => void
  onManageCategories?: () => void
}

export function ItemForm({ item, categories, depositCount, nameRef, onDone, onManageDeposits, onManageCategories }: ItemFormProps) {
  const [name, setName] = useState(item?.name ?? '')
  const [category, setCategory] = useState(item?.category ?? categories[0]?.name ?? '')
  const [target, setTarget] = useState(item ? String(item.target) : '')
  const [targetNumber, setTargetNumber] = useState(item ? item.target : Number.NaN)
  const [dueMonth, setDueMonth] = useState(item?.dueDate?.slice(0, 7) ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (categories.length === 0) {
    return (
      <div className="empty-dialog">
        <p className="form-hint">Belum ada kategori. Buat kategori dulu, lalu tambahkan kebutuhan.</p>
        {onManageCategories && <button type="button" className="primary-button dialog-submit" onClick={onManageCategories}>Kelola kategori</button>}
      </div>
    )
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim() || !(targetNumber > 0)) {
      setError('Isi nama dan target biaya lebih dari 0.')
      return
    }
    startTransition(async () => {
      const payload = { name: name.trim(), category, target: Math.round(targetNumber), dueMonth }
      const result = item ? await updatePlanItem({ id: item.id, ...payload }) : await addPlanItem(payload)
      if (!result.ok) return setError(result.error)
      onDone()
    })
  }

  async function remove() {
    if (!item) return { ok: false as const, error: 'Kebutuhan tidak ditemukan.' }
    const result = await deletePlanItem({ id: item.id })
    if (result.ok) onDone()
    return result
  }

  return (
    <form onSubmit={submit}>
      <label>Nama kebutuhan<input ref={nameRef} value={name} onChange={e => setName(e.target.value)} placeholder="Mis. Fotografer pernikahan" maxLength={120} required /></label>
      <div className="form-row">
        <label>Kategori<select value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></label>
        <label>Bulan target<input type="month" value={dueMonth} onChange={e => setDueMonth(e.target.value)} placeholder="2027-03" /></label>
      </div>
      <MoneyInput label="Target biaya" value={target} onValueChange={(value, valueAsNumber) => { setTarget(value); setTargetNumber(valueAsNumber) }} placeholder="Contoh: 5.000.000" step={500_000} />
      {item && (
        <div className="item-summary-line">
          <Wallet size={13} />
          <span>Terkumpul {formatMoney(item.saved)} · {depositCount} setoran</span>
          {onManageDeposits && <button type="button" className="link-button" onClick={onManageDeposits}>Kelola setoran</button>}
        </div>
      )}
      {error && <p className="form-status is-error" role="alert">{error}</p>}
      <div className="dialog-footer">
        {item && (
          <ConfirmButton
            className="danger-outline-button"
            title="Hapus kebutuhan ini?"
            description={`“${item.name}” beserta ${depositCount} catatan setorannya akan dihapus permanen dan tidak bisa dikembalikan.`}
            confirmLabel="Hapus kebutuhan"
            onConfirm={remove}
          >
            <Trash2 size={14} />Hapus
          </ConfirmButton>
        )}
        <button className="primary-button dialog-submit" type="submit" disabled={pending}>
          {item ? <Save size={15} /> : <Plus size={16} />}
          {pending ? 'Menyimpan…' : item ? 'Simpan perubahan' : 'Simpan kebutuhan'}
        </button>
      </div>
    </form>
  )
}

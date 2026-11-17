'use client'

import { Pencil, Plus, Trash2, Wallet, X } from 'lucide-react'
import { useState, useTransition, type RefObject } from 'react'
import { addDeposit, deleteDeposit, updateDeposit } from '@/app/actions'
import { ConfirmButton } from '@/components/confirm-button'
import { MoneyInput } from '@/components/money-input'
import { formatMoney, type Deposit, type PlanItem } from '@/lib/rangkai'

type DepositManagerProps = {
  /** Data item terbaru; undefined kalau item baru saja dihapus. */
  item: PlanItem | undefined
  deposits: Deposit[]
  amountRef?: RefObject<HTMLInputElement | null>
}

export function DepositManager({ item, deposits, amountRef }: DepositManagerProps) {
  const [amount, setAmount] = useState('')
  const [amountNumber, setAmountNumber] = useState(Number.NaN)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  if (!item) return <p className="form-hint">Kebutuhan ini sudah dihapus.</p>
  const itemId = item.id
  const pct = Math.min(100, Math.round(item.saved / item.target * 100))

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!(amountNumber > 0)) {
      setStatus({ error: true, text: 'Isi jumlah setoran lebih dari 0.' })
      return
    }
    startTransition(async () => {
      const result = await addDeposit({ itemId, amount: Math.round(amountNumber), note })
      if (!result.ok) return setStatus({ error: true, text: result.error })
      setAmount(''); setAmountNumber(Number.NaN); setNote('')
      setStatus({ error: false, text: 'Setoran tersimpan.' })
    })
  }

  return (
    <>
      <div className="item-summary">
        <div className="item-summary-numbers"><strong>{formatMoney(item.saved)}</strong><span>dari {formatMoney(item.target)} · {pct}%</span></div>
        <div className="need-progress-track"><span style={{ width: `${pct}%` }} /></div>
      </div>

      <form onSubmit={submit}>
        <div className="form-row">
          <MoneyInput label="Jumlah setoran" value={amount} onValueChange={(value, valueAsNumber) => { setAmount(value); setAmountNumber(valueAsNumber); setStatus(null) }} placeholder="Contoh: 500.000" inputRef={amountRef} />
          <label>Catatan (opsional)<input value={note} onChange={e => setNote(e.target.value)} placeholder="Mis. Gaji November" maxLength={160} /></label>
        </div>
        {status && <p className={`form-status ${status.error ? 'is-error' : ''}`} role="status">{status.text}</p>}
        <button className="primary-button dialog-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? 'Menyimpan…' : 'Tambahkan tabungan'}</button>
      </form>

      <div className="manage-section-title">RIWAYAT SETORAN · {deposits.length}</div>
      {deposits.length === 0 ? (
        <p className="form-hint">Belum ada setoran untuk kebutuhan ini.</p>
      ) : (
        <ul className="manage-list">
          {deposits.map(deposit => <DepositRow key={deposit.id} deposit={deposit} itemName={item.name} />)}
        </ul>
      )}
    </>
  )
}

function DepositRow({ deposit, itemName }: { deposit: Deposit; itemName: string }) {
  const [editing, setEditing] = useState(false)
  const [amount, setAmount] = useState(String(deposit.amount))
  const [amountNumber, setAmountNumber] = useState(deposit.amount)
  const [note, setNote] = useState(deposit.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function startEditing() {
    setAmount(String(deposit.amount)); setAmountNumber(deposit.amount); setNote(deposit.note ?? ''); setError(null)
    setEditing(true)
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!(amountNumber > 0)) return setError('Isi jumlah setoran lebih dari 0.')
    startTransition(async () => {
      const result = await updateDeposit({ id: deposit.id, amount: Math.round(amountNumber), note })
      if (!result.ok) return setError(result.error)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <li className="manage-row editing">
        <form className="inline-form" onSubmit={save}>
          <div className="form-row">
            <MoneyInput label="Jumlah" value={amount} onValueChange={(value, valueAsNumber) => { setAmount(value); setAmountNumber(valueAsNumber) }} />
            <label>Catatan<input value={note} onChange={e => setNote(e.target.value)} placeholder="Opsional" maxLength={160} /></label>
          </div>
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
      <span className="manage-icon"><Wallet size={15} /></span>
      <div className="manage-main">
        <strong>{formatMoney(deposit.amount)}</strong>
        <small>{deposit.date} · {deposit.note ?? 'Setoran dicatat'}</small>
      </div>
      <div className="manage-actions">
        <button type="button" className="mini-button" onClick={startEditing} aria-label={`Ubah setoran ${formatMoney(deposit.amount)}`}><Pencil size={13} /></button>
        <ConfirmButton
          className="mini-button danger"
          aria-label={`Hapus setoran ${formatMoney(deposit.amount)}`}
          title="Hapus setoran ini?"
          description={`Setoran ${formatMoney(deposit.amount)} (${deposit.date}) untuk “${itemName}” akan dihapus dan total terkumpul dikurangi.`}
          confirmLabel="Hapus setoran"
          onConfirm={() => deleteDeposit({ id: deposit.id })}
        >
          <Trash2 size={13} />
        </ConfirmButton>
      </div>
    </li>
  )
}

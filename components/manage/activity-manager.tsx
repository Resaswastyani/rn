'use client'

import { ArrowDownLeft, NotebookPen, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useState, useTransition, type RefObject } from 'react'
import { addActivity, deleteActivity, updateActivity } from '@/app/actions'
import { ConfirmButton } from '@/components/confirm-button'
import { formatMoney, type Activity } from '@/lib/rangkai'

export function ActivityManager({ activities, titleRef }: { activities: Activity[]; titleRef?: RefObject<HTMLInputElement | null> }) {
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [status, setStatus] = useState<{ error: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return setStatus({ error: true, text: 'Judul catatan wajib diisi.' })
    startTransition(async () => {
      const result = await addActivity({ title: title.trim(), detail })
      if (!result.ok) return setStatus({ error: true, text: result.error })
      setTitle(''); setDetail('')
      setStatus({ error: false, text: 'Catatan ditambahkan ke linimasa.' })
    })
  }

  return (
    <>
      <form onSubmit={submit}>
        <div className="form-row">
          <label>Judul catatan<input ref={titleRef} value={title} onChange={e => { setTitle(e.target.value); setStatus(null) }} placeholder="Mis. Survei gedung di Bandung" maxLength={120} /></label>
          <label>Keterangan (opsional)<input value={detail} onChange={e => setDetail(e.target.value)} placeholder="Mis. Bersama keluarga" maxLength={240} /></label>
        </div>
        {status && <p className={`form-status ${status.error ? 'is-error' : ''}`} role="status">{status.text}</p>}
        <button className="primary-button dialog-submit" type="submit" disabled={pending}><Plus size={16} />{pending ? 'Menyimpan…' : 'Tambah catatan'}</button>
      </form>

      <div className="manage-section-title">SEMUA AKTIVITAS · {activities.length}</div>
      {activities.length === 0 ? (
        <p className="form-hint">Linimasa masih kosong.</p>
      ) : (
        <ul className="manage-list">
          {activities.map(activity => <ActivityRow key={activity.id} activity={activity} />)}
        </ul>
      )}
    </>
  )
}

function ActivityRow({ activity }: { activity: Activity }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(activity.title)
  const [detail, setDetail] = useState(activity.detail)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const Icon = activity.amount ? ArrowDownLeft : NotebookPen

  function startEditing() {
    setTitle(activity.title); setDetail(activity.detail); setError(null)
    setEditing(true)
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!title.trim()) return setError('Judul catatan wajib diisi.')
    startTransition(async () => {
      const result = await updateActivity({ id: activity.id, title: title.trim(), detail })
      if (!result.ok) return setError(result.error)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <li className="manage-row editing">
        <form className="inline-form" onSubmit={save}>
          <label>Judul<input value={title} onChange={e => setTitle(e.target.value)} maxLength={120} autoFocus /></label>
          <label>Keterangan<input value={detail} onChange={e => setDetail(e.target.value)} maxLength={240} /></label>
          {activity.fromDeposit && <p className="form-hint">Jumlah setoran diubah lewat riwayat setoran di kebutuhannya.</p>}
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
      <span className={`manage-icon ${activity.amount ? 'is-money' : ''}`}><Icon size={15} /></span>
      <div className="manage-main">
        <strong>{activity.title}</strong>
        <small>{activity.time} · {activity.detail}{activity.amount ? ` · + ${formatMoney(activity.amount)}` : ''}</small>
      </div>
      <div className="manage-actions">
        <button type="button" className="mini-button" onClick={startEditing} aria-label={`Ubah catatan ${activity.title}`}><Pencil size={13} /></button>
        <ConfirmButton
          className="mini-button danger"
          aria-label={`Hapus catatan ${activity.title}`}
          title="Hapus dari linimasa?"
          description={activity.fromDeposit ? `“${activity.title}” akan hilang dari linimasa. Setorannya tetap tercatat di kebutuhan.` : `“${activity.title}” akan dihapus dari linimasa.`}
          confirmLabel="Hapus catatan"
          onConfirm={() => deleteActivity({ id: activity.id })}
        >
          <Trash2 size={13} />
        </ConfirmButton>
      </div>
    </li>
  )
}

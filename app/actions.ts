'use server'

import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getDb, schema } from '@/lib/db'
import { formatMoney, formatShortDate, iconForCategory, isCategory } from '@/lib/rangkai'

export type ActionResult = { ok: true } | { ok: false; error: string }

const MAX_AMOUNT = 1_000_000_000_000 // Rp 1 triliun, batas wajar untuk satu rencana
const isValidAmount = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n > 0 && n <= MAX_AMOUNT
const isValidIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))

function fail(error: unknown, message: string): ActionResult {
  console.error(message, error)
  return { ok: false, error: message }
}

export async function saveProfile(input: { nameOne: string; nameTwo: string; targetDate: string }): Promise<ActionResult> {
  const nameOne = String(input.nameOne ?? '').trim()
  const nameTwo = String(input.nameTwo ?? '').trim()
  const targetDate = String(input.targetDate ?? '')
  if (!nameOne || !nameTwo) return { ok: false, error: 'Kedua nama wajib diisi.' }
  if (nameOne.length > 60 || nameTwo.length > 60) return { ok: false, error: 'Nama maksimal 60 karakter.' }
  if (!isValidIsoDate(targetDate)) return { ok: false, error: 'Tanggal target tidak valid.' }

  try {
    const db = getDb()
    await db.batch([
      db
        .insert(schema.profile)
        .values({ id: 1, nameOne, nameTwo, targetDate })
        .onConflictDoUpdate({ target: schema.profile.id, set: { nameOne, nameTwo, targetDate, updatedAt: sql`now()` } }),
      db.insert(schema.activities).values({ title: 'Profil pasangan diperbarui', detail: `${nameOne} & ${nameTwo} · ${formatShortDate(targetDate)}` }),
    ])
  } catch (error) {
    return fail(error, 'Gagal menyimpan pengaturan. Coba lagi.')
  }

  revalidatePath('/')
  return { ok: true }
}

export async function addPlanItem(input: { name: string; category: string; target: number }): Promise<ActionResult> {
  const name = String(input.name ?? '').trim()
  const category = String(input.category ?? '')
  if (!name) return { ok: false, error: 'Nama kebutuhan wajib diisi.' }
  if (name.length > 120) return { ok: false, error: 'Nama kebutuhan maksimal 120 karakter.' }
  if (!isCategory(category)) return { ok: false, error: 'Kategori tidak dikenal.' }
  if (!isValidAmount(input.target)) return { ok: false, error: 'Target biaya harus angka rupiah lebih dari 0.' }

  try {
    const db = getDb()
    const [item] = await db
      .insert(schema.planItems)
      .values({ name, category, icon: iconForCategory(category), target: input.target })
      .returning({ id: schema.planItems.id })
    await db.insert(schema.activities).values({ title: `Rencana “${name}” ditambahkan`, detail: `Target ${formatMoney(input.target)}`, itemId: item.id })
  } catch (error) {
    return fail(error, 'Gagal menyimpan kebutuhan. Coba lagi.')
  }

  revalidatePath('/')
  return { ok: true }
}

export async function addDeposit(input: { itemId: number; amount: number }): Promise<ActionResult> {
  if (!Number.isSafeInteger(input.itemId)) return { ok: false, error: 'Kebutuhan tidak ditemukan.' }
  if (!isValidAmount(input.amount)) return { ok: false, error: 'Jumlah setoran harus angka rupiah lebih dari 0.' }

  try {
    const db = getDb()
    const [item] = await db.select({ name: schema.planItems.name }).from(schema.planItems).where(eq(schema.planItems.id, input.itemId))
    if (!item) return { ok: false, error: 'Kebutuhan tidak ditemukan.' }

    // Satu batch = satu transaksi: setoran, saldo item, dan linimasa selalu konsisten.
    await db.batch([
      db.insert(schema.deposits).values({ itemId: input.itemId, amount: input.amount }),
      db
        .update(schema.planItems)
        .set({ saved: sql`${schema.planItems.saved} + ${input.amount}` })
        .where(eq(schema.planItems.id, input.itemId)),
      db.insert(schema.activities).values({ title: `Tabungan ${item.name} bertambah`, detail: 'Setoran dicatat', amount: input.amount, itemId: input.itemId }),
    ])
  } catch (error) {
    return fail(error, 'Gagal mencatat tabungan. Coba lagi.')
  }

  revalidatePath('/')
  return { ok: true }
}

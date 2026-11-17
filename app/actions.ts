'use server'

import { count, eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getDb, schema } from '@/lib/db'
import { formatMoney, formatShortDate, isIconName } from '@/lib/rangkai'

export type ActionResult = { ok: true } | { ok: false; error: string }

type Db = ReturnType<typeof getDb>

const MAX_AMOUNT = 1_000_000_000_000 // Rp 1 triliun, batas wajar untuk satu rencana
const isValidAmount = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n > 0 && n <= MAX_AMOUNT
const isValidId = (n: unknown): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n > 0
const isValidIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
const clean = (value: unknown) => String(value ?? '').trim()

// "2027-03" → "2027-03-01", "" → null
function parseDueMonth(value: unknown): { ok: true; value: string | null } | { ok: false } {
  const month = clean(value)
  if (!month) return { ok: true, value: null }
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? { ok: true, value: `${month}-01` } : { ok: false }
}

// Kode error Postgres (mis. 23505 unik, 23503 foreign key), dibungkus Drizzle di `cause`.
function pgCode(error: unknown): string | undefined {
  let current: unknown = error
  for (let depth = 0; depth < 4 && current && typeof current === 'object'; depth++) {
    const code = (current as { code?: unknown }).code
    if (typeof code === 'string' && /^[0-9A-Z]{5}$/.test(code)) return code
    current = (current as { cause?: unknown }).cause
  }
  return undefined
}

function fail(error: unknown, message: string): ActionResult {
  console.error(message, error)
  return { ok: false, error: message }
}

function done(): ActionResult {
  revalidatePath('/')
  return { ok: true }
}

// Hitung ulang saldo item dari buku besar setoran (dipakai di dalam batch/transaksi).
const recomputeSaved = (db: Db, itemId: number) =>
  db
    .update(schema.planItems)
    .set({ saved: sql`(select coalesce(sum(${schema.deposits.amount}), 0) from ${schema.deposits} where ${schema.deposits.itemId} = ${itemId})` })
    .where(eq(schema.planItems.id, itemId))

// ───────────────────────── Profil ─────────────────────────

export async function saveProfile(input: { nameOne: string; nameTwo: string; targetDate: string }): Promise<ActionResult> {
  const nameOne = clean(input.nameOne)
  const nameTwo = clean(input.nameTwo)
  const targetDate = clean(input.targetDate)
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
  return done()
}

// ───────────────────────── Kategori ─────────────────────────

function validateCategory(input: { name: string; icon: string }) {
  const name = clean(input.name)
  const icon = clean(input.icon)
  if (!name) return { error: 'Nama kategori wajib diisi.' } as const
  if (name.length > 40) return { error: 'Nama kategori maksimal 40 karakter.' } as const
  if (name.toLowerCase() === 'semua') return { error: 'Nama “Semua” dipakai untuk filter. Pilih nama lain.' } as const
  if (!isIconName(icon)) return { error: 'Ikon tidak dikenal.' } as const
  return { name, icon } as const
}

export async function addCategory(input: { name: string; icon: string }): Promise<ActionResult> {
  const valid = validateCategory(input)
  if ('error' in valid) return { ok: false, error: valid.error as string }

  try {
    const db = getDb()
    await db.batch([
      db.insert(schema.categories).values({ name: valid.name, icon: valid.icon }),
      db.insert(schema.activities).values({ title: `Kategori “${valid.name}” ditambahkan`, detail: 'Area rencana baru' }),
    ])
  } catch (error) {
    if (pgCode(error) === '23505') return { ok: false, error: `Kategori “${valid.name}” sudah ada.` }
    return fail(error, 'Gagal menambah kategori. Coba lagi.')
  }
  return done()
}

export async function updateCategory(input: { id: number; name: string; icon: string }): Promise<ActionResult> {
  if (!isValidId(input.id)) return { ok: false, error: 'Kategori tidak ditemukan.' }
  const valid = validateCategory(input)
  if ('error' in valid) return { ok: false, error: valid.error as string }

  try {
    const db = getDb()
    const [existing] = await db.select().from(schema.categories).where(eq(schema.categories.id, input.id))
    if (!existing) return { ok: false, error: 'Kategori tidak ditemukan.' }

    // Ganti nama ikut memperbarui item (ON UPDATE CASCADE); ikon item disamakan dengan ikon kategori.
    await db.batch([
      db.update(schema.categories).set({ name: valid.name, icon: valid.icon }).where(eq(schema.categories.id, input.id)),
      db.update(schema.planItems).set({ icon: valid.icon }).where(eq(schema.planItems.category, valid.name)),
    ])
  } catch (error) {
    if (pgCode(error) === '23505') return { ok: false, error: `Kategori “${valid.name}” sudah ada.` }
    return fail(error, 'Gagal menyimpan kategori. Coba lagi.')
  }
  return done()
}

export async function deleteCategory(input: { id: number }): Promise<ActionResult> {
  if (!isValidId(input.id)) return { ok: false, error: 'Kategori tidak ditemukan.' }

  try {
    const db = getDb()
    const [existing] = await db.select().from(schema.categories).where(eq(schema.categories.id, input.id))
    if (!existing) return { ok: false, error: 'Kategori tidak ditemukan.' }

    const [{ value: used }] = await db.select({ value: count() }).from(schema.planItems).where(eq(schema.planItems.category, existing.name))
    if (used > 0) {
      return { ok: false, error: `Kategori “${existing.name}” masih dipakai ${used} kebutuhan. Pindahkan atau hapus kebutuhannya dulu.` }
    }

    await db.batch([
      db.delete(schema.categories).where(eq(schema.categories.id, input.id)),
      db.insert(schema.activities).values({ title: `Kategori “${existing.name}” dihapus`, detail: 'Area rencana dihapus' }),
    ])
  } catch (error) {
    if (pgCode(error) === '23503') return { ok: false, error: 'Kategori masih dipakai kebutuhan. Pindahkan atau hapus kebutuhannya dulu.' }
    return fail(error, 'Gagal menghapus kategori. Coba lagi.')
  }
  return done()
}

// ───────────────────────── Rencana & kebutuhan ─────────────────────────

type PlanItemInput = { name: string; category: string; target: number; dueMonth?: string }

async function validatePlanItem(db: Db, input: PlanItemInput) {
  const name = clean(input.name)
  const categoryName = clean(input.category)
  if (!name) return { error: 'Nama kebutuhan wajib diisi.' } as const
  if (name.length > 120) return { error: 'Nama kebutuhan maksimal 120 karakter.' } as const
  if (!isValidAmount(input.target)) return { error: 'Target biaya harus angka rupiah lebih dari 0.' } as const
  const due = parseDueMonth(input.dueMonth)
  if (!due.ok) return { error: 'Bulan target tidak valid.' } as const

  const [category] = await db.select().from(schema.categories).where(eq(schema.categories.name, categoryName))
  if (!category) return { error: 'Kategori tidak ditemukan. Pilih kategori lain.' } as const

  return { name, category, target: input.target, dueDate: due.value } as const
}

export async function addPlanItem(input: PlanItemInput): Promise<ActionResult> {
  try {
    const db = getDb()
    const valid = await validatePlanItem(db, input)
    if ('error' in valid) return { ok: false, error: valid.error as string }

    await db.batch([
      db.insert(schema.planItems).values({
        name: valid.name,
        category: valid.category.name,
        icon: valid.category.icon,
        target: valid.target,
        dueDate: valid.dueDate,
      }),
      db.insert(schema.activities).values({
        title: `Rencana “${valid.name}” ditambahkan`,
        detail: `Target ${formatMoney(valid.target)}`,
        itemId: sql`currval(pg_get_serial_sequence('plan_items', 'id'))`,
      }),
    ])
  } catch (error) {
    return fail(error, 'Gagal menyimpan kebutuhan. Coba lagi.')
  }
  return done()
}

export async function updatePlanItem(input: PlanItemInput & { id: number }): Promise<ActionResult> {
  if (!isValidId(input.id)) return { ok: false, error: 'Kebutuhan tidak ditemukan.' }

  try {
    const db = getDb()
    const valid = await validatePlanItem(db, input)
    if ('error' in valid) return { ok: false, error: valid.error as string }

    const [existing] = await db.select({ id: schema.planItems.id }).from(schema.planItems).where(eq(schema.planItems.id, input.id))
    if (!existing) return { ok: false, error: 'Kebutuhan tidak ditemukan.' }

    await db.batch([
      db
        .update(schema.planItems)
        .set({ name: valid.name, category: valid.category.name, icon: valid.category.icon, target: valid.target, dueDate: valid.dueDate })
        .where(eq(schema.planItems.id, input.id)),
      db.insert(schema.activities).values({ title: `Rencana “${valid.name}” diperbarui`, detail: `Target ${formatMoney(valid.target)}`, itemId: input.id }),
    ])
  } catch (error) {
    return fail(error, 'Gagal menyimpan perubahan kebutuhan. Coba lagi.')
  }
  return done()
}

export async function deletePlanItem(input: { id: number }): Promise<ActionResult> {
  if (!isValidId(input.id)) return { ok: false, error: 'Kebutuhan tidak ditemukan.' }

  try {
    const db = getDb()
    const [existing] = await db.select().from(schema.planItems).where(eq(schema.planItems.id, input.id))
    if (!existing) return { ok: false, error: 'Kebutuhan tidak ditemukan.' }

    // Setoran ikut terhapus (ON DELETE CASCADE), begitu juga aktivitas setorannya.
    await db.batch([
      db.delete(schema.planItems).where(eq(schema.planItems.id, input.id)),
      db.insert(schema.activities).values({
        title: `Rencana “${existing.name}” dihapus`,
        detail: `Target ${formatMoney(existing.target)} · terkumpul ${formatMoney(existing.saved)}`,
      }),
    ])
  } catch (error) {
    return fail(error, 'Gagal menghapus kebutuhan. Coba lagi.')
  }
  return done()
}

// ───────────────────────── Setoran tabungan ─────────────────────────

function validateDeposit(input: { amount: number; note?: string }) {
  if (!isValidAmount(input.amount)) return { error: 'Jumlah setoran harus angka rupiah lebih dari 0.' } as const
  const note = clean(input.note)
  if (note.length > 160) return { error: 'Catatan maksimal 160 karakter.' } as const
  return { amount: input.amount, note: note || null } as const
}

export async function addDeposit(input: { itemId: number; amount: number; note?: string }): Promise<ActionResult> {
  if (!isValidId(input.itemId)) return { ok: false, error: 'Kebutuhan tidak ditemukan.' }
  const valid = validateDeposit(input)
  if ('error' in valid) return { ok: false, error: valid.error as string }

  try {
    const db = getDb()
    const [item] = await db.select({ name: schema.planItems.name }).from(schema.planItems).where(eq(schema.planItems.id, input.itemId))
    if (!item) return { ok: false, error: 'Kebutuhan tidak ditemukan.' }

    // Satu batch = satu transaksi: setoran, aktivitasnya, dan saldo item selalu konsisten.
    await db.batch([
      db.insert(schema.deposits).values({ itemId: input.itemId, amount: valid.amount, note: valid.note }),
      db.insert(schema.activities).values({
        title: `Tabungan ${item.name} bertambah`,
        detail: valid.note ?? 'Setoran dicatat',
        amount: valid.amount,
        itemId: input.itemId,
        depositId: sql`currval(pg_get_serial_sequence('deposits', 'id'))`,
      }),
      recomputeSaved(db, input.itemId),
    ])
  } catch (error) {
    return fail(error, 'Gagal mencatat tabungan. Coba lagi.')
  }
  return done()
}

export async function updateDeposit(input: { id: number; amount: number; note?: string }): Promise<ActionResult> {
  if (!isValidId(input.id)) return { ok: false, error: 'Setoran tidak ditemukan.' }
  const valid = validateDeposit(input)
  if ('error' in valid) return { ok: false, error: valid.error as string }

  try {
    const db = getDb()
    const [deposit] = await db.select({ itemId: schema.deposits.itemId }).from(schema.deposits).where(eq(schema.deposits.id, input.id))
    if (!deposit) return { ok: false, error: 'Setoran tidak ditemukan.' }

    await db.batch([
      db.update(schema.deposits).set({ amount: valid.amount, note: valid.note }).where(eq(schema.deposits.id, input.id)),
      db.update(schema.activities).set({ amount: valid.amount, detail: valid.note ?? 'Setoran dicatat' }).where(eq(schema.activities.depositId, input.id)),
      recomputeSaved(db, deposit.itemId),
    ])
  } catch (error) {
    return fail(error, 'Gagal menyimpan setoran. Coba lagi.')
  }
  return done()
}

export async function deleteDeposit(input: { id: number }): Promise<ActionResult> {
  if (!isValidId(input.id)) return { ok: false, error: 'Setoran tidak ditemukan.' }

  try {
    const db = getDb()
    const [deposit] = await db.select({ itemId: schema.deposits.itemId }).from(schema.deposits).where(eq(schema.deposits.id, input.id))
    if (!deposit) return { ok: false, error: 'Setoran tidak ditemukan.' }

    // Aktivitas setoran ikut terhapus (ON DELETE CASCADE).
    await db.batch([db.delete(schema.deposits).where(eq(schema.deposits.id, input.id)), recomputeSaved(db, deposit.itemId)])
  } catch (error) {
    return fail(error, 'Gagal menghapus setoran. Coba lagi.')
  }
  return done()
}

// ───────────────────────── Linimasa ─────────────────────────

function validateNote(input: { title: string; detail?: string }) {
  const title = clean(input.title)
  const detail = clean(input.detail)
  if (!title) return { error: 'Judul catatan wajib diisi.' } as const
  if (title.length > 120) return { error: 'Judul maksimal 120 karakter.' } as const
  if (detail.length > 240) return { error: 'Keterangan maksimal 240 karakter.' } as const
  return { title, detail: detail || 'Catatan perencanaan' } as const
}

export async function addActivity(input: { title: string; detail?: string }): Promise<ActionResult> {
  const valid = validateNote(input)
  if ('error' in valid) return { ok: false, error: valid.error as string }

  try {
    await getDb().insert(schema.activities).values({ title: valid.title, detail: valid.detail })
  } catch (error) {
    return fail(error, 'Gagal menambah catatan. Coba lagi.')
  }
  return done()
}

export async function updateActivity(input: { id: number; title: string; detail?: string }): Promise<ActionResult> {
  if (!isValidId(input.id)) return { ok: false, error: 'Catatan tidak ditemukan.' }
  const valid = validateNote(input)
  if ('error' in valid) return { ok: false, error: valid.error as string }

  try {
    const updated = await getDb()
      .update(schema.activities)
      .set({ title: valid.title, detail: valid.detail })
      .where(eq(schema.activities.id, input.id))
      .returning({ id: schema.activities.id })
    if (updated.length === 0) return { ok: false, error: 'Catatan tidak ditemukan.' }
  } catch (error) {
    return fail(error, 'Gagal menyimpan catatan. Coba lagi.')
  }
  return done()
}

export async function deleteActivity(input: { id: number }): Promise<ActionResult> {
  if (!isValidId(input.id)) return { ok: false, error: 'Catatan tidak ditemukan.' }

  try {
    const deleted = await getDb().delete(schema.activities).where(eq(schema.activities.id, input.id)).returning({ id: schema.activities.id })
    if (deleted.length === 0) return { ok: false, error: 'Catatan tidak ditemukan.' }
  } catch (error) {
    return fail(error, 'Gagal menghapus catatan. Coba lagi.')
  }
  return done()
}

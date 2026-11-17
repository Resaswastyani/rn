import { asc, desc, eq } from 'drizzle-orm'
import { getDb, schema } from '@/lib/db'
import { DEFAULT_PROFILE, TIME_ZONE, type Activity, type DashboardData, type Deposit, type PlanItem } from '@/lib/rangkai'

const dayKeyFormat = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
const shortDayFormat = new Intl.DateTimeFormat('id-ID', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' })
const fullDayFormat = new Intl.DateTimeFormat('id-ID', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric' })
const dueFormat = new Intl.DateTimeFormat('id-ID', { timeZone: 'UTC', month: 'short', year: 'numeric' })

// "Baru saja" / "Hari ini" / "Kemarin" / "12 Nov", dihitung dalam zona waktu WIB.
export function activityTimeLabel(createdAt: Date, now = new Date()) {
  const dayDiff = Math.round((Date.parse(dayKeyFormat.format(now)) - Date.parse(dayKeyFormat.format(createdAt))) / 86_400_000)
  if (dayDiff <= 0) return now.getTime() - createdAt.getTime() < 5 * 60_000 ? 'Baru saja' : 'Hari ini'
  if (dayDiff === 1) return 'Kemarin'
  return shortDayFormat.format(createdAt)
}

export function dueLabel(dueDate: string | null) {
  return dueDate ? dueFormat.format(new Date(`${dueDate}T00:00:00Z`)) : 'Belum ditentukan'
}

export async function getDashboard(): Promise<DashboardData> {
  const db = getDb()
  const [profileRows, categoryRows, itemRows, depositRows, activityRows] = await db.batch([
    db.select().from(schema.profile).where(eq(schema.profile.id, 1)),
    db.select().from(schema.categories).orderBy(asc(schema.categories.id)),
    db.select().from(schema.planItems).orderBy(asc(schema.planItems.id)),
    db.select().from(schema.deposits).orderBy(desc(schema.deposits.createdAt), desc(schema.deposits.id)),
    db.select().from(schema.activities).orderBy(desc(schema.activities.createdAt), desc(schema.activities.id)).limit(100),
  ])

  const profileRow = profileRows[0]
  const now = new Date()

  const items: PlanItem[] = itemRows.map(row => ({
    id: row.id,
    name: row.name,
    category: row.category,
    target: row.target,
    saved: row.saved,
    dueDate: row.dueDate,
    due: dueLabel(row.dueDate),
    icon: row.icon,
  }))

  const deposits: Deposit[] = depositRows.map(row => ({
    id: row.id,
    itemId: row.itemId,
    amount: row.amount,
    note: row.note,
    date: fullDayFormat.format(row.createdAt),
  }))

  const activities: Activity[] = activityRows.map(row => ({
    id: row.id,
    title: row.title,
    detail: row.detail,
    amount: row.amount ?? undefined,
    time: activityTimeLabel(row.createdAt, now),
    fromDeposit: row.depositId !== null,
  }))

  return {
    profile: profileRow ? { nameOne: profileRow.nameOne, nameTwo: profileRow.nameTwo, targetDate: profileRow.targetDate } : DEFAULT_PROFILE,
    categories: categoryRows.map(row => ({ id: row.id, name: row.name, icon: row.icon })),
    items,
    deposits,
    activities,
  }
}

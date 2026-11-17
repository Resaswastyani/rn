// Konstanta, tipe, dan format yang dipakai bersama oleh server dan klien.

export const ICONS = ['sparkles', 'heart', 'home', 'gem', 'shirt', 'camera', 'utensils', 'car', 'gift', 'plane'] as const
export type IconName = (typeof ICONS)[number]
export const isIconName = (value: string): value is IconName => (ICONS as readonly string[]).includes(value)

export const TIME_ZONE = 'Asia/Jakarta'

export type Category = { id: number; name: string; icon: string }
export type PlanItem = {
  id: number
  name: string
  category: string
  target: number
  saved: number
  /** YYYY-MM-DD (tanggal 1 bulan target) atau null */
  dueDate: string | null
  /** Label tampilan, mis. "Des 2026" */
  due: string
  icon: string
}
export type Deposit = { id: number; itemId: number; amount: number; note: string | null; date: string }
export type Activity = { id: number; title: string; detail: string; amount?: number; time: string; fromDeposit: boolean }
export type Profile = { nameOne: string; nameTwo: string; targetDate: string }
export type DashboardData = { profile: Profile; categories: Category[]; items: PlanItem[]; deposits: Deposit[]; activities: Activity[] }

export const DEFAULT_PROFILE: Profile = { nameOne: 'Adinda', nameTwo: 'Dimas', targetDate: '2027-07-24' }

export const formatMoney = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n)

export function formatShortDate(isoDate: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${isoDate}T00:00:00Z`))
}

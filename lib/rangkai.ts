// Konstanta, tipe, dan format yang dipakai bersama oleh server dan klien.

export const CATEGORIES = ['Lamaran', 'Pernikahan', 'Rumah', 'Perhiasan', 'Busana'] as const
export type Category = (typeof CATEGORIES)[number]

export const ICONS = ['home', 'gem', 'sparkles', 'heart', 'shirt'] as const
export type IconName = (typeof ICONS)[number]

export const TIME_ZONE = 'Asia/Jakarta'

export type PlanItem = { id: number; name: string; category: string; target: number; saved: number; due: string; icon: string }
export type Activity = { id: number; title: string; detail: string; amount?: number; time: string }
export type Profile = { nameOne: string; nameTwo: string; targetDate: string }
export type DashboardData = { profile: Profile; items: PlanItem[]; activities: Activity[] }

export const DEFAULT_PROFILE: Profile = { nameOne: 'Adinda', nameTwo: 'Dimas', targetDate: '2027-07-24' }

export const isCategory = (value: string): value is Category => (CATEGORIES as readonly string[]).includes(value)

export function iconForCategory(category: Category): IconName {
  switch (category) {
    case 'Rumah': return 'home'
    case 'Perhiasan': return 'gem'
    case 'Busana': return 'shirt'
    case 'Pernikahan': return 'heart'
    default: return 'sparkles'
  }
}

export const formatMoney = (n: number) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n)

export function formatShortDate(isoDate: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${isoDate}T00:00:00Z`))
}

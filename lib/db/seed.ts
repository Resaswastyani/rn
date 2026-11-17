// Isi data contoh awal. Aman dijalankan berulang: hanya mengisi kalau tabel masih kosong.
// Jalankan: pnpm db:seed
import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { count } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'
import { activities, deposits, planItems, profile } from './schema'

config({ path: '.env', quiet: true })

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL belum diatur di .env')

const db = drizzle({ client: neon(url) })

const items = [
  { name: 'Uang muka rumah', category: 'Rumah', target: 80_000_000, saved: 32_500_000, dueDate: '2026-12-01', icon: 'home' },
  { name: 'Cincin pernikahan', category: 'Perhiasan', target: 18_000_000, saved: 12_000_000, dueDate: '2027-08-01', icon: 'gem' },
  { name: 'Seserahan utama', category: 'Lamaran', target: 12_000_000, saved: 4_500_000, dueDate: '2027-07-01', icon: 'sparkles' },
  { name: 'Gedung & katering', category: 'Pernikahan', target: 45_000_000, saved: 18_000_000, dueDate: '2027-01-01', icon: 'heart' },
  { name: 'Pakaian adat Sunda', category: 'Busana', target: 8_500_000, saved: 2_500_000, dueDate: '2027-01-01', icon: 'shirt' },
  { name: 'Dekorasi pelaminan', category: 'Pernikahan', target: 15_000_000, saved: 3_500_000, dueDate: '2027-02-01', icon: 'sparkles' },
  { name: 'Fotografer & videografer', category: 'Pernikahan', target: 9_500_000, saved: 2_500_000, dueDate: '2027-03-01', icon: 'heart' },
  { name: 'Mahar & perlengkapan akad', category: 'Lamaran', target: 7_000_000, saved: 3_000_000, dueDate: '2027-06-01', icon: 'gem' },
  { name: 'Hantaran keluarga', category: 'Lamaran', target: 5_500_000, saved: 1_800_000, dueDate: '2027-06-01', icon: 'sparkles' },
  { name: 'Makeup & tata rias', category: 'Busana', target: 6_500_000, saved: 1_200_000, dueDate: '2027-04-01', icon: 'shirt' },
  { name: 'Undangan & souvenir', category: 'Pernikahan', target: 8_000_000, saved: 1_500_000, dueDate: '2027-04-01', icon: 'heart' },
  { name: 'Seserahan keluarga', category: 'Lamaran', target: 4_500_000, saved: 1_000_000, dueDate: '2027-07-01', icon: 'sparkles' },
]

async function main() {
  await db.insert(profile).values({ id: 1, nameOne: 'Adinda', nameTwo: 'Dimas', targetDate: '2027-07-24' }).onConflictDoNothing()

  const [{ value: existing }] = await db.select({ value: count() }).from(planItems)
  if (existing > 0) {
    console.log(`Lewati seed: sudah ada ${existing} rencana di database.`)
    return
  }

  const inserted = await db.insert(planItems).values(items).returning({ id: planItems.id, saved: planItems.saved })

  // Saldo awal tiap item dicatat sebagai satu setoran supaya buku besar cocok dengan kolom saved.
  await db.insert(deposits).values(inserted.filter(row => row.saved > 0).map(row => ({ itemId: row.id, amount: row.saved })))

  const day = 86_400_000
  await db.insert(activities).values([
    { title: 'Target cincin diperbarui', detail: 'Disesuaikan bersama', createdAt: new Date('2026-11-12T10:00:00+07:00') },
    { title: 'Venue mulai masuk shortlist', detail: 'Catatan perencanaan', createdAt: new Date(Date.now() - day) },
    { title: 'Tabungan seserahan bertambah', detail: 'Setoran rutin bulanan', amount: 1_500_000, createdAt: new Date() },
  ])

  console.log(`Seed selesai: ${inserted.length} rencana, ${inserted.length} setoran awal, 3 aktivitas.`)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})

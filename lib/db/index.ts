import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL belum diatur. Salin .env.example menjadi .env lalu isi koneksi Neon.')
  }
  return drizzle({ client: neon(url), schema })
}

let db: ReturnType<typeof createDb> | undefined

// Dibuat saat pertama dipakai, supaya `next build` tidak gagal kalau env belum ada.
export function getDb() {
  return (db ??= createDb())
}

export { schema }

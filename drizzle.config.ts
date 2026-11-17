import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env', quiet: true })

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL belum diatur. Salin .env.example menjadi .env lalu isi koneksi Neon.')
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
})

# Rangkai

Aplikasi perencanaan tabungan lamaran dan pernikahan. Dibangun dengan Next.js 16, shadcn (gaya base-nova), Base UI, Ark UI, Drizzle ORM, dan PostgreSQL di Neon.

## Menjalankan secara lokal

```bash
corepack pnpm install
cp .env.example .env   # lalu isi DATABASE_URL dengan connection string Neon
corepack pnpm db:migrate
corepack pnpm db:seed  # opsional: data contoh, hanya mengisi kalau tabel kosong
corepack pnpm dev
```

## Skrip database

| Skrip | Fungsi |
| --- | --- |
| `pnpm db:generate` | Membuat file migrasi baru di `drizzle/` dari perubahan `lib/db/schema.ts` |
| `pnpm db:migrate` | Menjalankan migrasi ke database di `DATABASE_URL` |
| `pnpm db:seed` | Mengisi data contoh awal |
| `pnpm db:studio` | Membuka Drizzle Studio untuk melihat isi tabel |

## Struktur data

- `profile`: nama pasangan dan tanggal target (satu baris)
- `plan_items`: rencana & kebutuhan beserta target dan jumlah terkumpul
- `deposits`: catatan tiap setoran (jumlahnya per item selalu sama dengan `plan_items.saved`)
- `activities`: linimasa

## Komponen UI

- **Base UI** (`@base-ui/react`): dialog "Tambah kebutuhan" dan "Catat tabungan" (`components/form-dialog.tsx`), serta tombol shadcn.
- **Ark UI** (`@ark-ui/react`): input nominal rupiah dengan format otomatis dan tombol +/− (`components/money-input.tsx`).

## Deploy

Saat deploy (misalnya ke Vercel), tambahkan environment variable `DATABASE_URL`. File `.env` tidak ikut di-commit.

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

## Fitur kelola data (CRUD)

| Data | Tambah | Ubah | Hapus | Tempat di UI |
| --- | --- | --- | --- | --- |
| Kategori | ✓ | nama & ikon (ikut memperbarui semua kebutuhannya) | ✓, diblokir kalau masih dipakai | tombol **Kelola kategori** |
| Kebutuhan | ✓ | nama, kategori, target, bulan target | ✓, setorannya ikut terhapus | tombol **Tambah kebutuhan** dan ikon pensil di tiap baris |
| Setoran | ✓ (dengan catatan) | jumlah & catatan | ✓ | tombol **+** di tiap baris (riwayat setoran) |
| Linimasa | catatan sendiri | judul & keterangan | ✓ | tombol **···** atau **Kelola linimasa** |
| Profil | – | nama pasangan & tanggal target | – | bagian **Pengaturan** |

Total terkumpul tiap kebutuhan selalu dihitung ulang dari riwayat setoran di dalam satu transaksi, jadi angkanya tidak bisa melenceng.

## Struktur data

- `profile`: nama pasangan dan tanggal target (satu baris)
- `categories`: kategori rencana dan ikonnya
- `plan_items`: rencana & kebutuhan beserta target dan jumlah terkumpul; `category` merujuk ke `categories.name` (ganti nama ikut, hapus diblokir kalau masih dipakai)
- `deposits`: catatan tiap setoran (jumlahnya per item selalu sama dengan `plan_items.saved`)
- `activities`: linimasa; aktivitas setoran terhubung lewat `deposit_id` dan ikut terhapus bersama setorannya

## Komponen UI

- **Base UI** (`@base-ui/react`): semua dialog (`components/form-dialog.tsx`), konfirmasi hapus dengan AlertDialog (`components/confirm-button.tsx`), serta tombol shadcn.
- **Ark UI** (`@ark-ui/react`): input nominal rupiah dengan format otomatis dan tombol +/− (`components/money-input.tsx`), dan pemilih ikon kategori dengan RadioGroup (`components/icon-picker.tsx`).

## Deploy

Saat deploy (misalnya ke Vercel), tambahkan environment variable `DATABASE_URL`. File `.env` tidak ikut di-commit.

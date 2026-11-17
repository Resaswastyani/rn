import { sql } from 'drizzle-orm'
import { bigint, check, date, index, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

// Profil pasangan. Aplikasi ini belum punya login, jadi hanya ada satu baris (id = 1).
export const profile = pgTable(
  'profile',
  {
    id: integer('id').primaryKey().default(1),
    nameOne: text('name_one').notNull(),
    nameTwo: text('name_two').notNull(),
    targetDate: date('target_date', { mode: 'string' }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => [check('profile_singleton', sql`${t.id} = 1`)],
)

// Kategori rencana. Item merujuk ke nama kategori, jadi mengganti nama ikut memperbarui semua item.
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  icon: text('icon').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// Rencana & kebutuhan. Nominal dalam rupiah utuh.
export const planItems = pgTable(
  'plan_items',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    category: text('category')
      .notNull()
      .references(() => categories.name, { onUpdate: 'cascade', onDelete: 'restrict' }),
    icon: text('icon').notNull(),
    target: bigint('target', { mode: 'number' }).notNull(),
    saved: bigint('saved', { mode: 'number' }).notNull().default(0),
    dueDate: date('due_date', { mode: 'string' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => [
    check('plan_items_target_positive', sql`${t.target} > 0`),
    check('plan_items_saved_non_negative', sql`${t.saved} >= 0`),
  ],
)

// Buku besar setoran. Jumlah per item selalu sama dengan plan_items.saved.
export const deposits = pgTable(
  'deposits',
  {
    id: serial('id').primaryKey(),
    itemId: integer('item_id')
      .notNull()
      .references(() => planItems.id, { onDelete: 'cascade' }),
    amount: bigint('amount', { mode: 'number' }).notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => [index('deposits_item_id_idx').on(t.itemId), check('deposits_amount_positive', sql`${t.amount} > 0`)],
)

// Linimasa aktivitas. Aktivitas yang lahir dari setoran ikut terhapus bila setorannya dihapus.
export const activities = pgTable(
  'activities',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    detail: text('detail').notNull(),
    amount: bigint('amount', { mode: 'number' }),
    itemId: integer('item_id').references(() => planItems.id, { onDelete: 'set null' }),
    depositId: integer('deposit_id').references(() => deposits.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => [index('activities_created_at_idx').on(t.createdAt), index('activities_deposit_id_idx').on(t.depositId)],
)

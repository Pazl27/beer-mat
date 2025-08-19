import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { ItemType } from '@/types';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  totalDebt: integer('total_debt').notNull().default(0), // total debt in cents
});


export const items = sqliteTable('items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type', { enum: [ItemType.Drink, ItemType.Food] }).notNull(),
  price: integer('price').notNull(), // price in cents to avoid floating point issues
});

export const userItems = sqliteTable('user_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  itemId: integer('item_id').notNull().references(() => items.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
});

export type User = typeof users.$inferInsert;
export type Item = typeof items.$inferInsert;
export type UserItem = typeof userItems.$inferInsert;
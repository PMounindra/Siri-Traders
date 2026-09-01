import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { products } from './products.js';

export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull().unique(),
  availableStock: integer('available_stock').default(50).notNull(),
  reservedStock: integer('reserved_stock').default(0).notNull(),
  damagedStock: integer('damaged_stock').default(0).notNull(),
  returnedStock: integer('returned_stock').default(0).notNull(),
  expiredStock: integer('expired_stock').default(0).notNull(),
  incomingStock: integer('incoming_stock').default(0).notNull(),
  reorderLevel: integer('reorder_level').default(10).notNull(),
  costPrice: integer('cost_price').default(0).notNull(),
  expiryDate: text('expiry_date'),
  batchNumber: text('batch_number'),
  location: text('location').default('Main Shelf'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

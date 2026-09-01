import { pgTable, serial, integer, text, timestamp } from 'drizzle-orm/pg-core';

export const inventoryLogs = pgTable('inventory_logs', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  productName: text('product_name').notNull(),
  changeType: text('change_type').notNull(), // 'ADD', 'SUBTRACT', 'SET', 'DAMAGE', 'RETURN', 'EXPIRED', 'INCOMING_RECEIVE'
  quantity: integer('quantity').notNull(),
  stockBefore: integer('stock_before').notNull(),
  stockAfter: integer('stock_after').notNull(),
  reason: text('reason').notNull(),
  notes: text('notes'),
  batchNumber: text('batch_number'),
  adminName: text('admin_name').default('Admin'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

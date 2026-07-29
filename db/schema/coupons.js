import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  // Legacy free-text fields (kept for back-compat with the original seed rows)
  discount: integer('discount'),
  limit: integer('limit'),
  // Structured fields the checkout discount logic actually evaluates
  type: text('type').default('flat').notNull(), // 'flat' | 'percent' | 'freeDelivery'
  value: integer('value').default(0).notNull(),
  minOrder: integer('min_order').default(0).notNull(),
  maxDiscount: integer('max_discount'),
  title: text('title'),
  description: text('description'),
  customerType: text('customer_type').default('retail').notNull(), // 'retail' | 'wholesale'
  active: boolean('active').default(true)
});

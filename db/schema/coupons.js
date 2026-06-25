import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';

export const coupons = pgTable('coupons', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  discount: integer('discount').notNull(),
  limit: integer('limit'),
  active: boolean('active').default(true)
});

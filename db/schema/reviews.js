import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull(),
  productName: text('product_name').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  rating: integer('rating').notNull(), // 1 to 5
  title: text('title'),
  comment: text('comment'),
  status: text('status').default('Approved'), // 'Approved' | 'Pending' | 'Rejected'
  createdAt: timestamp('created_at').defaultNow().notNull()
});

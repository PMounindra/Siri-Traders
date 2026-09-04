import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: integer('product_id'), // null for combo/festive-offer line items with no real product
  orderItemId: integer('order_item_id'), // anchors the review to a specific purchased line item — required when productId is null
  productName: text('product_name').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  rating: integer('rating').notNull(), // 1 to 5
  title: text('title'),
  comment: text('comment'),
  status: text('status').default('Approved'), // 'Approved' | 'Pending' | 'Rejected'
  createdAt: timestamp('created_at').defaultNow().notNull()
});

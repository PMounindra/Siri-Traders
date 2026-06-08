import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID
  total: integer('total').notNull(),
  status: text('status').default('Pending'), // 'Pending', 'Preparing', 'In Transit', 'Delivered', 'Paid'
  deliveryAddress: text('delivery_address'),
  paymentMethod: text('payment_method'),
  createdAt: text('created_at').default(new Date().toISOString())
});

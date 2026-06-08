import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { orders } from './orders.js';
import { products } from './products.js';

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
  weight: text('weight'),
  unit: text('unit')
});

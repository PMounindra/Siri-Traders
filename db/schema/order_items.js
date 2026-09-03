import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { orders } from './orders.js';
import { products } from './products.js';

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  // Nullable: promotional/combo offer line items have no backing product row.
  productId: integer('product_id').references(() => products.id, { onDelete: 'restrict' }),
  name: text('name').notNull(),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
  weight: text('weight'),
  unit: text('unit')
});

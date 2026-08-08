import { pgTable, serial, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { categories } from './categories.js';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').references(() => categories.id).notNull(),
  brand: text('brand'),
  weight: text('weight'),
  unit: text('unit'),
  price: integer('price').notNull(),
  mrp: integer('mrp'),
  discount: integer('discount'),
  image: text('image'),
  description: text('description'),
  inStock: boolean('in_stock').default(true),
  deliveryTime: text('delivery_time').default('15 mins'),
  isBestseller: boolean('is_bestseller').default(false),
  isTodaysDeal: boolean('is_todays_deal').default(false),
  variants: jsonb('variants')
});

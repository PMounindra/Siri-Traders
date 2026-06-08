import { pgTable, text, integer } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: text('id').primaryKey(), // e.g., 'pulses', 'rice'
  name: text('name').notNull(),
  image: text('image'),
  color: text('color'),
  itemCount: integer('item_count').default(0)
});

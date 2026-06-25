import { pgTable, text, integer, boolean } from 'drizzle-orm/pg-core';

export const offers = pgTable('offers', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  price: integer('price').notNull(),
  mrp: integer('mrp').notNull(),
  badge: text('badge'),
  image: text('image'),
  link: text('link'),
  groupType: text('group_type').default('daily'), // 'daily' or 'festival'
  active: boolean('active').default(true)
});

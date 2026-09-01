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
  type: text('type').default('Sale offer'), // 'Sale offer' | 'BOGO' | 'Buy X Get Y' | 'Festive Deal' | 'Clearance'
  buyQty: integer('buy_qty').default(1),
  getQty: integer('get_qty').default(1),
  targetCategory: text('target_category'),
  targetProductId: integer('target_product_id'),
  startDate: text('start_date'),
  endDate: text('end_date'),
  usageLimit: integer('usage_limit'),
  timesClaimed: integer('times_claimed').default(0),
  active: boolean('active').default(true)
});

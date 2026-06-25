import { pgTable, text, boolean } from 'drizzle-orm/pg-core';

export const deliveryZones = pgTable('delivery_zones', {
  id: text('id').primaryKey(),
  area: text('area').notNull(),
  pincode: text('pincode').notNull().unique(),
  time: text('time').notNull(),
  distance: text('distance'),
  active: boolean('active').default(true)
});

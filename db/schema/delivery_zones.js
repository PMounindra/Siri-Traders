import { pgTable, text, boolean, integer } from 'drizzle-orm/pg-core';

export const deliveryZones = pgTable('delivery_zones', {
  id: text('id').primaryKey(),
  area: text('area').notNull(),
  pincode: text('pincode').notNull(),
  time: text('time').notNull(),
  distance: text('distance'),
  active: boolean('active').default(true),
  deliveryFee: integer('delivery_fee').default(0).notNull(),
  freeDeliveryThreshold: integer('free_delivery_threshold').default(0).notNull(),
  handlingCharge: integer('handling_charge').default(0).notNull()
});

import { pgTable, text, integer } from 'drizzle-orm/pg-core';

// Single-row table (id is always 'default') holding site-wide checkout settings
export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  deliveryFee: integer('delivery_fee').notNull().default(25),
  freeDeliveryThreshold: integer('free_delivery_threshold').notNull().default(500),
  handlingCharge: integer('handling_charge').notNull().default(5)
});

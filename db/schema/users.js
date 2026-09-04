import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').unique().notNull(),
  name: text('name'),
  phone: text('phone'),
  role: text('role').default('customer').notNull(), // 'customer', 'admin'
  segmentOverride: text('segment_override'), // admin-assigned 'VIP' | 'Returning' | 'New' | 'Inactive' — null means auto-computed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

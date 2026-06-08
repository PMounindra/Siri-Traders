import { pgTable, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: text('email').unique().notNull(),
  name: text('name'),
  phone: text('phone'),
  role: text('role').default('customer') // 'customer', 'admin'
});

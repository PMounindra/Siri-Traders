import { pgTable, serial, text, integer, boolean } from 'drizzle-orm/pg-core';

export const cmsFaqs = pgTable('cms_faqs', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  category: text('category').default('General'), // 'Delivery' | 'Orders' | 'Payments' | 'Quality' | 'General'
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true)
});

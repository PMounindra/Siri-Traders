import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const cmsPages = pgTable('cms_pages', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('general'), // 'legal' | 'general' | 'policy'
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  isPublished: boolean('is_published').default(true),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

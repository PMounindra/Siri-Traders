import { pgTable, serial, text, boolean, timestamp } from 'drizzle-orm/pg-core';

export const cmsBlogs = pgTable('cms_blogs', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  author: text('author').default('Siri Traders Editorial'),
  category: text('category').default('Grocery Tips'),
  coverImage: text('cover_image'),
  tags: text('tags'),
  isPublished: boolean('is_published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

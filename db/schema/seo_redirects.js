import { pgTable, serial, text, integer, boolean } from 'drizzle-orm/pg-core';

export const seoRedirects = pgTable('seo_redirects', {
  id: serial('id').primaryKey(),
  sourcePath: text('source_path').notNull().unique(),
  targetPath: text('target_path').notNull(),
  statusCode: integer('status_code').default(301),
  hits: integer('hits').default(0),
  active: boolean('active').default(true)
});

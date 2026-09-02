import { pgTable, serial, text, integer, boolean } from 'drizzle-orm/pg-core';

export const cmsBanners = pgTable('cms_banners', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  image: text('image').notNull(),
  mobileImage: text('mobile_image'),
  ctaText: text('cta_text').default('Shop Now'),
  ctaLink: text('cta_link').default('/categories'),
  type: text('type').default('hero'), // 'hero' | 'promo_strip' | 'sidebar'
  sortOrder: integer('sort_order').default(0),
  active: boolean('active').default(true)
});

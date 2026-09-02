import { pgTable, text, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
  id: text('id').primaryKey(),
  deliveryFee: integer('delivery_fee').notNull().default(25),
  freeDeliveryThreshold: integer('free_delivery_threshold').notNull().default(500),
  handlingCharge: integer('handling_charge').notNull().default(5),
  // Announcement Bar
  announcementText: text('announcement_text'),
  announcementBg: text('announcement_bg').default('#1C4B12'),
  announcementColor: text('announcement_color').default('#FFFFFF'),
  announcementLink: text('announcement_link').default('/categories'),
  announcementActive: boolean('announcement_active').default(true),
  // Global SEO & Metadata
  metaTitle: text('meta_title'),
  metaDescription: text('meta_description'),
  canonicalUrl: text('canonical_url').default('https://www.siritrader.com'),
  ogImage: text('og_image'),
  robotsIndex: boolean('robots_index').default(true),
  googleSiteVerification: text('google_site_verification'),
  schemaJson: text('schema_json'),
  sitemapEnabled: boolean('sitemap_enabled').default(true),
  // Navigation Menus
  headerMenu: jsonb('header_menu'),
  footerMenu: jsonb('footer_menu')
});

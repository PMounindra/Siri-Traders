import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('--- Starting CMS & SEO Database Migration ---');

  // 1. Enhance settings table
  console.log('1. Enhancing settings table with CMS and SEO columns...');
  await sql`
    ALTER TABLE settings
    ADD COLUMN IF NOT EXISTS announcement_text TEXT DEFAULT '⚡ Free 15-min delivery across Hyderabad on orders above ₹499!',
    ADD COLUMN IF NOT EXISTS announcement_bg VARCHAR(32) DEFAULT '#1C4B12',
    ADD COLUMN IF NOT EXISTS announcement_color VARCHAR(32) DEFAULT '#FFFFFF',
    ADD COLUMN IF NOT EXISTS announcement_link VARCHAR(255) DEFAULT '/categories',
    ADD COLUMN IF NOT EXISTS announcement_active BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255) DEFAULT 'Siri Traders — Fresh Groceries & Wholesale Supermarket in Hyderabad',
    ADD COLUMN IF NOT EXISTS meta_description TEXT DEFAULT 'Order fresh groceries, premium basmati rice, unpolished pulses, cold-pressed edible oils, and daily essentials online from Siri Traders with fast 15-minute delivery.',
    ADD COLUMN IF NOT EXISTS canonical_url VARCHAR(255) DEFAULT 'https://www.siritrader.com',
    ADD COLUMN IF NOT EXISTS og_image TEXT DEFAULT 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
    ADD COLUMN IF NOT EXISTS robots_index BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS google_site_verification VARCHAR(128) DEFAULT 'google-site-verification-siri-traders-2026',
    ADD COLUMN IF NOT EXISTS schema_json TEXT DEFAULT '{"@context":"https://schema.org","@type":"GroceryStore","name":"Siri Traders","image":"https://www.siritrader.com/logo-mark.webp","telephone":"+919849012345","priceRange":"₹₹","address":{"@type":"PostalAddress","streetAddress":"Kukatpally Main Road","addressLocality":"Hyderabad","addressRegion":"Telangana","postalCode":"500072","addressCountry":"IN"}}',
    ADD COLUMN IF NOT EXISTS sitemap_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS header_menu JSONB DEFAULT '[{"label":"All Groceries","url":"/categories"},{"label":"Bestsellers","url":"/bestsellers"},{"label":"Offers","url":"/festive-offers"},{"label":"Wholesale","url":"/wholesale"}]'::jsonb,
    ADD COLUMN IF NOT EXISTS footer_menu JSONB DEFAULT '[{"label":"About Us","url":"/info?tab=about"},{"label":"Contact","url":"/info?tab=contact"},{"label":"Privacy Policy","url":"/info?tab=privacy"},{"label":"Terms","url":"/info?tab=terms"}]'::jsonb;
  `;

  // 2. Create cms_banners table
  console.log('2. Creating cms_banners table...');
  await sql`
    CREATE TABLE IF NOT EXISTS cms_banners (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      subtitle TEXT,
      image TEXT NOT NULL,
      mobile_image TEXT,
      cta_text VARCHAR(64) DEFAULT 'Shop Now',
      cta_link VARCHAR(255) DEFAULT '/categories',
      type VARCHAR(32) DEFAULT 'hero',
      sort_order INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT TRUE
    );
  `;

  // 3. Create cms_pages table
  console.log('3. Creating cms_pages table...');
  await sql`
    CREATE TABLE IF NOT EXISTS cms_pages (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(128) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      category VARCHAR(64) DEFAULT 'general',
      meta_title VARCHAR(255),
      meta_description TEXT,
      is_published BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // 4. Create cms_faqs table
  console.log('4. Creating cms_faqs table...');
  await sql`
    CREATE TABLE IF NOT EXISTS cms_faqs (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      category VARCHAR(64) DEFAULT 'General',
      sort_order INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT TRUE
    );
  `;

  // 5. Create cms_blogs table
  console.log('5. Creating cms_blogs table...');
  await sql`
    CREATE TABLE IF NOT EXISTS cms_blogs (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(128) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      author VARCHAR(128) DEFAULT 'Siri Traders Editorial',
      category VARCHAR(64) DEFAULT 'Grocery Tips',
      cover_image TEXT,
      tags VARCHAR(255),
      is_published BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `;

  // 6. Create seo_redirects table
  console.log('6. Creating seo_redirects table...');
  await sql`
    CREATE TABLE IF NOT EXISTS seo_redirects (
      id SERIAL PRIMARY KEY,
      source_path VARCHAR(255) UNIQUE NOT NULL,
      target_path VARCHAR(255) NOT NULL,
      status_code INTEGER DEFAULT 301,
      hits INTEGER DEFAULT 0,
      active BOOLEAN DEFAULT TRUE
    );
  `;

  // 7. Seed initial CMS content if empty
  const bannerCount = await sql`SELECT COUNT(*) as count FROM cms_banners;`;
  if (Number(bannerCount[0]?.count || 0) === 0) {
    console.log('7. Backfilling initial hero banners...');
    await sql`
      INSERT INTO cms_banners (title, subtitle, image, cta_text, cta_link, type, sort_order, active)
      VALUES
        ('Farm Fresh Groceries at Unbeatable Wholesale Rates', 'Save up to 35% on daily staples, premium basmati rice and pure cold-pressed oils.', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&q=80', 'Explore Catalog', '/categories', 'hero', 1, true),
        ('Festival Mega Sale & BOGO Specials', 'Festive combo deals, festive dry fruits boxes, and instant 15-min delivery.', 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1600&q=80', 'View Festive Deals', '/festive-offers', 'hero', 2, true),
        ('Bulk & Wholesale B2B Grocery Packs', 'Direct-from-mill pricing for restaurants, caterers, and supermarkets across Telangana.', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=1600&q=80', 'Wholesale Orders', '/wholesale', 'hero', 3, true);
    `;
  }

  const pageCount = await sql`SELECT COUNT(*) as count FROM cms_pages;`;
  if (Number(pageCount[0]?.count || 0) === 0) {
    console.log('8. Backfilling static and legal pages...');
    await sql`
      INSERT INTO cms_pages (slug, title, content, category, meta_title, meta_description, is_published)
      VALUES
        ('about-us', 'About Siri Traders', 'Siri Traders is Hyderabad’s premier grocery and wholesale merchant, delivering pure, unadulterated staples directly from verified farmers and mills to your kitchen. Founded with a commitment to uncompromised quality, fast 15-minute delivery, and wholesale transparent pricing.', 'general', 'About Us — Siri Traders Hyderabad', 'Learn about Siri Traders, our heritage, farm sourcing, and 15-minute grocery delivery in Hyderabad.', true),
        ('privacy-policy', 'Privacy Policy', 'At Siri Traders, we value your privacy. We collect minimal customer information (such as name, phone number, and delivery address) strictly to fulfill your orders and improve our doorstep delivery experience. We never sell or share your personal data with third-party marketers.', 'legal', 'Privacy Policy — Siri Traders', 'Official Privacy Policy detailing data collection, order processing, and security practices at Siri Traders.', true),
        ('terms-and-conditions', 'Terms & Conditions', 'By accessing or placing orders through Siri Traders website or app, you agree to our standard terms of trade, pricing transparency, verified delivery slot commitments, and acceptable payment gateways.', 'legal', 'Terms & Conditions — Siri Traders', 'Official Terms and Conditions for grocery ordering, delivery zones, and customer service.', true),
        ('shipping-policy', 'Shipping & Delivery Policy', 'We provide hyper-local fast grocery delivery in 15 to 45 minutes across Hyderabad, alongside scheduled morning and evening time slots. Free delivery is provided on all orders exceeding ₹499.', 'policy', 'Shipping & Delivery Policy — Siri Traders', 'Details on delivery slots, shipping fees, free delivery thresholds, and serviceable pincodes.', true),
        ('refund-policy', 'Return & Refund Policy', 'We offer a 100% satisfaction guarantee. If any grocery item arrives damaged, defective, or past its expiration date, we provide instant doorstep replacement or full refund credited back within 24-48 hours.', 'policy', 'Return & Refund Policy — Siri Traders', 'Hassle-free grocery return policy, damage claims, and instant refund processing guidelines.', true);
    `;
  }

  const faqCount = await sql`SELECT COUNT(*) as count FROM cms_faqs;`;
  if (Number(faqCount[0]?.count || 0) === 0) {
    console.log('9. Backfilling frequently asked questions (FAQs)...');
    await sql`
      INSERT INTO cms_faqs (question, answer, category, sort_order, active)
      VALUES
        ('How fast is grocery delivery in Hyderabad?', 'We offer express delivery within 15-30 minutes for serviceable pincodes in Kukatpally, Madhapur, Gachibowli, and surrounding localities.', 'Delivery', 1, true),
        ('What is the minimum order value for free delivery?', 'Free delivery is automatically applied on all orders above ₹499. For smaller orders, a nominal delivery fee of ₹25 applies.', 'Delivery', 2, true),
        ('What payment methods do you accept?', 'We accept Cash on Delivery (COD), UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking.', 'Payments', 3, true),
        ('Can I return an item if I am not satisfied with quality?', 'Yes! We offer a no-questions-asked return policy at the time of delivery or within 24 hours for packaged groceries.', 'Quality', 4, true),
        ('Do you offer bulk pricing for restaurants and caterers?', 'Yes, we have a dedicated Wholesale section offering 25kg bags, 15L tins, and commercial carton packs at wholesale mill rates.', 'Orders', 5, true);
    `;
  }

  const blogCount = await sql`SELECT COUNT(*) as count FROM cms_blogs;`;
  if (Number(blogCount[0]?.count || 0) === 0) {
    console.log('10. Backfilling grocery tips and recipes blog...');
    await sql`
      INSERT INTO cms_blogs (slug, title, excerpt, content, author, category, cover_image, tags, is_published)
      VALUES
        ('how-to-choose-best-basmati-rice', 'How to Choose the Best Basmati Rice for Authentic Hyderabadi Biryani', 'Learn how grain elongation, 2-year aging, and aroma distinguish authentic Biryani basmati from ordinary rice.', 'Basmati rice is the crowning jewel of Hyderabadi cuisine. In this guide, our master grain tasters explain the importance of grain length, aging processes, and moisture content for cooking fluffy, aromatic Biryani.', 'Chef Rajesh Kumar', 'Recipes', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&q=80', 'Basmati, Biryani, Rice, Cooking Tips', true),
        ('benefits-of-unpolished-pulses', 'Why You Should Switch to Unpolished Pulses & Dals for Daily Nutrition', 'Discover how unpolished toor dal, moong dal, and chana dal retain natural dietary fiber, protein, and minerals.', 'Unlike machine-polished dals treated with oil or water, unpolished dals retain their natural outer husk rich in dietary fiber and essential micronutrients. Siri Traders brings you unpolished dals directly from natural farms.', 'Dr. S. Reddy', 'Healthy Eating', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80', 'Dals, Nutrition, Healthy Diet, Pulses', true);
    `;
  }

  const redirectCount = await sql`SELECT COUNT(*) as count FROM seo_redirects;`;
  if (Number(redirectCount[0]?.count || 0) === 0) {
    console.log('11. Backfilling initial 301 redirects...');
    await sql`
      INSERT INTO seo_redirects (source_path, target_path, status_code, hits, active)
      VALUES
        ('/rice-deals', '/categories', 301, 42, true),
        ('/oil-offers', '/festive-offers', 301, 18, true),
        ('/bulk-order', '/wholesale', 301, 35, true);
    `;
  }

  console.log('✅ CMS & SEO Database Migration Complete!');
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

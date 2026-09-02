import { db, settings, cmsBanners, cmsPages, cmsFaqs, cmsBlogs, seoRedirects } from '../db/index.js';
import { eq, asc, desc } from 'drizzle-orm';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

const DEFAULTS = {
  id: 'default',
  deliveryFee: 25,
  freeDeliveryThreshold: 500,
  handlingCharge: 5,
  announcementText: '⚡ Free 15-min delivery across Hyderabad on orders above ₹499!',
  announcementBg: '#1C4B12',
  announcementColor: '#FFFFFF',
  announcementLink: '/categories',
  announcementActive: true,
  metaTitle: 'Siri Traders — Fresh Groceries & Wholesale Supermarket in Hyderabad',
  metaDescription: 'Order fresh groceries, premium basmati rice, unpolished pulses, cold-pressed edible oils, and daily essentials online from Siri Traders with fast 15-minute delivery.',
  canonicalUrl: 'https://www.siritrader.com',
  ogImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
  robotsIndex: true,
  googleSiteVerification: 'google-site-verification-siri-traders-2026',
  schemaJson: '{"@context":"https://schema.org","@type":"GroceryStore","name":"Siri Traders","image":"https://www.siritrader.com/logo-mark.webp","telephone":"+919849012345","priceRange":"₹₹","address":{"@type":"PostalAddress","streetAddress":"Kukatpally Main Road","addressLocality":"Hyderabad","addressRegion":"Telangana","postalCode":"500072","addressCountry":"IN"}}',
  sitemapEnabled: true
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, id } = req.query;

  try {
    // ── 1. CMS Bulk Fetch: /api/settings?action=cms_all ─────────────────
    if (action === 'cms_all' && req.method === 'GET') {
      const [banners, pages, faqs, blogs, redirects, siteSettings] = await Promise.all([
        db.select().from(cmsBanners).orderBy(asc(cmsBanners.sortOrder)),
        db.select().from(cmsPages).orderBy(desc(cmsPages.updatedAt)),
        db.select().from(cmsFaqs).orderBy(asc(cmsFaqs.sortOrder)),
        db.select().from(cmsBlogs).orderBy(desc(cmsBlogs.createdAt)),
        db.select().from(seoRedirects).orderBy(desc(seoRedirects.hits)),
        db.select().from(settings).where(eq(settings.id, 'default'))
      ]);

      return res.status(200).json({
        banners,
        pages,
        faqs,
        blogs,
        redirects,
        settings: siteSettings[0] || DEFAULTS
      });
    }

    // ── 2. Banners CRUD: /api/settings?action=banner ─────────────────────
    if (action === 'banner') {
      if (req.method === 'GET') {
        const rows = await db.select().from(cmsBanners).orderBy(asc(cmsBanners.sortOrder));
        return res.status(200).json(rows);
      }

      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (req.method === 'POST') {
        const saved = await db.insert(cmsBanners).values({
          title: body.title,
          subtitle: body.subtitle || '',
          image: body.image,
          mobileImage: body.mobileImage || null,
          ctaText: body.ctaText || 'Shop Now',
          ctaLink: body.ctaLink || '/categories',
          type: body.type || 'hero',
          sortOrder: Number(body.sortOrder) || 0,
          active: body.active !== false
        }).returning();
        return res.status(201).json(saved[0]);
      }

      if (req.method === 'PUT' && id) {
        const updated = await db.update(cmsBanners).set({
          title: body.title,
          subtitle: body.subtitle,
          image: body.image,
          mobileImage: body.mobileImage,
          ctaText: body.ctaText,
          ctaLink: body.ctaLink,
          type: body.type,
          sortOrder: Number(body.sortOrder) || 0,
          active: body.active !== false
        }).where(eq(cmsBanners.id, Number(id))).returning();
        return res.status(200).json(updated[0]);
      }

      if (req.method === 'DELETE' && id) {
        await db.delete(cmsBanners).where(eq(cmsBanners.id, Number(id)));
        return res.status(200).json({ success: true, id });
      }
    }

    // ── 3. Pages CRUD: /api/settings?action=page ─────────────────────────
    if (action === 'page') {
      if (req.method === 'GET') {
        const rows = await db.select().from(cmsPages).orderBy(desc(cmsPages.updatedAt));
        return res.status(200).json(rows);
      }

      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (req.method === 'POST') {
        const saved = await db.insert(cmsPages).values({
          slug: (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, ''),
          title: body.title,
          content: body.content || '',
          category: body.category || 'general',
          metaTitle: body.metaTitle || body.title,
          metaDescription: body.metaDescription || '',
          isPublished: body.isPublished !== false
        }).returning();
        return res.status(201).json(saved[0]);
      }

      if (req.method === 'PUT' && id) {
        const updated = await db.update(cmsPages).set({
          slug: body.slug,
          title: body.title,
          content: body.content,
          category: body.category,
          metaTitle: body.metaTitle,
          metaDescription: body.metaDescription,
          isPublished: body.isPublished !== false,
          updatedAt: new Date()
        }).where(eq(cmsPages.id, Number(id))).returning();
        return res.status(200).json(updated[0]);
      }

      if (req.method === 'DELETE' && id) {
        await db.delete(cmsPages).where(eq(cmsPages.id, Number(id)));
        return res.status(200).json({ success: true, id });
      }
    }

    // ── 4. FAQs CRUD: /api/settings?action=faq ───────────────────────────
    if (action === 'faq') {
      if (req.method === 'GET') {
        const rows = await db.select().from(cmsFaqs).orderBy(asc(cmsFaqs.sortOrder));
        return res.status(200).json(rows);
      }

      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (req.method === 'POST') {
        const saved = await db.insert(cmsFaqs).values({
          question: body.question,
          answer: body.answer,
          category: body.category || 'General',
          sortOrder: Number(body.sortOrder) || 0,
          active: body.active !== false
        }).returning();
        return res.status(201).json(saved[0]);
      }

      if (req.method === 'PUT' && id) {
        const updated = await db.update(cmsFaqs).set({
          question: body.question,
          answer: body.answer,
          category: body.category,
          sortOrder: Number(body.sortOrder) || 0,
          active: body.active !== false
        }).where(eq(cmsFaqs.id, Number(id))).returning();
        return res.status(200).json(updated[0]);
      }

      if (req.method === 'DELETE' && id) {
        await db.delete(cmsFaqs).where(eq(cmsFaqs.id, Number(id)));
        return res.status(200).json({ success: true, id });
      }
    }

    // ── 5. Blog CRUD: /api/settings?action=blog ──────────────────────────
    if (action === 'blog') {
      if (req.method === 'GET') {
        const rows = await db.select().from(cmsBlogs).orderBy(desc(cmsBlogs.createdAt));
        return res.status(200).json(rows);
      }

      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (req.method === 'POST') {
        const saved = await db.insert(cmsBlogs).values({
          slug: (body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, ''),
          title: body.title,
          excerpt: body.excerpt || '',
          content: body.content || '',
          author: body.author || 'Siri Traders Team',
          category: body.category || 'Grocery Tips',
          coverImage: body.coverImage || '',
          tags: body.tags || '',
          isPublished: body.isPublished !== false
        }).returning();
        return res.status(201).json(saved[0]);
      }

      if (req.method === 'PUT' && id) {
        const updated = await db.update(cmsBlogs).set({
          slug: body.slug,
          title: body.title,
          excerpt: body.excerpt,
          content: body.content,
          author: body.author,
          category: body.category,
          coverImage: body.coverImage,
          tags: body.tags,
          isPublished: body.isPublished !== false
        }).where(eq(cmsBlogs.id, Number(id))).returning();
        return res.status(200).json(updated[0]);
      }

      if (req.method === 'DELETE' && id) {
        await db.delete(cmsBlogs).where(eq(cmsBlogs.id, Number(id)));
        return res.status(200).json({ success: true, id });
      }
    }

    // ── 6. Redirects CRUD: /api/settings?action=redirect ─────────────────
    if (action === 'redirect') {
      if (req.method === 'GET') {
        const rows = await db.select().from(seoRedirects).orderBy(desc(seoRedirects.hits));
        return res.status(200).json(rows);
      }

      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (req.method === 'POST') {
        const saved = await db.insert(seoRedirects).values({
          sourcePath: body.sourcePath,
          targetPath: body.targetPath,
          statusCode: Number(body.statusCode) || 301,
          hits: Number(body.hits) || 0,
          active: body.active !== false
        }).returning();
        return res.status(201).json(saved[0]);
      }

      if (req.method === 'PUT' && id) {
        const updated = await db.update(seoRedirects).set({
          sourcePath: body.sourcePath,
          targetPath: body.targetPath,
          statusCode: Number(body.statusCode) || 301,
          hits: Number(body.hits) || 0,
          active: body.active !== false
        }).where(eq(seoRedirects.id, Number(id))).returning();
        return res.status(200).json(updated[0]);
      }

      if (req.method === 'DELETE' && id) {
        await db.delete(seoRedirects).where(eq(seoRedirects.id, Number(id)));
        return res.status(200).json({ success: true, id });
      }
    }

    // ── 7. Global Settings & SEO: /api/settings ──────────────────────────
    if (req.method === 'GET') {
      const rows = await db.select().from(settings).where(eq(settings.id, 'default'));
      return res.status(200).json(rows[0] || DEFAULTS);
    }

    if (req.method === 'PUT') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const values = {
        id: 'default',
        deliveryFee: Number.isFinite(Number(body.deliveryFee)) ? Number(body.deliveryFee) : DEFAULTS.deliveryFee,
        freeDeliveryThreshold: Number.isFinite(Number(body.freeDeliveryThreshold)) ? Number(body.freeDeliveryThreshold) : DEFAULTS.freeDeliveryThreshold,
        handlingCharge: Number.isFinite(Number(body.handlingCharge)) ? Number(body.handlingCharge) : DEFAULTS.handlingCharge,
        announcementText: body.announcementText !== undefined ? body.announcementText : DEFAULTS.announcementText,
        announcementBg: body.announcementBg || DEFAULTS.announcementBg,
        announcementColor: body.announcementColor || DEFAULTS.announcementColor,
        announcementLink: body.announcementLink || DEFAULTS.announcementLink,
        announcementActive: body.announcementActive !== undefined ? Boolean(body.announcementActive) : true,
        metaTitle: body.metaTitle || DEFAULTS.metaTitle,
        metaDescription: body.metaDescription || DEFAULTS.metaDescription,
        canonicalUrl: body.canonicalUrl || DEFAULTS.canonicalUrl,
        ogImage: body.ogImage || DEFAULTS.ogImage,
        robotsIndex: body.robotsIndex !== undefined ? Boolean(body.robotsIndex) : true,
        googleSiteVerification: body.googleSiteVerification || DEFAULTS.googleSiteVerification,
        schemaJson: body.schemaJson || DEFAULTS.schemaJson,
        sitemapEnabled: body.sitemapEnabled !== undefined ? Boolean(body.sitemapEnabled) : true,
        headerMenu: body.headerMenu || null,
        footerMenu: body.footerMenu || null
      };

      const saved = await db.insert(settings).values(values).onConflictDoUpdate({
        target: settings.id,
        set: values
      }).returning();

      return res.status(200).json(saved[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/settings:', error);
    return res.status(500).json({ error: 'Something went wrong: ' + error.message });
  }
}

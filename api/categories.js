import { db, categories, products } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    // ── Collection: /api/categories ────────────────────────────────────
    if (!id) {
      if (req.method === 'GET') {
        const allCategories = await db.select().from(categories);
        // Cache categories list aggressively: categories change very rarely
        res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600');
        return res.status(200).json(allCategories);
      }

      if (req.method === 'POST') {
        const adminOk = await isAdminRequest(req);
        if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const name = String(body.name || '').trim();
        if (!name) return res.status(400).json({ error: 'name is required' });

        const catId = body.id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const saved = await db.insert(categories).values({
          id: catId,
          name,
          image: body.image || '',
          color: body.color || '#F1F8E9',
          itemCount: 0
        }).returning();

        return res.status(201).json(saved[0]);
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Item: /api/categories?id=:id ───────────────────────────────────
    if (req.method === 'DELETE') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const existing = await db.select().from(categories).where(eq(categories.id, id));
      if (!existing.length) return res.status(404).json({ error: 'Category not found' });

      await db.delete(products).where(eq(products.category, id));
      await db.delete(categories).where(eq(categories.id, id));
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'A category with that name already exists' });
    }
    console.error("Database error in /api/categories:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

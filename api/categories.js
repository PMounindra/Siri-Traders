import { db, categories, products } from '../db/index.js';
import { eq, or } from 'drizzle-orm';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const allCategories = await db.select().from(categories);
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.status(200).json(allCategories || []);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    const adminOk = await isAdminRequest(req);
    if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const name = String(body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Category name is required' });

      let catId = body.id || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      if (!catId) catId = `cat-${Date.now()}`;

      // Check if category ID already exists
      const existing = await db.select().from(categories).where(eq(categories.id, catId));
      if (existing.length > 0) {
        catId = `${catId}-${Date.now().toString().slice(-4)}`;
      }

      const saved = await db.insert(categories).values({
        id: catId,
        name,
        image: body.image || '',
        color: body.color || '#F1F8E9',
        itemCount: 0
      }).returning();

      return res.status(201).json(saved[0]);
    } catch (err) {
      console.error('Error creating category:', err);
      return res.status(500).json({ error: `Failed to create category: ${err.message}` });
    }
  }

  if (req.method === 'DELETE') {
    const adminOk = await isAdminRequest(req);
    if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

    if (!id) return res.status(400).json({ error: 'Category ID is required for deletion' });

    try {
      const catId = String(id).trim();
      const targetCat = await db.select().from(categories).where(eq(categories.id, catId));
      const catName = targetCat[0]?.name;

      await db.delete(products).where(
        catName
          ? or(eq(products.category, catId), eq(products.category, catName))
          : eq(products.category, catId)
      ).catch(() => {});

      await db.delete(categories).where(eq(categories.id, catId));
      return res.status(200).json({ success: true, id: catId });
    } catch (err) {
      console.error('Error deleting category:', err);
      return res.status(500).json({ error: `Failed to delete category: ${err.message}` });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

import { db, products } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { setCorsHeaders } from '../_cors.js';
import { isAdminRequest } from '../_adminAuth.js';

const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  brand: z.string().optional(),
  weight: z.string().optional(),
  mrp: z.number().positive().optional(),
  discount: z.number().nonnegative().optional(),
  image: z.string().optional(),
  description: z.string().optional(),
  inStock: z.boolean().optional(),
  deliveryTime: z.string().optional(),
  isBestseller: z.boolean().optional(),
  variants: z.array(z.any()).optional()
}).strict();

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing product ID' });
  }

  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json({ error: 'Invalid product ID' });
  }

  try {
    // ── GET /api/products/:id — public ───────────────────────────────────
    if (req.method === 'GET') {
      const result = await db.select().from(products).where(eq(products.id, parsedId));
      if (!result.length) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=600');
      return res.status(200).json(result[0]);
    }

    // ── PUT /api/products/:id — admin only ───────────────────────────────
    if (req.method === 'PUT') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const validation = productUpdateSchema.safeParse(body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
      }

      const existing = await db.select().from(products).where(eq(products.id, parsedId));
      if (!existing.length) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const updated = await db
        .update(products)
        .set(validation.data)
        .where(eq(products.id, parsedId))
        .returning();

      return res.status(200).json(updated[0]);
    }

    // ── DELETE /api/products/:id — admin only ────────────────────────────
    if (req.method === 'DELETE') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const existing = await db.select().from(products).where(eq(products.id, parsedId));
      if (!existing.length) {
        return res.status(404).json({ error: 'Product not found' });
      }

      await db.delete(products).where(eq(products.id, parsedId));
      return res.status(200).json({ success: true, id: parsedId });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/products/[id]:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

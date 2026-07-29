import { db, products } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().positive(),
  unit: z.string().min(1),
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
});

const productUpdateSchema = productSchema.partial().strict();

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    // ── Collection: /api/products ──────────────────────────────────────
    if (!id) {
      if (req.method === 'GET') {
        const { category } = req.query;
        let limitVal = parseInt(req.query.limit, 10);
        let offsetVal = parseInt(req.query.offset, 10);

        if (Number.isNaN(limitVal)) limitVal = 20;
        if (Number.isNaN(offsetVal)) offsetVal = 0;

        const parsedLimit = Math.min(500, Math.max(1, limitVal));
        const parsedOffset = Math.max(0, offsetVal);

        let query = db.select().from(products);
        if (category) {
          query = query.where(eq(products.category, category));
        }

        const allProducts = await query.limit(parsedLimit).offset(parsedOffset);

        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
        return res.status(200).json(allProducts);
      }

      if (req.method === 'POST') {
        const adminOk = await isAdminRequest(req);
        if (!adminOk) {
          return res.status(403).json({ error: 'Forbidden: admin access required' });
        }

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const validationResult = productSchema.safeParse(body);
        if (!validationResult.success) {
          return res.status(400).json({ error: 'Validation failed', details: validationResult.error.errors });
        }

        const newProduct = await db.insert(products).values(validationResult.data).returning();
        return res.status(201).json(newProduct[0]);
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Item: /api/products?id=:id ─────────────────────────────────────
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    if (req.method === 'GET') {
      const result = await db.select().from(products).where(eq(products.id, parsedId));
      if (!result.length) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=600');
      return res.status(200).json(result[0]);
    }

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
    console.error('Database error in /api/products:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

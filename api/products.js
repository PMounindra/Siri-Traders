import { db, products } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  subcategory: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  sku: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  unit: z.string().min(1),
  packSize: z.string().optional().nullable(),
  price: z.number().positive(),
  mrp: z.number().positive().optional().nullable(),
  costPrice: z.number().nonnegative().optional().nullable(),
  discount: z.number().nonnegative().optional().nullable(),
  gstRate: z.number().nonnegative().optional().nullable(),
  hsnCode: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  mfgDate: z.string().optional().nullable(),
  expiryDate: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  inStock: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  deliveryTime: z.string().optional().nullable(),
  isBestseller: z.boolean().optional(),
  isTodaysDeal: z.boolean().optional(),
  wholesalePrice: z.number().nonnegative().optional().nullable(),
  bulkPackLabel: z.string().optional().nullable(),
  bulkPackPrice: z.number().nonnegative().optional().nullable(),
  wholesaleCaseLabel: z.string().optional().nullable(),
  wholesaleCasePrice: z.number().nonnegative().optional().nullable(),
  variants: z.array(z.any()).optional().nullable()
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
        const { category, includeArchived } = req.query;
        let limitVal = parseInt(req.query.limit, 10);
        let offsetVal = parseInt(req.query.offset, 10);

        if (Number.isNaN(limitVal)) limitVal = 500;
        if (Number.isNaN(offsetVal)) offsetVal = 0;

        const parsedLimit = Math.min(1000, Math.max(1, limitVal));
        const parsedOffset = Math.max(0, offsetVal);

        let query = db.select().from(products);
        const conditions = [];

        if (category) {
          conditions.push(eq(products.category, category));
        }

        // For public store requests without admin context / without includeArchived, hide archived
        if (includeArchived !== 'true') {
          conditions.push(eq(products.isArchived, false));
        }

        if (conditions.length === 1) {
          query = query.where(conditions[0]);
        } else if (conditions.length > 1) {
          query = query.where(and(...conditions));
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
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
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
    return res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}

import { db, products, categories } from '../db/index.js';
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

  const { id, resource, action } = req.query;

  try {
    // ── Categories sub-resource: /api/categories or /api/products?resource=categories
    if (resource === 'categories' || action === 'categories') {
      if (!id) {
        if (req.method === 'GET') {
          const allCategories = await db.select().from(categories);
          res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
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
      } else {
        if (req.method === 'DELETE') {
          const adminOk = await isAdminRequest(req);
          if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

          await db.delete(products).where(eq(products.category, id));
          await db.delete(categories).where(eq(categories.id, id));
          return res.status(200).json({ success: true, id });
        }
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Products Collection: /api/products ─────────────────────────────
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

    // ── Product Item: /api/products?id=:id ─────────────────────────────
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
    return res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
  }
}

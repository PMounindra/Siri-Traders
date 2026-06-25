import { db, products } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
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

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-admin-secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
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

      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=600');
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

      const validatedData = validationResult.data;
      const newProduct = await db.insert(products).values(validatedData).returning();
      return res.status(201).json(newProduct[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Database error in /api/products:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

import { db, products } from '../../db/index.js';
import { eq } from 'drizzle-orm';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing product ID' });
    }

    const result = await db.select().from(products).where(eq(products.id, parseInt(id)));
    if (!result.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Cache aggressively for 1 hour on Vercel CDN, revalidate clients in 60s
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600, stale-while-revalidate=600');
    return res.status(200).json(result[0]);
  } catch (error) {
    console.error("Database error in /api/products/[id]:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

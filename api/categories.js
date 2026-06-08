import { db, categories } from '../db/index.js';

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
    const allCategories = await db.select().from(categories);

    // Cache categories list aggressively: categories change very rarely
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=86400, stale-while-revalidate=3600');
    return res.status(200).json(allCategories);
  } catch (error) {
    console.error("Database error in /api/categories:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

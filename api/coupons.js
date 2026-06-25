import { db, coupons } from '../db/index.js';
import { setCorsHeaders } from './_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const allCoupons = await db.select().from(coupons);
      return res.status(200).json(allCoupons);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/coupons:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

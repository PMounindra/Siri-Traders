import { db, offers } from '../db/index.js';
import { setCorsHeaders } from './_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const allOffers = await db.select().from(offers);
      return res.status(200).json(allOffers);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/offers:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

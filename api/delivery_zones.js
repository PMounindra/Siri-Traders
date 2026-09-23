import { db, deliveryZones } from '../db/index.js';
import { setCorsHeaders } from './_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    try {
      const zones = await db.select().from(deliveryZones);
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.status(200).json(zones || []);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

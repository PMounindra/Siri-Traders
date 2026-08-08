import { db, settings } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

const DEFAULTS = { id: 'default', deliveryFee: 25, freeDeliveryThreshold: 500, handlingCharge: 5 };

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const rows = await db.select().from(settings).where(eq(settings.id, 'default'));
      return res.status(200).json(rows[0] || DEFAULTS);
    }

    if (req.method === 'PUT') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const values = {
        id: 'default',
        deliveryFee: Number.isFinite(Number(body.deliveryFee)) ? Number(body.deliveryFee) : DEFAULTS.deliveryFee,
        freeDeliveryThreshold: Number.isFinite(Number(body.freeDeliveryThreshold)) ? Number(body.freeDeliveryThreshold) : DEFAULTS.freeDeliveryThreshold,
        handlingCharge: Number.isFinite(Number(body.handlingCharge)) ? Number(body.handlingCharge) : DEFAULTS.handlingCharge
      };

      const saved = await db.insert(settings).values(values).onConflictDoUpdate({
        target: settings.id,
        set: values
      }).returning();

      return res.status(200).json(saved[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/settings:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

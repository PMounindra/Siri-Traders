import { db, deliveryZones } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    // ── Collection: /api/delivery_zones ────────────────────────────────
    if (!id) {
      if (req.method === 'GET') {
        const allZones = await db.select().from(deliveryZones);
        return res.status(200).json(allZones);
      }

      if (req.method === 'POST') {
        const adminOk = await isAdminRequest(req);
        if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        if (!body.area || !body.pincode) {
          return res.status(400).json({ error: 'area and pincode are required' });
        }

        const zoneId = body.id || `zone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const values = {
          id: zoneId,
          area: body.area,
          pincode: String(body.pincode),
          time: body.time || '30 mins',
          distance: body.distance || '',
          active: body.active !== false,
          deliveryFee: Number(body.deliveryFee) || 0,
          freeDeliveryThreshold: Number(body.freeDeliveryThreshold) || 0,
          handlingCharge: Number(body.handlingCharge) || 0,
          minOrderValue: Number(body.minOrderValue) || 0,
          deliverySlots: Array.isArray(body.deliverySlots) ? body.deliverySlots : [
            'Morning (7:00 AM - 10:00 AM)',
            'Afternoon (1:00 PM - 4:00 PM)',
            'Evening (6:00 PM - 9:00 PM)',
            'Express (15-30 mins)'
          ],
          driverAssigned: body.driverAssigned || ''
        };

        const saved = await db.insert(deliveryZones).values(values).onConflictDoUpdate({
          target: deliveryZones.id,
          set: values
        }).returning();

        return res.status(201).json(saved[0]);
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Item: /api/delivery_zones?id=:id ───────────────────────────────
    if (req.method === 'PUT') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const existing = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id));
      if (!existing.length) return res.status(404).json({ error: 'Delivery zone not found' });

      const patch = {};
      if (body.area !== undefined) patch.area = body.area;
      if (body.pincode !== undefined) patch.pincode = String(body.pincode);
      if (body.time !== undefined) patch.time = body.time;
      if (body.distance !== undefined) patch.distance = body.distance;
      if (body.active !== undefined) patch.active = Boolean(body.active);
      if (body.deliveryFee !== undefined) patch.deliveryFee = Number(body.deliveryFee) || 0;
      if (body.freeDeliveryThreshold !== undefined) patch.freeDeliveryThreshold = Number(body.freeDeliveryThreshold) || 0;
      if (body.handlingCharge !== undefined) patch.handlingCharge = Number(body.handlingCharge) || 0;
      if (body.minOrderValue !== undefined) patch.minOrderValue = Number(body.minOrderValue) || 0;
      if (body.deliverySlots !== undefined) patch.deliverySlots = body.deliverySlots;
      if (body.driverAssigned !== undefined) patch.driverAssigned = body.driverAssigned;

      const updated = await db.update(deliveryZones).set(patch).where(eq(deliveryZones.id, id)).returning();
      return res.status(200).json(updated[0]);
    }

    if (req.method === 'DELETE') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const existing = await db.select().from(deliveryZones).where(eq(deliveryZones.id, id));
      if (!existing.length) return res.status(404).json({ error: 'Delivery zone not found' });

      await db.delete(deliveryZones).where(eq(deliveryZones.id, id));
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/delivery_zones:", error);
    return res.status(500).json({ error: 'Something went wrong: ' + error.message });
  }
}

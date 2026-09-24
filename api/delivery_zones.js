import { db, deliveryZones } from '../db/index.js';
import { eq, sql } from 'drizzle-orm';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

let zonesMigrated = false;

async function autoMigrateDeliveryZonesSchema() {
  if (zonesMigrated) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS delivery_zones (
        id TEXT PRIMARY KEY,
        area TEXT NOT NULL,
        pincode TEXT NOT NULL,
        time TEXT NOT NULL,
        distance TEXT,
        active BOOLEAN DEFAULT true,
        delivery_fee INTEGER DEFAULT 0 NOT NULL,
        free_delivery_threshold INTEGER DEFAULT 0 NOT NULL,
        handling_charge INTEGER DEFAULT 0 NOT NULL,
        min_order_value INTEGER DEFAULT 0,
        delivery_slots JSONB DEFAULT '[]'::jsonb,
        driver_assigned TEXT
      );
    `);
    zonesMigrated = true;
  } catch (err) {
    console.warn("Auto-migration delivery_zones failed:", err.message);
  }
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  await autoMigrateDeliveryZonesSchema();

  if (req.method === 'GET') {
    try {
      const zones = await db.select().from(deliveryZones);
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      return res.status(200).json(zones || []);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Admin authentication check for write methods
  const adminOk = await isAdminRequest(req);
  if (!adminOk) {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      if (!body.area || !body.pincode) {
        return res.status(400).json({ error: 'Area and pincode are required' });
      }

      const zoneId = body.id || `zone-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newZone = {
        id: String(zoneId),
        area: String(body.area).trim(),
        pincode: String(body.pincode).trim(),
        time: String(body.time || '30 mins').trim(),
        distance: body.distance ? String(body.distance) : null,
        active: body.active !== false,
        deliveryFee: Number(body.deliveryFee) || 0,
        freeDeliveryThreshold: Number(body.freeDeliveryThreshold) || 0,
        handlingCharge: Number(body.handlingCharge) || 5,
        minOrderValue: Number(body.minOrderValue) || 0,
        deliverySlots: Array.isArray(body.deliverySlots) ? body.deliverySlots : [],
        driverAssigned: body.driverAssigned ? String(body.driverAssigned).trim() : null,
      };

      const [inserted] = await db.insert(deliveryZones).values(newZone).returning();
      return res.status(201).json(inserted || newZone);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const targetId = req.query.id || (typeof req.body === 'object' ? req.body?.id : null);
      if (!targetId) {
        return res.status(400).json({ error: 'Delivery zone ID is required' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const updateData = {};

      if (body.area !== undefined) updateData.area = String(body.area).trim();
      if (body.pincode !== undefined) updateData.pincode = String(body.pincode).trim();
      if (body.time !== undefined) updateData.time = String(body.time).trim();
      if (body.distance !== undefined) updateData.distance = body.distance ? String(body.distance) : null;
      if (body.active !== undefined) updateData.active = Boolean(body.active);
      if (body.deliveryFee !== undefined) updateData.deliveryFee = Number(body.deliveryFee) || 0;
      if (body.freeDeliveryThreshold !== undefined) updateData.freeDeliveryThreshold = Number(body.freeDeliveryThreshold) || 0;
      if (body.handlingCharge !== undefined) updateData.handlingCharge = Number(body.handlingCharge) || 0;
      if (body.minOrderValue !== undefined) updateData.minOrderValue = Number(body.minOrderValue) || 0;
      if (body.deliverySlots !== undefined) updateData.deliverySlots = Array.isArray(body.deliverySlots) ? body.deliverySlots : [];
      if (body.driverAssigned !== undefined) updateData.driverAssigned = body.driverAssigned ? String(body.driverAssigned).trim() : null;

      const [updated] = await db.update(deliveryZones).set(updateData).where(eq(deliveryZones.id, String(targetId))).returning();
      return res.status(200).json(updated || { id: targetId, ...updateData });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const targetId = req.query.id || (typeof req.body === 'object' ? req.body?.id : null);
      if (!targetId) {
        return res.status(400).json({ error: 'Delivery zone ID is required' });
      }

      await db.delete(deliveryZones).where(eq(deliveryZones.id, String(targetId)));
      return res.status(200).json({ success: true, id: targetId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

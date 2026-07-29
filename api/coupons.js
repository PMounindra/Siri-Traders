import { db, coupons } from '../db/index.js';
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
    // ── Collection: /api/coupons ───────────────────────────────────────
    if (!id) {
      if (req.method === 'GET') {
        const allCoupons = await db.select().from(coupons);
        return res.status(200).json(allCoupons);
      }

      if (req.method === 'POST') {
        const adminOk = await isAdminRequest(req);
        if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const code = String(body.code || '').trim().toUpperCase();
        if (!code) return res.status(400).json({ error: 'code is required' });

        const couponId = body.id || `coupon-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const values = {
          id: couponId,
          code,
          type: body.type || 'flat',
          value: Number(body.value) || 0,
          minOrder: Number(body.minOrder) || 0,
          maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
          title: body.title || '',
          description: body.description || '',
          customerType: body.customerType || 'retail',
          active: body.active !== false
        };

        const saved = await db.insert(coupons).values(values).onConflictDoUpdate({
          target: coupons.id,
          set: values
        }).returning();

        return res.status(201).json(saved[0]);
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Item: /api/coupons?id=:id ───────────────────────────────────────
    if (req.method === 'PUT') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const existing = await db.select().from(coupons).where(eq(coupons.id, id));
      if (!existing.length) return res.status(404).json({ error: 'Coupon not found' });

      const patch = {};
      if (body.code !== undefined) patch.code = String(body.code).trim().toUpperCase();
      if (body.type !== undefined) patch.type = body.type;
      if (body.value !== undefined) patch.value = Number(body.value) || 0;
      if (body.minOrder !== undefined) patch.minOrder = Number(body.minOrder) || 0;
      if (body.maxDiscount !== undefined) patch.maxDiscount = body.maxDiscount ? Number(body.maxDiscount) : null;
      if (body.title !== undefined) patch.title = body.title;
      if (body.description !== undefined) patch.description = body.description;
      if (body.customerType !== undefined) patch.customerType = body.customerType;
      if (body.active !== undefined) patch.active = Boolean(body.active);

      const updated = await db.update(coupons).set(patch).where(eq(coupons.id, id)).returning();
      return res.status(200).json(updated[0]);
    }

    if (req.method === 'DELETE') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const existing = await db.select().from(coupons).where(eq(coupons.id, id));
      if (!existing.length) return res.status(404).json({ error: 'Coupon not found' });

      await db.delete(coupons).where(eq(coupons.id, id));
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'A coupon with that code already exists' });
    }
    console.error("Error in /api/coupons:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

import { db, offers, coupons } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id, resource, action } = req.query;

  try {
    // ── Coupons Handler ───────────────────────────────────────────────
    if (resource === 'coupons' || action === 'coupons') {
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
            buyQuantity: body.buyQuantity != null ? Number(body.buyQuantity) : 1,
            getQuantity: body.getQuantity != null ? Number(body.getQuantity) : 1,
            targetType: body.targetType || 'all',
            targetCategory: body.targetCategory || null,
            targetProductId: body.targetProductId ? Number(body.targetProductId) : null,
            targetCustomerEmail: body.targetCustomerEmail || null,
            usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
            perUserLimit: body.perUserLimit ? Number(body.perUserLimit) : 1,
            timesUsed: body.timesUsed ? Number(body.timesUsed) : 0,
            totalDiscountGiven: body.totalDiscountGiven ? Number(body.totalDiscountGiven) : 0,
            startDate: body.startDate || null,
            endDate: body.endDate || null,
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
      } else {
        if (req.method === 'PUT') {
          const adminOk = await isAdminRequest(req);
          if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

          const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
          const patch = {};
          if (body.code !== undefined) patch.code = String(body.code).trim().toUpperCase();
          if (body.type !== undefined) patch.type = body.type;
          if (body.value !== undefined) patch.value = Number(body.value) || 0;
          if (body.minOrder !== undefined) patch.minOrder = Number(body.minOrder) || 0;
          if (body.maxDiscount !== undefined) patch.maxDiscount = body.maxDiscount ? Number(body.maxDiscount) : null;
          if (body.buyQuantity !== undefined) patch.buyQuantity = Number(body.buyQuantity) || 1;
          if (body.getQuantity !== undefined) patch.getQuantity = Number(body.getQuantity) || 1;
          if (body.targetType !== undefined) patch.targetType = body.targetType;
          if (body.targetCategory !== undefined) patch.targetCategory = body.targetCategory;
          if (body.targetProductId !== undefined) patch.targetProductId = body.targetProductId ? Number(body.targetProductId) : null;
          if (body.targetCustomerEmail !== undefined) patch.targetCustomerEmail = body.targetCustomerEmail;
          if (body.usageLimit !== undefined) patch.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
          if (body.perUserLimit !== undefined) patch.perUserLimit = Number(body.perUserLimit) || 1;
          if (body.timesUsed !== undefined) patch.timesUsed = Number(body.timesUsed) || 0;
          if (body.totalDiscountGiven !== undefined) patch.totalDiscountGiven = Number(body.totalDiscountGiven) || 0;
          if (body.startDate !== undefined) patch.startDate = body.startDate;
          if (body.endDate !== undefined) patch.endDate = body.endDate;
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

          await db.delete(coupons).where(eq(coupons.id, id));
          return res.status(200).json({ success: true, id });
        }
      }
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Offers Handler: /api/offers ───────────────────────────────────
    if (!id) {
      if (req.method === 'GET') {
        const allOffers = await db.select().from(offers);
        return res.status(200).json(allOffers);
      }

      if (req.method === 'POST') {
        const adminOk = await isAdminRequest(req);
        if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const title = String(body.title || '').trim();
        if (!title) return res.status(400).json({ error: 'title is required' });

        const offerId = body.id || `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const values = {
          id: offerId,
          title,
          subtitle: body.subtitle || '',
          price: Number(body.price) || 0,
          mrp: Number(body.mrp) || Number(body.price) || 0,
          badge: body.badge || '',
          image: body.image || '',
          link: body.link || '/categories',
          groupType: body.group || body.groupType || 'daily',
          type: body.type || 'Sale offer',
          buyQty: body.buyQty != null ? Number(body.buyQty) : 1,
          getQty: body.getQty != null ? Number(body.getQty) : 1,
          targetCategory: body.targetCategory || null,
          targetProductId: body.targetProductId ? Number(body.targetProductId) : null,
          startDate: body.startDate || null,
          endDate: body.endDate || null,
          usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
          timesClaimed: body.timesClaimed ? Number(body.timesClaimed) : 0,
          active: body.active !== false
        };

        const saved = await db.insert(offers).values(values).onConflictDoUpdate({
          target: offers.id,
          set: values
        }).returning();

        return res.status(201).json(saved[0]);
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Item: /api/offers?id=:id ────────────────────────────────────────
    if (req.method === 'PUT') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const patch = {};
      if (body.title !== undefined) patch.title = String(body.title).trim();
      if (body.subtitle !== undefined) patch.subtitle = body.subtitle;
      if (body.price !== undefined) patch.price = Number(body.price) || 0;
      if (body.mrp !== undefined) patch.mrp = Number(body.mrp) || 0;
      if (body.badge !== undefined) patch.badge = body.badge;
      if (body.image !== undefined) patch.image = body.image;
      if (body.link !== undefined) patch.link = body.link;
      if (body.group !== undefined) patch.groupType = body.group;
      if (body.groupType !== undefined) patch.groupType = body.groupType;
      if (body.type !== undefined) patch.type = body.type;
      if (body.buyQty !== undefined) patch.buyQty = Number(body.buyQty) || 1;
      if (body.getQty !== undefined) patch.getQty = Number(body.getQty) || 1;
      if (body.targetCategory !== undefined) patch.targetCategory = body.targetCategory;
      if (body.targetProductId !== undefined) patch.targetProductId = body.targetProductId ? Number(body.targetProductId) : null;
      if (body.startDate !== undefined) patch.startDate = body.startDate;
      if (body.endDate !== undefined) patch.endDate = body.endDate;
      if (body.usageLimit !== undefined) patch.usageLimit = body.usageLimit ? Number(body.usageLimit) : null;
      if (body.timesClaimed !== undefined) patch.timesClaimed = Number(body.timesClaimed) || 0;
      if (body.active !== undefined) patch.active = Boolean(body.active);

      const updated = await db.update(offers).set(patch).where(eq(offers.id, id)).returning();
      return res.status(200).json(updated[0]);
    }

    if (req.method === 'DELETE') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      await db.delete(offers).where(eq(offers.id, id));
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/offers:", error);
    return res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
  }
}

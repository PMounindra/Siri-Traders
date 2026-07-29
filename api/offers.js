import { db, offers } from '../db/index.js';
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
    // ── Collection: /api/offers ─────────────────────────────────────────
    if (!id) {
      if (req.method === 'GET') {
        const allOffers = await db.select().from(offers);
        return res.status(200).json(allOffers);
      }

      if (req.method === 'POST') {
        const adminOk = await isAdminRequest(req);
        if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const offerId = body.id || `offer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const values = {
          id: offerId,
          title: body.title,
          subtitle: body.subtitle || '',
          price: Number(body.price) || 0,
          mrp: Number(body.mrp) || 0,
          badge: body.badge || '',
          image: body.image || '',
          link: body.link || '/categories',
          groupType: body.group || body.groupType || 'daily',
          active: body.active !== false
        };

        if (!values.title) {
          return res.status(400).json({ error: 'title is required' });
        }

        const saved = await db.insert(offers).values(values).onConflictDoUpdate({
          target: offers.id,
          set: values
        }).returning();

        return res.status(201).json(saved[0]);
      }

      return res.status(405).json({ error: 'Method not allowed' });
    }

    // ── Item: /api/offers?id=:id ─────────────────────────────────────────
    if (req.method === 'PUT') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const existing = await db.select().from(offers).where(eq(offers.id, id));
      if (!existing.length) return res.status(404).json({ error: 'Offer not found' });

      const patch = {};
      if (body.title !== undefined) patch.title = body.title;
      if (body.subtitle !== undefined) patch.subtitle = body.subtitle;
      if (body.price !== undefined) patch.price = Number(body.price) || 0;
      if (body.mrp !== undefined) patch.mrp = Number(body.mrp) || 0;
      if (body.badge !== undefined) patch.badge = body.badge;
      if (body.image !== undefined) patch.image = body.image;
      if (body.link !== undefined) patch.link = body.link;
      if (body.group !== undefined) patch.groupType = body.group;
      if (body.active !== undefined) patch.active = Boolean(body.active);

      const updated = await db.update(offers).set(patch).where(eq(offers.id, id)).returning();
      return res.status(200).json(updated[0]);
    }

    if (req.method === 'DELETE') {
      const adminOk = await isAdminRequest(req);
      if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

      const existing = await db.select().from(offers).where(eq(offers.id, id));
      if (!existing.length) return res.status(404).json({ error: 'Offer not found' });

      await db.delete(offers).where(eq(offers.id, id));
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/offers:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

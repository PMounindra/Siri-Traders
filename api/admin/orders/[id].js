import { db, orders, orderItems } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { createClerkClient } from '@clerk/backend';
import { z } from 'zod';
import { setCorsHeaders } from '../_cors.js';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

const VALID_STATUSES = ['Pending', 'Preparing', 'In Transit', 'Delivered', 'Paid'];

const patchSchema = z.object({
  status: z.enum(VALID_STATUSES)
});

async function verifyAdmin(req) {
  const authRequest = await clerk.authenticateRequest(req);
  const { userId } = authRequest;
  if (!userId) return null;
  const user = await clerk.users.getUser(userId);
  if (user.publicMetadata?.role !== 'admin') return null;
  return userId;
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify admin for all methods
  let adminId;
  try {
    adminId = await verifyAdmin(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!adminId) return res.status(403).json({ error: 'Forbidden: admins only' });

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing order ID' });

  const parsedId = parseInt(id, 10);
  if (Number.isNaN(parsedId) || parsedId <= 0) {
    return res.status(400).json({ error: 'Invalid order ID' });
  }

  try {
    // ── GET /api/admin/orders/:id ────────────────────────────────────
    if (req.method === 'GET') {
      const orderResult = await db.select().from(orders).where(eq(orders.id, parsedId));
      if (!orderResult.length) return res.status(404).json({ error: 'Order not found' });

      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, parsedId));
      return res.status(200).json({ ...orderResult[0], items });
    }

    // ── PATCH /api/admin/orders/:id — update status ──────────────────
    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const validation = patchSchema.safeParse(body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid status', validStatuses: VALID_STATUSES });
      }

      const orderResult = await db.select().from(orders).where(eq(orders.id, parsedId));
      if (!orderResult.length) return res.status(404).json({ error: 'Order not found' });

      const updated = await db
        .update(orders)
        .set({ status: validation.data.status })
        .where(eq(orders.id, parsedId))
        .returning();

      return res.status(200).json(updated[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/admin/orders/[id]:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

import { db, orders, orderItems, users } from '../../db/index.js';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { setCorsHeaders } from '../_cors.js';
import { isAdminRequest } from '../_adminAuth.js';
import { sendCustomerOrderStatusUpdateEmail } from '../_email.js';
import { sendCustomerOrderStatusWhatsApp } from '../_whatsapp.js';

const VALID_STATUSES = ['Pending', 'Preparing', 'In Transit', 'Delivered', 'Paid'];

const patchSchema = z.object({
  status: z.enum(VALID_STATUSES)
});

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminOk = await isAdminRequest(req);
  if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

  const { id } = req.query;

  try {
    // ── Collection: /api/admin/orders ─────────────────────────────────────
    if (!id) {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const allOrders = await db.select().from(orders).orderBy(orders.createdAt);
      const allItems = await db.select().from(orderItems);

      const ordersWithItems = allOrders.map(order => ({
        ...order,
        items: allItems.filter(item => item.orderId === order.id)
      }));

      return res.status(200).json(ordersWithItems);
    }

    // ── Item: /api/admin/orders?id=:id ─────────────────────────────────────
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId) || parsedId <= 0) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    if (req.method === 'GET') {
      const orderResult = await db.select().from(orders).where(eq(orders.id, parsedId));
      if (!orderResult.length) return res.status(404).json({ error: 'Order not found' });
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, parsedId));
      return res.status(200).json({ ...orderResult[0], items });
    }

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

      // Retrieve customer details to send automated notifications
      try {
        const [customer] = await db.select().from(users).where(eq(users.id, orderResult[0].userId));
        if (customer) {
          if (customer.email) {
            sendCustomerOrderStatusUpdateEmail(customer.email, customer.name, updated[0], validation.data.status).catch(err => {
              console.error("[EMAIL ERROR] Customer status email failed:", err.message);
            });
          }
          if (customer.phone) {
            sendCustomerOrderStatusWhatsApp(customer.phone, customer.name, updated[0], validation.data.status).catch(err => {
              console.error("[WHATSAPP ERROR] Customer status WhatsApp failed:", err.message);
            });
          }
        }
      } catch (err) {
        console.warn("Failed to send customer status updates:", err.message);
      }

      return res.status(200).json(updated[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/admin/orders:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

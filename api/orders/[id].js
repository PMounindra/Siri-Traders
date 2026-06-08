import { db, orders, orderItems } from '../../db/index.js';
import { eq, and } from 'drizzle-orm';
import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Auth check
  let authRequest;
  try {
    authRequest = await clerk.authenticateRequest(req);
  } catch (err) {
    console.error("Clerk auth connection error:", err);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId } = authRequest;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing order ID' });
    }

    // 2. Fetch order
    const orderResult = await db.select().from(orders).where(eq(orders.id, parseInt(id)));
    if (!orderResult.length) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderResult[0];

    // 3. Verify ownership (Never trust the client)
    if (order.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not own this order' });
    }

    // 4. Fetch order items
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));

    return res.status(200).json({
      ...order,
      items
    });
  } catch (error) {
    console.error("Error in /api/orders/[id]:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

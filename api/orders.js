import { db, orders, orderItems, users } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { setCorsHeaders } from './_cors.js';
import { clerk, getAuthenticatedUserId } from './_clerkAuth.js';

// Setup Upstash Redis rate limiting: 10 requests per 30 seconds for orders endpoint
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '30 s'),
});

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  // 1. Auth check
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ── Item: /api/orders?id=:id — single order, ownership-checked ───────────
  if (id) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const parsedId = parseInt(id, 10);
      if (Number.isNaN(parsedId) || parsedId <= 0) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }

      const orderResult = await db.select().from(orders).where(eq(orders.id, parsedId));
      if (!orderResult.length) {
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult[0];
      if (order.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden: You do not own this order' });
      }

      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      return res.status(200).json({ ...order, items });
    } catch (error) {
      console.error("Error in /api/orders?id:", error);
      return res.status(500).json({ error: 'Something went wrong' });
    }
  }

  // ── Collection: /api/orders ────────────────────────────────────────────
  // 2. Rate limiting check (using userId as the rate limit key)
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { success } = await ratelimit.limit(`orders_${userId}`);
      if (!success) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
    }
  } catch (err) {
    console.error("Rate limiting connection warning:", err);
    // Fail-open for rate limiter so we don't block users if Redis is down
  }

  try {
    if (req.method === 'GET') {
      const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));
      return res.status(200).json(userOrders);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { items, total, deliveryAddress, paymentMethod } = body;

      if (!Array.isArray(items) || items.length === 0 || !total) {
        return res.status(400).json({ error: 'Missing order details' });
      }

      // Sync user data to DB to ensure we have a record
      try {
        const clerkUser = await clerk.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
        const phone = clerkUser.phoneNumbers[0]?.phoneNumber || '';

        await db.insert(users)
          .values({
            id: userId,
            email: email,
            name: name,
            phone: phone,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: { email, name, phone, updatedAt: new Date() }
          });
      } catch (err) {
        console.warn("Failed to sync user data, proceeding with order anyway:", err.message);
      }

      // Create order & order items (avoiding transactions which are unsupported in neon-http)
      const orderResult = await db.insert(orders).values({
        userId,
        total,
        deliveryAddress: deliveryAddress || '',
        paymentMethod: paymentMethod || 'COD',
        status: paymentMethod === 'cod' ? 'Preparing' : 'Paid'
      }).returning();

      const insertedOrder = orderResult[0];

      // Insert all items sequentially
      for (const item of items) {
        await db.insert(orderItems).values({
          orderId: insertedOrder.id,
          productId: item.productId || item.id,
          name: item.name,
          quantity: item.qty || item.quantity || 1,
          price: item.price,
          weight: item.weight || '',
          unit: item.unit || ''
        });
      }

      return res.status(201).json(insertedOrder);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/orders:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

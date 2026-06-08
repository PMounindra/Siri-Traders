import { db, orders, orderItems } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { createClerkClient } from '@clerk/backend';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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

      if (!items || !items.length || !total) {
        return res.status(400).json({ error: 'Missing order details' });
      }

      // Create order & order items in a transaction
      const newOrder = await db.transaction(async (tx) => {
        const orderResult = await tx.insert(orders).values({
          userId,
          total,
          deliveryAddress: deliveryAddress || '',
          paymentMethod: paymentMethod || 'COD',
          createdAt: new Date().toISOString(),
          status: 'Paid'
        }).returning();

        const insertedOrder = orderResult[0];

        for (const item of items) {
          await tx.insert(orderItems).values({
            orderId: insertedOrder.id,
            productId: item.productId || item.id,
            name: item.name,
            quantity: item.qty || item.quantity || 1,
            price: item.price,
            weight: item.weight || '',
            unit: item.unit || ''
          });
        }

        return insertedOrder;
      });

      return res.status(201).json(newOrder);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/orders:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

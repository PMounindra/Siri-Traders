import { db, orders, orderItems, users } from '../db/index.js';
import { eq, inArray } from 'drizzle-orm';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { setCorsHeaders } from './_cors.js';
import { clerk, getAuthenticatedUserId } from './_clerkAuth.js';
import { sendOrderNotificationEmail, sendCustomerOrderConfirmationEmail } from './_email.js';
import { sendOrderNotificationWhatsApp } from './_whatsapp.js';

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
      let cleanId = id;
      if (typeof id === 'string' && id.startsWith('ORD-')) {
        cleanId = id.slice(4);
      }
      const parsedId = parseInt(cleanId, 10);
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
      return res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
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
      if (userOrders.length === 0) {
        return res.status(200).json([]);
      }
      const orderIds = userOrders.map(o => o.id);
      const allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));

      const ordersWithItems = userOrders.map(order => ({
        ...order,
        items: allItems.filter(item => item.orderId === order.id)
      }));

      // Sort orders descending so the latest ones show up first
      ordersWithItems.sort((a, b) => b.id - a.id);

      return res.status(200).json(ordersWithItems);
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { items, total, deliveryAddress, paymentMethod } = body;

      if (!Array.isArray(items) || items.length === 0 || !total) {
        return res.status(400).json({ error: 'Missing order details' });
      }

      // Sync user data to DB to ensure we have a record
      let customerEmail = '';
      let customerName = '';
      try {
        const clerkUser = await clerk.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress || '';
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
        const phone = clerkUser.phoneNumbers[0]?.phoneNumber || '';

        customerEmail = email;
        customerName = name || 'Customer';

        if (email) {
          // Only upsert if we have an email (it's a unique NOT NULL column)
          await db.insert(users)
            .values({
              id: userId,
              email: email,
              name: name || 'Customer',
              phone: phone,
            })
            .onConflictDoUpdate({
              target: users.id,
              set: { name: name || 'Customer', phone, updatedAt: new Date() }
            });
        }
      } catch (err) {
        console.warn("Failed to sync user data, proceeding with order anyway:", err.message);
      }

      const isCod = (paymentMethod || '').toLowerCase().includes('cod');
      const tempId = Date.now();
      const txnId = isCod ? `COD-SIRI-${Math.floor(100000 + Math.random() * 900000)}` : `TXN-SIRI-${Math.floor(200000 + Math.random() * 900000)}`;
      const trackingNumber = `TRK-SIRI-${Math.floor(500000 + Math.random() * 900000)}`;

      // Create order & its items in one transaction — if any item fails
      // (e.g. an unresolvable product id), the whole order rolls back instead
      // of leaving an orphaned order with no items sitting in the dashboard.
      const insertedOrder = await db.transaction(async (tx) => {
        const orderResult = await tx.insert(orders).values({
          userId,
          total,
          deliveryAddress: deliveryAddress || '',
          paymentMethod: paymentMethod || 'COD',
          status: isCod ? 'Preparing' : 'Paid',
          customerName: customerName || body.customerName || 'Customer',
          customerPhone: body.customerPhone || '',
          customerEmail: customerEmail || body.customerEmail || '',
          paymentStatus: isCod ? 'Pending' : 'Paid',
          paymentGateway: isCod ? 'Cash on Delivery' : (body.paymentGateway || 'UPI / Online'),
          paymentTxnId: txnId,
          trackingNumber: trackingNumber,
          deliverySlot: body.deliverySlot || 'Morning (7:00 AM - 10:00 AM)',
          deliveryDate: body.deliveryDate || new Date().toLocaleDateString('en-IN')
        }).returning();

        const order = orderResult[0];

        for (const item of items) {
          // Promotional/combo offer items (added from Today's Deals / Festive
          // Offers) have no backing product row — their id looks like
          // "offer-<id>" rather than a real numeric product id. Store null
          // for those instead of forcing a bogus number through.
          let cleanProductId = parseInt(item.productId, 10);
          if (isNaN(cleanProductId)) {
            cleanProductId = parseInt(item.id, 10);
          }
          if (isNaN(cleanProductId)) {
            cleanProductId = null;
          }

          await tx.insert(orderItems).values({
            orderId: order.id,
            productId: cleanProductId,
            name: item.name,
            quantity: item.qty || item.quantity || 1,
            price: item.price,
            weight: item.weight || '',
            unit: item.unit || ''
          });
        }

        return order;
      });

      // Fire email notification asynchronously (don't block HTTP response)
      sendOrderNotificationEmail(insertedOrder, items).catch(err => {
        console.error("[EMAIL ERROR] Async email send failed:", err.message);
      });

      if (customerEmail) {
        sendCustomerOrderConfirmationEmail(customerEmail, customerName, insertedOrder, items).catch(err => {
          console.error("[CUSTOMER EMAIL ERROR] Async customer email send failed:", err.message);
        });
      }

      // Fire WhatsApp notification asynchronously (don't block HTTP response)
      sendOrderNotificationWhatsApp(insertedOrder, items).catch(err => {
        console.error("[WHATSAPP ERROR] Async WhatsApp send failed:", err.message);
      });

      return res.status(201).json(insertedOrder);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/orders:", error?.message, error?.stack);
    return res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
  }
}

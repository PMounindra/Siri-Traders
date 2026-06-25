import { db, orders, orderItems } from '../../../db/index.js';
import { createClerkClient } from '@clerk/backend';
import { setCorsHeaders } from '../../_cors.js';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

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

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let adminId;
  try {
    adminId = await verifyAdmin(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!adminId) return res.status(403).json({ error: 'Forbidden: admins only' });

  try {
    // Get all orders
    const allOrders = await db.select().from(orders).orderBy(orders.createdAt);

    // Get all order items
    const allItems = await db.select().from(orderItems);

    // Join items into orders
    const ordersWithItems = allOrders.map(order => ({
      ...order,
      items: allItems.filter(item => item.orderId === order.id)
    }));

    return res.status(200).json(ordersWithItems);
  } catch (error) {
    console.error('Error in /api/admin/orders:', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

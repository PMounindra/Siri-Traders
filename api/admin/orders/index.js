import { db, orders, orderItems } from '../../../db/index.js';
import { setCorsHeaders } from '../../_cors.js';
import { isAdminRequest } from '../../_adminAuth.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminOk = await isAdminRequest(req);
  if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

  try {
    const allOrders = await db.select().from(orders).orderBy(orders.createdAt);
    const allItems = await db.select().from(orderItems);

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

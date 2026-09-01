import { db, users, orders, orderItems } from '../../db/index.js';
import { desc } from 'drizzle-orm';
import { isAdminRequest } from '../_adminAuth.js';
import { setCorsHeaders } from '../_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const isAdmin = await isAdminRequest(req);
  if (!isAdmin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      const allItems = await db.select().from(orderItems);

      const itemsByOrderId = new Map();
      for (const it of allItems) {
        if (!itemsByOrderId.has(it.orderId)) {
          itemsByOrderId.set(it.orderId, []);
        }
        itemsByOrderId.get(it.orderId).push(it);
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const enrichedUsers = allUsers.map(user => {
        const userOrders = allOrders
          .filter(o => o.userId === user.id)
          .map(o => ({
            ...o,
            items: itemsByOrderId.get(o.id) || []
          }));

        const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        const orderCount = userOrders.length;
        const aov = orderCount > 0 ? Math.round(totalSpent / orderCount) : 0;
        
        const lastOrder = userOrders[0];
        const firstOrder = userOrders[userOrders.length - 1];
        const lastOrderDate = lastOrder ? new Date(lastOrder.createdAt) : null;
        const firstOrderDate = firstOrder ? new Date(firstOrder.createdAt) : null;

        // Determine segmentation
        let segment = 'New';
        if (orderCount >= 5 || totalSpent >= 5000) {
          segment = 'VIP';
        } else if (orderCount >= 2) {
          if (lastOrderDate && lastOrderDate < thirtyDaysAgo) {
            segment = 'Inactive';
          } else {
            segment = 'Returning';
          }
        } else if (orderCount === 1) {
          if (lastOrderDate && lastOrderDate < thirtyDaysAgo) {
            segment = 'Inactive';
          } else {
            segment = 'New';
          }
        } else {
          segment = 'Inactive';
        }

        return {
          ...user,
          ordersCount: orderCount,
          totalSpent,
          averageOrderValue: aov,
          segment,
          lastOrderDate: lastOrderDate ? lastOrderDate.toISOString() : null,
          firstOrderDate: firstOrderDate ? firstOrderDate.toISOString() : null,
          orderHistory: userOrders
        };
      });

      return res.status(200).json(enrichedUsers);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/admin/users:", error);
    return res.status(500).json({ error: 'Something went wrong: ' + error.message });
  }
}

import { db, users, orders, orderItems } from '../../db/index.js';
import { eq } from 'drizzle-orm';
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
      const allUsers = await db.select().from(users);
      
      // We might want to attach total spent and orders count. Let's fetch all orders too.
      const allOrders = await db.select().from(orders);
      
      const enrichedUsers = allUsers.map(user => {
        const userOrders = allOrders.filter(o => o.userId === user.id);
        const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
        return {
          ...user,
          ordersCount: userOrders.length,
          totalSpent
        };
      });

      return res.status(200).json(enrichedUsers);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error("Error in /api/admin/users:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

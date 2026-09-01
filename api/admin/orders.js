import { db, orders, orderItems, users, inventory, inventoryLogs } from '../../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { setCorsHeaders } from '../_cors.js';
import { isAdminRequest } from '../_adminAuth.js';
import { sendCustomerOrderStatusUpdateEmail } from '../_email.js';
import { sendCustomerOrderStatusWhatsApp } from '../_whatsapp.js';

const VALID_STATUSES = ['Pending', 'Preparing', 'In Transit', 'Delivered', 'Paid', 'Cancelled'];
const VALID_PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded', 'Partially Refunded'];
const VALID_RETURN_STATUSES = ['None', 'Requested', 'Approved', 'Picked Up', 'Refunded', 'Rejected'];

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const adminOk = await isAdminRequest(req);
  if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

  const { id } = req.query;

  try {
    // ── Collection: GET /api/admin/orders ─────────────────────────────────────
    if (!id) {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      const allItems = await db.select().from(orderItems);
      const allUsers = await db.select().from(users);

      const userMap = new Map(allUsers.map(u => [u.id, u]));

      const ordersWithDetails = allOrders.map(order => {
        const user = userMap.get(order.userId);
        const items = allItems.filter(item => item.orderId === order.id);
        return {
          ...order,
          customerName: order.customerName || user?.name || 'Customer',
          customerPhone: order.customerPhone || user?.phone || '',
          customerEmail: order.customerEmail || user?.email || '',
          items
        };
      });

      return res.status(200).json(ordersWithDetails);
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
      const [user] = await db.select().from(users).where(eq(users.id, orderResult[0].userId));
      return res.status(200).json({
        ...orderResult[0],
        customerName: orderResult[0].customerName || user?.name || 'Customer',
        customerPhone: orderResult[0].customerPhone || user?.phone || '',
        customerEmail: orderResult[0].customerEmail || user?.email || '',
        items
      });
    }

    if (req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const orderResult = await db.select().from(orders).where(eq(orders.id, parsedId));
      if (!orderResult.length) return res.status(404).json({ error: 'Order not found' });

      const currentOrder = orderResult[0];
      const updateData = {};

      if (body.status !== undefined) {
        if (!VALID_STATUSES.includes(body.status)) {
          return res.status(400).json({ error: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}` });
        }
        updateData.status = body.status;
        if (body.status === 'Cancelled' && !currentOrder.cancelledAt) {
          updateData.cancelledAt = new Date();
          if (body.cancellationReason) updateData.cancellationReason = body.cancellationReason;
        }
      }

      if (body.paymentStatus !== undefined) {
        if (!VALID_PAYMENT_STATUSES.includes(body.paymentStatus)) {
          return res.status(400).json({ error: `Invalid paymentStatus. Valid: ${VALID_PAYMENT_STATUSES.join(', ')}` });
        }
        updateData.paymentStatus = body.paymentStatus;
      }

      if (body.paymentGateway !== undefined) updateData.paymentGateway = body.paymentGateway;
      if (body.paymentTxnId !== undefined) updateData.paymentTxnId = body.paymentTxnId;
      if (body.orderNotes !== undefined) updateData.orderNotes = body.orderNotes;
      if (body.deliverySlot !== undefined) updateData.deliverySlot = body.deliverySlot;
      if (body.deliveryDate !== undefined) updateData.deliveryDate = body.deliveryDate;
      if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber;
      if (body.deliveryPartner !== undefined) updateData.deliveryPartner = body.deliveryPartner;

      // Handle Refunds
      if (body.refundAmount !== undefined && Number(body.refundAmount) > 0) {
        const refAmt = Number(body.refundAmount);
        const totalRef = (currentOrder.refundAmount || 0) + refAmt;
        updateData.refundAmount = totalRef;
        updateData.refundReason = body.refundReason || 'Admin processed refund';
        updateData.refundedAt = new Date();
        updateData.paymentStatus = totalRef >= currentOrder.total ? 'Refunded' : 'Partially Refunded';
      }

      // Handle Returns
      if (body.returnStatus !== undefined) {
        if (!VALID_RETURN_STATUSES.includes(body.returnStatus)) {
          return res.status(400).json({ error: `Invalid returnStatus. Valid: ${VALID_RETURN_STATUSES.join(', ')}` });
        }
        updateData.returnStatus = body.returnStatus;
        if (body.returnReason) updateData.returnReason = body.returnReason;
      }

      // Restock inventory on cancellation or return approval if requested
      if (body.restockOnCancel) {
        try {
          const items = await db.select().from(orderItems).where(eq(orderItems.orderId, parsedId));
          for (const item of items) {
            if (item.productId) {
              const invList = await db.select().from(inventory).where(eq(inventory.productId, item.productId));
              if (invList.length > 0) {
                const currentStock = invList[0].availableStock || 0;
                const newStock = currentStock + (item.quantity || 1);
                await db.update(inventory).set({ availableStock: newStock }).where(eq(inventory.productId, item.productId));
                await db.insert(inventoryLogs).values({
                  productId: item.productId,
                  productName: item.name,
                  changeType: 'RETURN',
                  quantity: item.quantity || 1,
                  stockBefore: currentStock,
                  stockAfter: newStock,
                  reason: `Order #${parsedId} Cancelled / Restocked`,
                  notes: body.cancellationReason || body.returnReason || '',
                  adminName: 'Admin Control Center'
                });
              }
            }
          }
        } catch (restockErr) {
          console.warn('Restock warning:', restockErr.message);
        }
      }

      const updated = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, parsedId))
        .returning();

      // Retrieve customer details to send automated status notifications if status changed
      if (body.status && body.status !== currentOrder.status) {
        try {
          const [customer] = await db.select().from(users).where(eq(users.id, currentOrder.userId));
          if (customer) {
            if (customer.email) {
              sendCustomerOrderStatusUpdateEmail(customer.email, customer.name, updated[0], body.status).catch(err => {
                console.error("[EMAIL ERROR] Customer status email failed:", err.message);
              });
            }
            if (customer.phone) {
              sendCustomerOrderStatusWhatsApp(customer.phone, customer.name, updated[0], body.status).catch(err => {
                console.error("[WHATSAPP ERROR] Customer status WhatsApp failed:", err.message);
              });
            }
          }
        } catch (err) {
          console.warn("Failed to send customer status updates:", err.message);
        }
      }

      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, parsedId));
      return res.status(200).json({ ...updated[0], items });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in /api/admin/orders:', error);
    return res.status(500).json({ error: 'Something went wrong: ' + error.message });
  }
}

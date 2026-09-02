import { db, orders, orderItems, users, inventory, inventoryLogs } from '../../db/index.js';
import { eq, desc } from 'drizzle-orm';
import { setCorsHeaders } from '../_cors.js';
import { isAdminRequest } from '../_adminAuth.js';
import { sendCustomerOrderStatusUpdateEmail } from '../_email.js';
import { sendCustomerOrderStatusWhatsApp } from '../_whatsapp.js';
import nodemailer from 'nodemailer';

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

  const { id, resource, action } = req.query;

  try {
    // ── 1. Users & Customer Segmentation: ?resource=users or ?action=users ─────
    if (resource === 'users' || action === 'users') {
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

          let segment = 'New';
          if (orderCount >= 5 || totalSpent >= 5000) {
            segment = 'VIP';
          } else if (orderCount >= 2) {
            segment = lastOrderDate && lastOrderDate < thirtyDaysAgo ? 'Inactive' : 'Returning';
          } else if (orderCount === 1) {
            segment = lastOrderDate && lastOrderDate < thirtyDaysAgo ? 'Inactive' : 'New';
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
    }

    // ── 2. Promotional Email Broadcast: ?resource=broadcast or ?action=broadcast ──
    if (resource === 'broadcast' || action === 'broadcast') {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { subject, messageText, recipients: bodyRecipients } = body;

      if (!subject || !messageText) {
        return res.status(400).json({ error: 'Subject and message text are required' });
      }

      let recipients = [];
      if (Array.isArray(bodyRecipients) && bodyRecipients.length > 0) {
        recipients = bodyRecipients.filter(Boolean);
      } else {
        const allUsers = await db.select().from(users);
        recipients = allUsers.map(u => u.email).filter(Boolean);
      }

      if (recipients.length === 0) {
        return res.status(200).json({ success: true, count: 0, message: 'No recipients available.' });
      }

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;
      const smtpSender = process.env.SMTP_SENDER || `"Siri Traders" <${smtpUser}>`;

      if (!smtpHost || !smtpUser || !smtpPass) {
        return res.status(500).json({ error: 'Mail server credentials are not configured on Vercel' });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass }
      });

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #faf9f6;">
          <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #2d5016;">
            <h1 style="color: #2d5016; margin: 0; font-size: 24px; letter-spacing: 0.5px;">SIRI TRADERS</h1>
            <p style="color: #687466; margin: 4px 0 0; font-size: 13px;">Fast & Reliable Grocery Delivery</p>
          </div>
          <div style="color: #1f2937; font-size: 15px; line-height: 1.6; padding: 10px 0;">
            ${messageText.replace(/\n/g, '<br />')}
          </div>
          <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <a href="https://www.siritrader.com" style="display: inline-block; background-color: #2d5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Visit Our Store</a>
            <p style="color: #9ca3af; font-size: 11px; margin-top: 20px;">
              H.No 10-152, Nagarjuna Colony Road No 12, Chitkul, Isnapur Municipality, Hyderabad — 502307<br />
              You are receiving this email because you are a registered user of Siri Traders.
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: smtpSender,
        to: smtpUser,
        bcc: recipients,
        subject: subject,
        html: htmlContent
      });

      return res.status(200).json({ success: true, count: recipients.length });
    }

    // ── 3. Orders Collection: GET /api/admin/orders ─────────────────────
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

    // ── 4. Single Order Item: /api/admin/orders?id=:id ───────────────────
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

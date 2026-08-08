import nodemailer from 'nodemailer';

export async function sendOrderNotificationEmail(order, items) {
  const adminEmail = process.env.ADMIN_EMAIL || 'pothineni076@gmail.com';
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSender = process.env.SMTP_SENDER || `"Siri Traders Notifications" <${adminEmail}>`;

  const itemsListText = items.map(item => {
    const qty = item.qty || item.quantity || 1;
    const weightInfo = item.weight ? ` (${item.weight})` : '';
    return `- ${item.name}${weightInfo} x${qty} - ₹${item.price * qty}`;
  }).join('\n');

  const subject = `🔔 New Order Placed: Order #${order.id} - ₹${order.total}`;
  const text = `
Hello Admin,

A new order has been placed on Siri Traders!

Order Details:
----------------------------------------
Order ID: #${order.id}
Payment Method: ${String(order.paymentMethod).toUpperCase()}
Total Amount: ₹${order.total}
Delivery Address: ${order.deliveryAddress}

Items Ordered:
----------------------------------------
${itemsListText}

Please log in to the admin dashboard at https://www.siritrader.com/admin to view and process this order.

Best regards,
Siri Traders Notifications
`;

  console.log(`[EMAIL] Attempting to send notification for order #${order.id} to ${adminEmail}`);

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[EMAIL] SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) not configured. Logging email content instead:');
    console.log('[EMAIL SUBJECT]:', subject);
    console.log('[EMAIL CONTENT]:', text);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    await transporter.sendMail({
      from: smtpSender,
      to: adminEmail,
      subject: subject,
      text: text
    });

    console.log(`[EMAIL] Notification email sent successfully to ${adminEmail}!`);
    return true;
  } catch (error) {
    console.error('[EMAIL] Failed to send notification email:', error.message);
    return false;
  }
}

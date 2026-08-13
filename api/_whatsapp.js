export async function sendOrderNotificationWhatsApp(order, items) {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '+918125702866';
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox sender

  const itemsListText = items.map(item => {
    const qty = item.qty || item.quantity || 1;
    const weightInfo = item.weight ? ` (${item.weight})` : '';
    return `- ${item.name}${weightInfo} x${qty} - ₹${item.price * qty}`;
  }).join('\n');

  const text = `🔔 *New Order Placed on Siri Traders!*

*Order ID:* #ORD-${order.id}
*Payment Method:* ${String(order.paymentMethod).toUpperCase()}
*Total Amount:* ₹${order.total}
*Delivery Address:* ${order.deliveryAddress}

*Items Ordered:*
${itemsListText}

👉 Log in to dashboard to manage: https://www.siritrader.com/admin`;

  console.log(`[WHATSAPP] Attempting to send notification for order #${order.id} to ${adminPhone}`);

  if (!twilioSid || !twilioToken) {
    console.warn('[WHATSAPP] Twilio credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN) not configured. Logging WhatsApp content instead:');
    console.log('[WHATSAPP CONTENT]:\n', text);
    return false;
  }

  // Format destination number: must start with whatsapp: and have country code
  let formattedTo = adminPhone.trim();
  if (!formattedTo.startsWith('whatsapp:')) {
    // Strip spaces and special characters
    formattedTo = formattedTo.replace(/[\s\-()]+/g, '');
    if (!formattedTo.startsWith('+')) {
      formattedTo = '+' + formattedTo;
    }
    formattedTo = 'whatsapp:' + formattedTo;
  }

  // Format from number
  let formattedFrom = twilioFrom.trim();
  if (!formattedFrom.startsWith('whatsapp:')) {
    formattedFrom = 'whatsapp:' + formattedFrom;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', formattedTo);
    params.append('From', formattedFrom);
    params.append('Body', text);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || 'Twilio API error');
    }

    console.log(`[WHATSAPP] Notification sent successfully! SID: ${data.sid}`);
    return true;
  } catch (error) {
    console.error('[WHATSAPP] Failed to send WhatsApp notification:', error.message);
    return false;
  }
}

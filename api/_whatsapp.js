export async function sendOrderNotificationWhatsApp(order, items) {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER || '+918125702866';
  const metaPhoneId = process.env.META_PHONE_NUMBER_ID;
  const metaAccessToken = process.env.META_ACCESS_TOKEN;

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

  console.log(`[META WHATSAPP] Attempting to send notification for order #${order.id} to ${adminPhone}`);

  if (!metaPhoneId || !metaAccessToken) {
    console.warn('[META WHATSAPP] Meta credentials (META_PHONE_NUMBER_ID, META_ACCESS_TOKEN) not configured. Logging WhatsApp content instead:');
    console.log('[META WHATSAPP CONTENT]:\n', text);
    return false;
  }

  // Format destination number: must be digits only (e.g. 918125702866)
  let formattedTo = adminPhone.trim();
  if (formattedTo.startsWith('whatsapp:')) {
    formattedTo = formattedTo.replace('whatsapp:', '');
  }
  // Strip all non-digit characters
  formattedTo = formattedTo.replace(/\D/g, '');

  try {
    const url = `https://graph.facebook.com/v20.0/${metaPhoneId}/messages`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${metaAccessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedTo,
        type: "text",
        text: {
          preview_url: false,
          body: text
        }
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.message || 'Meta API error');
    }

    console.log(`[META WHATSAPP] Notification sent successfully! Message ID: ${data.messages?.[0]?.id}`);
    return true;
  } catch (error) {
    console.error('[META WHATSAPP] Failed to send WhatsApp notification:', error.message);
    return false;
  }
}

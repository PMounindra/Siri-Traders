const MSG91_SEND_URL = 'https://api.msg91.com/api/v2/sendsms';
const MSG91_CHUNK_SIZE = 100;

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).trim().replace(/\D/g, '');
  if (digits.length === 10) digits = `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

// route: '4' = transactional (order updates), '6' = promotional (offers/coupons)
// dltTemplateId: the DLT-registered Content Template ID this message's wording
// matches — telecom operators silently drop messages that don't carry one.
async function sendSMS(to, message, route = '4', dltTemplateId = '') {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'SIRITR';

  const recipients = [...new Set((Array.isArray(to) ? to : [to]).map(normalizePhone).filter(Boolean))];
  if (recipients.length === 0) return { success: false, count: 0 };

  if (!authKey) {
    console.warn('[MSG91 SMS] MSG91_AUTH_KEY not configured. Logging SMS content instead:');
    console.log(`[SMS CONTENT] To: ${recipients.join(', ')}\n`, message);
    return { success: false, count: 0 };
  }

  let sentCount = 0;
  for (let i = 0; i < recipients.length; i += MSG91_CHUNK_SIZE) {
    const batch = recipients.slice(i, i + MSG91_CHUNK_SIZE);
    try {
      const res = await fetch(MSG91_SEND_URL, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: senderId,
          route,
          country: '91',
          sms: [{ message, to: batch, ...(dltTemplateId ? { DLT_TE_ID: dltTemplateId } : {}) }]
        })
      });

      const data = await res.json();

      if (!res.ok || data.type === 'error') {
        throw new Error(data.message || 'MSG91 API error');
      }

      sentCount += batch.length;
      console.log(`[MSG91 SMS] Sent to ${batch.length} recipient(s). Response: ${data.message}`);
    } catch (error) {
      console.error('[MSG91 SMS] Failed to send SMS batch:', error.message);
    }
  }

  return { success: sentCount > 0, count: sentCount };
}

export async function sendOrderNotificationSMS(order, items) {
  const adminPhone = process.env.ADMIN_PHONE_NUMBER || '+918125702866';

  const itemNames = items.map(i => i.name).slice(0, 3).join(', ');
  const moreItems = items.length > 3 ? ` +${items.length - 3} more` : '';

  const message = `New order #ORD-${order.id} on Siri Traders! Amount: Rs.${order.total}, Payment: ${String(order.paymentMethod).toUpperCase()}. Items: ${itemNames}${moreItems}. View: siritrader.com/admin`;

  const result = await sendSMS(adminPhone, message, '4', process.env.MSG91_DLT_TE_ID_ADMIN_ORDER);
  return result.success;
}

export async function sendCustomerOrderStatusSMS(customerPhone, customerName, order, status) {
  if (!customerPhone) return false;

  const message = `Hi ${customerName || 'Customer'}, your Siri Traders order #ORD-${order.id} is now "${status}". Track: siritrader.com/orders`;

  const result = await sendSMS(customerPhone, message, '4', process.env.MSG91_DLT_TE_ID_ORDER_STATUS);
  return result.success;
}

// Used for coupon/offer broadcasts to many customers at once (promotional route).
// Wraps the admin's free text into the single DLT-approved promotional template
// (one variable slot) — the wording here must match that template exactly,
// aside from the {#var#} content, or the telecom operator will drop it.
export async function sendBulkPromotionalSMS(phones, freeText) {
  const message = `Dear Customer, ${freeText}. Shop now: siritrader.com. T&C apply.`;
  return sendSMS(phones, message, process.env.MSG91_PROMO_ROUTE || '6', process.env.MSG91_DLT_TE_ID_PROMO);
}

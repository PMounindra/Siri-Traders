export const formatPrice = (value) => {
  const num = Number(value);
  const safeNum = isNaN(num) ? 0 : num;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(safeNum);
};

export const getOrderBillBreakdown = (order) => {
  if (!order) {
    return { subtotal: 0, deliveryFee: 0, handlingCharge: 0, discount: 0, couponCode: '', gstAmount: 0, grandTotal: 0 };
  }

  const items = order.items || [];
  const itemsTotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity || i.qty) || 1), 0);

  const discount = Number(order.discount) || 0;
  const couponCode = order.couponCode || order.coupon_code || '';

  const subtotal = (order.subtotal !== undefined && Number(order.subtotal) > 0)
    ? Number(order.subtotal)
    : (itemsTotal || Number(order.total) || 0);

  const grandTotal = Number(order.total) || 0;

  let deliveryFee = order.deliveryFee !== undefined
    ? Number(order.deliveryFee)
    : (order.delivery_fee !== undefined ? Number(order.delivery_fee) : 0);

  let handlingCharge = order.handlingCharge !== undefined
    ? Number(order.handlingCharge)
    : (order.handling_charge !== undefined ? Number(order.handling_charge) : 0);

  // Fallback for orders where delivery_fee/handling_charge were unpopulated in DB,
  // but grandTotal > (subtotal - discount)
  if (deliveryFee === 0 && handlingCharge === 0 && grandTotal > (subtotal - discount)) {
    const diff = grandTotal - (subtotal - discount);
    if (diff >= 5) {
      handlingCharge = 5;
      deliveryFee = diff - 5;
    } else {
      deliveryFee = diff;
    }
  }

  // Orders placed before GST was tracked have no gst_amount column value;
  // gstRate is stored per order item so it's recomputed here as a fallback.
  const gstAmount = order.gstAmount !== undefined && Number(order.gstAmount) > 0
    ? Number(order.gstAmount)
    : Math.round(items.reduce((s, i) => {
        const rate = Number(i.gstRate) || 0;
        if (!rate) return s;
        return s + (Number(i.price) || 0) * (Number(i.quantity || i.qty) || 1) * (rate / 100);
      }, 0));

  return {
    subtotal,
    deliveryFee,
    handlingCharge,
    discount,
    couponCode,
    gstAmount,
    grandTotal
  };
};

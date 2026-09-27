export const formatPrice = (value) => {
  const num = Number(value);
  const safeNum = isNaN(num) ? 0 : num;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(safeNum);
};

// Only the product amount and delivery fee are charged — no handling charge, no GST.
export const getOrderBillBreakdown = (order) => {
  if (!order) {
    return { subtotal: 0, deliveryFee: 0, discount: 0, couponCode: '', grandTotal: 0 };
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

  // Older orders (placed while a handling charge or GST existed) may have that
  // amount baked into the stored total with no delivery_fee recorded for it.
  // Attribute any such leftover difference to delivery fee so the numbers add up.
  if (deliveryFee === 0 && grandTotal > (subtotal - discount)) {
    deliveryFee = grandTotal - (subtotal - discount);
  }

  return {
    subtotal,
    deliveryFee,
    discount,
    couponCode,
    grandTotal
  };
};

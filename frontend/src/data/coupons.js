// Coupon codes advertised on the Home page and redeemed at Checkout.
// Single source of truth so both stay in sync.

export const retailCoupons = [
  { iconKey: 'percent', title: 'FLAT ₹50 OFF', desc: 'On your first order above ₹399', code: 'WELCOME50', type: 'flat', value: 50, minOrder: 399 },
  { iconKey: 'truck', title: 'FREE Delivery', desc: 'On all your orders above ₹199', code: 'FREEDEL', type: 'freeDelivery', value: 0, minOrder: 199 },
  { iconKey: 'tag', title: 'Extra 10% OFF', desc: 'On orders above ₹999', code: 'SIRI10', type: 'percent', value: 10, minOrder: 999, maxDiscount: 150 },
];

export const wholesaleCoupons = [
  { iconKey: 'package', title: 'FLAT ₹200 OFF', desc: 'On bulk orders above ₹2999', code: 'BULK200', type: 'flat', value: 200, minOrder: 2999 },
  { iconKey: 'truck', title: 'FREE Delivery', desc: 'On all wholesale orders', code: 'WSFREE', type: 'freeDelivery', value: 0, minOrder: 0 },
  { iconKey: 'percent', title: 'Extra 15% OFF', desc: 'On orders above ₹4999', code: 'WSBIG15', type: 'percent', value: 15, minOrder: 4999, maxDiscount: 750 },
];

export const getCouponsForType = (customerType = 'retail') =>
  customerType === 'wholesale' ? wholesaleCoupons : retailCoupons;

/**
 * Validate + compute a coupon's effect against a cart total.
 * Returns { valid, error, discount, freeDelivery, coupon }.
 */
export const applyCoupon = (code, cartTotal, customerType = 'retail') => {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return { valid: false, error: 'Enter a coupon code.' };

  const coupon = getCouponsForType(customerType).find(c => c.code === normalized);
  if (!coupon) return { valid: false, error: 'Invalid coupon code.' };

  if (cartTotal < coupon.minOrder) {
    return { valid: false, error: `Add items worth ${coupon.minOrder - cartTotal} more to use ${coupon.code}.` };
  }

  if (coupon.type === 'flat') {
    return { valid: true, discount: coupon.value, freeDelivery: false, coupon };
  }
  if (coupon.type === 'percent') {
    const raw = Math.round((cartTotal * coupon.value) / 100);
    const discount = coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
    return { valid: true, discount, freeDelivery: false, coupon };
  }
  if (coupon.type === 'freeDelivery') {
    return { valid: true, discount: 0, freeDelivery: true, coupon };
  }
  return { valid: false, error: 'Invalid coupon code.' };
};

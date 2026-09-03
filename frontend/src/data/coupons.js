// Fallback coupon codes shown if the database is unreachable.
// The live source of truth is the `coupons` DB table, served via SiteDataContext.

export const retailCoupons = [
  { iconKey: 'percent', title: 'FLAT ₹50 OFF', description: 'On your first order above ₹399', code: 'WELCOME50', type: 'flat', value: 50, minOrder: 399 },
  { iconKey: 'tag', title: 'Extra 10% OFF', description: 'On orders above ₹999', code: 'SIRI10', type: 'percent', value: 10, minOrder: 999, maxDiscount: 150 },
];

export const wholesaleCoupons = [
  { iconKey: 'package', title: 'FLAT ₹200 OFF', description: 'On bulk orders above ₹2999', code: 'BULK200', type: 'flat', value: 200, minOrder: 2999 },
  { iconKey: 'truck', title: 'FREE Delivery', description: 'On all wholesale orders', code: 'WSFREE', type: 'freeDelivery', value: 0, minOrder: 0 },
  { iconKey: 'percent', title: 'Extra 15% OFF', description: 'On orders above ₹4999', code: 'WSBIG15', type: 'percent', value: 15, minOrder: 4999, maxDiscount: 750 },
];

/**
 * Validate + compute a coupon's effect against a cart total.
 * `couponList` is the live (DB-backed) list of coupons for the customer's type.
 * `options.cartItems` (needed for category/product/BOGO targeting) and
 * `options.userEmail` (needed for customer-targeted coupons) are optional.
 * Returns { valid, error, discount, freeDelivery, coupon }.
 */
export const applyCoupon = (code, cartTotal, couponList, options = {}) => {
  const { cartItems = [], userEmail = '' } = options;
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return { valid: false, error: 'Enter a coupon code.' };

  const coupon = (couponList || []).find(c => c.code === normalized);
  if (!coupon) return { valid: false, error: 'Invalid coupon code.' };

  if (coupon.active === false) return { valid: false, error: 'This coupon is no longer active.' };

  const today = new Date().toISOString().slice(0, 10);
  if (coupon.startDate && today < coupon.startDate) {
    return { valid: false, error: `This coupon is valid from ${coupon.startDate}.` };
  }
  if (coupon.endDate && today > coupon.endDate) {
    return { valid: false, error: 'This coupon has expired.' };
  }

  if (coupon.targetType === 'customer' && coupon.targetCustomerEmail) {
    if (!userEmail || userEmail.toLowerCase() !== coupon.targetCustomerEmail.toLowerCase()) {
      return { valid: false, error: 'This coupon is not valid for your account.' };
    }
  }

  const minOrder = coupon.minOrder || 0;
  if (cartTotal < minOrder) {
    return { valid: false, error: `Add items worth ${minOrder - cartTotal} more to use ${coupon.code}.` };
  }

  const eligibleItems = cartItems.filter(item => {
    if (coupon.targetType === 'category') return item.category === coupon.targetCategory;
    if (coupon.targetType === 'product') return (item.productId ?? item.id) === coupon.targetProductId;
    return true;
  });

  if ((coupon.targetType === 'category' || coupon.targetType === 'product') && eligibleItems.length === 0) {
    return { valid: false, error: 'This coupon does not apply to the items in your cart.' };
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
  if (coupon.type === 'bogo' || coupon.type === 'buyXgetY') {
    const buyQty = Math.max(1, Number(coupon.buyQuantity) || 1);
    const getQty = Math.max(1, Number(coupon.getQuantity) || 1);
    const groupSize = buyQty + getQty;
    // Sort priciest-first so, within each group, the cheaper units are the ones given free.
    const unitPrices = eligibleItems
      .flatMap(item => Array(item.quantity).fill(item.price))
      .sort((a, b) => b - a);

    if (unitPrices.length < groupSize) {
      return { valid: false, error: `Add ${groupSize - unitPrices.length} more eligible item(s) to use ${coupon.code}.` };
    }

    let discount = 0;
    for (let i = 0; i + groupSize <= unitPrices.length; i += groupSize) {
      discount += unitPrices.slice(i + buyQty, i + groupSize).reduce((sum, p) => sum + p, 0);
    }

    if (discount <= 0) {
      return { valid: false, error: `Add ${groupSize - unitPrices.length} more eligible item(s) to use ${coupon.code}.` };
    }
    return { valid: true, discount, freeDelivery: false, coupon };
  }
  return { valid: false, error: 'Invalid coupon code.' };
};

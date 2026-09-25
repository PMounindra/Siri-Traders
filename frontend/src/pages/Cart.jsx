import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiTag, FiArrowLeft, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteData } from '../context/SiteDataContext';
import { useProducts } from '../context/ProductContext';
import { applyCoupon as evaluateCoupon } from '../data/coupons';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import { getSavedAddresses } from '../utils/userStorage';
import './Cart.css';

const Cart = () => {
  const {
    cartItems, updateQuantity, removeFromCart, cartTotal, cartSavings, cartCount, requireAuth,
    appliedCouponCode, applyCouponCode, removeCoupon, getAppliedCoupon, couponError, setCouponError
  } = useCart();
  const { user, customerType } = useAuth();
  const { retailCoupons, wholesaleCoupons, deliveryZones } = useSiteData();
  const { getProductsForType } = useProducts();
  const todayStr = new Date().toISOString().slice(0, 10);
  const rawCoupons = customerType === 'wholesale' ? wholesaleCoupons : retailCoupons;
  const coupons = rawCoupons.filter(c => {
    if (c.active === false) return false;
    if (c.startDate && todayStr < c.startDate) return false;
    if (c.endDate && todayStr > c.endDate) return false;
    if (c.usageLimit && Number(c.timesUsed || 0) >= Number(c.usageLimit)) return false;
    return true;
  });
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState(appliedCouponCode || '');

  const appliedCoupon = getAppliedCoupon(coupons);

  const savedAddress = getSavedAddresses(user)[0];
  const activeZone = savedAddress ? deliveryZones.find(z => z.area.toLowerCase() === savedAddress.area.toLowerCase()) : null;
  const activeDeliveryFeeVal = activeZone ? activeZone.deliveryFee : 25;
  const activeHandlingChargeVal = activeZone ? activeZone.handlingCharge : 5;

  const baseDeliveryFee = activeDeliveryFeeVal;
  const deliveryFee = appliedCoupon?.freeDelivery ? 0 : baseDeliveryFee;
  const handlingCharge = cartCount > 0 ? activeHandlingChargeVal : 0;
  const couponDiscount = appliedCoupon?.discount || 0;
  const grandTotal = Math.max(0, cartTotal + deliveryFee + handlingCharge - couponDiscount);

  const suggestions = getProductsForType(customerType).filter(p => p.isBestseller && !cartItems.find(i => i.productId === p.id || i.id === p.id)).slice(0, 6);

  const applyCoupon = (code = coupon) => {
    const success = applyCouponCode(code, coupons);
    if (success) {
      setCoupon(code.toUpperCase());
    }
  };

  const handleCheckout = () => {
    if (requireAuth()) {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="page-wrapper">
        <div className="cart-empty">
          <span className="cart-empty__icon"><FiShoppingBag /></span>
          <h2 className="cart-empty__title">Your cart is empty</h2>
          <p className="cart-empty__text">Add items to get started</p>
          <button className="cart-empty__btn" onClick={() => navigate('/home')}>
            <FiShoppingBag /> Start Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="cart">
        <div className="cart__container container">
          {/* Header */}
          <div className="cart__header">
            <button className="cart__back" onClick={() => navigate(-1)}><FiArrowLeft /></button>
            <h1 className="cart__title">My Cart <span>({cartCount} items)</span></h1>
          </div>

          {/* Cart items */}
          <div className="cart__items">
            {cartItems.map(item => {
              const isOfferItem = item.isOffer || item.category === 'offers' || String(item.id).startsWith('offer-');
              const includedText = item.itemsIncluded || (isOfferItem ? item.weight : null);

              return (
                <div key={item.id} className="cart__item">
                  <img
                    src={toWebpImage(item.image)}
                    alt={item.name}
                    className="cart__item-img" 
                    onClick={() => item.productId && navigate(`/product/${item.productId}`)}
                    style={{ cursor: item.productId ? 'pointer' : 'default' }}
                  />
                  <div className="cart__item-info">
                    {isOfferItem && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#B45309',
                        background: '#FEF3C7',
                        padding: '1px 7px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        marginBottom: '3px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px'
                      }}>
                        🎁 {item.badge || 'PROMOTIONAL DEAL'}
                      </span>
                    )}
                    <h3 className="cart__item-name" style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>
                      {item.name}
                    </h3>

                    {/* Clear Included Items / Package Contents */}
                    {isOfferItem && includedText && (
                      <div style={{
                        margin: '4px 0',
                        padding: '4px 8px',
                        background: '#F0FDF4',
                        border: '1px solid #DCFCE7',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        color: '#166534',
                        fontWeight: 600
                      }}>
                        📦 <strong>Included:</strong> {includedText}
                      </div>
                    )}

                    {!isOfferItem && (
                      <span className="cart__item-weight">{item.weight} {item.unit}</span>
                    )}

                    <div className="cart__item-price-row" style={{ marginTop: '4px' }}>
                      <span className="cart__item-price">{formatPrice(item.price * item.quantity)}</span>
                      {item.discount > 0 && <span className="cart__item-mrp">{formatPrice(item.mrp * item.quantity)}</span>}
                    </div>
                  </div>
                  <div className="cart__item-actions">
                    <div className="cart__item-stepper">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                        <FiMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                        <FiPlus />
                      </button>
                    </div>
                    <button className="cart__item-remove" onClick={() => removeFromCart(item.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })}

          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="cart__suggestions">
              <h3 className="cart__suggestions-title">You might also like</h3>
              <div className="cart__suggestions-scroll hide-scrollbar">
                {suggestions.map(p => (
                  <div key={p.id} className="cart__suggestions-item">
                    <ProductCard product={p} compact />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coupon */}
          <div className="cart__coupon">
            <FiTag className="cart__coupon-icon" />
            <div className="cart__coupon-list">
              {coupons.map(item => (
                <button
                  key={item.code}
                  type="button"
                  className={`cart__coupon-chip ${appliedCoupon?.code === item.code ? 'cart__coupon-chip--active' : ''}`}
                  onClick={() => applyCoupon(item.code)}
                >
                  <strong>{item.code}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>
            <div className="cart__coupon-input-wrap">
              <input
                type="text"
                name="coupon_code_no_autocomplete"
                placeholder='Try "SIRI20"'
                value={coupon}
                onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(''); }}
                className="cart__coupon-input"
                id="cart-coupon-input"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-lpignore="true"
              />
              <button className="cart__coupon-btn" onClick={() => applyCoupon()}>Apply</button>
            </div>
            {couponError && <span className="cart__coupon-error">{couponError}</span>}
            {appliedCoupon && (
              <span className="cart__coupon-success" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><FiCheck /> Coupon {appliedCoupon.code} applied! You save {formatPrice(couponDiscount || (appliedCoupon.freeDelivery ? baseDeliveryFee : 0))}</span>
                <button type="button" onClick={() => { removeCoupon(); setCoupon(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontWeight: 'bold', textDecoration: 'underline' }}>Remove</button>
              </span>
            )}
          </div>

          {/* Bill */}
          <div className="cart__bill">
            <h3 className="cart__bill-title">Bill Details</h3>
            <div className="cart__bill-row">
              <span>Item Total</span><span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="cart__bill-row">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? <span className="cart__bill-free">FREE</span> : formatPrice(deliveryFee)}</span>
            </div>
            <div className="cart__bill-row">
              <span>Handling Charge</span><span>{formatPrice(handlingCharge)}</span>
            </div>
            {couponDiscount > 0 && (
              <div className="cart__bill-row cart__bill-row--green">
                <span>Coupon Discount</span><span>-{formatPrice(couponDiscount)}</span>
              </div>
            )}
            <div className="cart__bill-total">
              <span>Grand Total</span><span>{formatPrice(grandTotal)}</span>
            </div>
          </div>

          {cartSavings > 0 && (
            <div className="cart__savings">
              🎉 You're saving {formatPrice(cartSavings)} on this order!
            </div>
          )}
        </div>

        {/* Sticky CTA */}
        <div className="cart__cta">
          <div className="cart__cta-inner container">
            <div className="cart__cta-total">
              <span className="cart__cta-label">Total</span>
              <span className="cart__cta-amount">{formatPrice(grandTotal)}</span>
            </div>
            <button className="cart__cta-btn" onClick={handleCheckout} id="proceed-checkout">
              Proceed to Checkout →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;

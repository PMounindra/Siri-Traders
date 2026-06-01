import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiTag, FiArrowLeft, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getBestsellers } from '../data/products';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../utils/format';
import { getUserStorageKey } from '../utils/userStorage';
import { toWebpImage } from '../utils/images';
import './Cart.css';

const baseCoupons = [
  { code: 'SIRI20', desc: '20% off up to Rs100', type: 'percent', value: 0.2, max: 100 },
  { code: 'WELCOME50', desc: 'Rs50 off first order', type: 'flat', value: 50, firstOrder: true },
  { code: 'FESTIVE30', desc: '30% off up to Rs120', type: 'percent', value: 0.3, max: 120 },
  { code: 'EID25', desc: '25% off up to Rs90', type: 'percent', value: 0.25, max: 90 },
  { code: 'FREEDEL', desc: 'Free delivery fee', type: 'delivery' }
];

const getAdminCoupons = () => {
  try {
    const saved = localStorage.getItem('siri-admin-coupons');
    const adminCoupons = saved ? JSON.parse(saved) : [];
    return adminCoupons
      .filter(coupon => coupon.active && coupon.code)
      .map(coupon => {
        const percent = Number(coupon.discount?.match(/\d+/)?.[0] || 10) / 100;
        return {
          code: coupon.code,
          desc: coupon.discount || 'Admin coupon',
          type: 'percent',
          value: Math.min(percent, 0.9),
          max: 150
        };
      });
  } catch {
    return [];
  }
};

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, cartSavings, cartCount, requireAuth } = useCart();
  const { user, customerType } = useAuth();
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const coupons = useMemo(() => [...getAdminCoupons(), ...baseCoupons], []);
  const hasPlacedOrder = (() => {
    try {
      const key = getUserStorageKey(user, 'orders');
      const saved = key ? localStorage.getItem(key) : null;
      return saved ? JSON.parse(saved).length > 0 : false;
    } catch {
      return false;
    }
  })();

  const deliveryFee = cartTotal >= 500 ? 0 : 25;
  const handlingCharge = cartCount > 0 ? 5 : 0;
  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === 'delivery'
      ? deliveryFee
      : appliedCoupon.type === 'flat'
        ? Math.min(appliedCoupon.value, cartTotal)
        : Math.min(cartTotal * appliedCoupon.value, appliedCoupon.max)
    : 0;
  const grandTotal = cartTotal + deliveryFee + handlingCharge - couponDiscount;

  const suggestions = getBestsellers(customerType).filter(p => !cartItems.find(i => i.productId === p.id || i.id === p.id)).slice(0, 6);

  const applyCoupon = (code = coupon) => {
    const selectedCoupon = coupons.find(item => item.code === code.trim().toUpperCase());

    if (!selectedCoupon) {
      setCouponError('Invalid coupon code');
      setAppliedCoupon(null);
      return;
    }

    if (selectedCoupon.firstOrder && hasPlacedOrder) {
      setCouponError('This coupon is only for first-time users');
      setAppliedCoupon(null);
      return;
    }

    setCoupon(selectedCoupon.code);
    setAppliedCoupon(selectedCoupon);
    setCouponError('');
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
            {cartItems.map(item => (
              <div key={item.id} className="cart__item">
                <img src={toWebpImage(item.image)} alt={item.name} className="cart__item-img" 
                  onClick={() => navigate(`/product/${item.id}`)} />
                <div className="cart__item-info">
                  <h3 className="cart__item-name">{item.name}</h3>
                  <span className="cart__item-weight">{item.weight} {item.unit}</span>
                  <div className="cart__item-price-row">
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
            ))}
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
                  <span>{item.desc}</span>
                </button>
              ))}
            </div>
            <div className="cart__coupon-input-wrap">
              <input
                type="text"
                placeholder='Try "SIRI20"'
                value={coupon}
                onChange={(e) => { setCoupon(e.target.value); setCouponError(''); }}
                className="cart__coupon-input"
                id="cart-coupon-input"
              />
              <button className="cart__coupon-btn" onClick={applyCoupon}>Apply</button>
            </div>
            {couponError && <span className="cart__coupon-error">{couponError}</span>}
            {appliedCoupon && (
              <span className="cart__coupon-success">
                <FiCheck /> Coupon {appliedCoupon.code} applied! You save {formatPrice(couponDiscount)}
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

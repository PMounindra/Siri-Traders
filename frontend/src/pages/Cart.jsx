import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiTag, FiArrowLeft, FiShoppingBag, FiCheck } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteData } from '../context/SiteDataContext';
import { getBestsellers } from '../data/products';
import { applyCoupon as evaluateCoupon } from '../data/coupons';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, cartSavings, cartCount, requireAuth } = useCart();
  const { user, customerType } = useAuth();
  const { retailCoupons, wholesaleCoupons } = useSiteData();
  const coupons = customerType === 'wholesale' ? wholesaleCoupons : retailCoupons;
  const navigate = useNavigate();
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const baseDeliveryFee = cartTotal >= 500 ? 0 : 25;
  const handlingCharge = cartCount > 0 ? 5 : 0;
  const deliveryFee = appliedCoupon?.freeDelivery ? 0 : baseDeliveryFee;
  const couponDiscount = appliedCoupon?.discount || 0;
  const grandTotal = cartTotal + deliveryFee + handlingCharge - couponDiscount;

  const suggestions = getBestsellers(customerType).filter(p => !cartItems.find(i => i.productId === p.id || i.id === p.id)).slice(0, 6);

  const applyCoupon = (code = coupon) => {
    const result = evaluateCoupon(code, cartTotal, coupons);
    if (!result.valid) {
      setCouponError(result.error);
      setAppliedCoupon(null);
      return;
    }
    setCoupon(result.coupon.code);
    setAppliedCoupon(result);
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
                  className={`cart__coupon-chip ${appliedCoupon?.coupon?.code === item.code ? 'cart__coupon-chip--active' : ''}`}
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
                <FiCheck /> Coupon {appliedCoupon.coupon.code} applied! You save {formatPrice(couponDiscount || (appliedCoupon.freeDelivery ? baseDeliveryFee : 0))}
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

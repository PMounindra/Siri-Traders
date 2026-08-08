/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiAward, FiBriefcase, FiCheck, FiCheckCircle,
  FiCreditCard, FiHome, FiMoreHorizontal, FiPlus,
  FiRefreshCw, FiShield, FiShoppingBag, FiTag, FiTruck, FiX
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteData } from '../context/SiteDataContext';
import { getUserStorageKey } from '../utils/userStorage';
import { getDeliveryTimeForAddress } from '../utils/deliveryZones';
import { SERVICEABLE_AREAS, isServiceableAddress } from '../utils/serviceableAreas';
import { applyCoupon } from '../data/coupons';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import './Checkout.css';

const addressTypes = [
  { id: 'home', label: 'Home', icon: <FiHome /> },
  { id: 'work', label: 'Work', icon: <FiBriefcase /> },
  { id: 'other', label: 'Other', icon: <FiMoreHorizontal /> },
];

const trustBadges = [
  { icon: <FiCheckCircle />, title: 'Freshness Guaranteed', sub: 'Handpicked & quality checked' },
  { icon: <FiRefreshCw />, title: 'Easy Returns', sub: 'Hassle-free returns within 24 hrs' },
  { icon: <FiTruck />, title: 'On-time Delivery', sub: 'From our Isnapur store' },
  { icon: <FiAward />, title: 'Quality Products', sub: 'Trusted local brands' },
];

const whyShopPoints = [
  { title: 'Fresh & Quality', sub: 'Handpicked with care' },
  { title: 'Safe & Hygienic Packing', sub: '100% contactless delivery' },
  { title: 'On-time Delivery', sub: 'Fast and reliable' },
  { title: 'Local & Trusted', sub: 'Serving the Isnapur community' },
];

const emptyAddress = {
  name: '',
  phone: '',
  alternatePhone: '',
  email: '',
  flatNo: '',
  landmark: '',
  area: '',
  pincode: '',
  type: 'home',
  instructions: '',
};

const getSavedAddresses = (user) => {
  try {
    const key = getUserStorageKey(user, 'addresses');
    const saved = key ? localStorage.getItem(key) : null;
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const addressLine1 = (address) => address.flatNo || address.address || '';
const addressLine2 = (address) => {
  const parts = [address.landmark, address.area].filter(Boolean);
  return parts.length ? parts.join(', ') : (address.area || '');
};

const Checkout = () => {
  const { cartItems, cartTotal, cartCount, cartSavings, clearCart, requireAuth } = useCart();
  const { user, isAuthenticated, getToken, customerType } = useAuth();
  const { deliveryZones, retailCoupons, wholesaleCoupons, deliverySettings } = useSiteData();
  const coupons = customerType === 'wholesale' ? wholesaleCoupons : retailCoupons;
  const navigate = useNavigate();
  const addressStorageKey = getUserStorageKey(user, 'addresses');
  const orderStorageKey = getUserStorageKey(user, 'orders');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedAddress, setPlacedAddress] = useState(null);
  const [orderId, setOrderId] = useState(() => `ORD-${Date.now().toString().slice(-6)}`);
  const [addresses, setAddresses] = useState(() => getSavedAddresses(user));
  const [selectedAddressId, setSelectedAddressId] = useState(() => getSavedAddresses(user)[0]?.id || '');
  const [showAddressForm, setShowAddressForm] = useState(() => getSavedAddresses(user).length === 0);
  const [addressForm, setAddressForm] = useState(() => ({
    ...emptyAddress,
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  }));
  const [addressError, setAddressError] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const selectedAddress = addresses.find(address => address.id === selectedAddressId);
  const addressReady = !!selectedAddress && !showAddressForm;

  // Determine active zone for checkout fee calculations
  const activeZone = (selectedAddress || addressForm) 
    ? deliveryZones.find(z => z.area.toLowerCase() === (selectedAddress || addressForm).area.toLowerCase()) 
    : null;
  const activeDeliveryFeeVal = activeZone ? activeZone.deliveryFee : 25;
  const activeHandlingChargeVal = activeZone ? activeZone.handlingCharge : 5;

  const couponDiscount = appliedCoupon?.discount || 0;
  const baseDeliveryFee = activeDeliveryFeeVal;
  const deliveryFee = appliedCoupon?.freeDelivery ? 0 : baseDeliveryFee;
  const handlingCharge = activeHandlingChargeVal;
  const grandTotal = Math.max(0, cartTotal + deliveryFee + handlingCharge - couponDiscount);
  const totalSaved = cartSavings + couponDiscount + (appliedCoupon?.freeDelivery ? baseDeliveryFee : 0);

  useEffect(() => {
    if (addressStorageKey) {
      localStorage.setItem(addressStorageKey, JSON.stringify(addresses));
    }
  }, [addresses, addressStorageKey]);

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth();
      navigate('/home');
      return;
    }

    const savedAddresses = getSavedAddresses(user);
    setAddresses(savedAddresses);
    setSelectedAddressId(savedAddresses[0]?.id || '');
    setShowAddressForm(savedAddresses.length === 0);
  }, [isAuthenticated, navigate, requireAuth, user]);

  if (cartItems.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  const updateAddressField = (field, value) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    setAddressError('');
  };

  const updateAddressArea = (areaName) => {
    const area = SERVICEABLE_AREAS.find(a => a.name === areaName);
    setAddressForm(prev => ({ ...prev, area: areaName, pincode: area ? area.pincode : '' }));
    setAddressError('');
  };

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponInput, cartTotal, coupons);
    if (!result.valid) {
      setCouponError(result.error);
      setAppliedCoupon(null);
      return;
    }
    setCouponError('');
    setAppliedCoupon({ code: result.coupon.code, discount: result.discount, freeDelivery: result.freeDelivery });
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const saveAddress = () => {
    const trimmed = Object.fromEntries(
      Object.entries(addressForm).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])
    );
    const requiredFields = ['name', 'phone', 'flatNo', 'area', 'pincode'];
    const missingField = requiredFields.find(field => !trimmed[field]);

    if (missingField) {
      setAddressError('Please fill all required delivery details, including your delivery area.');
      return null;
    }

    if (!/^\d{6}$/.test(trimmed.pincode)) {
      setAddressError('Please enter a valid 6 digit pincode.');
      return null;
    }

    if (!isServiceableAddress(trimmed.area, trimmed.pincode)) {
      setAddressError("We can't deliver to this area.");
      return null;
    }

    const address = {
      ...trimmed,
      address: trimmed.landmark ? `${trimmed.flatNo}, ${trimmed.landmark}` : trimmed.flatNo,
      id: Date.now().toString()
    };
    setAddresses(prev => [address, ...prev]);
    setSelectedAddressId(address.id);
    setShowAddressForm(false);
    setAddressForm({ ...emptyAddress, name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
    setAddressError('');
    return address;
  };

  const handleAddNewAddress = () => {
    setAddressForm({
      ...emptyAddress,
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
    });
    setShowAddressForm(true);
    setAddressError('');
  };

  const finalizeOrder = async (addressForOrder) => {
    const deliveryTime = getDeliveryTimeForAddress(addressForOrder, deliveryZones);

    // Require Clerk authentication for real order placement
    let clerkToken = null;
    if (typeof getToken === 'function') {
      try { clerkToken = await getToken(); } catch { /* not signed in */ }
    }

    if (!clerkToken) {
      alert('Please sign in to place an order.');
      return;
    }

    const orderItemsList = cartItems.map(item => {
      let cleanProductId = parseInt(item.productId, 10);
      if (isNaN(cleanProductId) && typeof item.id === 'string' && item.id.includes('-')) {
        const parts = item.id.split('-');
        if (parts.length >= 2) {
          cleanProductId = parseInt(parts[1], 10);
        }
      }
      if (isNaN(cleanProductId)) {
        cleanProductId = parseInt(item.id, 10);
      }

      return {
        productId: cleanProductId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        weight: item.weight || '',
        unit: item.unit || ''
      };
    });

    const addressLine = [addressLine1(addressForOrder), addressForOrder.landmark, addressForOrder.area]
      .filter(Boolean).join(', ');

    let finalOrderId = orderId;
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clerkToken}`
        },
        body: JSON.stringify({
          items: orderItemsList,
          total: grandTotal,
          deliveryAddress: `${addressLine}, ${addressForOrder.pincode}`,
          paymentMethod: 'cod'
        })
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        alert(err.error || 'Failed to place order. Please try again.');
        return;
      }

      const created = await orderRes.json();
      if (created?.id) finalOrderId = created.id;
    } catch {
      alert('Network error. Please check your connection and try again.');
      return;
    }

    const order = {
      id: finalOrderId,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'preparing',
      deliveryTime,
      payment: 'cod',
      address: addressForOrder,
      items: cartItems.map(item => ({ ...item, qty: item.quantity })),
      total: grandTotal,
      couponCode: appliedCoupon?.code || null,
      discount: couponDiscount,
    };

    try {
      const saved = orderStorageKey ? localStorage.getItem(orderStorageKey) : null;
      const orders = saved ? JSON.parse(saved) : [];
      if (orderStorageKey) {
        localStorage.setItem(orderStorageKey, JSON.stringify([order, ...orders]));
      }
    } catch {
      if (orderStorageKey) {
        localStorage.setItem(orderStorageKey, JSON.stringify([order]));
      }
    }

    localStorage.setItem('siri-traders-last-order-address', JSON.stringify(addressForOrder));
    setPlacedAddress(addressForOrder);
    setOrderPlaced(true);
    clearCart();
    // Navigate straight to order tracking page
    navigate(`/track/${finalOrderId}`, {
      replace: true,
      state: {
        orderId: finalOrderId,
        deliveryTime: getDeliveryTimeForAddress(addressForOrder, deliveryZones),
        address: addressForOrder,
        total: grandTotal,
        items: cartItems.map(item => ({ ...item, qty: item.quantity })),
        justPlaced: true,
      }
    });
  };

  const handlePlaceOrder = () => {
    let addressForOrder = selectedAddress;

    if (showAddressForm || !addressForOrder) {
      addressForOrder = saveAddress();
    }

    if (!addressForOrder) return;

    finalizeOrder(addressForOrder);
  };

  if (orderPlaced) {
    return (
      <div className="page-wrapper">
        <div className="checkout-success">
          <div className="checkout-success__icon">✅</div>
          <h2 className="checkout-success__title">Order Placed Successfully!</h2>
          <p className="checkout-success__order-id">Order #{orderId}</p>
          {(placedAddress || selectedAddress) && (
            <p className="checkout-success__text" style={{color:'#2D5016',fontWeight:700}}>
              Estimated delivery: {getDeliveryTimeForAddress(placedAddress || selectedAddress, deliveryZones)}
            </p>
          )}
          {(placedAddress || selectedAddress) && (
            <div className="checkout-success__address">
              <strong>Delivering to {(placedAddress || selectedAddress).name}</strong>
              <span>{addressLine1(placedAddress || selectedAddress)}{addressLine2(placedAddress || selectedAddress) ? `, ${addressLine2(placedAddress || selectedAddress)}` : ''}</span>
              <span>{(placedAddress || selectedAddress).phone}</span>
            </div>
          )}
          <div className="checkout-success__actions">
            <button onClick={() => navigate(`/track/${orderId}`)} className="checkout-success__btn checkout-success__btn--primary">
              Track Order
            </button>
            <button onClick={() => navigate('/home')} className="checkout-success__btn checkout-success__btn--secondary">
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 1, label: 'Cart', state: 'done' },
    { id: 2, label: 'Address', state: addressReady ? 'done' : 'current' },
    { id: 3, label: 'Payment', state: addressReady ? 'done' : 'upcoming' },
    { id: 4, label: 'Review', state: addressReady ? 'current' : 'upcoming' },
  ];

  return (
    <div className="page-wrapper">
      <div className="checkout">
        <div className="checkout__container container">
          <div className="checkout__header">
            <button className="checkout__back" onClick={() => navigate(-1)}><FiArrowLeft /></button>
            <h1 className="checkout__title">Checkout</h1>
            <div className="checkout__stepper">
              {steps.map((step, i) => (
                <div className="checkout__step" key={step.id}>
                  <div className={`checkout__step-dot checkout__step-dot--${step.state}`}>
                    {step.state === 'done' ? <FiCheck /> : step.id}
                  </div>
                  <span className={`checkout__step-label checkout__step-label--${step.state}`}>{step.label}</span>
                  {i < steps.length - 1 && <span className={`checkout__step-line checkout__step-line--${step.state === 'upcoming' ? 'upcoming' : 'done'}`} />}
                </div>
              ))}
            </div>
          </div>

          <div className="checkout__secure-banner">
            <FiShield /> 100% Secure Payments <span className="checkout__secure-dot">•</span> Your data is safe and encrypted
          </div>

          <div className="checkout__layout">
            <div className="checkout__main">

              {/* Delivery details */}
              <div className="checkout__section">
                <h3 className="checkout__section-title"><FiTruck /> Delivery Details</h3>

                {addresses.length > 0 && (
                  <div className="checkout__address-list">
                    {addresses.map(address => (
                      <button
                        key={address.id}
                        type="button"
                        className={`checkout__address-card ${selectedAddressId === address.id ? 'checkout__address-card--active' : ''}`}
                        onClick={() => {
                          setSelectedAddressId(address.id);
                          setShowAddressForm(false);
                        }}
                      >
                        <span className="checkout__address-check">
                          {selectedAddressId === address.id && <FiCheck />}
                        </span>
                        <span className="checkout__address-text">
                          <strong>{address.name} {address.type && <span className="checkout__address-type">{address.type}</span>}</strong>
                          <span>{address.phone}{address.email ? ` · ${address.email}` : ''}</span>
                          <span>{addressLine1(address)}{addressLine2(address) ? `, ${addressLine2(address)}` : ''}, {address.pincode}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!showAddressForm && (
                  <button type="button" className="checkout__address-add" onClick={handleAddNewAddress}>
                    <FiPlus /> Add New Address
                  </button>
                )}

                {showAddressForm && (
                  <div className="checkout__address-form">
                    <p className="checkout__form-subhead">Contact Information</p>
                    <div className="checkout__input-row">
                      <label className="checkout__field">
                        <span>Full Name *</span>
                        <input type="text" placeholder="Your name" value={addressForm.name}
                          onChange={(e) => updateAddressField('name', e.target.value)} className="checkout__input" />
                      </label>
                      <label className="checkout__field">
                        <span>Mobile Number *</span>
                        <input type="tel" placeholder="10-digit mobile number" value={addressForm.phone}
                          onChange={(e) => updateAddressField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className="checkout__input" />
                      </label>
                    </div>
                    <div className="checkout__input-row">
                      <label className="checkout__field">
                        <span>Email ID (optional)</span>
                        <input type="email" placeholder="you@example.com" value={addressForm.email}
                          onChange={(e) => updateAddressField('email', e.target.value)} className="checkout__input" />
                      </label>
                      <label className="checkout__field">
                        <span>Alternate Number (optional)</span>
                        <input type="tel" placeholder="Backup contact" value={addressForm.alternatePhone}
                          onChange={(e) => updateAddressField('alternatePhone', e.target.value.replace(/\D/g, '').slice(0, 10))} className="checkout__input" />
                      </label>
                    </div>

                    <p className="checkout__form-subhead">Delivery Address</p>
                    <div className="checkout__address-tabs">
                      {addressTypes.map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          className={`checkout__address-tab ${addressForm.type === t.id ? 'checkout__address-tab--active' : ''}`}
                          onClick={() => updateAddressField('type', t.id)}
                        >
                          {t.icon} {t.label}
                        </button>
                      ))}
                    </div>
                    <div className="checkout__input-row">
                      <label className="checkout__field">
                        <span>Flat / House No. *</span>
                        <input type="text" placeholder="e.g. 12-3-456/7" value={addressForm.flatNo}
                          onChange={(e) => updateAddressField('flatNo', e.target.value)} className="checkout__input" />
                      </label>
                      <label className="checkout__field">
                        <span>Landmark (optional)</span>
                        <input type="text" placeholder="Nearby landmark" value={addressForm.landmark}
                          onChange={(e) => updateAddressField('landmark', e.target.value)} className="checkout__input" />
                      </label>
                    </div>
                    <div className="checkout__input-row">
                      <label className="checkout__field">
                        <span>Delivery Area *</span>
                        <select
                          value={addressForm.area}
                          onChange={(e) => updateAddressArea(e.target.value)}
                          className="checkout__input checkout__select"
                        >
                          <option value="">Select your delivery area</option>
                          {SERVICEABLE_AREAS.map((area) => (
                            <option key={area.name} value={area.name}>{area.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="checkout__field">
                        <span>Pincode</span>
                        <input type="text" placeholder="Auto-filled" value={addressForm.pincode} readOnly
                          className="checkout__input checkout__input--readonly" />
                      </label>
                    </div>
                    <p className="checkout__area-note">
                      We currently deliver only to {SERVICEABLE_AREAS.map(a => a.name).join(', ')}.
                    </p>
                    <label className="checkout__field">
                      <span>Delivery Instructions (optional)</span>
                      <textarea
                        placeholder="E.g. Leave at door, call before delivery..."
                        value={addressForm.instructions}
                        maxLength={120}
                        onChange={(e) => updateAddressField('instructions', e.target.value)}
                        className="checkout__input checkout__textarea"
                      />
                    </label>

                    <button type="button" className="checkout__save-address" onClick={saveAddress}>
                      Save Address
                    </button>
                    {addresses.length > 0 && (
                      <button type="button" className="checkout__address-cancel" onClick={() => setShowAddressForm(false)}>
                        Cancel
                      </button>
                    )}
                    {addressError && <p className="checkout__address-error">{addressError}</p>}
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="checkout__section">
                <h3 className="checkout__section-title"><FiCreditCard /> Payment Method</h3>
                <p className="checkout__section-sub">Cash on Delivery is the only payment option</p>
                <div className="checkout__payments">
                  <div className="checkout__payment checkout__payment--active checkout__payment--solo">
                    <span className="checkout__payment-icon">💵</span>
                    <div className="checkout__payment-info">
                      <span className="checkout__payment-name">Cash on Delivery</span>
                      <span className="checkout__payment-desc">Pay when your order is delivered</span>
                    </div>
                    <FiCheck className="checkout__payment-check" />
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="checkout__trust-row">
                {trustBadges.map((badge) => (
                  <div className="checkout__trust-badge" key={badge.title}>
                    <span className="checkout__trust-icon">{badge.icon}</span>
                    <span className="checkout__trust-title">{badge.title}</span>
                    <span className="checkout__trust-sub">{badge.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order summary — right rail */}
            <aside className="checkout__aside">
              <div className="checkout__summary-card">
                <h3 className="checkout__summary-title"><FiShoppingBag /> Order Summary ({cartCount} item{cartCount !== 1 ? 's' : ''})</h3>

                <div className="checkout__summary-items">
                  {cartItems.map(item => (
                    <div key={item.id} className="checkout__summary-item">
                      <img src={toWebpImage(item.image)} alt={item.name} className="checkout__summary-item-img" />
                      <div className="checkout__summary-item-info">
                        <strong>{item.name}</strong>
                        <span>{[item.weight, item.unit].filter(Boolean).join(' ')} {item.quantity > 1 ? `× ${item.quantity}` : ''}</span>
                      </div>
                      <span className="checkout__summary-item-price">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="checkout__coupon">
                  {appliedCoupon ? (
                    <div className="checkout__coupon-applied">
                      <span><FiTag /> Coupon <strong>{appliedCoupon.code}</strong> applied</span>
                      <button type="button" onClick={removeCoupon} aria-label="Remove coupon"><FiX /></button>
                    </div>
                  ) : (
                    <div className="checkout__coupon-input-row">
                      <input
                        type="text"
                        placeholder="Have a coupon code?"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                        className="checkout__input checkout__coupon-input"
                      />
                      <button type="button" className="checkout__coupon-apply" onClick={handleApplyCoupon}>Apply</button>
                    </div>
                  )}
                  {couponError && <p className="checkout__address-error">{couponError}</p>}
                </div>

                <div className="checkout__bill">
                  <div className="checkout__bill-row"><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
                  <div className="checkout__bill-row">
                    <span>Delivery Fee</span>
                    <span>{deliveryFee === 0 ? <span className="checkout__bill-free">FREE</span> : formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="checkout__bill-row"><span>Handling Charge</span><span>{formatPrice(handlingCharge)}</span></div>
                  {couponDiscount > 0 && (
                    <div className="checkout__bill-row checkout__bill-row--discount">
                      <span>Coupon ({appliedCoupon.code})</span><span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="checkout__bill-total"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
                  {totalSaved > 0 && (
                    <p className="checkout__saved"><FiCheckCircle /> You saved {formatPrice(totalSaved)} on this order</p>
                  )}
                </div>

                <div className="checkout__why-shop">
                  <p className="checkout__why-shop-title">Why shop with Siri Traders?</p>
                  {whyShopPoints.map(point => (
                    <div className="checkout__why-shop-item" key={point.title}>
                      <FiCheckCircle />
                      <div>
                        <strong>{point.title}</strong>
                        <span>{point.sub}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="checkout__place-btn" onClick={handlePlaceOrder} id="place-order-btn">
                  <span>Place Order (COD) →</span>
                  <span className="checkout__place-btn-sub">
                    Pay {formatPrice(grandTotal)} on delivery
                  </span>
                </button>

                <div className="checkout__secure-footer">
                  <span><FiShield /> Secure Payments</span>
                  <span><FiCheckCircle /> 100% Secure</span>
                </div>
                <p className="checkout__delivery-footer">
                  <FiTruck /> Delivering to you in {getDeliveryTimeForAddress(selectedAddress || addressForm, deliveryZones)}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiAward, FiBriefcase, FiCheck, FiCheckCircle,
  FiCreditCard, FiCrosshair, FiEdit2, FiHome, FiMoreHorizontal, FiPlus,
  FiRefreshCw, FiShield, FiShoppingBag, FiTag, FiTruck, FiX
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteData } from '../context/SiteDataContext';
import { getUserStorageKey } from '../utils/userStorage';
import { getDeliveryTimeForAddress, detectCurrentDeliveryZone, isServiceablePincode, OUT_OF_SERVICE_MESSAGE } from '../utils/deliveryZones';
import { applyCoupon } from '../data/coupons';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import ProductImage from '../components/ProductImage';
import Loading from '../components/Loading';
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
  const {
    cartItems, cartTotal, cartCount, clearCart, requireAuth,
    appliedCouponCode, applyCouponCode, removeCoupon: contextRemoveCoupon, getAppliedCoupon, couponError, setCouponError
  } = useCart();
  const { user, isAuthenticated, isLoaded, getToken, customerType } = useAuth();
  const { deliveryZones, retailCoupons, wholesaleCoupons, allCoupons = [], deliverySettings, homeSections } = useSiteData();
  const storeClosed = homeSections?.storeOpen === false;
  const coupons = customerType === 'wholesale' ? wholesaleCoupons : retailCoupons;
  const navigate = useNavigate();
  const addressStorageKey = getUserStorageKey(user, 'addresses');
  const orderStorageKey = getUserStorageKey(user, 'orders');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedAddress, setPlacedAddress] = useState(null);
  const [orderId, setOrderId] = useState(() => `ORD-${Date.now().toString().slice(-6)}`);
  const [addresses, setAddresses] = useState(() => getSavedAddresses(user));
  const [selectedAddressId, setSelectedAddressId] = useState(() => getSavedAddresses(user)[0]?.id || '');
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(() => getSavedAddresses(user).length === 0);
  const [addressForm, setAddressForm] = useState(() => ({
    ...emptyAddress,
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
  }));
  const [addressError, setAddressError] = useState('');
  const [locatingArea, setLocatingArea] = useState(false);
  // "Other" lets a customer type their own locality + pincode when it isn't
  // one of the admin's specifically-priced zones — still accepted as long as
  // the pincode is within Hyderabad (500xxx) or Sangareddy (502xxx).
  const [useManualArea, setUseManualArea] = useState(false);
  const [couponInput, setCouponInput] = useState(appliedCouponCode || '');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');

  const appliedCoupon = getAppliedCoupon(coupons, allCoupons);

  useEffect(() => {
    if (appliedCouponCode) {
      setCouponInput(appliedCouponCode);
    }
  }, [appliedCouponCode]);

  const selectedAddress = addresses.find(address => address.id === selectedAddressId);
  const addressReady = !!selectedAddress && !showAddressForm;

  // Determine active zone for checkout fee calculations
  const activeZone = (selectedAddress || addressForm) 
    ? deliveryZones.find(z => z.area.toLowerCase() === (selectedAddress || addressForm).area.toLowerCase()) 
    : null;
  const activeDeliveryFeeVal = activeZone ? activeZone.deliveryFee : 25;

  const couponDiscount = appliedCoupon?.discount || 0;
  const baseDeliveryFee = activeDeliveryFeeVal;
  const deliveryFee = appliedCoupon?.freeDelivery ? 0 : baseDeliveryFee;
  const grandTotal = Math.max(0, cartTotal + deliveryFee - couponDiscount);

  const minOrderValue = Number(deliverySettings?.minOrderValue) || 0;
  const isBelowMinOrder = minOrderValue > 0 && cartTotal < minOrderValue;
  const minOrderDiff = Math.max(0, minOrderValue - cartTotal);

  useEffect(() => {
    if (addressStorageKey) {
      localStorage.setItem(addressStorageKey, JSON.stringify(addresses));
    }
  }, [addresses, addressStorageKey]);

  useEffect(() => {
    const reloadAddresses = () => {
      const saved = getSavedAddresses(user);
      setAddresses(saved);
      if (saved.length > 0 && !selectedAddressId) {
        setSelectedAddressId(saved[0].id);
      }
    };
    window.addEventListener("siri-addresses-changed", reloadAddresses);
    window.addEventListener("storage", reloadAddresses);
    return () => {
      window.removeEventListener("siri-addresses-changed", reloadAddresses);
      window.removeEventListener("storage", reloadAddresses);
    };
  }, [user, selectedAddressId]);

  useEffect(() => {
    // Wait for Clerk to finish restoring the session before treating the
    // user as logged out — on a reload, isAuthenticated starts false for a
    // moment even for an already-signed-in user, and redirecting away here
    // sent people back to /home mid-checkout even though they were signed in.
    if (!isLoaded) return;

    if (!isAuthenticated) {
      requireAuth();
      navigate('/home');
      return;
    }

    const savedAddresses = getSavedAddresses(user);
    setAddresses(savedAddresses);
    setSelectedAddressId(savedAddresses[0]?.id || '');
    setShowAddressForm(savedAddresses.length === 0);
  }, [isLoaded, isAuthenticated, navigate, requireAuth, user]);

  // Cart is keyed by the signed-in user's id, which is briefly null while
  // Clerk restores the session on a page reload — cartItems reads as empty
  // during that window even for a real, non-empty cart. Wait for isLoaded
  // before treating an empty cart as genuinely empty.
  if (!isLoaded) {
    return <Loading />;
  }

  if (cartItems.length === 0 && !orderPlaced) {
    navigate('/cart');
    return null;
  }

  const updateAddressField = (field, value) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    setAddressError('');
  };

  const updateAddressArea = (areaName, explicitPincode) => {
    const area = deliveryZones.find(a => a.area === areaName);
    setAddressForm(prev => ({ ...prev, area: areaName, pincode: area ? area.pincode : (explicitPincode || '') }));
    setAddressError('');
  };

  const useCurrentLocationCheckout = async () => {
    setAddressError('');
    setLocatingArea(true);
    const { zone, landmark, error } = await detectCurrentDeliveryZone(deliveryZones);
    if (zone) {
      // Pass the detected pincode through directly — a locality GPS found
      // that isn't one of the admin's specifically-configured zones (still
      // serviceable, just at the default fee) has no row to look it up from.
      // Show it as editable text too: a <select> silently shows its first
      // option when the value doesn't match any of them, which would
      // misrepresent whatever area GPS actually detected.
      updateAddressArea(zone.name, zone.pincode);
      setUseManualArea(true);
      // Precise street-level text from GPS — house/flat number still has to
      // come from the customer, so only fill landmark if they haven't typed
      // one already.
      if (landmark) {
        setAddressForm(prev => (prev.landmark ? prev : { ...prev, landmark }));
      }
    } else {
      setAddressError(error);
    }
    setLocatingArea(false);
  };

  const handleApplyCoupon = () => {
    const success = applyCouponCode(couponInput, coupons, allCoupons);
    if (success) {
      setCouponInput('');
    }
  };

  const removeCoupon = () => {
    contextRemoveCoupon();
    setCouponInput('');
  };

  const handleEditAddress = (address, e) => {
    if (e) e.stopPropagation();
    setEditingAddressId(address.id);
    setAddressForm({
      ...emptyAddress,
      name: address.name || user?.name || '',
      phone: address.phone || user?.phone || '',
      alternatePhone: address.alternatePhone || '',
      email: address.email || user?.email || '',
      flatNo: address.flatNo || address.address || '',
      landmark: address.landmark || '',
      area: address.area || '',
      pincode: address.pincode || '',
      type: address.type || 'home',
      instructions: address.instructions || '',
    });
    const zone = deliveryZones.find(z => z.area.toLowerCase() === (address.area || '').toLowerCase());
    if (!zone && address.area) {
      setUseManualArea(true);
    } else {
      setUseManualArea(false);
    }
    setAddressError('');
    setShowAddressForm(true);
  };

  const cancelEditAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      ...emptyAddress,
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
    });
    setAddressError('');
    if (addresses.length > 0) {
      setShowAddressForm(false);
    }
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

    if (!/^[6-9]\d{9}$/.test(trimmed.phone)) {
      setAddressError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
      return null;
    }

    if (trimmed.alternatePhone && !/^[6-9]\d{9}$/.test(trimmed.alternatePhone)) {
      setAddressError('Please enter a valid 10-digit alternate mobile number starting with 6, 7, 8, or 9.');
      return null;
    }

    if (!/^\d{6}$/.test(trimmed.pincode)) {
      setAddressError('Please enter a valid 6 digit pincode.');
      return null;
    }

    // Serviceable if it's one of the admin's specifically-configured zones,
    // or any Hyderabad/Sangareddy pincode (500xxx / 502xxx) — we deliver
    // everywhere in both, not only the areas admin has individually priced.
    const isServiceable = deliveryZones.some(z => z.area.toLowerCase() === trimmed.area.toLowerCase() && z.pincode === trimmed.pincode)
      || isServiceablePincode(trimmed.pincode);
    if (!isServiceable) {
      setAddressError(OUT_OF_SERVICE_MESSAGE);
      return null;
    }

    let nextAddress;
    let nextAddresses;
    const formattedAddressLine = trimmed.landmark ? `${trimmed.flatNo}, ${trimmed.landmark}` : trimmed.flatNo;

    if (editingAddressId) {
      nextAddress = {
        ...trimmed,
        address: formattedAddressLine,
        id: editingAddressId,
      };
      nextAddresses = addresses.map((a) => (a.id === editingAddressId ? nextAddress : a));
      setEditingAddressId(null);
    } else {
      nextAddress = {
        ...trimmed,
        address: formattedAddressLine,
        id: Date.now().toString(),
      };
      nextAddresses = [nextAddress, ...addresses.filter((a) => a.id !== nextAddress.id)];
    }

    setAddresses(nextAddresses);
    setSelectedAddressId(nextAddress.id);
    setShowAddressForm(false);
    setAddressForm({ ...emptyAddress, name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
    setAddressError('');

    if (addressStorageKey) {
      localStorage.setItem(addressStorageKey, JSON.stringify(nextAddresses));
      window.dispatchEvent(new CustomEvent('siri-addresses-changed'));
    }

    return nextAddress;
  };

  const handleAddNewAddress = () => {
    setEditingAddressId(null);
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
    setOrderError('');
    setPlacingOrder(true);
    try {
    const deliveryTime = getDeliveryTimeForAddress(addressForOrder, deliveryZones);

    // Require Clerk authentication for real order placement
    let clerkToken = null;
    if (typeof getToken === 'function') {
      try { clerkToken = await getToken(); } catch { /* not signed in */ }
    }

    if (!clerkToken) {
      setOrderError('Please sign in to place an order.');
      return;
    }

    const orderItemsList = cartItems.map(item => {
      // Promotional/combo offer items have no backing product row — their id
      // looks like "offer-<id>", not a real numeric product id. Send null
      // for those rather than forcing a bogus number through.
      let cleanProductId = parseInt(item.productId, 10);
      if (isNaN(cleanProductId)) cleanProductId = null;

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
          subtotal: cartTotal,
          deliveryFee,
          couponCode: appliedCoupon?.code || null,
          discount: couponDiscount,
          deliveryAddress: `${addressLine}, ${addressForOrder.pincode}`,
          paymentMethod: 'cod'
        })
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        setOrderError(err.error || 'Failed to place order. Please try again.');
        return;
      }

      const created = await orderRes.json();
      if (created?.id) finalOrderId = created.id;
    } catch {
      setOrderError('Network error. Please check your connection and try again.');
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
    } finally {
      setPlacingOrder(false);
    }
  };

  const handlePlaceOrder = () => {
    if (placingOrder || storeClosed) return;

    if (isBelowMinOrder) {
      setOrderError(`Minimum order value is ${formatPrice(minOrderValue)}. Please add items worth ${formatPrice(minOrderDiff)} more to place your order.`);
      return;
    }

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
                      <div
                        key={address.id}
                        role="button"
                        tabIndex={0}
                        className={`checkout__address-card ${selectedAddressId === address.id ? 'checkout__address-card--active' : ''} ${editingAddressId === address.id ? 'checkout__address-card--editing' : ''}`}
                        onClick={() => {
                          setSelectedAddressId(address.id);
                          setShowAddressForm(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedAddressId(address.id);
                            setShowAddressForm(false);
                          }
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
                        <button
                          type="button"
                          className="checkout__address-edit-btn"
                          onClick={(e) => handleEditAddress(address, e)}
                          title="Edit address"
                        >
                          <FiEdit2 size={13} /> Edit
                        </button>
                      </div>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <p className="checkout__form-subhead" style={{ margin: 0 }}>
                        {editingAddressId ? 'Edit Delivery Address' : 'Contact Information'}
                      </p>
                      {editingAddressId && (
                        <button type="button" onClick={cancelEditAddress} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                          Cancel Edit
                        </button>
                      )}
                    </div>
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
                    <button
                      type="button"
                      className="checkout__locate-btn"
                      onClick={useCurrentLocationCheckout}
                      disabled={locatingArea}
                    >
                      <FiCrosshair className={locatingArea ? 'checkout__locate-icon--spin' : ''} />
                      {locatingArea ? 'Detecting your location…' : 'Use my current location'}
                    </button>
                    <div className="checkout__input-row">
                      <label className="checkout__field">
                        <span>Delivery Area *</span>
                        {useManualArea ? (
                          <input
                            type="text"
                            placeholder="e.g. Gachibowli, Kompally, Sangareddy town..."
                            value={addressForm.area}
                            onChange={(e) => updateAddressField('area', e.target.value)}
                            className="checkout__input"
                          />
                        ) : (
                          <select
                            value={addressForm.area}
                            onChange={(e) => {
                              if (e.target.value === '__other__') { setUseManualArea(true); return; }
                              updateAddressArea(e.target.value);
                            }}
                            className="checkout__input checkout__select"
                          >
                            <option value="">Select your delivery area</option>
                            {deliveryZones.map((zone) => (
                              <option key={zone.id} value={zone.area}>{zone.area}</option>
                            ))}
                            <option value="__other__">Other area in Hyderabad / Sangareddy…</option>
                          </select>
                        )}
                      </label>
                      <label className="checkout__field">
                        <span>Pincode</span>
                        <input
                          type="text"
                          placeholder={useManualArea ? 'e.g. 500032' : 'Auto-filled'}
                          value={addressForm.pincode}
                          readOnly={!useManualArea}
                          onChange={(e) => updateAddressField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className={`checkout__input ${useManualArea ? '' : 'checkout__input--readonly'}`}
                        />
                      </label>
                    </div>
                    {useManualArea && (
                      <button type="button" className="checkout__locate-btn" style={{ marginTop: '-8px', marginBottom: '4px' }}
                        onClick={() => { setUseManualArea(false); updateAddressArea(''); }}>
                        ← Choose from the list instead
                      </button>
                    )}
                    <p className="checkout__area-note">
                      We deliver across Hyderabad and Sangareddy. Specific areas we've set up with their own delivery time: {deliveryZones.map(z => z.area).join(', ')}.
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
                      {editingAddressId ? 'Update Address' : 'Save Address'}
                    </button>
                    {(addresses.length > 0 || editingAddressId) && (
                      <button type="button" className="checkout__address-cancel" onClick={cancelEditAddress}>
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
                      <ProductImage src={item.image} name={item.name} className="checkout__summary-item-img" style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'contain', flexShrink: 0 }} />
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
                        name="checkout_coupon_no_autofill"
                        placeholder="Have a coupon code?"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                        className="checkout__input checkout__coupon-input"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck="false"
                        data-lpignore="true"
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
                  {couponDiscount > 0 && (
                    <div className="checkout__bill-row checkout__bill-row--discount">
                      <span>Coupon ({appliedCoupon.code})</span><span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <div className="checkout__bill-total"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
                </div>

                <div className="checkout__payment-info-box" style={{
                  padding: '16px',
                  background: '#FAF9F6',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border-light)',
                  marginBottom: '20px',
                  color: '#2D5016'
                }}>
                  <p style={{ margin: '0 0 10px', fontWeight: '800', fontSize: '15px', color: '#2D5016', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiCreditCard /> Doorstep Payment Options
                  </p>
                  <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#687466', fontWeight: '500', lineHeight: '1.4' }}>
                    Pay at your doorstep during delivery using any of these convenient methods:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <FiCheck style={{ color: '#5B8C3F', marginTop: '3px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#111827' }}>Cash on Delivery</strong>
                        <span style={{ fontSize: '11px', color: '#687466' }}>Standard cash payment is always welcome.</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <FiCheck style={{ color: '#5B8C3F', marginTop: '3px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#111827' }}>Sodexo Meal Cards</strong>
                        <span style={{ fontSize: '11px', color: '#687466' }}>We happily accept Sodexo cards during delivery.</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <FiCheck style={{ color: '#5B8C3F', marginTop: '3px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#111827' }}>Credit & Debit Cards</strong>
                        <span style={{ fontSize: '11px', color: '#687466' }}>Swipe your cards with our delivery executive.</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <FiCheck style={{ color: '#5B8C3F', marginTop: '3px', flexShrink: 0 }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#111827' }}>UPI Payments (GPay/PhonePe)</strong>
                        <span style={{ fontSize: '11px', color: '#687466' }}>Scan the QR code and pay directly via any UPI app.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {storeClosed && <p className="checkout__address-error">🔒 The store is closed right now. Orders can't be placed until we reopen.</p>}
                {isBelowMinOrder && <p className="checkout__address-error">⚠️ Minimum order value is {formatPrice(minOrderValue)}. Please add items worth {formatPrice(minOrderDiff)} more to place your order.</p>}
                {orderError && <p className="checkout__address-error">{orderError}</p>}
                <button
                  className="checkout__place-btn"
                  onClick={handlePlaceOrder}
                  id="place-order-btn"
                  disabled={placingOrder || storeClosed || isBelowMinOrder}
                  aria-busy={placingOrder}
                  style={isBelowMinOrder ? { background: '#9CA3AF', cursor: 'not-allowed', borderColor: '#9CA3AF' } : {}}
                >
                  <span>{placingOrder ? 'Placing Order…' : isBelowMinOrder ? `Add ${formatPrice(minOrderDiff)} More to Order` : 'Place Order (COD) →'}</span>
                  <span className="checkout__place-btn-sub">
                    {placingOrder ? 'Please wait, do not close this page' : isBelowMinOrder ? `Minimum order value is ${formatPrice(minOrderValue)}` : `Pay ${formatPrice(grandTotal)} on delivery`}
                  </span>
                </button>

                <div className="checkout__secure-footer">
                  <span><FiShield /> Secure Payments</span>
                  <span><FiCheckCircle /> 100% Secure</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiClock, FiCreditCard, FiGlobe, FiMapPin, FiPlus, FiSmartphone } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getUserStorageKey } from '../utils/userStorage';
import { getDeliveryTimeForAddress } from '../utils/deliveryZones';
import { formatPrice } from '../utils/format';
import NetBankingFlow from '../components/NetBankingFlow';
import './Checkout.css';

const timeSlots = [
  { id: 'express', label: '10 mins', sub: 'Express', icon: '⚡' },
  { id: '30min', label: '30 mins', sub: 'Standard', icon: '🕐' },
  { id: '1hr', label: '1 hour', sub: 'Economy', icon: '📦' },
  { id: '2-4hr', label: '2-4 hours', sub: 'Scheduled', icon: '📅' },
];

const emptyAddress = {
  name: '',
  phone: '',
  email: '',
  address: '',
  pincode: ''
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

const Checkout = () => {
  const { cartItems, cartTotal, cartCount, clearCart, requireAuth } = useCart();
  const { location, user, isAuthenticated, getToken } = useAuth();
  const navigate = useNavigate();
  const addressStorageKey = getUserStorageKey(user, 'addresses');
  const orderStorageKey = getUserStorageKey(user, 'orders');
  const [selectedSlot, setSelectedSlot] = useState('express');
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [showNetBankingFlow, setShowNetBankingFlow] = useState(false);
  const [showItems, setShowItems] = useState(false);
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
    address: location.full || location.address || '',
    pincode: ''
  }));
  const [addressError, setAddressError] = useState('');

  const deliveryFee = cartTotal >= 500 ? 0 : 25;
  const handlingCharge = 5;
  const grandTotal = cartTotal + deliveryFee + handlingCharge;
  const selectedAddress = addresses.find(address => address.id === selectedAddressId);

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

  const saveAddress = () => {
    const trimmed = Object.fromEntries(
      Object.entries(addressForm).map(([key, value]) => [key, value.trim()])
    );
    const missing = Object.entries(trimmed).find(([, value]) => !value);

    if (missing) {
      setAddressError('Please fill all address details before payment.');
      return null;
    }

    if (!/^\d{6}$/.test(trimmed.pincode)) {
      setAddressError('Please enter a valid 6 digit pincode.');
      return null;
    }

    const address = {
      ...trimmed,
      id: Date.now().toString()
    };
    setAddresses(prev => [address, ...prev]);
    setSelectedAddressId(address.id);
    setShowAddressForm(false);
    setAddressForm(emptyAddress);
    setAddressError('');
    return address;
  };

  const handleAddNewAddress = () => {
    setAddressForm({
      ...emptyAddress,
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      address: '',
      pincode: ''
    });
    setShowAddressForm(true);
    setAddressError('');
  };

  const finalizeOrder = async (addressForOrder, paymentDetails = {}) => {
    const orderTotal = grandTotal;
    const orderItemsList = cartItems.map(item => ({
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      weight: item.weight || '',
      unit: item.unit || ''
    }));

    let finalOrderId = orderId;
    if (getToken) {
      try {
        const token = await getToken();
        
        // 1. Call checkout endpoint
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            total: orderTotal,
            items: orderItemsList
          })
        });
        
        if (!checkoutRes.ok) {
          const errData = await checkoutRes.json();
          alert(errData.error || 'Checkout failed');
          return;
        }

        // 2. Call place order endpoint
        const orderRes = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            items: orderItemsList,
            total: orderTotal,
            deliveryAddress: `${addressForOrder.address}, ${addressForOrder.pincode}`,
            paymentMethod: selectedPayment
          })
        });

        if (!orderRes.ok) {
          const errData = await orderRes.json();
          alert(errData.error || 'Failed to place order');
          return;
        }

        const createdOrder = await orderRes.json();
        if (createdOrder && createdOrder.id) {
          finalOrderId = createdOrder.id;
          setOrderId(createdOrder.id);
        }
      } catch (err) {
        console.error("API error during checkout/order placement:", err);
        alert('An error occurred during checkout. Please try again.');
        return;
      }
    }

    const order = {
      id: finalOrderId,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: selectedPayment === 'cod' ? 'preparing' : 'paid',
      deliveryTime: getDeliveryTimeForAddress(addressForOrder),
      payment: selectedPayment,
      address: addressForOrder,
      items: cartItems.map(item => ({ ...item, qty: item.quantity })),
      total: grandTotal,
      ...paymentDetails,
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
  };

  const handlePlaceOrder = () => {
    let addressForOrder = selectedAddress;

    if (showAddressForm || !addressForOrder) {
      addressForOrder = saveAddress();
    }

    if (!addressForOrder) return;

    // For net banking, open the multi-step bank flow instead of placing immediately
    if (selectedPayment === 'netbanking') {
      if (!selectedBank) {
        return; // bank must be selected
      }
      setShowNetBankingFlow(true);
      return;
    }

    finalizeOrder(addressForOrder);
  };

  const handleNetBankingSuccess = (paymentResult) => {
    setShowNetBankingFlow(false);
    const addressForOrder = selectedAddress || addresses[0];
    finalizeOrder(addressForOrder, {
      transactionId: paymentResult.transactionId,
      bankCode: paymentResult.bankCode,
      paymentSessionId: paymentResult.sessionId,
    });
  };

  const handleNetBankingFailure = () => {
    setShowNetBankingFlow(false);
    // User stays on checkout to retry or choose another method
  };

  const handleNetBankingCancel = () => {
    setShowNetBankingFlow(false);
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
              Estimated delivery: {getDeliveryTimeForAddress(placedAddress || selectedAddress)}
            </p>
          )}
          {(placedAddress || selectedAddress) && (
            <div className="checkout-success__address">
              <strong>Delivering to {(placedAddress || selectedAddress).name}</strong>
              <span>{(placedAddress || selectedAddress).address}, {(placedAddress || selectedAddress).pincode}</span>
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

  return (
    <div className="page-wrapper">
      <div className="checkout">
        <div className="checkout__container container">
          <div className="checkout__header">
            <button className="checkout__back" onClick={() => navigate(-1)}><FiArrowLeft /></button>
            <h1 className="checkout__title">Checkout</h1>
          </div>

          {/* Address */}
          <div className="checkout__section">
            <h3 className="checkout__section-title"><FiMapPin /> Delivery Address</h3>
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
                      <strong>{address.name}</strong>
                      <span>{address.phone} · {address.email}</span>
                      <span>{address.address}, {address.pincode}</span>
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
                <div className="checkout__input-row">
                  <input
                    type="text"
                    placeholder="Name"
                    value={addressForm.name}
                    onChange={(e) => updateAddressField('name', e.target.value)}
                    className="checkout__input"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number"
                    value={addressForm.phone}
                    onChange={(e) => updateAddressField('phone', e.target.value)}
                    className="checkout__input"
                  />
                </div>
                <input
                  type="email"
                  placeholder="Email"
                  value={addressForm.email}
                  onChange={(e) => updateAddressField('email', e.target.value)}
                  className="checkout__input"
                />
                <textarea
                  placeholder="Address"
                  value={addressForm.address}
                  onChange={(e) => updateAddressField('address', e.target.value)}
                  className="checkout__input checkout__textarea"
                />
                <div className="checkout__input-row">
                  <input
                    type="text"
                    placeholder="Pincode"
                    value={addressForm.pincode}
                    onChange={(e) => updateAddressField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="checkout__input"
                  />
                  <button type="button" className="checkout__save-address" onClick={saveAddress}>
                    Save Address
                  </button>
                </div>
                {addresses.length > 0 && (
                  <button type="button" className="checkout__address-cancel" onClick={() => setShowAddressForm(false)}>
                    Cancel
                  </button>
                )}
                {addressError && <p className="checkout__address-error">{addressError}</p>}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="checkout__section">
            <button className="checkout__summary-toggle" onClick={() => setShowItems(!showItems)}>
              <span>Order Summary ({cartCount} items)</span>
              <span>{showItems ? '▲' : '▼'}</span>
            </button>
            {showItems && (
              <div className="checkout__summary-items">
                {cartItems.map(item => (
                  <div key={item.id} className="checkout__summary-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="checkout__section">
            <h3 className="checkout__section-title"><FiCreditCard /> Payment Method</h3>
            <div className="checkout__payments">
              <button
                className={`checkout__payment ${selectedPayment === 'cod' ? 'checkout__payment--active' : ''}`}
                onClick={() => setSelectedPayment('cod')}
              >
                <span className="checkout__payment-icon">💵</span>
                <div className="checkout__payment-info">
                  <span className="checkout__payment-name">Cash on Delivery</span>
                  <span className="checkout__payment-desc">Pay when delivered</span>
                </div>
                {selectedPayment === 'cod' && <FiCheck className="checkout__payment-check" />}
              </button>

              <button
                className={`checkout__payment ${selectedPayment === 'upi' ? 'checkout__payment--active' : ''}`}
                onClick={() => setSelectedPayment('upi')}
              >
                <span className="checkout__payment-icon"><FiSmartphone /></span>
                <div className="checkout__payment-info">
                  <span className="checkout__payment-name">UPI Payment</span>
                  <span className="checkout__payment-desc">GPay, PhonePe, Paytm</span>
                </div>
                {selectedPayment === 'upi' && <FiCheck className="checkout__payment-check" />}
              </button>
              {selectedPayment === 'upi' && (
                <div className="checkout__payment-form">
                  <input type="text" placeholder="Enter UPI ID (e.g., name@upi)"
                    value={upiId} onChange={(e) => setUpiId(e.target.value)}
                    className="checkout__input" />
                </div>
              )}

              <button
                className={`checkout__payment ${selectedPayment === 'card' ? 'checkout__payment--active' : ''}`}
                onClick={() => setSelectedPayment('card')}
              >
                <span className="checkout__payment-icon"><FiCreditCard /></span>
                <div className="checkout__payment-info">
                  <span className="checkout__payment-name">Credit / Debit Card</span>
                  <span className="checkout__payment-desc">Visa, Mastercard, RuPay</span>
                </div>
                {selectedPayment === 'card' && <FiCheck className="checkout__payment-check" />}
              </button>
              {selectedPayment === 'card' && (
                <div className="checkout__payment-form">
                  <input type="text" placeholder="Card Number" value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    className="checkout__input" />
                  <div className="checkout__input-row">
                    <input type="text" placeholder="MM/YY" value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)} className="checkout__input" />
                    <input type="text" placeholder="CVV" value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      className="checkout__input" />
                  </div>
                </div>
              )}

              <button
                className={`checkout__payment ${selectedPayment === 'netbanking' ? 'checkout__payment--active' : ''}`}
                onClick={() => setSelectedPayment('netbanking')}
              >
                <span className="checkout__payment-icon"><FiGlobe /></span>
                <div className="checkout__payment-info">
                  <span className="checkout__payment-name">Net Banking</span>
                  <span className="checkout__payment-desc">SBI, HDFC, ICICI, Axis & more</span>
                </div>
                {selectedPayment === 'netbanking' && <FiCheck className="checkout__payment-check" />}
              </button>
              {selectedPayment === 'netbanking' && (
                <div className="checkout__payment-form">
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="checkout__input checkout__select"
                  >
                    <option value="">-- Select Your Bank --</option>
                    <option value="sbi">State Bank of India (SBI)</option>
                    <option value="hdfc">HDFC Bank</option>
                    <option value="icici">ICICI Bank</option>
                    <option value="axis">Axis Bank</option>
                    <option value="kotak">Kotak Mahindra Bank</option>
                    <option value="bob">Bank of Baroda</option>
                    <option value="pnb">Punjab National Bank</option>
                    <option value="canara">Canara Bank</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Bill */}
          <div className="checkout__bill">
            <div className="checkout__bill-row"><span>Item Total</span><span>{formatPrice(cartTotal)}</span></div>
            <div className="checkout__bill-row">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? <span style={{color:'var(--color-accent)', fontWeight:600}}>FREE</span> : formatPrice(deliveryFee)}</span>
            </div>
            <div className="checkout__bill-row"><span>Handling Charge</span><span>{formatPrice(handlingCharge)}</span></div>
            <div className="checkout__bill-total"><span>Total</span><span>{formatPrice(grandTotal)}</span></div>
          </div>

          {/* Place Order */}
          <button className="checkout__place-btn" onClick={handlePlaceOrder} id="place-order-btn">
            {selectedPayment === 'cod' ? 'Place Order (COD)' : `Pay ${formatPrice(grandTotal)}`} →
          </button>

          {/* Net Banking Flow Modal */}
          {showNetBankingFlow && (
            <NetBankingFlow
              bankCode={selectedBank}
              amount={grandTotal}
              orderId={orderId}
              cartItems={cartItems}
              deliveryFee={deliveryFee}
              handlingCharge={handlingCharge}
              customerInfo={{
                name: selectedAddress?.name || user?.name || '',
                email: selectedAddress?.email || user?.email || '',
                phone: selectedAddress?.phone || user?.phone || '',
              }}
              onSuccess={handleNetBankingSuccess}
              onFailure={handleNetBankingFailure}
              onCancel={handleNetBankingCancel}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;

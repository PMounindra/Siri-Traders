import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiClock, FiPackage, FiTruck, FiHome, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getUserStorageKey } from '../utils/userStorage';
import { formatPrice } from '../utils/format';
import './TrackOrder.css';

const STEPS = [
  { id: 'placed',    icon: FiCheckCircle, label: 'Order Placed',     sub: 'We received your order' },
  { id: 'confirmed', icon: FiPackage,     label: 'Order Confirmed',  sub: 'Store is preparing your items' },
  { id: 'packed',    icon: FiPackage,     label: 'Order Packed',     sub: 'Your order is packed and ready' },
  { id: 'transit',   icon: FiTruck,       label: 'Out for Delivery', sub: 'Delivery partner is on the way' },
  { id: 'delivered', icon: FiHome,        label: 'Delivered',        sub: 'Order delivered successfully!' },
];

const STATUS_TO_STEP = {
  pending:      0,
  placed:       0,
  confirmed:    1,
  preparing:    1,
  packed:       2,
  paid:         1,
  transit:      3,
  'in transit': 3,
  delivered:    4,
};

const computeEta = (deliveryTime) => {
  const minsMatch = String(deliveryTime).match(/(\d+)\s*min/i);
  const hoursMatch = String(deliveryTime).match(/(\d+)\s*hour/i);
  let totalMins = 0;
  if (minsMatch) totalMins += parseInt(minsMatch[1]);
  if (hoursMatch) totalMins += parseInt(hoursMatch[1]) * 60;
  if (totalMins === 0) totalMins = 30;

  const arrival = new Date(Date.now() + totalMins * 60 * 1000);
  return {
    time: arrival.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    minutes: totalMins,
  };
};

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, getToken } = useAuth();
  const [order, setOrder] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const applyOrder = useCallback((found) => {
    setOrder(found);
    setCurrentStep(STATUS_TO_STEP[found.status?.toLowerCase()] ?? 0);
    if (found.deliveryTime) setEta(computeEta(found.deliveryTime));
  }, []);

  const refreshOrder = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setNotFound(false);
    setLoadError(false);

    // The live server record is the source of truth — it's what reflects
    // admin status changes (Preparing/In Transit/Delivered/Paid etc.), so it
    // always wins over anything cached locally. Only fall back to route
    // state / localStorage if we can't reach it.
    if (isAuthenticated && typeof getToken === 'function') {
      try {
        const token = await getToken();
        const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          applyOrder({
            id: data.id,
            status: data.status,
            deliveryTime: data.deliverySlot || 'Same day',
            address: { name: data.customerName, address: data.deliveryAddress, phone: data.customerPhone },
            total: data.total,
            items: data.items || [],
          });
          setLoading(false);
          return;
        }
        // 404/403 mean the order genuinely isn't this user's; anything else
        // (5xx, rate limit, etc.) is a temporary failure — fall through to
        // route state / localStorage rather than giving up immediately.
        if (res.status !== 404 && res.status !== 403) {
          setLoadError(true);
          setLoading(false);
          return;
        }
      } catch {
        // network error — fall through to route state / localStorage below
      }
    }

    // Route state from Checkout (justPlaced=true) — covers the instant right
    // after checkout if the fetch above hasn't resolved yet.
    const state = location.state;
    if (state?.justPlaced) {
      setOrder({
        id: state.orderId,
        status: 'placed',
        deliveryTime: state.deliveryTime,
        address: state.address,
        total: state.total,
        items: state.items,
      });
      setCurrentStep(0);
      if (state.deliveryTime) setEta(computeEta(state.deliveryTime));
      setLoading(false);
      return;
    }

    // Last resort: localStorage (orders placed while offline / on this device)
    try {
      const key = getUserStorageKey(user, 'orders');
      const saved = key ? localStorage.getItem(key) : null;
      const orders = saved ? JSON.parse(saved) : [];
      const found = orders.find(o => String(o.id) === String(orderId));
      if (found) {
        applyOrder(found);
        setLoading(false);
        return;
      }
    } catch { /* ignore */ }

    setNotFound(true);
    setLoading(false);
  }, [orderId, user, location.state, isAuthenticated, getToken, applyOrder]);

  useEffect(() => { refreshOrder(); }, [refreshOrder]);

  // Poll for status updates while the order is still moving, so an admin
  // marking it In Transit / Delivered / Paid shows up without a manual reload.
  useEffect(() => {
    if (!order || currentStep >= STEPS.length - 1) return;
    const interval = setInterval(() => refreshOrder(false), 20000);
    return () => clearInterval(interval);
  }, [order, currentStep, refreshOrder]);

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="track__not-found">
          <FiPackage size={48} />
          <h2>Loading order…</h2>
        </div>
      </div>
    );
  }

  if (loadError && !order) {
    return (
      <div className="page-wrapper">
        <div className="track__not-found">
          <FiPackage size={48} />
          <h2>Couldn't load this order</h2>
          <p>We're having trouble reaching the server right now. Please try again shortly.</p>
          <button onClick={() => refreshOrder()} className="track__back-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!order || notFound) {
    return (
      <div className="page-wrapper">
        <div className="track__not-found">
          <FiPackage size={48} />
          <h2>Order not found</h2>
          <p>We couldn't find order #{orderId}</p>
          <button onClick={() => navigate('/orders')} className="track__back-btn">
            View All Orders
          </button>
        </div>
      </div>
    );
  }

  const isDelivered = currentStep === STEPS.length - 1;

  return (
    <div className="page-wrapper">
      <div className="track">
        <div className="track__shell container">

          {/* Header */}
          <div className="track__header">
            <button className="track__back" onClick={() => navigate('/orders')} aria-label="Back">
              <FiArrowLeft />
            </button>
            <div>
              <h1 className="track__title">Order Tracking</h1>
              <p className="track__order-id">#{order.id || orderId}</p>
            </div>
          </div>

          {/* Success banner for freshly placed orders */}
          {location.state?.justPlaced && (
            <div className="track__success-banner">
              <FiCheckCircle size={22} />
              <div>
                <p className="track__success-title">Order Placed Successfully! 🎉</p>
                <p className="track__success-sub">Thank you for shopping with Siri Traders</p>
              </div>
            </div>
          )}

          {/* ETA banner */}
          {!isDelivered && eta && (
            <div className="track__eta-banner">
              <FiClock className="track__eta-icon" />
              <div>
                <p className="track__eta-label">Estimated Delivery</p>
                <p className="track__eta-time">
                  You'll get your order by <strong>{eta.time}</strong>
                  <span className="track__eta-mins"> (~{eta.minutes} mins)</span>
                </p>
              </div>
            </div>
          )}
          {!isDelivered && !eta && order.deliveryTime && (
            <div className="track__eta-banner">
              <FiClock className="track__eta-icon" />
              <div>
                <p className="track__eta-label">Estimated Delivery</p>
                <p className="track__eta-time">{order.deliveryTime}</p>
              </div>
            </div>
          )}
          {isDelivered && (
            <div className="track__eta-banner track__eta-banner--done">
              <FiCheckCircle className="track__eta-icon" />
              <div>
                <p className="track__eta-label">Delivered!</p>
                <p className="track__eta-time">Your order has arrived ✓</p>
              </div>
            </div>
          )}

          {/* Stepper */}
          <div className="track__steps">
            {STEPS.map((step, i) => {
              const done = i <= currentStep;
              const active = i === currentStep;
              const Icon = step.icon;
              return (
                <div key={step.id} className={`track__step ${done ? 'track__step--done' : ''} ${active ? 'track__step--active' : ''}`}>
                  <div className="track__step-left">
                    <div className={`track__step-circle ${done ? 'track__step-circle--done' : ''} ${active ? 'track__step-circle--active' : ''}`}>
                      {done && !active ? <FiCheckCircle size={18} /> : <Icon size={18} />}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`track__step-line ${i < currentStep ? 'track__step-line--done' : ''}`} />
                    )}
                  </div>
                  <div className="track__step-right">
                    <p className={`track__step-label ${active ? 'track__step-label--active' : ''}`}>{step.label}</p>
                    <p className="track__step-sub">{active ? <span className="track__step-sub--live">● {step.sub}</span> : step.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery address */}
          {order.address && (
            <div className="track__address">
              <FiMapPin className="track__address-icon" />
              <div>
                <p className="track__address-name">{order.address.name}</p>
                <p className="track__address-text">
                  {order.address.flatNo || order.address.address}
                  {order.address.landmark ? `, ${order.address.landmark}` : ''}
                  {order.address.area ? `, ${order.address.area}` : ''}
                  {order.address.pincode ? ` - ${order.address.pincode}` : ''}
                </p>
                {order.address.phone && <p className="track__address-text">{order.address.phone}</p>}
              </div>
            </div>
          )}

          {/* Order items */}
          {order.items?.length > 0 && (
            <div className="track__items">
              <h3 className="track__items-title">Order Items</h3>
              {order.items.map((item, i) => (
                <div key={i} className="track__item">
                  <span className="track__item-name">{item.name}</span>
                  <span className="track__item-qty">x{item.qty || item.quantity || 1}</span>
                  <span className="track__item-price">{formatPrice(item.price * (item.qty || item.quantity || 1))}</span>
                </div>
              ))}
              <div className="track__total">
                <span>Total Paid</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="track__actions">
            <button className="track__btn track__btn--primary" onClick={() => navigate('/orders')}>
              All Orders
            </button>
            <button className="track__btn track__btn--secondary" onClick={() => navigate('/home')}>
              Continue Shopping
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TrackOrder;

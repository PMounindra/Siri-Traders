import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiClock, FiPackage, FiTruck, FiHome } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getUserStorageKey } from '../utils/userStorage';
import { formatPrice } from '../utils/format';
import './TrackOrder.css';

/*
 * Tracking Steps
 * The UI renders a stepper based on the order's `status` field.
 * The status value must be one of the keys in STATUS_TO_STEP.
 *
 * ── Backend Integration (future) ──
 * When the backend is ready, it should update the order's `status` field
 * via one of these approaches:
 *   1. REST API polling  – periodically GET /api/orders/:id → update state
 *   2. WebSocket / SSE   – listen for `order.status.updated` events → update state
 *
 * The `refreshOrder()` function below reads the latest order data and
 * updates the UI. Call it after any status change from the backend.
 *
 * Expected order shape from backend:
 *   { id, status, items, total, address, deliveryTime, createdAt, ... }
 *   status: 'placed' | 'confirmed' | 'packed' | 'transit' | 'delivered'
 */

const STEPS = [
  { id: 'placed',    icon: FiCheckCircle, label: 'Order Placed',         sub: 'We received your order' },
  { id: 'confirmed', icon: FiPackage,     label: 'Order Confirmed',      sub: 'Store is preparing your items' },
  { id: 'packed',    icon: FiPackage,     label: 'Order Packed',         sub: 'Your order is packed and ready' },
  { id: 'transit',   icon: FiTruck,       label: 'Out for Delivery',     sub: 'Delivery partner is on the way' },
  { id: 'delivered', icon: FiHome,        label: 'Delivered',            sub: 'Order delivered successfully!' },
];

const STATUS_TO_STEP = {
  placed:    0,
  confirmed: 1,
  preparing: 1,
  packed:    2,
  paid:      1,
  transit:   3,
  delivered: 4,
};

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [eta, setEta] = useState(null);

  /**
   * refreshOrder – reads the latest order data and updates UI state.
   *
   * Currently reads from localStorage.
   * ── Backend Integration (future) ──
   * Replace the localStorage read with an API call:
   *   const res = await fetch(`/api/orders/${orderId}`);
   *   const found = await res.json();
   */
  const refreshOrder = useCallback(() => {
    try {
      const key = getUserStorageKey(user, 'orders');
      const saved = key ? localStorage.getItem(key) : null;
      const orders = saved ? JSON.parse(saved) : [];
      const found = orders.find(o => o.id === orderId);
      if (found) {
        setOrder(found);
        const step = STATUS_TO_STEP[found.status] ?? 0;
        setCurrentStep(step);

        // Parse ETA from deliveryTime field
        const mins = parseInt(found.deliveryTime);
        if (!isNaN(mins)) {
          const arrival = new Date(Date.now() + mins * 60 * 1000);
          setEta(arrival.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }));
        }
      }
    } catch { /* ignore */ }
  }, [orderId, user]);

  // Load order on mount
  useEffect(() => {
    refreshOrder();
  }, [refreshOrder]);

  /*
   * ── Backend Integration (future) ──
   * Uncomment ONE of the blocks below to enable real-time status updates:
   *
   * Option A: Polling (simple)
   * useEffect(() => {
   *   const interval = setInterval(refreshOrder, 10000); // poll every 10s
   *   return () => clearInterval(interval);
   * }, [refreshOrder]);
   *
   * Option B: WebSocket (recommended)
   * useEffect(() => {
   *   const ws = new WebSocket(`wss://your-api.com/ws/orders/${orderId}`);
   *   ws.onmessage = (event) => {
   *     const data = JSON.parse(event.data);
   *     if (data.type === 'order.status.updated') {
   *       refreshOrder(); // or directly setOrder(data.order)
   *     }
   *   };
   *   return () => ws.close();
   * }, [orderId, refreshOrder]);
   *
   * Option C: Server-Sent Events
   * useEffect(() => {
   *   const es = new EventSource(`/api/orders/${orderId}/stream`);
   *   es.addEventListener('status', () => refreshOrder());
   *   return () => es.close();
   * }, [orderId, refreshOrder]);
   */

  if (!order) {
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
              <h1 className="track__title">Track Order</h1>
              <p className="track__order-id">#{orderId}</p>
            </div>
          </div>

          {/* ETA banner */}
          {!isDelivered && (
            <div className="track__eta-banner">
              <FiClock className="track__eta-icon" />
              <div>
                <p className="track__eta-label">Estimated Arrival</p>
                <p className="track__eta-time">{eta || order.deliveryTime}</p>
              </div>
            </div>
          )}
          {isDelivered && (
            <div className="track__eta-banner track__eta-banner--done">
              <FiCheckCircle className="track__eta-icon" />
              <div>
                <p className="track__eta-label">Delivered!</p>
                <p className="track__eta-time">Your order has arrived</p>
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
              <FiHome className="track__address-icon" />
              <div>
                <p className="track__address-name">{order.address.name}</p>
                <p className="track__address-text">{order.address.address}, {order.address.pincode}</p>
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="track__items">
            <h3 className="track__items-title">Order Items</h3>
            {order.items?.map((item, i) => (
              <div key={i} className="track__item">
                <span className="track__item-name">{item.name}</span>
                <span className="track__item-qty">x{item.qty || item.quantity || 1}</span>
                <span className="track__item-price">{formatPrice(item.price * (item.qty || item.quantity || 1))}</span>
              </div>
            ))}
            <div className="track__total">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

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

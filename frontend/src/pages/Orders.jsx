import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPackage, FiChevronDown, FiChevronUp, FiRefreshCw, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getUserStorageKey } from '../utils/userStorage';
import { formatPrice } from '../utils/format';
import './Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [expandedId, setExpandedId] = useState(null);
  const [reordered, setReordered] = useState(null);

  const orders = useMemo(() => {
    if (!isAuthenticated) return [];
    try {
      const saved = localStorage.getItem(getUserStorageKey(user, 'orders'));
      const parsed = saved ? JSON.parse(saved) : [];
      return parsed.filter(order => order?.address || order?.payment);
    } catch {
      return [];
    }
  }, [isAuthenticated, user]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'delivered': return { bg: '#D8F3DC', color: '#1B4332', label: 'Delivered' };
      case 'transit': return { bg: '#FFF3CD', color: '#856404', label: 'In Transit' };
      case 'preparing': return { bg: '#D1ECF1', color: '#0C5460', label: 'Preparing' };
      case 'paid': return { bg: '#D8F3DC', color: '#1B4332', label: 'Paid' };
      default: return { bg: '#E5E7EB', color: '#6B7280', label: status };
    }
  };

  const handleReorder = (order) => {
    order.items.forEach(item => {
      addToCart({
        ...item,
        id: item.id || `${item.name}-${Date.now()}`,
        quantity: 1,
        weight: item.weight || '1',
        unit: item.unit || 'pc',
        image: item.image || '',
        discount: item.discount || 0,
        deliveryTime: item.deliveryTime || '10 mins'
      });
    });
    setReordered(order.id);
    setTimeout(() => setReordered(null), 2000);
  };

  return (
    <div className="page-wrapper">
      <div className="orders">
        <div className="container">
          <h1 className="orders__title">
            <FiPackage /> My Orders
            <span className="orders__count">{orders.length} orders</span>
          </h1>

          {orders.length === 0 ? (
            <div className="orders__empty">
              <span className="orders__empty-icon">📋</span>
              <h2>No orders yet</h2>
              <p>Start shopping to see your orders here</p>
              <button className="orders__empty-btn" onClick={() => navigate('/home')}>
                <FiShoppingBag /> Start Shopping
              </button>
            </div>
          ) : (
            <div className="orders__list">
              {orders.map(order => {
                const status = getStatusStyle(order.status);
                const isExpanded = expandedId === order.id;
                return (
                  <div key={order.id} className="orders__card">
                    <div className="orders__card-header" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                      <div className="orders__card-top">
                        <div>
                          <span className="orders__card-id">{order.id}</span>
                          <span className="orders__card-date">{order.date}</span>
                        </div>
                        <span className="orders__status" style={{ background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                      <div className="orders__card-bottom">
                        <span className="orders__card-summary">
                          {order.items.length} items · {formatPrice(order.total)}
                        </span>
                        <span className="orders__card-delivery">Delivery {order.deliveryTime}</span>
                        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="orders__card-details">
                        {order.items.map((item, i) => (
                          <div key={i} className="orders__detail-item">
                            <span>{item.name} x {item.qty || item.quantity}</span>
                            <span>{formatPrice(item.price * (item.qty || item.quantity || 1))}</span>
                          </div>
                        ))}
                        <div className="orders__detail-total">
                          <span>Total</span><span>{formatPrice(order.total)}</span>
                        </div>
                        <button
                          className={`orders__reorder-btn ${reordered === order.id ? 'orders__reorder-btn--done' : ''}`}
                          onClick={() => handleReorder(order)}
                        >
                          <FiRefreshCw /> {reordered === order.id ? 'Added to Cart!' : 'Reorder'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;

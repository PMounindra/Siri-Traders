import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBell,
  FiCheck,
  FiChevronRight,
  FiCreditCard,
  FiHelpCircle,
  FiInfo,
  FiLogOut,
  FiMail,
  FiMapPin,
  FiPhone,
  FiPlus,
  FiShield,
  FiTrash2,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getUserStorageKey } from '../utils/userStorage';
import './Profile.css';

const getStoredList = (key, fallback = []) => {
  try {
    const saved = key ? localStorage.getItem(key) : null;
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const getStoredObject = (key, fallback) => {
  try {
    const saved = key ? localStorage.getItem(key) : null;
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const Profile = () => {
  const { user, isAuthenticated, logout, location, setLocation } = useAuth();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState(null);
  const addressKey = getUserStorageKey(user, 'addresses');
  const paymentKey = getUserStorageKey(user, 'payment-methods');
  const notificationKey = getUserStorageKey(user, 'notifications');
  const [addresses, setAddresses] = useState(() => getStoredList(addressKey));
  const [payments, setPayments] = useState(() => getStoredList(paymentKey));
  const [notifications, setNotifications] = useState(() => getStoredObject(notificationKey, {
    orderUpdates: true,
    offers: true,
    reminders: false
  }));
  const [addressForm, setAddressForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: '', pincode: '' });
  const [paymentForm, setPaymentForm] = useState({ label: 'UPI', value: '' });

  useEffect(() => {
    if (addressKey) localStorage.setItem(addressKey, JSON.stringify(addresses));
  }, [addressKey, addresses]);

  useEffect(() => {
    if (paymentKey) localStorage.setItem(paymentKey, JSON.stringify(payments));
  }, [paymentKey, payments]);

  useEffect(() => {
    if (notificationKey) localStorage.setItem(notificationKey, JSON.stringify(notifications));
  }, [notificationKey, notifications]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const addAddress = () => {
    const trimmed = Object.fromEntries(Object.entries(addressForm).map(([key, value]) => [key, value.trim()]));
    if (!trimmed.name || !trimmed.phone || !trimmed.address || !/^\d{6}$/.test(trimmed.pincode)) return;
    const nextAddress = { ...trimmed, id: Date.now().toString() };
    setAddresses(prev => [nextAddress, ...prev]);
    setLocation({ address: trimmed.address, city: trimmed.pincode, full: `${trimmed.address}, ${trimmed.pincode}`, contact: nextAddress });
    setAddressForm({ name: user?.name || '', phone: user?.phone || '', address: '', pincode: '' });
  };

  const selectAddress = (address) => {
    setLocation({ address: address.address, city: address.pincode, full: `${address.address}, ${address.pincode}`, contact: address });
    setActivePanel(null);
  };

  const addPayment = () => {
    const value = paymentForm.value.trim();
    if (!value) return;
    setPayments(prev => [{ id: Date.now().toString(), label: paymentForm.label, value }, ...prev]);
    setPaymentForm({ label: 'UPI', value: '' });
  };

  const menuSections = [
    {
      title: 'My Account',
      items: [
        { icon: FiMapPin, label: 'My Addresses', panel: 'addresses' },
        { icon: FiCreditCard, label: 'Payment Methods', panel: 'payments' },
      ]
    },
    {
      title: 'Settings',
      items: [
        { icon: FiBell, label: 'Notifications', panel: 'notifications' },
        { icon: FiShield, label: 'Privacy & Security', panel: 'privacy' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: FiHelpCircle, label: 'Help & Support', panel: 'support' },
        { icon: FiInfo, label: 'About Siri Traders', panel: 'about' },
      ]
    },
  ];

  const panelTitle = {
    addresses: 'My Addresses',
    payments: 'Payment Methods',
    notifications: 'Notifications',
    privacy: 'Privacy & Security',
    support: 'Help & Support',
    about: 'About Siri Traders'
  }[activePanel];

  if (!isAuthenticated) {
    return (
      <div className="page-wrapper">
        <div className="profile-login">
          <div className="profile-login__icon">👤</div>
          <h2>Login to view your profile</h2>
          <p>Manage your orders, addresses, and preferences</p>
          <button className="profile-login__btn" onClick={() => navigate('/login')}>Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="profile">
        <div className="container">
          <div className="profile__header">
            <div className="profile__avatar">
              <span>{getInitials(user?.name)}</span>
            </div>
            <h1 className="profile__name">{user?.name || 'User'}</h1>
            <p className="profile__email">{user?.email}</p>
            <p className="profile__phone">{user?.phone}</p>
          </div>

          {menuSections.map((section, idx) => (
            <div key={idx} className="profile__section">
              <h3 className="profile__section-title">{section.title}</h3>
              <div className="profile__section-card">
                {section.items.map((item, i) => (
                  <button key={i} className="profile__menu-item" onClick={() => setActivePanel(item.panel)}>
                    <item.icon className="profile__menu-icon" />
                    <span className="profile__menu-label">{item.label}</span>
                    <FiChevronRight className="profile__menu-chevron" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button className="profile__logout" onClick={handleLogout} id="profile-logout-btn">
            <FiLogOut className="profile__logout-icon" />
            <span>Logout</span>
          </button>

          <p className="profile__version">Siri Traders v1.0.0</p>
        </div>
      </div>

      {activePanel && (
        <div className="profile-sheet" role="dialog" aria-modal="true">
          <button className="profile-sheet__backdrop" onClick={() => setActivePanel(null)} aria-label="Close" />
          <div className="profile-sheet__card">
            <div className="profile-sheet__handle" />
            <div className="profile-sheet__header">
              <h2>{panelTitle}</h2>
              <button onClick={() => setActivePanel(null)} aria-label="Close"><FiX /></button>
            </div>

            {activePanel === 'addresses' && (
              <div className="profile-panel">
                <div className="profile-current">
                  <FiMapPin />
                  <div>
                    <strong>Delivering to</strong>
                    <span>{location.full || location.address || 'No address selected'}</span>
                  </div>
                </div>
                <div className="profile-form-grid">
                  <input value={addressForm.name} onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Name" />
                  <input value={addressForm.phone} onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" />
                  <input value={addressForm.address} onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Flat, street, area" />
                  <input value={addressForm.pincode} onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="Pincode" />
                  <button className="profile-action-btn" onClick={addAddress}><FiPlus /> Add Address</button>
                </div>
                <div className="profile-list">
                  {addresses.length === 0 ? <p className="profile-empty">No saved addresses yet.</p> : addresses.map(address => (
                    <div key={address.id} className="profile-list__item">
                      <FiMapPin />
                      <div>
                        <strong>{address.name}</strong>
                        <span>{address.address}, {address.pincode}</span>
                      </div>
                      <button onClick={() => selectAddress(address)}><FiCheck /></button>
                      <button onClick={() => setAddresses(prev => prev.filter(item => item.id !== address.id))}><FiTrash2 /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'payments' && (
              <div className="profile-panel">
                <div className="profile-form-grid profile-form-grid--inline">
                  <select value={paymentForm.label} onChange={(e) => setPaymentForm(prev => ({ ...prev, label: e.target.value }))}>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Wallet</option>
                  </select>
                  <input value={paymentForm.value} onChange={(e) => setPaymentForm(prev => ({ ...prev, value: e.target.value }))} placeholder="UPI ID, card nickname, or wallet" />
                  <button className="profile-action-btn" onClick={addPayment}><FiPlus /> Add</button>
                </div>
                <div className="profile-list">
                  {payments.length === 0 ? <p className="profile-empty">No payment methods saved. Cash on delivery is always available.</p> : payments.map(payment => (
                    <div key={payment.id} className="profile-list__item">
                      <FiCreditCard />
                      <div>
                        <strong>{payment.label}</strong>
                        <span>{payment.value}</span>
                      </div>
                      <button onClick={() => setPayments(prev => prev.filter(item => item.id !== payment.id))}><FiTrash2 /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'notifications' && (
              <div className="profile-panel">
                {[
                  ['orderUpdates', 'Order updates', 'Delivery status, refunds, and checkout alerts'],
                  ['offers', 'Offers and coupons', 'Festive deals and limited-time savings'],
                  ['reminders', 'Cart reminders', 'Helpful nudges for items left in cart']
                ].map(([key, title, text]) => (
                  <label key={key} className="profile-toggle">
                    <span><strong>{title}</strong><small>{text}</small></span>
                    <input type="checkbox" checked={notifications[key]} onChange={() => setNotifications(prev => ({ ...prev, [key]: !prev[key] }))} />
                  </label>
                ))}
              </div>
            )}

            {activePanel === 'privacy' && (
              <div className="profile-panel">
                <div className="profile-info-row"><FiShield /><span>Signed in as {user.email}</span></div>
                <button className="profile-action-btn" onClick={() => navigate('/orders')}>View order history</button>
                <button className="profile-danger-btn" onClick={handleLogout}>Logout from this device</button>
              </div>
            )}

            {activePanel === 'support' && (
              <div className="profile-panel">
                <a className="profile-contact-card" href="tel:+919876543210"><FiPhone /><span>Call support</span><strong>+91 98765 43210</strong></a>
                <a className="profile-contact-card" href="mailto:support@siritraders.com"><FiMail /><span>Email us</span><strong>support@siritraders.com</strong></a>
                <button className="profile-action-btn" onClick={() => navigate('/orders')}>Get help with an order</button>
              </div>
            )}

            {activePanel === 'about' && (
              <div className="profile-panel">
                <div className="profile-about">
                  <strong>Siri Traders</strong>
                  <span>Fast and reliable grocery delivery for everyday essentials, fresh produce, and festive deals.</span>
                  <small>Version 1.0.0</small>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

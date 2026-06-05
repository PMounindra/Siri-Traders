import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiGrid, FiClipboard, FiShoppingCart, FiUser } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './BottomNav.css';

const BottomNav = () => {
  const { cartCount } = useCart();
  const location = useLocation();

  // Hide on auth pages
  const hiddenRoutes = ['/login', '/signup'];
  if (hiddenRoutes.includes(location.pathname)) return null;

  const navItems = [
    { to: '/home', icon: FiHome, label: 'Home' },
    { to: '/categories', icon: FiGrid, label: 'Categories' },
    { to: '/orders', icon: FiClipboard, label: 'Orders' },
    { to: '/cart', icon: FiShoppingCart, label: 'Cart', badge: cartCount },
    { to: '/profile', icon: FiUser, label: 'Profile' },
  ];

  return (
    <nav className="bottom-nav" id="bottom-nav">
      {navItems.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
          id={`bottom-nav-${item.label.toLowerCase()}`}
        >
          <div className="bottom-nav__icon-wrapper">
            <item.icon className="bottom-nav__icon" />
            {item.badge > 0 && (
              <span className="bottom-nav__badge" key={item.badge}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </div>
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;

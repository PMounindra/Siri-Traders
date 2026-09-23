import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './CartSummaryBar.css';

const CartSummaryBar = () => {
  const { cartCount } = useCart();
  const location = useLocation();

  const hiddenRoutes = ['/cart', '/checkout', '/admin', '/login', '/admin-login'];
  const isHiddenRoute = hiddenRoutes.some((path) => location.pathname.startsWith(path));

  if (isHiddenRoute || cartCount === 0) return null;

  return (
    <Link to="/cart" className="cart-summary-bar">
      <span>{cartCount} {cartCount === 1 ? 'Item' : 'Items'} added</span>
      <span>View Cart <FiChevronRight /></span>
    </Link>
  );
};

export default CartSummaryBar;

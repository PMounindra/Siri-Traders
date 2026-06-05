import { Link, useLocation } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './CartSummaryBar.css';

const CartSummaryBar = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const visibleRoutes = ['/home', '/categories', '/orders'];
  const isVisibleRoute = visibleRoutes.includes(location.pathname);

  if (!isVisibleRoute || cartCount === 0) return null;

  return (
    <Link to="/cart" className="cart-summary-bar">
      <span>{cartCount} {cartCount === 1 ? 'Item' : 'Items'} added</span>
      <span>View Cart <FiChevronRight /></span>
    </Link>
  );
};

export default CartSummaryBar;

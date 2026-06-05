import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './ScrollControls.css';

const ScrollControls = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState('down');
  const lastScrollYRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  const visibleRoutes = ['/home', '/categories', '/orders'];
  const isVisibleRoute = visibleRoutes.includes(location.pathname);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollBottom = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      const nextDirection = currentScrollY > lastScrollYRef.current ? 'down' : 'up';
      setHasScrolled(currentScrollY > 12);
      setCanScrollDown(scrollBottom < pageHeight - 12);
      setIsScrolling(true);
      setScrollDirection(nextDirection);
      lastScrollYRef.current = currentScrollY;

      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        setIsScrolling(false);
      }, 850);
    };

    lastScrollYRef.current = window.scrollY;
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  if (!isVisibleRoute || !hasScrolled || !isScrolling) return null;

  const showDownArrow = scrollDirection === 'down' && canScrollDown;
  const showUpArrow = scrollDirection === 'up';

  return (
    <div className={`scroll-controls ${cartCount > 0 ? 'scroll-controls--cart-visible' : ''}`} aria-label="Page scroll controls">
      {showUpArrow && (
        <button type="button" className="scroll-controls__btn scroll-controls__btn--top" onClick={scrollToTop} aria-label="Scroll to top">
          <FiChevronUp />
        </button>
      )}
      {showDownArrow && (
        <button type="button" className="scroll-controls__btn scroll-controls__btn--bottom" onClick={scrollToBottom} aria-label="Scroll to bottom">
          <FiChevronDown />
        </button>
      )}
    </div>
  );
};

export default ScrollControls;

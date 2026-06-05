/* eslint-disable react-hooks/set-state-in-effect, react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiShoppingCart } from 'react-icons/fi';
import { useAuth } from './AuthContext';
import { getUserStorageKey } from '../utils/userStorage';
import '../components/AuthRequiredModal.css';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const cartStorageKey = getUserStorageKey(user, 'cart');
  const skipNextPersist = useRef(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = cartStorageKey ? localStorage.getItem(cartStorageKey) : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    skipNextPersist.current = true;
    if (!cartStorageKey) {
      setCartItems([]);
      return;
    }

    try {
      const saved = localStorage.getItem(cartStorageKey);
      setCartItems(saved ? JSON.parse(saved) : []);
    } catch {
      setCartItems([]);
    }
  }, [cartStorageKey]);

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }

    if (cartStorageKey) {
      localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    }
  }, [cartItems, cartStorageKey]);

  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    setShowAuthPrompt(true);
    return false;
  }, [isAuthenticated]);

  const addToCart = (product) => {
    if (!requireAuth()) return false;
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    return true;
  };

  const removeFromCart = (productId) => {
    if (!requireAuth()) return;
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (!requireAuth()) return;
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const getItemQuantity = (productId) => {
    const item = cartItems.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const goToAuth = useCallback((path) => {
    setShowAuthPrompt(false);
    navigate(path);
  }, [navigate]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  const cartSavings = cartItems.reduce(
    (sum, item) => sum + (item.mrp - item.price) * item.quantity, 0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        getItemQuantity,
        clearCart,
        requireAuth,
        showAuthPrompt: () => setShowAuthPrompt(true),
        cartCount,
        cartTotal,
        cartSavings
      }}
    >
      {children}
      {showAuthPrompt && (
        <div className="auth-required" role="dialog" aria-modal="true">
          <div className="auth-required__card">
            <span className="auth-required__icon"><FiShoppingCart /></span>
            <h2>Login to continue</h2>
            <p>Please login or create an account before adding items or placing an order.</p>
            <div className="auth-required__actions">
              <button type="button" className="auth-required__btn auth-required__btn--login" onClick={() => goToAuth('/login')}>
                Login
              </button>
              <button type="button" className="auth-required__btn auth-required__btn--signup" onClick={() => goToAuth('/signup')}>
                Sign up
              </button>
            </div>
            <button type="button" className="auth-required__close" onClick={() => setShowAuthPrompt(false)}>
              Not now
            </button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { baseProducts, toWholesaleProduct } from '../data/products';
import { useAuth } from './AuthContext';
import { subscribeSync, SYNC_EVENTS } from '../utils/syncChannel';

const ProductContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(baseProducts);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchProducts = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/products?limit=500');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(baseProducts);
      }
    } catch (err) {
      console.warn("Could not fetch products from database. Falling back to local static catalog.", err);
      setProducts(baseProducts);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

  // Real-time synchronization: listen for admin changes across all tabs
  useEffect(() => {
    const unsubscribe = subscribeSync(
      [SYNC_EVENTS.PRODUCTS_CHANGED, SYNC_EVENTS.REFRESH_ALL],
      () => {
        fetchProducts(false);
      }
    );

    // Auto-refresh when tab regains focus
    const onFocus = () => {
      fetchProducts(false);
    };
    window.addEventListener('focus', onFocus);

    // Periodic sync in background — long interval on purpose: this pulls every
    // column (including base64-encoded product images) for up to 500 rows, and
    // was previously firing every 25s per open tab, which is what blew through
    // the Neon data-transfer quota. Focus-refetch + cross-tab sync above cover
    // the common "someone just changed something" case; this is just a safety net.
    const interval = setInterval(() => {
      fetchProducts(false);
    }, 5 * 60 * 1000);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchProducts]);

  // Returns the live API products
  const getProductsForType = (customerType = 'retail') => {
    if (customerType === 'wholesale') {
      return products.map(toWholesaleProduct);
    }
    return products;
  };

  const addProduct = async (productData) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (getToken) {
        const token = await getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
      const res = await fetch('/api/products', {
        method: 'POST',
        headers,
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        await fetchProducts(false); // Refresh list from DB
        return true;
      }
    } catch (err) {
      console.error("Failed to add product via database API:", err);
    }
    return false;
  };

  return (
    <ProductContext.Provider value={{ products, loading, refreshProducts: () => fetchProducts(false), addProduct, getProductsForType }}>
      {children}
    </ProductContext.Provider>
  );
};

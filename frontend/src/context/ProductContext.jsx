import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { baseProducts, toWholesaleProduct } from '../data/products';
import { groupProductsByBase } from '../utils/productGrouping';
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchProducts = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/products?limit=500');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn("Could not fetch products from database.", err);
      setProducts([]);
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

    const interval = setInterval(() => {
      fetchProducts(false);
    }, 5 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [fetchProducts]);

  // Returns the live API products filtered by customerType / targetType & grouped by base product
  const getProductsForType = (customerType = 'retail') => {
    const list = Array.isArray(products) ? products : [];
    // Only show products the admin has explicitly published to the website
    const publishedList = list.filter(p => p.isPublished !== false);
    let items;
    if (customerType === 'wholesale') {
      const wholesaleItems = publishedList.filter(p => {
        if (!p.targetType) return true; // Default fallback for existing DB items
        return p.targetType === 'wholesale' || p.targetType === 'retail_and_wholesale' || p.targetType === 'both';
      });
      items = wholesaleItems.map(toWholesaleProduct);
    } else {
      const retailItems = publishedList.filter(p => {
        if (!p.targetType) return true; // Default fallback for existing DB items
        return p.targetType === 'retail' || p.targetType === 'retail_and_wholesale' || p.targetType === 'both';
      });
      // Custom price ranges/tiers are strictly for wholesale.
      // Clear variants on raw retail items so custom wholesale ranges don't bleed into retail pricing or grouping.
      items = retailItems.map(p => ({
        ...p,
        variants: []
      }));
    }

    return groupProductsByBase(items);
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

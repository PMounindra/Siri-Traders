import { createContext, useContext, useState, useEffect } from 'react';
import { baseProducts, toWholesaleProduct } from '../data/products';
import { useAuth } from './AuthContext';

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

  const fetchProducts = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Returns the live API products (no localStorage merge — admin saves go to DB, not localStorage)
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
        await fetchProducts(); // Refresh list from DB
        return true;
      }
    } catch (err) {
      console.error("Failed to add product via database API:", err);
    }
    return false;
  };

  return (
    <ProductContext.Provider value={{ products, loading, refreshProducts: fetchProducts, addProduct, getProductsForType }}>
      {children}
    </ProductContext.Provider>
  );
};

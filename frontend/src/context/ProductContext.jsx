import { createContext, useContext, useState, useEffect } from 'react';
import { baseProducts, toWholesaleProduct, mergeCatalog } from '../data/products';

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

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
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

  const getProductsForType = (customerType = 'retail') => {
    // Read local admin products (if any exist in local storage)
    const saved = localStorage.getItem('siri-traders-admin-products');
    const adminProducts = saved ? JSON.parse(saved) : [];
    
    if (customerType === 'wholesale') {
      const wholesaleCatalog = products.map(toWholesaleProduct);
      return mergeCatalog(wholesaleCatalog, adminProducts);
    }
    return mergeCatalog(products, adminProducts);
  };

  const addProduct = async (productData) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        await fetchProducts(); // Refresh list
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

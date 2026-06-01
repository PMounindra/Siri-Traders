import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiShare2, FiClock, FiShield, FiPlus, FiMinus, FiShoppingCart } from 'react-icons/fi';
import { getProductById, getProductsByCategory } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const { customerType } = useAuth();
  const navigate = useNavigate();
  const product = getProductById(id, customerType);
  const { addToCart, removeFromCart, updateQuantity, getItemQuantity } = useCart();
  const [imageFailed, setImageFailed] = useState(false);
  const variants = product?.variants || (product ? [{ label: `${product.weight} ${product.unit}`, price: product.price }] : []);
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);

  if (!product) {
    return (
      <div className="page-wrapper">
        <div className="pd__not-found">
          <span>😕</span>
          <h2>Product not found</h2>
          <button onClick={() => navigate('/home')} className="pd__back-home">Go Home</button>
        </div>
      </div>
    );
  }

  const selectedProductId = `${product.id}-${selectedVariant.label}`;
  const selectedMrp = selectedVariant.mrp || Math.round(selectedVariant.price * (product.mrp / product.price));
  const selectedDiscount = Math.max(0, Math.round(((selectedMrp - selectedVariant.price) / selectedMrp) * 100));
  const quantity = getItemQuantity(selectedProductId);
  const similarProducts = getProductsByCategory(product.category, customerType)
    .filter(p => p.id !== product.id)
    .slice(0, 8);

  return (
    <div className="page-wrapper">
      <div className="pd">
        {/* Header */}
        <div className="pd__header">
          <button className="pd__back" onClick={() => navigate(-1)}>
            <FiArrowLeft />
          </button>
          <span className="pd__header-title">{product.name}</span>
          <button className="pd__share"><FiShare2 /></button>
        </div>

        {/* Image */}
        <div className="pd__image-section">
          {selectedDiscount > 0 && (
            <span className="pd__discount-badge">{selectedDiscount}% OFF</span>
          )}
          {!imageFailed ? (
            <img
              src={toWebpImage(product.image)}
              alt={product.name}
              className="pd__image"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="pd__image pd__image-fallback">
              {product.name.split(' ').slice(0, 2).map(word => word[0]).join('')}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pd__info">
          <span className="pd__brand">{product.brand}</span>
          <h1 className="pd__name">{product.name}</h1>
          <div className="pd__variants">
            {variants.map(variant => (
              <button
                key={variant.label}
                type="button"
                className={selectedVariant.label === variant.label ? 'pd__variant pd__variant--active' : 'pd__variant'}
                onClick={() => setSelectedVariant(variant)}
              >
                <span>{variant.label}</span>
                <strong>{formatPrice(variant.price)}</strong>
              </button>
            ))}
          </div>

          <div className="pd__price-row">
            <span className="pd__price">{formatPrice(selectedVariant.price)}</span>
            {selectedDiscount > 0 && (
              <>
                <span className="pd__mrp">{formatPrice(selectedMrp)}</span>
                <span className="pd__off">{selectedDiscount}% OFF</span>
              </>
            )}
          </div>

          <div className="pd__badges">
            <div className="pd__badge">
              <FiClock />
              <span>Delivery in {product.deliveryTime}</span>
            </div>
            <div className="pd__badge">
              <FiShield />
              <span>100% Quality Assured</span>
            </div>
          </div>

          {/* Add to cart */}
          <div className="pd__actions">
            {quantity === 0 ? (
              <button className="pd__add-btn" onClick={() => addToCart({ ...product, id: selectedProductId, productId: product.id, price: selectedVariant.price, mrp: selectedMrp, discount: selectedDiscount, weight: selectedVariant.label, unit: '' })} id="pd-add-to-cart">
                <FiShoppingCart /> Add to Cart
              </button>
            ) : (
              <div className="pd__cart-controls">
                <div className="pd__stepper">
                  <button onClick={() => quantity <= 1 ? removeFromCart(selectedProductId) : updateQuantity(selectedProductId, quantity - 1)}>
                    <FiMinus />
                  </button>
                  <span>{quantity}</span>
                  <button onClick={() => updateQuantity(selectedProductId, quantity + 1)}>
                    <FiPlus />
                  </button>
                </div>
                <Link to="/cart" className="pd__go-cart">Go to Cart →</Link>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="pd__description">
            <h3>Product Description</h3>
            <p>{product.description}</p>
          </div>
        </div>

        {/* Similar products */}
        {similarProducts.length > 0 && (
          <div className="pd__similar">
            <h3 className="pd__similar-title">You might also like</h3>
            <div className="pd__similar-scroll hide-scrollbar">
              {similarProducts.map(p => (
                <div key={p.id} className="pd__similar-item">
                  <ProductCard product={p} compact />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import './ProductCard.css';

const ProductCard = ({ product, compact = false }) => {
  const { addToCart, removeFromCart, updateQuantity, getItemQuantity } = useCart();
  const { customerType } = useAuth();
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const isWholesale = customerType === 'wholesale';
  const isOutOfStock = product.stockNote === 'Out of stock' || product.inStock === false;
  const stockNote = product.stockNote && product.stockNote !== 'In stock' ? product.stockNote : '';
  const priceVariants = product.variants || [
    { label: `${product.weight} ${product.unit}`, price: product.price }
  ];
  const [selectedVariant, setSelectedVariant] = useState(() => {
    // Auto-select the variant that's already in cart (if any), scoped by customerType
    const inCart = priceVariants.find(v => getItemQuantity(`${customerType}-${product.id}-${v.label}`) > 0);
    return inCart || priceVariants[0];
  });
  const selectedProductId = `${customerType}-${product.id}-${selectedVariant.label}`;
  const selectedPrice = selectedVariant.price;
  const selectedMrp = selectedVariant.mrp || Math.round(selectedPrice * (product.mrp / product.price));
  const selectedDiscount = Math.max(0, Math.round(((selectedMrp - selectedPrice) / selectedMrp) * 100));
  const quantity = getItemQuantity(selectedProductId);
  const productInitials = product.name
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('');

  const unitRate = (variant) => {
    const match = variant.label.match(/([\d.]+)\s*(kg|l)\b/i);
    if (!match) return '';
    const amount = Number(match[1]);
    return amount ? `${formatPrice(Math.round(variant.price / amount))}/${match[2].toLowerCase()}` : '';
  };

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    addToCart({
      ...product,
      id: selectedProductId,
      productId: product.id,
      price: selectedPrice,
      mrp: selectedMrp,
      discount: selectedDiscount,
      weight: selectedVariant.label,
      unit: '',
      selectedVariant: selectedVariant.label
    });
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    updateQuantity(selectedProductId, quantity + 1);
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (quantity <= 1) {
      removeFromCart(selectedProductId);
    } else {
      updateQuantity(selectedProductId, quantity - 1);
    }
  };

  const handleVariantSelect = (e, variant) => {
    e.stopPropagation();
    setSelectedVariant(variant);
  };

  return (
    <div
      className={`product-card ${compact ? 'product-card--compact' : ''}`}
      onClick={() => navigate(`/product/${product.id}`)}
      id={`product-card-${product.id}`}
    >
      <div className="product-card__image-container">
        {!imageFailed ? (
          <img
            src={toWebpImage(product.image)}
            alt={product.name}
            className="product-card__image"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="product-card__image-fallback" aria-label={product.name}>
            <span>{productInitials}</span>
          </div>
        )}
        {selectedDiscount > 0 && (
          <span className="product-card__discount-badge">
            {selectedDiscount}% OFF
          </span>
        )}
        {stockNote && (
          <span className={`product-card__stock-badge ${isOutOfStock ? 'product-card__stock-badge--out' : ''}`}>
            {stockNote}
          </span>
        )}
        {isWholesale && (
          <span className="product-card__wholesale-badge">Wholesale</span>
        )}
      </div>

      <div className="product-card__info">
        <span className="product-card__delivery-badge">
          <FiClock /> {product.deliveryTime}
        </span>
        <h3 className="product-card__name">{product.name}</h3>
        {isWholesale && product.wholesalePrice && (
          <span className="product-card__ws-price">WS Price: {formatPrice(product.wholesalePrice)}</span>
        )}
        <p className="product-card__weight">{selectedVariant.label}</p>
        <div className="product-card__variants">
          {priceVariants.slice(0, isWholesale ? 4 : 3).map(variant => (
            <button
              key={`${product.id}-${variant.label}`}
              type="button"
              className={selectedVariant.label === variant.label ? 'product-card__variant product-card__variant--active' : 'product-card__variant'}
              onClick={(e) => handleVariantSelect(e, variant)}
            >
              <span>{variant.label}</span>
              <strong>{formatPrice(variant.price)}</strong>
            </button>
          ))}
        </div>

        <div className="product-card__bottom">
          <div className="product-card__price-group">
            <span className="product-card__price">{formatPrice(selectedPrice)}</span>
            {selectedDiscount > 0 && (
              <span className="product-card__mrp">{formatPrice(selectedMrp)}</span>
            )}
          </div>

          {isOutOfStock ? (
            <button className="product-card__add-btn product-card__add-btn--disabled" onClick={(e) => e.stopPropagation()}>
              OUT
            </button>
          ) : quantity === 0 ? (
            <button
              className="product-card__add-btn"
              onClick={handleAdd}
              id={`add-btn-${product.id}`}
            >
              ADD
            </button>
          ) : (
            <div className="product-card__stepper" onClick={(e) => e.stopPropagation()}>
              <button className="product-card__stepper-btn" onClick={handleDecrease}>
                <FiMinus />
              </button>
              <span className="product-card__stepper-count">{quantity}</span>
              <button className="product-card__stepper-btn" onClick={handleIncrease}>
                <FiPlus />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import ProductImage from './ProductImage';
import './ProductCard.css';

const ProductCard = ({ product, compact = false }) => {
  const { addToCart, removeFromCart, updateQuantity, getItemQuantity } = useCart();
  const { customerType } = useAuth();
  const navigate = useNavigate();
  const isWholesale = customerType === 'wholesale';
  const isOutOfStock = product.stockNote === 'Out of stock' || product.inStock === false;
  const stockNote = product.stockNote && product.stockNote !== 'In stock' ? product.stockNote : '';
  const priceVariants = (isWholesale && Array.isArray(product.variants) && product.variants.length > 0)
    ? product.variants
    : (!isWholesale && Array.isArray(product.variants) && product.variants.length > 1)
      ? product.variants
      : [{ label: `${product.weight || ''} ${product.unit || ''}`.trim() || 'Standard Pack', price: Number(product.price) || 0, mrp: Number(product.mrp) || Number(product.price) || 0 }];
  const [selectedVariant, setSelectedVariant] = useState(() => {
    const inCart = priceVariants.find(v => getItemQuantity(`${customerType}-${product.id}-${v.label}`) > 0);
    return inCart || priceVariants[0];
  });
  const selectedProductId = `${customerType}-${product.id}-${selectedVariant.label}`;
  const selectedPrice = Number(selectedVariant?.price) || Number(product.price) || 0;
  const baseMrp = Number(selectedVariant?.mrp) || Number(product.mrp) || selectedPrice;
  const selectedMrp = Math.max(selectedPrice, baseMrp);
  const selectedDiscount = selectedMrp > selectedPrice ? Math.max(0, Math.round(((selectedMrp - selectedPrice) / selectedMrp) * 100)) : 0;
  const quantity = getItemQuantity(selectedProductId);

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
        <ProductImage
          src={product.image}
          name={product.name}
          className="product-card__image"
        />
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
        <h3 className="product-card__name">{product.name}</h3>
        {isWholesale && product.wholesalePrice && (
          <span className="product-card__ws-price">WS Price: {formatPrice(product.wholesalePrice)}</span>
        )}
        <p className="product-card__weight">{selectedVariant.label}</p>
        {priceVariants.length > 1 && (
          <div className="product-card__variants">
            {priceVariants.slice(0, 6).map(variant => (
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
        )}

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

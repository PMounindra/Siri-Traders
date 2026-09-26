import { useState } from 'react';
import { toWebpImage } from '../utils/images';
import './ProductImage.css';

/**
 * ProductImage — renders a product image with a branded initial-letter fallback.
 * When `src` is empty/null OR the image fails to load, shows the first letter of
 * `name` on a white background in the logo green color (#2D5016).
 */
const ProductImage = ({ src, name = '', alt, className = '', style = {}, onClick }) => {
  const [failed, setFailed] = useState(false);

  const hasSrc = src && typeof src === 'string' && src.trim() !== '';
  const showFallback = !hasSrc || failed;

  const initial = (name || '').trim().charAt(0).toUpperCase() || '?';

  if (showFallback) {
    return (
      <div
        className={`product-img-initial ${className}`}
        style={style}
        onClick={onClick}
        aria-label={name}
        role={onClick ? 'button' : undefined}
      >
        <span>{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={toWebpImage(src)}
      alt={alt || name}
      className={className}
      style={style}
      onClick={onClick}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
};

export default ProductImage;

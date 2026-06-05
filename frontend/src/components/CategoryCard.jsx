import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toWebpImage } from '../utils/images';
import './CategoryCard.css';

const CategoryCard = ({ category, size = 'medium' }) => {
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const initials = category.name
    .split(' ')
    .filter(word => word !== '&')
    .slice(0, 2)
    .map(word => word[0])
    .join('');

  return (
    <div
      className={`category-card category-card--${size}`}
      style={{ '--cat-bg': category.color }}
      onClick={() => navigate(`/categories?cat=${category.id}`)}
      id={`category-card-${category.id}`}
    >
      <div className="category-card__icon">
        {category.image && !imgError ? (
          <img
            src={toWebpImage(category.image)}
            alt={category.name}
            className="category-card__icon-img"
            onError={() => setImgError(true)}
            loading="lazy"
          />
        ) : (
          <span className="category-card__fallback">{initials}</span>
        )}
      </div>
      <span className="category-card__name">{category.name}</span>
    </div>
  );
};

export default CategoryCard;

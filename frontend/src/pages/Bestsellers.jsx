import { Link } from 'react-router-dom';
import { FiChevronRight, FiPackage, FiShoppingBag, FiStar } from 'react-icons/fi';
import { categories } from '../data/categories';
import { getProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { toWebpImage } from '../utils/images';
import { useSearchParams } from 'react-router-dom';
import './Bestsellers.css';

const Bestsellers = () => {
  const { customerType } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCat = searchParams.get('cat') || '';
  const isWholesale = customerType === 'wholesale';

  const allProducts = getProducts(customerType);
  const bestsellerProducts = allProducts.filter(p => p.isBestseller);

  // Priority order: pulses, rice, atta, oils, masala first, then everything else
  const categoryPriority = ['pulses', 'rice', 'atta', 'oils', 'masala'];
  const sortedBestsellerProducts = [...bestsellerProducts].sort((a, b) => {
    const aRank = categoryPriority.indexOf(a.category);
    const bRank = categoryPriority.indexOf(b.category);
    const aVal = aRank === -1 ? 999 : aRank;
    const bVal = bRank === -1 ? 999 : bRank;
    return aVal - bVal;
  });

  const filteredProducts = activeCat
    ? sortedBestsellerProducts.filter(p => p.category === activeCat)
    : sortedBestsellerProducts;

  // Sidebar categories sorted same way
  const bestsellerCategories = categories
    .filter(cat => bestsellerProducts.some(p => p.category === cat.id))
    .sort((a, b) => {
      const aRank = categoryPriority.indexOf(a.id);
      const bRank = categoryPriority.indexOf(b.id);
      return (aRank === -1 ? 999 : aRank) - (bRank === -1 ? 999 : bRank);
    });

  return (
    <div className="page-wrapper">
      <div className="bspage">
        <aside className="bspage__sidebar hide-scrollbar">
          <button
            className={`bspage__sidebar-item ${!activeCat ? 'bspage__sidebar-item--active' : ''}`}
            onClick={() => setSearchParams({})}
          >
            <span className="bspage__sidebar-icon bspage__sidebar-icon--all">
              <FiStar />
            </span>
            <span className="bspage__sidebar-name">All Best</span>
          </button>
          {bestsellerCategories.map(cat => (
            <button
              key={cat.id}
              className={`bspage__sidebar-item ${activeCat === cat.id ? 'bspage__sidebar-item--active' : ''}`}
              onClick={() => setSearchParams({ cat: cat.id })}
            >
              <span className="bspage__sidebar-icon">
                <img src={toWebpImage(cat.image)} alt={cat.name} />
              </span>
              <span className="bspage__sidebar-name">{cat.name}</span>
            </button>
          ))}
        </aside>

        <div className="bspage__content">
          <div className={`bspage__mode-banner ${isWholesale ? 'bspage__mode-banner--wholesale' : ''}`}>
            {isWholesale ? <><FiPackage /><span>Wholesale Mode — bulk prices</span></> : <><span className="bspage__mode-dot" /><span>Most loved products by customers</span></>}
          </div>

          <div className="bspage__heading-row">
            <h1 className="bspage__heading">
              <FiStar className="bspage__heading-icon" />
              Bestsellers
              <span className="bspage__count">{filteredProducts.length} items</span>
            </h1>
            <Link to="/categories" className="bspage__back-link">
              All Categories <FiChevronRight />
            </Link>
          </div>

          <div className="bspage__grid">
            {filteredProducts.map(product => (
              <ProductCard key={`${customerType}-${product.id}`} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="bspage__empty">
              <FiPackage className="bspage__empty-icon" />
              <p>No bestsellers in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Bestsellers;

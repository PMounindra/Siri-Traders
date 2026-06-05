import { Link } from 'react-router-dom';
import { FiChevronRight, FiPackage, FiShoppingBag, FiTag } from 'react-icons/fi';
import { categories } from '../data/categories';
import { getProducts } from '../data/products';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { toWebpImage } from '../utils/images';
import { useSearchParams } from 'react-router-dom';
import './TodaysDeals.css';

const TodaysDeals = () => {
  const { customerType } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCat = searchParams.get('cat') || '';
  const isWholesale = customerType === 'wholesale';

  const allProducts = getProducts(customerType);
  const dealProducts = allProducts.filter(p => p.discount >= 10);

  // Priority order: pulses, rice, atta, oils, masala first, then everything else
  const categoryPriority = ['pulses', 'rice', 'atta', 'oils', 'masala'];
  const sortedDealProducts = [...dealProducts].sort((a, b) => {
    const aRank = categoryPriority.indexOf(a.category);
    const bRank = categoryPriority.indexOf(b.category);
    const aVal = aRank === -1 ? 999 : aRank;
    const bVal = bRank === -1 ? 999 : bRank;
    return aVal - bVal;
  });

  const filteredProducts = activeCat
    ? sortedDealProducts.filter(p => p.category === activeCat)
    : sortedDealProducts;

  // Sidebar categories sorted same way
  const dealCategories = categories
    .filter(cat => dealProducts.some(p => p.category === cat.id))
    .sort((a, b) => {
      const aRank = categoryPriority.indexOf(a.id);
      const bRank = categoryPriority.indexOf(b.id);
      return (aRank === -1 ? 999 : aRank) - (bRank === -1 ? 999 : bRank);
    });

  return (
    <div className="page-wrapper">
      <div className="tdpage">
        <aside className="tdpage__sidebar hide-scrollbar">
          <button
            className={`tdpage__sidebar-item ${!activeCat ? 'tdpage__sidebar-item--active' : ''}`}
            onClick={() => setSearchParams({})}
          >
            <span className="tdpage__sidebar-icon tdpage__sidebar-icon--all">
              <FiTag />
            </span>
            <span className="tdpage__sidebar-name">All Deals</span>
          </button>
          {dealCategories.map(cat => (
            <button
              key={cat.id}
              className={`tdpage__sidebar-item ${activeCat === cat.id ? 'tdpage__sidebar-item--active' : ''}`}
              onClick={() => setSearchParams({ cat: cat.id })}
            >
              <span className="tdpage__sidebar-icon">
                <img src={toWebpImage(cat.image)} alt={cat.name} />
              </span>
              <span className="tdpage__sidebar-name">{cat.name}</span>
            </button>
          ))}
        </aside>

        <div className="tdpage__content">
          <div className={`tdpage__mode-banner ${isWholesale ? 'tdpage__mode-banner--wholesale' : ''}`}>
            {isWholesale ? <><FiPackage /><span>Wholesale Mode — bulk prices</span></> : <><span className="tdpage__mode-dot" /><span>Today's best discounts for you</span></>}
          </div>

          <div className="tdpage__heading-row">
            <h1 className="tdpage__heading">
              <FiTag className="tdpage__heading-icon" />
              Today's Deals
              <span className="tdpage__count">{filteredProducts.length} items</span>
            </h1>
            <Link to="/categories" className="tdpage__back-link">
              All Categories <FiChevronRight />
            </Link>
          </div>

          <div className="tdpage__grid">
            {filteredProducts.map(product => (
              <ProductCard key={`${customerType}-${product.id}`} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="tdpage__empty">
              <FiPackage className="tdpage__empty-icon" />
              <p>No deals in this category right now</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodaysDeals;

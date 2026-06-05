import { useSearchParams } from 'react-router-dom';
import { FiPackage, FiShoppingBag } from 'react-icons/fi';
import { categories } from '../data/categories';
import { getProducts, getProductsByCategory } from '../data/products';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import { useAuth } from '../context/AuthContext';
import { toWebpImage } from '../utils/images';
import './Categories.css';

const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { customerType } = useAuth();
  const activeCat = searchParams.get('cat') || '';
  const searchQuery = searchParams.get('search') || '';
  const isWholesale = customerType === 'wholesale';

  const filteredProducts = searchQuery
    ? getProducts(customerType).filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeCat
    ? getProductsByCategory(activeCat, customerType)
    : getProducts(customerType);

  const activeCategory = categories.find(c => c.id === activeCat);

  return (
    <div className="page-wrapper">
      <div className="categories">
        <aside className="categories__sidebar hide-scrollbar">
          <button
            className={`categories__sidebar-item ${!activeCat ? 'categories__sidebar-item--active' : ''}`}
            onClick={() => setSearchParams({})}
          >
            <span className="categories__sidebar-icon categories__sidebar-icon--all">
              <FiShoppingBag />
            </span>
            <span className="categories__sidebar-name">All</span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`categories__sidebar-item ${activeCat === cat.id ? 'categories__sidebar-item--active' : ''}`}
              onClick={() => setSearchParams({ cat: cat.id })}
              id={`sidebar-${cat.id}`}
            >
              <span className="categories__sidebar-icon">
                <img src={toWebpImage(cat.image)} alt={cat.name} />
              </span>
              <span className="categories__sidebar-name">{cat.name}</span>
            </button>
          ))}
        </aside>

        <div className="categories__content">
          <div className={`categories__mode-banner ${isWholesale ? 'categories__mode-banner--wholesale' : ''}`}>
            {isWholesale ? (
              <>
                <FiPackage />
                <span>Wholesale Mode - bulk prices and larger packs</span>
              </>
            ) : (
              <>
                <span className="categories__mode-dot"></span>
                <span>Retail Mode - shop for home and daily needs</span>
              </>
            )}
          </div>

          <h1 className="categories__heading">
            {searchQuery ? `Results for "${searchQuery}"` : activeCategory ? activeCategory.name : 'All Products'}
            <span className="categories__count">
              {filteredProducts.length} items
            </span>
          </h1>

          {!activeCat && !searchQuery && (
            <div className="categories__cat-grid">
              {categories.map(cat => (
                <CategoryCard key={cat.id} category={cat} size="large" />
              ))}
            </div>
          )}

          <div className="categories__grid">
            {filteredProducts.map(product => (
              <ProductCard key={`${customerType}-${product.id}`} product={product} />
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="categories__empty">
              <FiPackage className="categories__empty-icon" />
              <p>No products found in this category</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;

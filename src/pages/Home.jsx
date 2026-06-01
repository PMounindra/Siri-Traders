import { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
  FiFacebook,
  FiInstagram,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiTwitter,
  FiPercent,
  FiTruck,
  FiPackage
} from 'react-icons/fi';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import { categories } from '../data/categories';
import { baseProducts, getProducts } from '../data/products';
import { getDailyOffers, getFestivalOffers } from '../data/offers';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import { useAuth } from '../context/AuthContext';
import './Home.css';

const ScrollRow = ({ children, className }) => {
  const rowRef = useRef(null);

  const scrollByPage = (direction) => {
    rowRef.current?.scrollBy({
      left: direction * Math.round(rowRef.current.clientWidth * 0.8),
      behavior: 'smooth'
    });
  };

  return (
    <div className="home__scroll-wrap">
      <button
        type="button"
        className="home__scroll-btn home__scroll-btn--left"
        onClick={() => scrollByPage(-1)}
        aria-label="Scroll left"
      >
        <FiChevronLeft />
      </button>
      <div ref={rowRef} className={`${className} hide-scrollbar`}>
        {children}
      </div>
      <button
        type="button"
        className="home__scroll-btn home__scroll-btn--right"
        onClick={() => scrollByPage(1)}
        aria-label="Scroll right"
      >
        <FiChevronRight />
      </button>
    </div>
  );
};

/* ── Coupon data ── */
const retailCoupons = [
  { icon: <FiPercent />, title: 'FLAT ₹50 OFF', desc: 'On your first order above ₹399', code: 'WELCOME50' },
  { icon: <FiTruck />, title: 'FREE Delivery', desc: 'On all your orders above ₹199', code: 'FREEDEL' },
  { icon: <FiTag />, title: 'Extra 10% OFF', desc: 'On orders above ₹999', code: 'SIRI10' }
];

const wholesaleCoupons = [
  { icon: <FiPackage />, title: 'FLAT ₹200 OFF', desc: 'On bulk orders above ₹2999', code: 'BULK200' },
  { icon: <FiTruck />, title: 'FREE Delivery', desc: 'On all wholesale orders', code: 'WSFREE' },
  { icon: <FiPercent />, title: 'Extra 15% OFF', desc: 'On orders above ₹4999', code: 'WSBIG15' }
];

/* ── Festive offers data ── */
const festiveOffers = [
  {
    label: 'Festive Offers',
    title: 'Eid Mubarak',
    text: 'Celebrate with sweets, snacks, cooking essentials and festive-ready deals.',
    cta: 'Shop Now',
    link: '/categories',
    theme: 'eid',
    tiles: [
      {
        title: 'Eid Specials',
        image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=500&q=80',
        link: '/categories?cat=snacks-munchies'
      },
      {
        title: 'Cook & Feast',
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80',
        link: '/categories?cat=masala'
      },
      {
        title: 'Prayer & Gifting',
        image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=500&q=80',
        link: '/categories?cat=personal-care'
      },
      {
        title: 'Sweets & Desserts',
        image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80',
        link: '/categories?cat=bakery-biscuits'
      },
      {
        title: 'Get Eid Ready',
        image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80',
        link: '/categories?cat=personal-care'
      },
      {
        title: 'Meat Marinades & Spices',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80',
        link: '/categories?cat=masala'
      }
    ]
  },
  {
    label: 'Festival Deals',
    title: 'Diwali Dhamaka',
    text: 'Light up your home with sweets, dry fruits, pooja picks and party essentials.',
    cta: 'Explore Deals',
    link: '/categories?cat=bakery-biscuits',
    theme: 'diwali',
    tiles: [
      {
        title: 'Mithai Boxes',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80',
        link: '/categories?cat=bakery-biscuits'
      },
      {
        title: 'Dry Fruits',
        image: 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500&q=80',
        link: '/categories?cat=snacks-munchies'
      },
      {
        title: 'Home Sparkle',
        image: 'https://images.unsplash.com/photo-1605143185677-4e4aebc3a36e?w=500&q=80',
        link: '/categories?cat=cleaning-household'
      },
      {
        title: 'Party Snacks',
        image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&q=80',
        link: '/categories?cat=snacks-munchies'
      },
      {
        title: 'Pooja Ready',
        image: 'https://images.unsplash.com/photo-1607877361964-d9b0d773066d?w=500&q=80',
        link: '/categories?cat=personal-care'
      },
      {
        title: 'Family Feast',
        image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=500&q=80',
        link: '/categories?cat=masala'
      }
    ]
  },
  {
    label: 'Fresh Fest',
    title: 'Holi Specials',
    text: 'Stock up on colors, refreshing drinks, crunchy snacks and cheerful treats.',
    cta: 'Shop Holi',
    link: '/categories?cat=beverages',
    theme: 'holi',
    tiles: [
      {
        title: 'Cool Drinks',
        image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=80',
        link: '/categories?cat=beverages'
      },
      {
        title: 'Namkeen Packs',
        image: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&q=80',
        link: '/categories?cat=snacks-munchies'
      },
      {
        title: 'Sweet Bites',
        image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80',
        link: '/categories?cat=bakery-biscuits'
      },
      {
        title: 'Skin Care',
        image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80',
        link: '/categories?cat=personal-care'
      },
      {
        title: 'Fresh Fruits',
        image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80',
        link: '/categories?cat=fruits-vegetables'
      },
      {
        title: 'Quick Meals',
        image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80',
        link: '/categories?cat=instant-frozen'
      }
    ]
  },
  {
    label: 'Holiday Offers',
    title: 'Christmas Treats',
    text: 'Bring home cakes, chocolates, baking must-haves and cozy celebration picks.',
    cta: 'Shop Treats',
    link: '/categories?cat=bakery-biscuits',
    theme: 'christmas',
    tiles: [
      {
        title: 'Cakes & Cookies',
        image: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500&q=80',
        link: '/categories?cat=bakery-biscuits'
      },
      {
        title: 'Chocolates',
        image: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80',
        link: '/categories?cat=snacks-munchies'
      },
      {
        title: 'Baking Needs',
        image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=500&q=80',
        link: '/categories?cat=atta'
      },
      {
        title: 'Coffee & Cocoa',
        image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80',
        link: '/categories?cat=beverages'
      },
      {
        title: 'Gift Hampers',
        image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=500&q=80',
        link: '/categories?cat=personal-care'
      },
      {
        title: 'Dinner Prep',
        image: 'https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=500&q=80',
        link: '/categories?cat=oils'
      }
    ]
  }
];

const WelcomeBanner = ({ customerType }) => {
  const isWholesale = customerType === 'wholesale';
  const coupons = isWholesale ? wholesaleCoupons : retailCoupons;

  return (
    <section className={`home-hero ${isWholesale ? 'home-hero--wholesale' : ''}`}>
      <div className="home-hero__intro">
        <h1>{isWholesale ? 'WHOLESALE HUB' : 'WELCOME'}</h1>
        <p>{isWholesale ? 'Bulk prices, bigger savings for your business' : 'Order now and enjoy great offers'}</p>
      </div>
      <div className="home-hero__offers-pill">
        <span>✦ OFFERS FOR YOU ✦</span>
      </div>
      <div className="home-hero__coupons">
        {coupons.map((coupon, i) => (
          <div className="home-hero__coupon-card" key={i}>
            <div className="home-hero__coupon-icon">{coupon.icon}</div>
            <div className="home-hero__coupon-info">
              <strong>{coupon.title}</strong>
              <span>{coupon.desc}</span>
            </div>
            <div className="home-hero__coupon-code">Code: <strong>{coupon.code}</strong></div>
          </div>
        ))}
      </div>
    </section>
  );
};

const OffersSection = ({ customerType }) => {
  const adminFestival = getFestivalOffers().find(offer => offer.source === 'admin');
  const activeFestival = adminFestival ? {
    label: 'Festive Offers',
    title: adminFestival.title,
    text: adminFestival.subtitle || 'Fresh festive savings selected by Siri Traders.',
    tiles: Array.from({ length: 6 }, (_, index) => ({
      title: index === 0 ? adminFestival.title : adminFestival.subtitle || 'Festival Essentials',
      image: adminFestival.image,
      link: adminFestival.link || '/categories'
    }))
  } : festiveOffers[0];
  const dailySpotlights = getDailyOffers().slice(0, 6);
  const festivalSpotlights = getFestivalOffers().slice(0, 6);

  return (
    <section className="home-offers" aria-label="Daily and festive offers">
      {/* Daily Offers panel */}
      <div className="home-hero__panel">
        <div className="home-hero__panel-head">
          <div>
            <span>Curated savings</span>
            <h2>Daily Offers</h2>
          </div>
          <Link to="/categories">View all <FiArrowRight /></Link>
        </div>
        <ScrollRow className="home-hero__offers-scroll">
          {dailySpotlights.map(offer => (
            <Link to={offer.link} className="home-hero__offer-card" key={offer.id}>
              <img src={toWebpImage(offer.image)} alt={offer.title} />
              <div className="home-hero__offer-card-body">
                <span className="home-hero__offer-badge">{offer.badge}</span>
                <h3>{offer.title}</h3>
                <strong>{formatPrice(offer.price)}</strong>
              </div>
            </Link>
          ))}
        </ScrollRow>
      </div>

      {/* Festive Offers panel — now matching daily offers style */}
      <div className="home-hero__panel home-hero__panel--festival">
        <div className="home-hero__panel-head">
          <div>
            <span>{activeFestival.label}</span>
            <h2>{activeFestival.title}</h2>
          </div>
          <Link to="/categories">View all <FiArrowRight /></Link>
        </div>
        <p className="home-hero__festival-desc">{activeFestival.text}</p>
        <ScrollRow className="home-hero__offers-scroll">
          {(festivalSpotlights.length > 0 ? festivalSpotlights : activeFestival.tiles).map((item, i) => (
            <Link to={item.link} className="home-hero__offer-card home-hero__offer-card--festive" key={item.id || item.title + i}>
              <img src={toWebpImage(item.image)} alt={item.title} />
              <div className="home-hero__offer-card-body">
                <span className="home-hero__offer-badge home-hero__offer-badge--festive">{item.badge || activeFestival.label}</span>
                <h3>{item.title}</h3>
                {item.price && <strong>{formatPrice(item.price)}</strong>}
              </div>
            </Link>
          ))}
        </ScrollRow>
      </div>
    </section>
  );
};

const Home = () => {
  const { customerType } = useAuth();
  const isWholesale = customerType === 'wholesale';
  const stapleIds = ['fruits-vegetables', 'rice', 'atta', 'pulses', 'oils', 'masala'];
  const catalog = customerType === 'retail' ? baseProducts : getProducts(customerType);
  const byCategory = category => catalog.filter(product => product.category === category);
  const deals = catalog.filter(product => product.discount >= 10 && stapleIds.includes(product.category));
  const bestsellers = catalog.filter(product => product.isBestseller && stapleIds.includes(product.category));
  const pulses = byCategory('pulses');
  const oils = byCategory('oils');
  const atta = byCategory('atta');
  const rice = byCategory('rice');
  const masala = byCategory('masala');
  const fruitsVeg = byCategory('fruits-vegetables');
  const stapleCategories = categories.filter(cat => stapleIds.includes(cat.id));

  return (
    <div className="page-wrapper">
      <div className={`home ${isWholesale ? 'home--wholesale' : ''}`}>
        <div className="container">
          {/* Wholesale mode indicator */}
          {isWholesale && (
            <div className="home__wholesale-banner">
              <FiPackage />
              <span>Wholesale Mode</span>
              <span className="home__wholesale-banner-sep">•</span>
              <span>Bulk Prices</span>
              <span className="home__wholesale-banner-sep">•</span>
              <span>Business Savings</span>
            </div>
          )}

          <WelcomeBanner customerType={customerType} />
          <OffersSection customerType={customerType} />

          {/* Shop by Category */}
          <section className="home__section home__section--categories">
            <div className="section-header">
              <h2 className="section-title">Shop by Category</h2>
              <Link to="/categories" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <div className="home__category-grid">
              {stapleCategories.map(cat => (
                <CategoryCard key={cat.id} category={cat} size="large" />
              ))}
            </div>
          </section>

          {/* Today's Deals */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title"><FiTag /> Today's Deals</h2>
              <Link to="/categories" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__deals-scroll">
              {deals.map(product => (
                <div key={product.id} className="home__deals-item">
                  <ProductCard key={`${customerType}-${product.id}`} product={product} />
                </div>
              ))}
            </ScrollRow>
          </section>

          {/* Bestsellers */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title"><FiStar /> Bestsellers</h2>
              <Link to="/categories" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__deals-scroll">
              {bestsellers.map(product => (
                <div key={product.id} className="home__deals-item">
                  <ProductCard key={`${customerType}-${product.id}`} product={product} />
                </div>
              ))}
            </ScrollRow>
          </section>

          {/* Fruits & Vegetables */}
          {fruitsVeg.length > 0 && (
            <section className="home__section">
              <div className="section-header">
                <h2 className="section-title">🥬 Fruits & Vegetables</h2>
                <Link to="/categories?cat=fruits-vegetables" className="section-link">
                  See All <FiChevronRight />
                </Link>
              </div>
              <ScrollRow className="home__deals-scroll">
                {fruitsVeg.map(product => (
                  <div key={product.id} className="home__deals-item">
                    <ProductCard key={`${customerType}-${product.id}`} product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          )}

          {/* Pulses */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title">Pulses</h2>
              <Link to="/categories?cat=pulses" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__deals-scroll">
              {pulses.map(product => (
                <div key={product.id} className="home__deals-item">
                  <ProductCard key={`${customerType}-${product.id}`} product={product} />
                </div>
              ))}
            </ScrollRow>
          </section>

          {/* Rice & Atta */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title">Rice & Atta</h2>
              <Link to="/categories?cat=rice" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__deals-scroll">
              {[...rice, ...atta].map(product => (
                <div key={product.id} className="home__deals-item">
                  <ProductCard key={`${customerType}-${product.id}`} product={product} />
                </div>
              ))}
            </ScrollRow>
          </section>

          {/* Oils & Masala */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title">Oils & Masala</h2>
              <Link to="/categories?cat=oils" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__deals-scroll">
              {[...oils, ...masala].map(product => (
                <div key={product.id} className="home__deals-item">
                  <ProductCard key={`${customerType}-${product.id}`} product={product} />
                </div>
              ))}
            </ScrollRow>
          </section>
        </div>

        {/* Footer — 3 column horizontal */}
        <footer className="home__footer">
          <div className="home__footer-grid">
            {/* Left: Brand */}
            <div className="home__footer-brand">
              <span className="home__footer-logo"><FiShoppingBag /></span>
              <h3 className="home__footer-name">Siri Traders</h3>
              <p className="home__footer-tagline">Fast & Reliable Grocery Delivery</p>
            </div>

            {/* Center: Links */}
            <div className="home__footer-links-col">
              <h4 className="home__footer-col-title">Quick Links</h4>
              <div className="home__footer-links">
                <a href="#">About Us</a>
                <a href="#">Contact</a>
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
              </div>
            </div>

            {/* Right: Social */}
            <div className="home__footer-social-col">
              <h4 className="home__footer-col-title">Follow Us</h4>
              <div className="home__footer-social">
                <a href="#" className="home__footer-social-link"><FiInstagram /></a>
                <a href="#" className="home__footer-social-link"><FiTwitter /></a>
                <a href="#" className="home__footer-social-link"><FiFacebook /></a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="home__footer-divider" />
          <p className="home__footer-copy">&copy; 2025 Siri Traders. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;

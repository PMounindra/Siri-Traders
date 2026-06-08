import { useRef } from 'react';
import {
  FiArrowRight,
  FiChevronRight,
  FiFacebook,
  FiInstagram,
  FiPackage,
  FiPercent,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiTruck,
  FiTwitter
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import CategoryCard from '../components/CategoryCard';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { categories } from '../data/categories';
import { getDailyOffers, getFestivalOffers } from '../data/offers';
import { baseProducts } from '../data/products';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
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
  const welcomeText = 'WELCOME';
  // Subtle rotation + vertical lift for gentle bend
  const letterStyles = [
    { angle: -6, lift: -2 },   // W
    { angle: -4, lift: -5 },   // E
    { angle: -2, lift: -7 },   // L
    { angle: 0,  lift: -8 },   // C
    { angle: 2,  lift: -7 },   // O
    { angle: 4,  lift: -5 },   // M
    { angle: 6,  lift: -2 },   // E
  ];

  return (
    <section className={`home-hero ${isWholesale ? 'home-hero--wholesale' : ''}`}>
      <div className="home-hero__intro">
        <div className="home-hero__semicircle">
          <div className="home-hero__arc">
            {welcomeText.split('').map((letter, index) => (
              <span
                key={letter + index}
                className="home-hero__arc-letter"
                style={{
                  '--letter-angle': `${letterStyles[index].angle}deg`,
                  '--letter-lift': `${letterStyles[index].lift}px`,
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        </div>
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
  const { addToCart, removeFromCart, updateQuantity, getItemQuantity } = useCart();
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
  const festivalSpotlights = getFestivalOffers().slice(0, 14);
  const getOfferCartId = (offer) => `offer-${offer.id || offer.title}`;
  const handleOfferAdd = (event, offer) => {
    event.preventDefault();
    event.stopPropagation();
    const price = offer.price || 0;
    addToCart({
      id: getOfferCartId(offer),
      productId: getOfferCartId(offer),
      name: offer.title,
      brand: offer.badge || 'Siri Traders Offer',
      price,
      mrp: offer.mrp || price,
      discount: offer.mrp && price ? Math.round(((offer.mrp - price) / offer.mrp) * 100) : 0,
      image: offer.image,
      weight: offer.subtitle || 'Combo offer',
      unit: '',
      selectedVariant: offer.subtitle || 'Combo offer',
      category: 'offers',
      deliveryTime: customerType === 'wholesale' ? 'Same day' : '10 mins'
    });
  };
  const handleOfferIncrease = (event, offer) => {
    event.preventDefault();
    event.stopPropagation();
    const id = getOfferCartId(offer);
    updateQuantity(id, getItemQuantity(id) + 1);
  };
  const handleOfferDecrease = (event, offer) => {
    event.preventDefault();
    event.stopPropagation();
    const id = getOfferCartId(offer);
    const quantity = getItemQuantity(id);
    if (quantity <= 1) removeFromCart(id);
    else updateQuantity(id, quantity - 1);
  };
  const renderOfferAction = (item) => {
    const quantity = getItemQuantity(getOfferCartId(item));
    if (quantity === 0) {
      return <button type="button" onClick={(event) => handleOfferAdd(event, item)}>Add</button>;
    }
    return (
      <div className="home-hero__offer-stepper" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={(event) => handleOfferDecrease(event, item)} aria-label="Remove one">-</button>
        <span>{quantity}</span>
        <button type="button" onClick={(event) => handleOfferIncrease(event, item)} aria-label="Add one">+</button>
      </div>
    );
  };

  return (
    <section className="home-offers" aria-label="Daily and festive offers">
      {/* Daily Offers panel */}
      <div className="home-hero__panel" id="section-daily-offers">
        <div className="home-hero__panel-head">
          <div>
            <span>Curated savings</span>
            <Link to="/todays-deals">
              <h2 className="home__section-title-link">Daily Offers</h2>
            </Link>
          </div>
          <Link to="/todays-deals" className="section-link">View all <FiArrowRight /></Link>
        </div>
        <ScrollRow className="home-hero__offers-scroll">
          {dailySpotlights.map(offer => (
            <Link to={offer.link} className="home-hero__offer-card" key={offer.id}>
              <img src={toWebpImage(offer.image)} alt={offer.title} />
              <div className="home-hero__offer-card-body">
                <span className="home-hero__offer-badge">{offer.badge}</span>
                <h3>{offer.title}</h3>
                <div className="home-hero__offer-bottom">
                  <strong>{formatPrice(offer.price)}</strong>
                  {renderOfferAction(offer)}
                </div>
              </div>
            </Link>
          ))}
        </ScrollRow>
      </div>

      {/* Festive Offers panel — now matching daily offers style */}
      <div className="home-hero__panel home-hero__panel--festival" id="section-festive-offers">
        <div className="home-hero__panel-head">
          <div>
            <span>Seasonal savings</span>
            <Link to="/festive-offers">
              <h2 className="home__section-title-link">Festive Offers</h2>
            </Link>
          </div>
          <Link to="/festive-offers" className="section-link">View all <FiArrowRight /></Link>
        </div>
        <p className="home-hero__festival-desc">{activeFestival.text}</p>
        <ScrollRow className="home-hero__offers-scroll">
          {(festivalSpotlights.length > 0 ? festivalSpotlights : activeFestival.tiles).map((item, i) => (
            <Link to={item.link} className="home-hero__offer-card home-hero__offer-card--festive" key={item.id || item.title + i}>
              <img src={toWebpImage(item.image)} alt={item.title} />
              <div className="home-hero__offer-card-body">
                <span className="home-hero__offer-badge home-hero__offer-badge--festive">{item.badge || activeFestival.label}</span>
                <h3>{item.title}</h3>
                <div className="home-hero__offer-bottom">
                  {item.price ? <strong>{formatPrice(item.price)}</strong> : <strong>Deal</strong>}
                  {renderOfferAction(item)}
                </div>
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
  const { getProductsForType, loading } = useProducts();
  const isWholesale = customerType === 'wholesale';
  const stapleIds = ['pulses', 'rice', 'atta', 'oils', 'masala', 'ravva-poha', 'millets', 'grocery-essentials', 'nuts-dry-fruits'];
  const staplePriority = ['pulses', 'rice', 'oils', 'atta', 'masala'];
  const catalog = getProductsForType(customerType);
  const byCategory = category => catalog.filter(product => product.category === category);
  const categoryRank = (category) => {
    if (category === 'fruits' || category === 'vegetables') return 99;
    const rank = staplePriority.indexOf(category);
    return rank === -1 ? 50 : rank;
  };
  const deals = catalog
    .filter(product => product.discount >= 10)
    .sort((a, b) => categoryRank(a.category) - categoryRank(b.category));
  const bestsellers = catalog
    .filter(product => product.isBestseller)
    .sort((a, b) => categoryRank(a.category) - categoryRank(b.category));
  const pulses = byCategory('pulses');
  const oils = byCategory('oils');
  const atta = byCategory('atta');
  const rice = byCategory('rice');
  const masala = byCategory('masala');
  const fruits = byCategory('fruits');
  const vegetables = byCategory('vegetables');
  const dairy = byCategory('dairy-breakfast');
  const ravvaPoha = byCategory('ravva-poha');
  const millets = byCategory('millets');
  const nuts = byCategory('nuts-dry-fruits');
  const grocery = byCategory('grocery-essentials');
  const snacks = byCategory('snacks-munchies');
  const categoryOrder = ['pulses', 'rice', 'atta', 'oils', 'masala', 'ravva-poha', 'millets', 'nuts-dry-fruits', 'grocery-essentials', 'snacks-munchies'];
  const homeCategories = [...categories].sort((a, b) => {
    if (['fruits', 'vegetables', 'dairy-breakfast', 'beverages', 'bakery-biscuits', 'personal-care', 'cleaning-household', 'instant-frozen'].includes(a.id)) return 1;
    if (['fruits', 'vegetables', 'dairy-breakfast', 'beverages', 'bakery-biscuits', 'personal-care', 'cleaning-household', 'instant-frozen'].includes(b.id)) return -1;
    const aRank = categoryOrder.indexOf(a.id);
    const bRank = categoryOrder.indexOf(b.id);
    return (aRank === -1 ? 50 : aRank) - (bRank === -1 ? 50 : bRank);
  });

  return (
    <div className="page-wrapper">
      <div className={`home ${isWholesale ? 'home--wholesale' : ''}`}>
        <div className="container">
          <div className={`home__mode-banner ${isWholesale ? 'home__mode-banner--wholesale' : ''}`}>
            {isWholesale ? (
              <>
              <FiPackage />
              <span>Wholesale Mode</span>
              <span className="home__wholesale-banner-sep">|</span>
              <span>Bulk Prices</span>
              <span className="home__wholesale-banner-sep">|</span>
              <span>Business Savings</span>
              </>
            ) : (
              <>
                <FiShoppingBag />
                <span>Retail Mode</span>
                <span className="home__wholesale-banner-sep">|</span>
                <span>Daily Home Needs</span>
                <span className="home__wholesale-banner-sep">|</span>
                <span>Fast Delivery</span>
              </>
            )}
          </div>

          <WelcomeBanner customerType={customerType} />
          <OffersSection customerType={customerType} />

          {/* Shop by Category */}
          <section className="home__section home__section--categories">
            <div className="section-header">
              <Link to="/categories">
                <h2 className="section-title home__section-title-link">Shop by Category</h2>
              </Link>
              <Link to="/categories" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__category-scroll">
              {homeCategories.map(cat => (
                <CategoryCard key={cat.id} category={cat} size="large" />
              ))}
            </ScrollRow>
          </section>

          {/* Today's Deals */}
          <section className="home__section" id="section-todays-deals">
            <div className="section-header">
              <Link to="/todays-deals">
                <h2 className="section-title home__section-title-link"><FiTag /> Today's Deals</h2>
              </Link>
              <Link to="/todays-deals" className="section-link">
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
          <section className="home__section" id="section-bestsellers">
            <div className="section-header">
              <Link to="/bestsellers">
                <h2 className="section-title home__section-title-link"><FiStar /> Bestsellers</h2>
              </Link>
              <Link to="/bestsellers" className="section-link">
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

          {/* Pulses */}
          <section className="home__section" id="section-pulses">
            <div className="section-header">
              <Link to="/categories?cat=pulses">
                <h2 className="section-title home__section-title-link">Pulses</h2>
              </Link>
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
          <section className="home__section" id="section-rice-atta">
            <div className="section-header">
              <Link to="/categories?cat=rice">
                <h2 className="section-title home__section-title-link">Rice & Atta</h2>
              </Link>
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
          <section className="home__section" id="section-oils-masala">
            <div className="section-header">
              <Link to="/categories?cat=oils">
                <h2 className="section-title home__section-title-link">Oils & Masala</h2>
              </Link>
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

          {/* Ravva & Poha */}
          {ravvaPoha.length > 0 && (
            <section className="home__section" id="section-ravva-poha">
              <div className="section-header">
                <Link to="/categories?cat=ravva-poha">
                  <h2 className="section-title home__section-title-link">Ravva & Poha</h2>
                </Link>
                <Link to="/categories?cat=ravva-poha" className="section-link">
                  See All <FiChevronRight />
                </Link>
              </div>
              <ScrollRow className="home__deals-scroll">
                {ravvaPoha.map(product => (
                  <div key={product.id} className="home__deals-item">
                    <ProductCard key={`${customerType}-${product.id}`} product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          )}

          {/* Nuts & Dry Fruits */}
          {nuts.length > 0 && (
            <section className="home__section" id="section-nuts">
              <div className="section-header">
                <Link to="/categories?cat=nuts-dry-fruits">
                  <h2 className="section-title home__section-title-link">Nuts & Dry Fruits</h2>
                </Link>
                <Link to="/categories?cat=nuts-dry-fruits" className="section-link">
                  See All <FiChevronRight />
                </Link>
              </div>
              <ScrollRow className="home__deals-scroll">
                {nuts.map(product => (
                  <div key={product.id} className="home__deals-item">
                    <ProductCard key={`${customerType}-${product.id}`} product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          )}

          {/* Millets & Grains */}
          {millets.length > 0 && (
            <section className="home__section" id="section-millets">
              <div className="section-header">
                <Link to="/categories?cat=millets">
                  <h2 className="section-title home__section-title-link">Millets & Grains</h2>
                </Link>
                <Link to="/categories?cat=millets" className="section-link">
                  See All <FiChevronRight />
                </Link>
              </div>
              <ScrollRow className="home__deals-scroll">
                {millets.map(product => (
                  <div key={product.id} className="home__deals-item">
                    <ProductCard key={`${customerType}-${product.id}`} product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          )}

          {/* Grocery Essentials */}
          {grocery.length > 0 && (
            <section className="home__section" id="section-grocery">
              <div className="section-header">
                <Link to="/categories?cat=grocery-essentials">
                  <h2 className="section-title home__section-title-link">Grocery Essentials</h2>
                </Link>
                <Link to="/categories?cat=grocery-essentials" className="section-link">
                  See All <FiChevronRight />
                </Link>
              </div>
              <ScrollRow className="home__deals-scroll">
                {grocery.map(product => (
                  <div key={product.id} className="home__deals-item">
                    <ProductCard key={`${customerType}-${product.id}`} product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          )}

          {/* Fruits */}
          {fruits.length > 0 && (
            <section className="home__section" id="section-fruits">
              <div className="section-header">
                <Link to="/categories?cat=fruits">
                  <h2 className="section-title home__section-title-link">Fruits</h2>
                </Link>
                <Link to="/categories?cat=fruits" className="section-link">
                  See All <FiChevronRight />
                </Link>
              </div>
              <ScrollRow className="home__deals-scroll">
                {fruits.map(product => (
                  <div key={product.id} className="home__deals-item">
                    <ProductCard key={`${customerType}-${product.id}`} product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          )}

          {/* Vegetables */}
          {vegetables.length > 0 && (
            <section className="home__section" id="section-vegetables">
              <div className="section-header">
                <Link to="/categories?cat=vegetables">
                  <h2 className="section-title home__section-title-link">Vegetables</h2>
                </Link>
                <Link to="/categories?cat=vegetables" className="section-link">
                  See All <FiChevronRight />
                </Link>
              </div>
              <ScrollRow className="home__deals-scroll">
                {vegetables.map(product => (
                  <div key={product.id} className="home__deals-item">
                    <ProductCard key={`${customerType}-${product.id}`} product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          )}

          {/* Dairy & Breakfast */}
          {dairy.length > 0 && (
            <section className="home__section" id="section-dairy-breakfast">
              <div className="section-header">
                <Link to="/categories?cat=dairy-breakfast">
                  <h2 className="section-title home__section-title-link">Dairy & Breakfast</h2>
                </Link>
                <Link to="/categories?cat=dairy-breakfast" className="section-link">
                  See All <FiChevronRight />
                </Link>
              </div>
              <ScrollRow className="home__deals-scroll">
                {dairy.map(product => (
                  <div key={product.id} className="home__deals-item">
                    <ProductCard key={`${customerType}-${product.id}`} product={product} />
                  </div>
                ))}
              </ScrollRow>
            </section>
          )}
        </div>

        {/* Footer — 3 column horizontal */}
        <footer className="home__footer">
          <div className="home__footer-grid">
            {/* Left: Brand */}
            <div className="home__footer-brand">
              <span className="home__footer-logo">
                <img src="/logo-mark.webp" alt="Siri Traders" />
              </span>
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
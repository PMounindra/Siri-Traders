import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiChevronLeft,
  FiChevronRight,
  FiArrowRight,
  FiFacebook,
  FiHeart,
  FiInstagram,
  FiShoppingBag,
  FiStar,
  FiTag,
  FiTwitter,
} from "react-icons/fi";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import { categories } from "../data/categories";
import {
  getBestsellers,
  getDeals,
  getProductsByCategory,
} from "../data/products";
import { getDailyOffers, getFestivalOffers } from "../data/offers";
import { formatPrice } from "../utils/format";
import { toWebpImage } from "../utils/images";
import { useCart } from "../context/CartContext";
import Features from "./Home/Features";
import "./Home.css";

const ScrollRow = ({ children, className }) => {
  const rowRef = useRef(null);

  const scrollByPage = (direction) => {
    rowRef.current?.scrollBy({
      left: direction * Math.round(rowRef.current.clientWidth * 0.8),
      behavior: "smooth",
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

const festiveOffers = [
  {
    label: "Festive Offers",
    title: "Eid Mubarak",
    text: "Celebrate with sweets, snacks, cooking essentials and festive-ready deals.",
    cta: "Shop Now",
    link: "/categories",
    theme: "eid",
    tiles: [
      {
        title: "Eid Specials",
        image:
          "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=500&q=80",
        link: "/categories?cat=snacks-munchies",
      },
      {
        title: "Cook & Feast",
        image:
          "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=500&q=80",
        link: "/categories?cat=masala-oils",
      },
      {
        title: "Prayer & Gifting",
        image:
          "https://images.unsplash.com/photo-1512909006721-3d6018887383?w=500&q=80",
        link: "/categories?cat=personal-care",
      },
      {
        title: "Sweets & Desserts",
        image:
          "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80",
        link: "/categories?cat=bakery-biscuits",
      },
      {
        title: "Get Eid Ready",
        image:
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&q=80",
        link: "/categories?cat=personal-care",
      },
      {
        title: "Meat Marinades & Spices",
        image:
          "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&q=80",
        link: "/categories?cat=masala-oils",
      },
    ],
  },
  {
    label: "Festival Deals",
    title: "Diwali Dhamaka",
    text: "Light up your home with sweets, dry fruits, pooja picks and party essentials.",
    cta: "Explore Deals",
    link: "/categories?cat=bakery-biscuits",
    theme: "diwali",
    tiles: [
      {
        title: "Mithai Boxes",
        image:
          "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80",
        link: "/categories?cat=bakery-biscuits",
      },
      {
        title: "Dry Fruits",
        image:
          "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=500&q=80",
        link: "/categories?cat=snacks-munchies",
      },
      {
        title: "Home Sparkle",
        image:
          "https://images.unsplash.com/photo-1605143185677-4e4aebc3a36e?w=500&q=80",
        link: "/categories?cat=cleaning-household",
      },
      {
        title: "Party Snacks",
        image:
          "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&q=80",
        link: "/categories?cat=snacks-munchies",
      },
      {
        title: "Pooja Ready",
        image:
          "https://images.unsplash.com/photo-1607877361964-d9b0d773066d?w=500&q=80",
        link: "/categories?cat=personal-care",
      },
      {
        title: "Family Feast",
        image:
          "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=500&q=80",
        link: "/categories?cat=masala-oils",
      },
    ],
  },
  {
    label: "Fresh Fest",
    title: "Holi Specials",
    text: "Stock up on colors, refreshing drinks, crunchy snacks and cheerful treats.",
    cta: "Shop Holi",
    link: "/categories?cat=beverages",
    theme: "holi",
    tiles: [
      {
        title: "Cool Drinks",
        image:
          "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&q=80",
        link: "/categories?cat=beverages",
      },
      {
        title: "Namkeen Packs",
        image:
          "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=500&q=80",
        link: "/categories?cat=snacks-munchies",
      },
      {
        title: "Sweet Bites",
        image:
          "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&q=80",
        link: "/categories?cat=bakery-biscuits",
      },
      {
        title: "Skin Care",
        image:
          "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&q=80",
        link: "/categories?cat=personal-care",
      },
      {
        title: "Fresh Fruits",
        image:
          "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80",
        link: "/categories?cat=fruits-vegetables",
      },
      {
        title: "Quick Meals",
        image:
          "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&q=80",
        link: "/categories?cat=instant-frozen",
      },
    ],
  },
  {
    label: "Holiday Offers",
    title: "Christmas Treats",
    text: "Bring home cakes, chocolates, baking must-haves and cozy celebration picks.",
    cta: "Shop Treats",
    link: "/categories?cat=bakery-biscuits",
    theme: "christmas",
    tiles: [
      {
        title: "Cakes & Cookies",
        image:
          "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500&q=80",
        link: "/categories?cat=bakery-biscuits",
      },
      {
        title: "Chocolates",
        image:
          "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&q=80",
        link: "/categories?cat=snacks-munchies",
      },
      {
        title: "Baking Needs",
        image:
          "https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=500&q=80",
        link: "/categories?cat=rice-atta",
      },
      {
        title: "Coffee & Cocoa",
        image:
          "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80",
        link: "/categories?cat=beverages",
      },
      {
        title: "Gift Hampers",
        image:
          "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=500&q=80",
        link: "/categories?cat=personal-care",
      },
      {
        title: "Dinner Prep",
        image:
          "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=500&q=80",
        link: "/categories?cat=masala-oils",
      },
    ],
  },
];

const EidBanner = () => {
  const bannerOffers = useMemo(() => {
    const adminFestivalOffers = getFestivalOffers()
      .filter((offer) => offer.source === "admin")
      .map((offer) => ({
        label: "Festive Offers",
        title: offer.title,
        text:
          offer.subtitle || "Fresh festive savings selected by Siri Traders.",
        cta: offer.badge || "Shop Now",
        link: offer.link || "/categories",
        theme: "diwali",
        tiles: [
          {
            title: offer.title,
            image: offer.image,
            link: offer.link || "/categories",
          },
          {
            title: offer.subtitle || "Festival Essentials",
            image: offer.image,
            link: offer.link || "/categories",
          },
        ],
      }));
    return [...adminFestivalOffers, ...festiveOffers];
  }, []);
  const [activeOffer, setActiveOffer] = useState(0);

  const moveOffer = useCallback(
    (direction) => {
      setActiveOffer(
        (current) =>
          (current + direction + bannerOffers.length) % bannerOffers.length,
      );
    },
    [bannerOffers.length],
  );

  useEffect(() => {
    const timer = window.setInterval(() => moveOffer(1), 4500);
    return () => window.clearInterval(timer);
  }, [moveOffer]);

  return (
    <section className="home__section home__section--essentials">
      <div className="home-essentials-carousel">
        <button
          type="button"
          className="home-essentials__nav home-essentials__nav--left"
          onClick={() => moveOffer(-1)}
          aria-label="Previous festive offer"
        >
          <FiChevronLeft />
        </button>
        <div
          className="home-essentials-carousel__track"
          style={{ transform: `translateX(-${activeOffer * 100}%)` }}
        >
          {bannerOffers.map((offer) => (
            <div
              key={offer.title}
              className={`home-essentials home-essentials--${offer.theme}`}
            >
              <div className="home-essentials__content">
                <span className="home-essentials__eyebrow">{offer.label}</span>
                <h1>{offer.title}</h1>
                <p>{offer.text}</p>
                <Link to={offer.link} className="home-essentials__cta">
                  {offer.cta} <FiArrowRight />
                </Link>
              </div>
              <div className="home-essentials__tiles">
                {offer.tiles.map((tile) => (
                  <Link
                    key={tile.title}
                    to={tile.link}
                    className="home-essentials__tile"
                  >
                    <img src={toWebpImage(tile.image)} alt={tile.title} />
                    <span>{tile.title}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="home-essentials__nav home-essentials__nav--right"
          onClick={() => moveOffer(1)}
          aria-label="Next festive offer"
        >
          <FiChevronRight />
        </button>
        <div className="home-essentials__dots" aria-hidden="true">
          {bannerOffers.map((offer, index) => (
            <span
              key={offer.title}
              className={
                index === activeOffer
                  ? "home-essentials__dot home-essentials__dot--active"
                  : "home-essentials__dot"
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const OfferCard = ({ offer }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const { addToCart, updateQuantity, removeFromCart, getItemQuantity } =
    useCart();
  const quantity = getItemQuantity(offer.id);
  const initials = offer.title
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  const handleAdd = (e) => {
    e.preventDefault();
    addToCart({
      id: offer.id,
      name: offer.title,
      price: offer.price,
      mrp: offer.mrp,
      discount: Math.max(
        0,
        Math.round(((offer.mrp - offer.price) / offer.mrp) * 100),
      ),
      image: offer.image,
      weight: "1",
      unit: "combo",
      deliveryTime: "10 mins",
    });
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    if (quantity <= 1) {
      removeFromCart(offer.id);
    } else {
      updateQuantity(offer.id, quantity - 1);
    }
  };

  const handleIncrease = (e) => {
    e.preventDefault();
    updateQuantity(offer.id, quantity + 1);
  };

  return (
    <Link to={offer.link} className="home-offer-card">
      {!imageFailed ? (
        <img
          src={toWebpImage(offer.image)}
          alt={offer.title}
          className="home-offer-card__image"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="home-offer-card__image home-offer-card__image-fallback">
          {initials}
        </div>
      )}
      <div className="home-offer-card__body">
        <span className="home-offer-card__badge">{offer.badge}</span>
        <h3>{offer.title}</h3>
        <p>{offer.subtitle}</p>
        <div className="home-offer-card__price-row">
          <span className="home-offer-card__price">
            {formatPrice(offer.price)}
          </span>
          <span className="home-offer-card__mrp">{formatPrice(offer.mrp)}</span>
        </div>
        {quantity === 0 ? (
          <button
            type="button"
            className="home-offer-card__add"
            onClick={handleAdd}
          >
            ADD
          </button>
        ) : (
          <div
            className="home-offer-card__stepper"
            onClick={(e) => e.preventDefault()}
          >
            <button type="button" onClick={handleDecrease}>
              -
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={handleIncrease}>
              +
            </button>
          </div>
        )}
      </div>
    </Link>
  );
};

const Home = () => {
  const deals = getDeals();
  const bestsellers = getBestsellers();
  const fruits = getProductsByCategory("fruits-vegetables");
  const dairy = getProductsByCategory("dairy-breakfast");
  const dailyOffers = getDailyOffers();

  return (
    <div className="page-wrapper">
      <div className="home">
        <div className="container">
          <EidBanner />
          <Features />

          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title">
                <FiTag /> Daily Offers
              </h2>
              <Link to="/categories" className="section-link">
                Shop All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home-offer-grid home-offer-grid--slider">
              {dailyOffers.map((offer) => (
                <div key={offer.id} className="home-offer-slide">
                  <OfferCard offer={offer} />
                </div>
              ))}
            </ScrollRow>
          </section>

          {/* Shop by Category */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title">Shop by Category</h2>
              <Link to="/categories" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <div className="home__category-grid">
              {categories.slice(0, 6).map((cat) => (
                <CategoryCard key={cat.id} category={cat} size="large" />
              ))}
            </div>
          </section>

          {/* Today's Deals */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title">
                <FiTag /> Today's Deals
              </h2>
              <Link to="/categories" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__deals-scroll">
              {deals.map((product) => (
                <div key={product.id} className="home__deals-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </ScrollRow>
          </section>

          {/* Bestsellers */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title">
                <FiStar /> Bestsellers
              </h2>
              <Link to="/categories" className="section-link">
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__deals-scroll">
              {bestsellers.map((product) => (
                <div key={product.id} className="home__deals-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </ScrollRow>
          </section>

          {/* Fruits & Vegetables */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title">Fruits & Vegetables</h2>
              <Link
                to="/categories?cat=fruits-vegetables"
                className="section-link"
              >
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__deals-scroll">
              {fruits.slice(0, 4).map((product) => (
                <div key={product.id} className="home__deals-item">
                  <ProductCard product={product} />
                </div>
              ))}
            </ScrollRow>
          </section>

          {/* Dairy & Breakfast */}
          <section className="home__section">
            <div className="section-header">
              <h2 className="section-title">Dairy & Breakfast</h2>
              <Link
                to="/categories?cat=dairy-breakfast"
                className="section-link"
              >
                See All <FiChevronRight />
              </Link>
            </div>
            <ScrollRow className="home__deals-scroll">
              {dairy.slice(0, 4).map((product) => (
                <div key={product.id} className="home__deals-item">
                  <ProductCard product={product} />
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
              <span className="home__footer-logo">
                <FiShoppingBag />
              </span>
              <h3 className="home__footer-name">Siri Traders</h3>
              <p className="home__footer-tagline">
                Fast & Reliable Grocery Delivery
              </p>
              <p className="home__footer-made">
                Made with <FiHeart className="home__footer-heart" /> in India
              </p>
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
                <a href="#" className="home__footer-social-link">
                  <FiInstagram />
                </a>
                <a href="#" className="home__footer-social-link">
                  <FiTwitter />
                </a>
                <a href="#" className="home__footer-social-link">
                  <FiFacebook />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="home__footer-divider" />
          <p className="home__footer-copy">
            &copy; 2025 Siri Traders. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Home;

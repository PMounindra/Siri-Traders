import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiGift,
  FiCheckCircle,
  FiShoppingBag,
  FiArrowLeft,
  FiMinus,
  FiPlus,
  FiTruck,
  FiShield,
  FiZap,
  FiChevronRight,
  FiPackage,
  FiExternalLink,
} from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteData } from '../context/SiteDataContext';
import { useProducts } from '../context/ProductContext';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import './FestiveOfferDetail.css';

const FestiveOfferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { customerType } = useAuth();
  const { addToCart, updateQuantity, removeFromCart, getItemQuantity } = useCart();
  const { festivalOffers, dailyOffers } = useSiteData();
  const { getProductsForType } = useProducts();
  const isWholesale = customerType === 'wholesale';

  const allProducts = getProductsForType(customerType);

  // Find offer by matching ID or slug title
  const offer = useMemo(() => {
    const allOffers = [...festivalOffers, ...dailyOffers];
    return (
      allOffers.find(
        (o) =>
          String(o.id) === String(id) ||
          (o.title && o.title.toLowerCase().replace(/\s+/g, '-') === String(id))
      ) || null
    );
  }, [festivalOffers, dailyOffers, id]);

  // Find linked target product if set by admin
  const linkedProduct = useMemo(() => {
    if (!offer || !offer.targetProductId) return null;
    return allProducts.find((p) => String(p.id) === String(offer.targetProductId)) || null;
  }, [offer, allProducts]);

  // Parse multi-product combo items
  const comboItems = useMemo(() => {
    if (!offer || !offer.comboItems) return [];
    try {
      const parsed = typeof offer.comboItems === 'string' ? JSON.parse(offer.comboItems) : offer.comboItems;
      if (!Array.isArray(parsed)) return [];
      // Enrich combo items with current catalog details if available
      return parsed.map((ci) => {
        const catProd = allProducts.find((p) => String(p.id) === String(ci.productId));
        return {
          ...ci,
          name: catProd?.name || ci.name || 'Catalog Item',
          image: catProd?.image || ci.image || '',
          price: catProd?.price || ci.price || 0,
          mrp: catProd?.mrp || ci.mrp || catProd?.price || ci.price || 0,
          weight: catProd ? `${catProd.weight}${catProd.unit}` : ci.weight || '',
        };
      });
    } catch {
      return [];
    }
  }, [offer, allProducts]);

  const [quantity, setQuantity] = useState(1);

  if (!offer) {
    return (
      <div className="page-wrapper">
        <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FiGift style={{ fontSize: '48px', color: '#6B7280', marginBottom: '16px' }} />
          <h2>Festive Offer Not Found</h2>
          <p style={{ color: '#6B7280', marginBottom: '24px' }}>
            This festive offer may have expired or is no longer available.
          </p>
          <button
            className="fodetail__btn-add"
            style={{ width: 'auto', padding: '0 24px', margin: '0 auto' }}
            onClick={() => navigate('/festive-offers')}
          >
            Browse All Festive Offers
          </button>
        </div>
      </div>
    );
  }

  // Price calculations
  const isCombo = comboItems.length > 0;
  const comboRegularSum = isCombo
    ? comboItems.reduce((sum, item) => sum + (item.mrp || item.price) * (item.quantity || 1), 0)
    : 0;

  const price = offer.price || (isCombo ? comboItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0) : (linkedProduct ? linkedProduct.price : 0));
  const mrp = offer.mrp || (isCombo ? comboRegularSum : (linkedProduct ? linkedProduct.mrp : price));
  const discount = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const savings = mrp > price ? mrp - price : 0;

  const itemsIncludedRaw =
    offer.itemsIncluded ||
    offer.items_included ||
    offer.subtitle ||
    (isCombo
      ? comboItems.map((i) => `${i.quantity || 1}x ${i.name}`).join(', ')
      : linkedProduct
      ? `${linkedProduct.weight} ${linkedProduct.unit}`
      : 'Special Festive Package');

  const includedItemsList = isCombo
    ? comboItems.map((i) => `${i.quantity || 1}x ${i.name} (${i.weight})`)
    : itemsIncludedRaw
        .split(/[,;\n]+/)
        .map((item) => item.trim())
        .filter(Boolean);

  const cartItemId = `offer-${offer.id || offer.title}`;
  const existingCartQty = getItemQuantity(cartItemId);

  const handleAddToCart = () => {
    const success = addToCart({
      id: cartItemId,
      productId: offer.targetProductId || null,
      name: offer.title,
      brand: offer.badge || (isCombo ? 'FESTIVE COMBO DEAL' : 'FESTIVE DEAL'),
      price,
      mrp,
      discount,
      image: offer.image || (isCombo ? comboItems[0]?.image : (linkedProduct ? linkedProduct.image : '')),
      weight: itemsIncludedRaw,
      itemsIncluded: itemsIncludedRaw,
      comboItems: isCombo ? comboItems : null,
      unit: '',
      isOffer: true,
      badge: offer.badge || (isCombo ? 'FESTIVE COMBO DEAL' : 'FESTIVE DEAL'),
      category: 'offers',
      deliveryTime: isWholesale ? 'Same day' : '10 mins',
    });

    if (success && quantity > 1) {
      updateQuantity(cartItemId, existingCartQty + quantity);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  // Related festive offers
  const relatedOffers = festivalOffers
    .filter((o) => String(o.id) !== String(offer.id))
    .slice(0, 4);

  return (
    <div className="page-wrapper">
      <div className="fodetail container">
        {/* Breadcrumb Navigation */}
        <div className="fodetail__breadcrumbs">
          <Link to="/home">Home</Link>
          <FiChevronRight />
          <Link to="/festive-offers">Festive Offers</Link>
          <FiChevronRight />
          <span>{offer.title}</span>
        </div>

        {/* WOW Hero Header Banner */}
        <div className="fodetail__hero-banner">
          <span className="fodetail__hero-badge">
            <FiGift /> {offer.badge || (isCombo ? '🎁 FESTIVE COMBO PACK' : 'FESTIVE SPECIAL DEAL')}
          </span>
          <h1 className="fodetail__hero-title">{offer.title}</h1>
          <p className="fodetail__hero-sub">
            {offer.subtitle ||
              (isCombo
                ? `Get all ${comboItems.length} products bundled together for a massive festive discount!`
                : 'Exclusive festive bundle with maximum savings & premium quality.')}
          </p>
        </div>

        {/* Main 2-Column Grid */}
        <div className="fodetail__main-grid">
          {/* Column 1: Image Gallery & Guarantees */}
          <div className="fodetail__gallery-col">
            <div className="fodetail__image-card">
              {discount > 0 && (
                <span className="fodetail__discount-tag">{discount}% OFF</span>
              )}
              <img
                src={toWebpImage(
                  offer.image || (isCombo ? comboItems[0]?.image : (linkedProduct ? linkedProduct.image : ''))
                )}
                alt={offer.title}
                className="fodetail__image"
              />
            </div>

            <div className="fodetail__guarantees">
              <div className="fodetail__guarantee-item">
                <FiTruck className="fodetail__guarantee-icon" />
                <div>
                  <strong>{isWholesale ? 'Same-Day' : '10 Mins'} Delivery</strong>
                  <span>Direct to your doorstep</span>
                </div>
              </div>
              <div className="fodetail__guarantee-item">
                <FiShield className="fodetail__guarantee-icon" />
                <div>
                  <strong>100% Authentic</strong>
                  <span>Fresh quality guaranteed</span>
                </div>
              </div>
              <div className="fodetail__guarantee-item">
                <FiZap className="fodetail__guarantee-icon" />
                <div>
                  <strong>Best Price</strong>
                  <span>Festive savings unlocked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Details & Pricing & Actions */}
          <div className="fodetail__info-col">
            {/* Price Card */}
            <div className="fodetail__price-card">
              <div className="fodetail__price-row">
                <span className="fodetail__price">{formatPrice(price)}</span>
                {mrp > price && (
                  <span className="fodetail__mrp">{formatPrice(mrp)}</span>
                )}
                {savings > 0 && (
                  <span className="fodetail__savings-badge">
                    Save {formatPrice(savings)}
                  </span>
                )}
              </div>
              <span className="fodetail__tax-note">Inclusive of all taxes</span>
            </div>

            {/* Multi-Product Combo Pack Grid Section (NEW!) */}
            {isCombo ? (
              <div className="fodetail__combo-box">
                <div className="fodetail__combo-header">
                  <FiPackage />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', color: '#166534', fontWeight: 800 }}>
                      🎁 Festive Combo Pack ({comboItems.length} Items Included)
                    </h3>
                    <span style={{ fontSize: '12px', color: '#15803D' }}>
                      Get all these catalog products together at a discounted combo price!
                    </span>
                  </div>
                </div>

                <div className="fodetail__combo-grid">
                  {comboItems.map((item, idx) => (
                    <div className="fodetail__combo-item-card" key={idx}>
                      <div className="fodetail__combo-item-left">
                        <img src={toWebpImage(item.image)} alt={item.name} />
                        <div>
                          <Link to={`/product/${item.productId}`} className="fodetail__combo-item-name">
                            {item.name} <FiExternalLink size={11} />
                          </Link>
                          <span className="fodetail__combo-item-weight">{item.weight}</span>
                        </div>
                      </div>

                      <div className="fodetail__combo-item-right">
                        <span className="fodetail__combo-item-qty">{item.quantity || 1}x Included</span>
                        <div className="fodetail__combo-item-prices">
                          <strong>{formatPrice(item.price)}</strong>
                          {item.mrp > item.price && <span>{formatPrice(item.mrp)}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="fodetail__combo-summary">
                  <div>
                    <span>Individual Catalog Total: </span>
                    <strong style={{ textDecoration: 'line-through', color: '#6B7280' }}>
                      {formatPrice(mrp)}
                    </strong>
                  </div>
                  <div>
                    <span>Combo Special Deal: </span>
                    <strong style={{ color: '#1C4D12', fontSize: '16px' }}>{formatPrice(price)}</strong>
                  </div>
                  <div className="fodetail__combo-savings-pill">
                    🎉 Save {formatPrice(savings)} ({discount}% OFF)
                  </div>
                </div>
              </div>
            ) : (
              /* Package Contents Breakdown for Single / Standard Festive Offers */
              <div className="fodetail__included-box">
                <div className="fodetail__included-header">
                  <FiPackage /> What's Included in this Festive Offer
                </div>
                <div className="fodetail__included-content">
                  {includedItemsList.length > 1 ? (
                    <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {includedItemsList.map((item, idx) => (
                        <li key={idx} style={{ listStyleType: 'disc' }}>
                          <strong>{item}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="fodetail__included-text">
                      <FiCheckCircle style={{ color: '#166534', marginRight: '6px' }} />
                      {itemsIncludedRaw}
                    </p>
                  )}
                </div>

                {linkedProduct && (
                  <div className="fodetail__linked-product">
                    <img src={toWebpImage(linkedProduct.image)} alt={linkedProduct.name} />
                    <div>
                      <strong>Fulfilling Item: {linkedProduct.name}</strong>
                      <span>Category: {linkedProduct.category || 'Grocery'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Urgency & Stock Bar */}
            <div className="fodetail__urgency-card">
              <div className="fodetail__urgency-top">
                <span className="fodetail__urgency-fire">🔥 High Festive Demand</span>
                <span className="fodetail__urgency-stock">Limited Festive Stock Remaining</span>
              </div>
              <div className="fodetail__urgency-bar-track">
                <div className="fodetail__urgency-bar-fill" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Quantity & Action Buttons */}
            <div className="fodetail__actions">
              {existingCartQty > 0 ? (
                <div className="fodetail__stepper-row">
                  <div className="fodetail__stepper">
                    <button
                      type="button"
                      onClick={() =>
                        existingCartQty === 1
                          ? removeFromCart(cartItemId)
                          : updateQuantity(cartItemId, existingCartQty - 1)
                      }
                    >
                      <FiMinus />
                    </button>
                    <span>{existingCartQty}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(cartItemId, existingCartQty + 1)}
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="fodetail__btn-view-cart"
                    onClick={() => navigate('/cart')}
                  >
                    <FiShoppingBag /> View Cart ({existingCartQty} in Cart)
                  </button>
                </div>
              ) : (
                <div className="fodetail__btn-row">
                  <button
                    type="button"
                    className="fodetail__btn-add"
                    onClick={handleAddToCart}
                  >
                    <FiShoppingBag /> Add to Cart
                  </button>
                  <button
                    type="button"
                    className="fodetail__btn-buy"
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Festive Offers */}
        {relatedOffers.length > 0 && (
          <div className="fodetail__related">
            <h3 className="fodetail__related-title">
              <FiGift /> More Festive Offers
            </h3>
            <div className="fodetail__related-grid">
              {relatedOffers.map((item) => (
                <Link
                  to={`/festive-offer/${item.id}`}
                  className="fodetail__related-card"
                  key={item.id}
                >
                  <img src={toWebpImage(item.image)} alt={item.title} />
                  <div className="fodetail__related-info">
                    <h4>{item.title}</h4>
                    <p>{item.subtitle || item.badge}</p>
                    <strong>{formatPrice(item.price)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FestiveOfferDetail;

import { Link } from 'react-router-dom';
import { FiChevronRight, FiPackage, FiGift } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getFestivalOffers } from '../data/offers';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import './FestiveOffers.css';

const FestiveOffers = () => {
  const { customerType } = useAuth();
  const { addToCart, removeFromCart, updateQuantity, getItemQuantity } = useCart();
  const isWholesale = customerType === 'wholesale';
  const offers = getFestivalOffers();

  const getCartId = (offer) => `offer-${offer.id || offer.title}`;

  const handleAdd = (e, offer) => {
    e.preventDefault();
    e.stopPropagation();
    const price = offer.price || 0;
    addToCart({
      id: getCartId(offer),
      productId: getCartId(offer),
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
      deliveryTime: isWholesale ? 'Same day' : '10 mins',
    });
  };

  const handleIncrease = (e, offer) => {
    e.preventDefault();
    e.stopPropagation();
    const id = getCartId(offer);
    updateQuantity(id, getItemQuantity(id) + 1);
  };

  const handleDecrease = (e, offer) => {
    e.preventDefault();
    e.stopPropagation();
    const id = getCartId(offer);
    const qty = getItemQuantity(id);
    if (qty <= 1) removeFromCart(id);
    else updateQuantity(id, qty - 1);
  };

  const renderAction = (offer) => {
    const qty = getItemQuantity(getCartId(offer));
    if (qty === 0) {
      return (
        <button
          type="button"
          className="fopage__card-add"
          onClick={(e) => handleAdd(e, offer)}
        >
          Add
        </button>
      );
    }
    return (
      <div className="fopage__card-stepper" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={(e) => handleDecrease(e, offer)}>-</button>
        <span>{qty}</span>
        <button type="button" onClick={(e) => handleIncrease(e, offer)}>+</button>
      </div>
    );
  };

  return (
    <div className="page-wrapper">
      <div className="fopage">
        <div className={`fopage__mode-banner ${isWholesale ? 'fopage__mode-banner--wholesale' : ''}`}>
          {isWholesale
            ? <><FiPackage /><span>Wholesale Mode — bulk prices</span></>
            : <><span className="fopage__mode-dot" /><span>Seasonal savings handpicked for you</span></>
          }
        </div>

        <div className="fopage__heading-row">
          <h1 className="fopage__heading">
            <FiGift className="fopage__heading-icon" />
            Festive Offers
            <span className="fopage__count">{offers.length} deals</span>
          </h1>
          <Link to="/categories" className="fopage__back-link">
            All Categories <FiChevronRight />
          </Link>
        </div>

        <div className="fopage__grid">
          {offers.map((offer, i) => (
            <Link
              to={offer.link}
              className="fopage__card"
              key={offer.id || offer.title + i}
            >
              <div className="fopage__card-img-wrap">
                <img src={toWebpImage(offer.image)} alt={offer.title} />
                <span className="fopage__card-badge">{offer.badge}</span>
              </div>
              <div className="fopage__card-body">
                <h3 className="fopage__card-title">{offer.title}</h3>
                <p className="fopage__card-sub">{offer.subtitle}</p>
                <div className="fopage__card-bottom">
                  <div className="fopage__card-price">
                    {offer.price ? (
                      <>
                        <strong>{formatPrice(offer.price)}</strong>
                        {offer.mrp && offer.mrp > offer.price && (
                          <span className="fopage__card-mrp">{formatPrice(offer.mrp)}</span>
                        )}
                        {offer.mrp && offer.mrp > offer.price && (
                          <span className="fopage__card-disc">
                            {Math.round(((offer.mrp - offer.price) / offer.mrp) * 100)}% off
                          </span>
                        )}
                      </>
                    ) : (
                      <strong>Special Deal</strong>
                    )}
                  </div>
                  {renderAction(offer)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FestiveOffers;

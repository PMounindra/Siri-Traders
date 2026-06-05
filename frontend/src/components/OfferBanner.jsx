import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { offers } from '../data/offers';
import { toWebpImage } from '../utils/images';
import './OfferBanner.css';

const OfferBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const touchStartX = useRef(0);
  const navigate = useNavigate();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isAutoPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % offers.length);
      }, 4000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isAutoPlaying]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 8000);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToSlide((currentSlide + 1) % offers.length);
      } else {
        goToSlide((currentSlide - 1 + offers.length) % offers.length);
      }
    }
  };

  return (
    <div className="offer-banner" id="offer-banner">
      <div
        className="offer-banner__track"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="offer-banner__slide"
            onClick={() => navigate(offer.link)}
          >
            {/* Full-bleed background image */}
            <div
              className="offer-banner__bg-image"
              style={{ backgroundImage: `url(${toWebpImage(offer.image)})` }}
            />
            {/* Gradient overlay for text readability */}
            <div className="offer-banner__gradient-overlay" />
            <div className="offer-banner__content">
              <div className="offer-banner__text">
                <span className="offer-banner__subtitle">{offer.subtitle}</span>
                <h2 className="offer-banner__title">{offer.title}</h2>
                <p className="offer-banner__description">{offer.description}</p>
                <button className="offer-banner__cta">
                  {offer.cta} →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="offer-banner__dots">
        {offers.map((_, index) => (
          <button
            key={index}
            className={`offer-banner__dot ${index === currentSlide ? 'offer-banner__dot--active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default OfferBanner;

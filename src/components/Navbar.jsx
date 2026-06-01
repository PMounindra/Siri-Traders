/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiCheck, FiChevronDown, FiHome, FiList, FiMapPin, FiMenu, FiNavigation, FiPackage, FiPlus, FiSearch, FiShoppingCart, FiX, FiUser } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { searchProducts } from '../data/products';
import { formatPrice } from '../utils/format';
import { getUserStorageKey } from '../utils/userStorage';
import { toWebpImage } from '../utils/images';
import './Navbar.css';

const Navbar = () => {
  const { cartCount } = useCart();
  const { location, setLocation, isAuthenticated, user, customerType, setCustomerType } = useAuth();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [failedImages, setFailedImages] = useState({});
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const addressStorageKey = getUserStorageKey(user, 'addresses');
  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      const saved = addressStorageKey ? localStorage.getItem(addressStorageKey) : null;
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const hasSavedSelectedAddress = savedAddresses.some(address => address.id === location.contact?.id);
  const deliveryAddressText = hasSavedSelectedAddress
    ? (location.full || location.address)
    : 'Your address';
  const [addressForm, setAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: '',
    pincode: ''
  });
  const [addressError, setAddressError] = useState('');
  const searchRef = useRef(null);
  const locationRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);

  const hiddenRoutes = ['/login', '/signup'];
  const isHidden = hiddenRoutes.includes(routeLocation.pathname);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('navbar-menu-open', showDesktopMenu || showLocationMenu);
    return () => document.body.classList.remove('navbar-menu-open');
  }, [showDesktopMenu, showLocationMenu]);

  useEffect(() => {
    if (!addressStorageKey) {
      setSavedAddresses([]);
      return;
    }

    try {
      const saved = localStorage.getItem(addressStorageKey);
      setSavedAddresses(saved ? JSON.parse(saved) : []);
    } catch {
      setSavedAddresses([]);
    }
  }, [addressStorageKey]);

  useEffect(() => {
    setAddressForm(prev => ({
      ...prev,
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || ''
    }));
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
        setSearchResults([]);
      }
      if (locationRef.current && !locationRef.current.contains(e.target)) {
        setShowLocationMenu(false);
        setAddressError('');
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowDesktopMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isHidden) return null;

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchProducts(query, customerType).slice(0, 8);
      setSearchResults(results);
      setShowSearch(true);
      setFailedImages({});
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const handleResultClick = (product) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    navigate(`/product/${product.id}`);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
    inputRef.current?.focus();
  };

  const selectAddress = (address) => {
    setLocation({
      address: address.address,
      city: address.pincode,
      full: `${address.address}, ${address.pincode}`,
      contact: address
    });
    setShowLocationMenu(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setAddressError('Current location is not available on this browser.');
      return;
    }

    setAddressError('Detecting your location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const suburb = data.address?.suburb || data.address?.neighbourhood || '';
          const city = data.address?.city || data.address?.town || data.address?.state_district || '';
          setLocation({
            address: suburb || city || 'Current Location',
            city,
            lat: latitude,
            lng: longitude,
            full: data.display_name || ''
          });
          setAddressError('');
          setShowLocationMenu(false);
        } catch {
          setAddressError('Could not detect exact address. Please add it manually.');
        }
      },
      () => setAddressError('Location permission was not allowed. Please add an address.'),
      { timeout: 6000 }
    );
  };

  const saveNewAddress = () => {
    const trimmed = Object.fromEntries(
      Object.entries(addressForm).map(([key, value]) => [key, value.trim()])
    );

    if (Object.values(trimmed).some(value => !value)) {
      setAddressError('Please fill all address details.');
      return;
    }

    if (!/^\d{6}$/.test(trimmed.pincode)) {
      setAddressError('Please enter a valid 6 digit pincode.');
      return;
    }

    const newAddress = { ...trimmed, id: Date.now().toString() };
    const nextAddresses = [newAddress, ...savedAddresses];
    setSavedAddresses(nextAddresses);
    if (addressStorageKey) {
      localStorage.setItem(addressStorageKey, JSON.stringify(nextAddresses));
    }
    selectAddress(newAddress);
    setAddressForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '', address: '', pincode: '' });
  };

  const goTo = (path) => {
    setShowDesktopMenu(false);
    navigate(path);
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__container">
        {/* Top row */}
        <div className="navbar__top">
          {/* Logo */}
          <Link to="/home" className="navbar__logo">
            <span className="navbar__logo-mark">
              <img src="/logo-mark.webp" alt="Siri Traders" className="navbar__logo-img" />
            </span>
            <div className="navbar__logo-text">
              <span className="navbar__brand">Siri Traders</span>
              <span className="navbar__tagline">Fast & Reliable</span>
            </div>
          </Link>

          {/* Location */}
          <div className="navbar__customer-type" aria-label="Customer type">
            {['retail', 'wholesale'].map(type => (
              <button
                key={type}
                type="button"
                className={customerType === type ? 'navbar__type-btn navbar__type-btn--active' : 'navbar__type-btn'}
                onClick={() => setCustomerType(type)}
              >
                {type === 'retail' ? 'Retail' : 'Wholesale'}
              </button>
            ))}
          </div>

          {/* Location */}
          <div className="navbar__location" ref={locationRef}>
            <button type="button" className="navbar__delivery-badge" onClick={() => setShowLocationMenu(prev => !prev)}>
              <span className="navbar__delivery-dot"></span>
              Your address
            </button>
            <button type="button" className="navbar__address" onClick={() => setShowLocationMenu(prev => !prev)}>
              <FiMapPin className="navbar__pin-icon" />
              <span className="navbar__address-text">{deliveryAddressText}</span>
              <FiChevronDown className="navbar__chevron" />
            </button>

            {showLocationMenu && (
              <div className="navbar-location-menu">
                <div className="navbar-location-menu__header">
                  <strong>Select delivery address</strong>
                  <span>Choose where your order should arrive.</span>
                </div>
                <button type="button" className="navbar-location-menu__current" onClick={useCurrentLocation}>
                  <FiNavigation /> Use current location
                </button>

                {savedAddresses.length > 0 && (
                  <div className="navbar-location-menu__saved">
                    {savedAddresses.slice(0, 3).map(address => (
                      <div key={address.id} className="navbar-location-menu__address">
                        <div>
                          <strong>{address.name}</strong>
                          <span>{address.address}, {address.pincode}</span>
                        </div>
                        <button type="button" onClick={() => selectAddress(address)}>
                          <FiCheck /> Use
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="navbar-location-menu__form">
                  <span className="navbar-location-menu__form-title"><FiPlus /> Add new address</span>
                  <div className="navbar-location-menu__grid">
                    <input placeholder="Name" value={addressForm.name} onChange={(e) => setAddressForm(prev => ({ ...prev, name: e.target.value }))} />
                    <input placeholder="Phone" value={addressForm.phone} onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))} />
                  </div>
                  <input placeholder="Email" value={addressForm.email} onChange={(e) => setAddressForm(prev => ({ ...prev, email: e.target.value }))} />
                  <input placeholder="Address" value={addressForm.address} onChange={(e) => setAddressForm(prev => ({ ...prev, address: e.target.value }))} />
                  <div className="navbar-location-menu__grid">
                    <input placeholder="Pincode" value={addressForm.pincode} onChange={(e) => setAddressForm(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} />
                    <button type="button" onClick={saveNewAddress}>Save Address</button>
                  </div>
                  {addressError && <p>{addressError}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="navbar__search-row" ref={searchRef}>
            <div className="navbar__search-box">
              <FiSearch className="navbar__search-icon" />
              <input
                ref={inputRef}
                type="text"
                className="navbar__search-input"
                placeholder='Search for "rice, atta, dal..."'
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
                id="navbar-search-input"
              />
              {searchQuery && (
                <button className="navbar__search-clear" onClick={clearSearch}>
                  <FiX />
                </button>
              )}
            </div>

            {showSearch && searchResults.length > 0 && (
              <div className="navbar__search-dropdown">
                {searchResults.map(product => (
                  <button
                    key={product.id}
                    className="navbar__search-result"
                    onClick={() => handleResultClick(product)}
                  >
                    {failedImages[product.id] ? (
                      <span className="navbar__result-img navbar__result-img--fallback">
                        {product.name.split(' ').slice(0, 2).map(word => word[0]).join('')}
                      </span>
                    ) : (
                      <img
                        src={toWebpImage(product.image)}
                        alt={product.name}
                        className="navbar__result-img"
                        onError={() => setFailedImages(prev => ({ ...prev, [product.id]: true }))}
                      />
                    )}
                    <div className="navbar__result-info">
                      <span className="navbar__result-name">{product.name}</span>
                      <span className="navbar__result-meta">
                        {product.weight} {product.unit} &middot; {formatPrice(product.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {showSearch && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="navbar__search-dropdown">
                <div className="navbar__search-empty">
                  No products found for "{searchQuery}"
                </div>
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="navbar__actions">
            <Link to={isAuthenticated ? '/profile' : '/login'} className="navbar__login">
              {isAuthenticated ? (
                <>
                  <FiUser />
                  {user?.name || 'Profile'}
                </>
              ) : (
                'Login'
              )}
            </Link>
            <Link to="/cart" className="navbar__cart" id="navbar-cart-btn">
            <FiShoppingCart className="navbar__cart-icon" />
            {cartCount > 0 && (
              <span className="navbar__cart-badge" key={cartCount}>
                {cartCount}
              </span>
            )}
            {cartCount > 0 && (
              <span className="navbar__cart-label">My Cart</span>
            )}
            {cartCount === 0 && (
              <span className="navbar__cart-label">My Cart</span>
            )}
            </Link>
            <div className="navbar-menu" ref={menuRef}>
              <button type="button" className="navbar-menu__toggle" onClick={() => setShowDesktopMenu(prev => !prev)} aria-label="Open menu">
                <FiMenu />
              </button>
              {showDesktopMenu && (
                <div className="navbar-menu__dropdown">
                  <button type="button" onClick={() => goTo('/home')}><FiHome /> Home</button>
                  <button type="button" onClick={() => goTo('/categories')}><FiList /> Categories</button>
                  <button type="button" onClick={() => goTo('/orders')}><FiPackage /> Orders</button>
                  <button type="button" onClick={() => goTo('/cart')}><FiShoppingCart /> Cart</button>
                  <button type="button" onClick={() => goTo('/profile')}><FiUser /> Profile</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

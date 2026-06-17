import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDownIcon,
  MapPinIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  SearchIcon,
  ShieldIcon,
  ShoppingCartIcon,
  UserIcon,
  XIcon,
  LayoutGridIcon,
  HomeIcon,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getUserStorageKey } from "../utils/userStorage";
import { getDeliveryTimeForAddress } from "../utils/deliveryZones";
import "./Navbar.css";

const emptyAddress = {
  name: "",
  phone: "",
  address: "",
  pincode: "",
};

const Navbar = () => {
  const { cartCount } = useCart();
  const { user, logout, location: deliveryLocation, setLocation, customerType, setCustomerType } = useAuth();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mapCoords, setMapCoords] = useState({ lat: 20.5937, lng: 78.9629 }); // default: India centre
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({
    ...emptyAddress,
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const addressStorageKey = getUserStorageKey(user, "addresses");

  const hiddenRoutes = ["/login", "/signup", "/admin-login"];
  const isHidden = hiddenRoutes.includes(routeLocation.pathname);

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
    setAddressForm((prev) => ({
      ...prev,
      name: user?.name || "",
      phone: user?.phone || "",
    }));
  }, [user]);

  // Close menus on scroll
  useEffect(() => {
    if (!menuOpen && !addressMenuOpen && !userMenuOpen) return;
    const handleScroll = () => {
      setMenuOpen(false);
      setAddressMenuOpen(false);
      setUserMenuOpen(false);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [menuOpen, addressMenuOpen, userMenuOpen]);

  if (isHidden) return null;

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/categories?search=${encodeURIComponent(trimmed)}`);
      setSearchQuery("");
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setAddressMenuOpen(false);
    setUserMenuOpen(false);
    navigate("/home");
  };

  const saveAddresses = (nextAddresses) => {
    setSavedAddresses(nextAddresses);
    if (addressStorageKey) {
      localStorage.setItem(addressStorageKey, JSON.stringify(nextAddresses));
    }
  };

  const selectAddress = (address) => {
    setLocation({
      address: address.address,
      city: address.pincode,
      full: `${address.address}, ${address.pincode}`,
      contact: address,
    });
    setAddressMenuOpen(false);
  };

  const saveAddress = () => {
    const trimmed = Object.fromEntries(
      Object.entries(addressForm).map(([k, v]) => [k, v.trim()])
    );
    if (Object.values(trimmed).some((v) => !v)) return;
    if (!/^\d{6}$/.test(trimmed.pincode)) return;
    const nextAddress = { ...trimmed, id: Date.now().toString() };
    const nextAddresses = [nextAddress, ...savedAddresses.filter((a) => a.id !== nextAddress.id)];
    saveAddresses(nextAddresses);
    selectAddress(nextAddress);
    setAddressForm({ ...emptyAddress, name: user?.name || "", phone: user?.phone || "" });
  };

  const currentAddressText =
    deliveryLocation.full || deliveryLocation.address || "Add address";

  // Delivery time based on customer's pincode/area — set by admin in Delivery Zones
  const deliveryTime = getDeliveryTimeForAddress(deliveryLocation);

  const changeCustomerType = (type) => {
    setCustomerType(type);
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__bar">

          {/* Logo — always first */}
          <Link to="/home" className="navbar__brand-link" onClick={() => setMenuOpen(false)}>
            <div className="navbar__brand-logo-wrap">
              <img src="/logo-mark.webp" alt="Siri Traders" className="navbar__brand-logo" />
            </div>
            <span className="navbar__brand-copy">
              <span className="navbar__brand-name">SIRI TRADERS</span>
              <span className="navbar__brand-tagline">Fast & Reliable Grocery Delivery</span>
            </span>
          </Link>

          {/* Retail / Wholesale toggle */}
          <div className="navbar__mode-switch" role="tablist" aria-label="Shopping mode">
            <button
              type="button"
              className={`navbar__mode-btn ${customerType === "retail" ? "navbar__mode-btn--active" : ""}`}
              onClick={() => changeCustomerType("retail")}
              aria-selected={customerType === "retail"}
            >
              Retail
            </button>
            <button
              type="button"
              className={`navbar__mode-btn ${customerType === "wholesale" ? "navbar__mode-btn--active" : ""}`}
              onClick={() => changeCustomerType("wholesale")}
              aria-selected={customerType === "wholesale"}
            >
              Wholesale
            </button>
          </div>

          {/* Delivery address pill — desktop + mobile row 3 */}
          <div className="navbar__address-wrap">
            <button
              type="button"
              className="navbar__address-pill"
              onClick={() => { setAddressMenuOpen((p) => !p); setMenuOpen(false); }}
            >
              <span className="navbar__address-copy">
                <span className="navbar__address-label">Delivery in {deliveryTime}</span>
                <span className="navbar__address-text">{currentAddressText}</span>
              </span>
              <ChevronDownIcon className="navbar__chevron" />
            </button>

            {/* Address dropdown — anchored directly below the pill */}
            {addressMenuOpen && (
              <div className="navbar__menu navbar__menu--address" role="dialog" aria-label="Delivery address">
                <div className="navbar__menu-section">

                  {/* Header */}
                  <div className="navbar__menu-user navbar__menu-user--address">
                    <span className="navbar__avatar navbar__avatar--large">
                      <MapPinIcon className="navbar__avatar-icon" />
                    </span>
                    <div style={{flex:1}}>
                      <p className="navbar__menu-name">Delivery address</p>
                      <p className="navbar__menu-email">Choose your current location.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddressMenuOpen(false)}
                      style={{width:32,height:32,borderRadius:'50%',background:'#F1F8E9',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}
                      aria-label="Close"
                    >
                      <XIcon size={16} color="#2D5016" />
                    </button>
                  </div>

                  {/* Use current location button */}
                  <button
                    type="button"
                    className="navbar__detect-btn"
                    onClick={() => {
                      if (!navigator.geolocation) {
                        alert('Geolocation is not supported by your browser.');
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          const { latitude, longitude } = pos.coords;
                          setMapCoords({ lat: latitude, lng: longitude });
                          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
                            .then(r => r.json())
                            .then(data => {
                              const addr = data.address;
                              const display = data.display_name?.split(',').slice(0,3).join(',') || 'Current location';
                              const pincode = addr?.postcode || '';
                              setLocation({ address: display, city: pincode, full: `${display}${pincode ? ', ' + pincode : ''}` });
                              setAddressMenuOpen(false);
                            })
                            .catch(() => {
                              setLocation({ address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, city: '', full: 'Current location' });
                              setAddressMenuOpen(false);
                            });
                        },
                        () => alert('Unable to get your location. Please allow location access.')
                      );
                    }}
                  >
                    <MapPinIcon size={16} />
                    Use my current location
                  </button>

                  {/* Area search */}
                  <div className="navbar__area-search">
                    <SearchIcon size={15} className="navbar__area-search-icon" />
                    <input
                      type="text"
                      placeholder="Search for your area, street, landmark..."
                      className="navbar__area-search-input"
                      onChange={(e) => {
                        // TODO (backend): wire to Google Places Autocomplete API
                      }}
                    />
                  </div>

                  {/* Map placeholder removed — will be added when backend/Maps API is connected */}

                  {/* Saved addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="navbar__address-list">
                      <p style={{fontSize:11,fontWeight:800,color:'#687466',marginBottom:4}}>SAVED ADDRESSES</p>
                      {savedAddresses.map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          className="navbar__address-item"
                          onClick={() => selectAddress(address)}
                        >
                          <span className="navbar__address-item-title">{address.name}</span>
                          <span className="navbar__address-item-text">{address.address}, {address.pincode}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Manual entry form */}
                  <div className="navbar__address-form">
                    <p style={{fontSize:11,fontWeight:800,color:'#687466',marginBottom:4}}>ADD MANUALLY</p>
                    <input type="text" placeholder="Name" value={addressForm.name}
                      onChange={(e) => setAddressForm((p) => ({ ...p, name: e.target.value }))} />
                    <input type="text" placeholder="Phone" value={addressForm.phone}
                      onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))} />
                    <input type="text" placeholder="Address" value={addressForm.address}
                      onChange={(e) => setAddressForm((p) => ({ ...p, address: e.target.value }))} />
                    <div className="navbar__address-form-row">
                      <input type="text" placeholder="Pincode" value={addressForm.pincode}
                        onChange={(e) => setAddressForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                      <button type="button" className="navbar__address-save" onClick={saveAddress}>Save</button>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Search bar */}
          <form className="navbar__search" onSubmit={handleSearch}>
            <SearchIcon className="navbar__search-icon" />
            <input
              type="text"
              placeholder="Search for groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="navbar__search-input"
            />
          </form>

          {/* Right actions — cart + hamburger only */}
          <div className="navbar__actions">
            <Link to="/cart" className="navbar__cart" aria-label={`Cart with ${cartCount} items`}>
              <ShoppingCartIcon className="navbar__action-icon" />
              {cartCount > 0 && <span className="navbar__cart-badge">{cartCount}</span>}
            </Link>

            {!user && (
              <Link to="/login" className="navbar__signin">
                <UserIcon className="navbar__action-icon" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              type="button"
              className="navbar__menu-toggle"
              onClick={() => { setMenuOpen((p) => !p); setAddressMenuOpen(false); }}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* Backdrop — transparent, just catches outside clicks */}
        {(addressMenuOpen || menuOpen) && (
          <button
            type="button"
            className="navbar__backdrop"
            aria-label="Close menu"
            onClick={() => { setAddressMenuOpen(false); setMenuOpen(false); }}
          />
        )}

        {/* Address dropdown moved inside navbar__address-wrap above */}

        {/* Hamburger menu — full nav + account links */}
        {menuOpen && (
          <div className="navbar__menu" role="menu" aria-label="Navigation menu">
            <div className="navbar__menu-section">
              {user && (
                <div className="navbar__menu-user">
                  <span className="navbar__avatar navbar__avatar--large">{user.name.charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="navbar__menu-name">{user.name}</p>
                    <p className="navbar__menu-email">{user.email}</p>
                  </div>
                </div>
              )}
              <Link to="/home" className="dropdown-link" onClick={() => setMenuOpen(false)}><HomeIcon size={16} /> Home</Link>
              <Link to="/categories" className="dropdown-link" onClick={() => setMenuOpen(false)}><LayoutGridIcon size={16} /> Categories</Link>
              <Link to="/cart" className="dropdown-link" onClick={() => setMenuOpen(false)}><ShoppingCartIcon size={16} /> Cart</Link>
              {user ? (
                <>
                  <Link to="/orders" className="dropdown-link" onClick={() => setMenuOpen(false)}><PackageIcon size={16} /> My Orders</Link>
                  <Link to="/profile" className="dropdown-link" onClick={() => setMenuOpen(false)}><UserIcon size={16} /> Profile</Link>
                  {user.isAdmin && (
                    <Link to="/admin" className="dropdown-link" onClick={() => setMenuOpen(false)}><ShieldIcon size={16} /> Admin Panel</Link>
                  )}
                  <button type="button" className="dropdown-link dropdown-link--danger" onClick={handleLogout}>
                    <LogOutIcon size={16} /> Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="dropdown-link" onClick={() => setMenuOpen(false)}><UserIcon size={16} /> Sign In</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowUpRightIcon,
  BikeIcon,
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
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { getUserStorageKey } from "../utils/userStorage";
import "./Navbar.css";

const emptyAddress = {
  name: "",
  phone: "",
  address: "",
  pincode: "",
};

const Navbar = () => {
  const { cartCount } = useCart();
  const { user, logout, location: deliveryLocation, setLocation } = useAuth();
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addressMenuOpen, setAddressMenuOpen] = useState(false);
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
      Object.entries(addressForm).map(([key, value]) => [key, value.trim()]),
    );

    if (Object.values(trimmed).some((value) => !value)) return;
    if (!/^\d{6}$/.test(trimmed.pincode)) return;

    const nextAddress = { ...trimmed, id: Date.now().toString() };
    const nextAddresses = [
      nextAddress,
      ...savedAddresses.filter((item) => item.id !== nextAddress.id),
    ];
    saveAddresses(nextAddresses);
    selectAddress(nextAddress);
    setAddressForm({
      ...emptyAddress,
      name: user?.name || "",
      phone: user?.phone || "",
    });
  };

  const currentAddressText =
    deliveryLocation.full || deliveryLocation.address || "Add address";

  const navLinks = [
    { label: "Home", to: "/home" },
    { label: "Categories", to: "/categories" },
    { label: "Deals", to: "/categories?search=deals" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__bar">
          <Link
            to="/home"
            className="navbar__brand-link"
            onClick={() => setMenuOpen(false)}
          >
            <span className="navbar__brand-mark" aria-hidden="true">
              <BikeIcon />
            </span>
            <span className="navbar__brand-copy">
              <span className="navbar__brand-name">Siri Traders</span>
              <span className="navbar__brand-tagline">
                Fast & Reliable Grocery Delivery
              </span>
            </span>
          </Link>

          <div className="navbar__desktop-links">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className={
                  routeLocation.pathname === link.to.split("?")[0]
                    ? "navbar__link navbar__link--active"
                    : "navbar__link"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>

          <button
            type="button"
            className="navbar__address-pill"
            onClick={() => {
              setAddressMenuOpen((prev) => !prev);
              setMenuOpen(false);
            }}
          >
            <span className="navbar__address-copy">
              <span className="navbar__address-label">
                Delivery in 10 minutes
              </span>
              <span className="navbar__address-text">{currentAddressText}</span>
            </span>
            <ChevronDownIcon className="navbar__chevron" />
          </button>

          <form className="navbar__search" onSubmit={handleSearch}>
            <SearchIcon className="navbar__search-icon" />
            <input
              type="text"
              placeholder="Search for groceries..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="navbar__search-input"
            />
          </form>

          <div className="navbar__actions">
            <Link
              to="/cart"
              className="navbar__cart"
              aria-label={`Cart with ${cartCount} items`}
            >
              <ShoppingCartIcon className="navbar__action-icon" />
              {cartCount > 0 && (
                <span className="navbar__cart-badge">{cartCount}</span>
              )}
            </Link>

            {user ? (
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="navbar__user-btn"
                aria-expanded={menuOpen}
                aria-label="Open account menu"
              >
                <span className="navbar__avatar">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <ChevronDownIcon className="navbar__chevron" />
              </button>
            ) : (
              <Link to="/login" className="navbar__signin">
                <UserIcon className="navbar__action-icon" />
                <span>Sign In</span>
              </Link>
            )}

            <button
              type="button"
              className="navbar__menu-toggle"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {addressMenuOpen && (
          <>
            <button
              type="button"
              className="navbar__backdrop"
              aria-label="Close address menu overlay"
              onClick={() => setAddressMenuOpen(false)}
            />
            <div
              className="navbar__menu navbar__menu--address"
              role="dialog"
              aria-label="Delivery address menu"
            >
              <div className="navbar__menu-section">
                <div className="navbar__menu-user navbar__menu-user--address">
                  <span className="navbar__avatar navbar__avatar--large">
                    <MapPinIcon className="navbar__avatar-icon" />
                  </span>
                  <div>
                    <p className="navbar__menu-name">Delivery address</p>
                    <p className="navbar__menu-email">
                      Choose where your order should arrive.
                    </p>
                  </div>
                </div>

                <div className="navbar__address-list">
                  {savedAddresses.length > 0 ? (
                    savedAddresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        className="navbar__address-item"
                        onClick={() => selectAddress(address)}
                      >
                        <span className="navbar__address-item-title">
                          {address.name}
                        </span>
                        <span className="navbar__address-item-text">
                          {address.address}, {address.pincode}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="navbar__address-empty">
                      No saved addresses yet. Add one below.
                    </p>
                  )}
                </div>

                <div className="navbar__address-form">
                  <input
                    type="text"
                    placeholder="Name"
                    value={addressForm.name}
                    onChange={(event) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={addressForm.phone}
                    onChange={(event) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        phone: event.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Address"
                    value={addressForm.address}
                    onChange={(event) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        address: event.target.value,
                      }))
                    }
                  />
                  <div className="navbar__address-form-row">
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={addressForm.pincode}
                      onChange={(event) =>
                        setAddressForm((prev) => ({
                          ...prev,
                          pincode: event.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6),
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="navbar__address-save"
                      onClick={saveAddress}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {menuOpen && (
          <>
            <button
              type="button"
              className="navbar__backdrop"
              aria-label="Close menu overlay"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="navbar__menu"
              role="menu"
              aria-label="Account and navigation menu"
            >
              <div className="navbar__menu-section">
                {user && (
                  <div className="navbar__menu-user">
                    <span className="navbar__avatar navbar__avatar--large">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="navbar__menu-name">{user.name}</p>
                      <p className="navbar__menu-email">{user.email}</p>
                    </div>
                  </div>
                )}

                {!user && (
                  <Link
                    to="/login"
                    className="dropdown-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserIcon size={16} /> Sign In
                  </Link>
                )}

                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="dropdown-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ArrowUpRightIcon size={16} /> {link.label}
                  </Link>
                ))}

                {user && (
                  <>
                    <Link
                      to="/orders"
                      className="dropdown-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      <PackageIcon size={16} /> My Orders
                    </Link>
                    <Link
                      to="/profile"
                      className="dropdown-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      <UserIcon size={16} /> Profile
                    </Link>
                    {user.isAdmin && (
                      <Link
                        to="/admin"
                        className="dropdown-link"
                        onClick={() => setMenuOpen(false)}
                      >
                        <ShieldIcon size={16} /> Admin Panel
                      </Link>
                    )}
                    <button
                      type="button"
                      className="dropdown-link dropdown-link--danger"
                      onClick={handleLogout}
                    >
                      <LogOutIcon size={16} /> Logout
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

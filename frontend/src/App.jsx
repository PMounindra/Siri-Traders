import { useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { SiteDataProvider } from "./context/SiteDataContext";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import ScrollControls from "./components/ScrollControls";
import CartSummaryBar from "./components/CartSummaryBar";
import Loading from "./components/Loading";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SsoCallback from "./pages/SsoCallback";
import Home from "./pages/Home/index.jsx";
import "./App.css";

// lazyWithRetry: wraps dynamic import with an auto-reload fallback for chunk errors
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasBeenRefreshed = sessionStorage.getItem("page_has_been_refreshed");
    try {
      const component = await componentImport();
      sessionStorage.removeItem("page_has_been_refreshed");
      return component;
    } catch (error) {
      if (!pageHasBeenRefreshed) {
        sessionStorage.setItem("page_has_been_refreshed", "true");
        window.location.reload();
        return new Promise(() => {});
      }
      throw error;
    }
  });

// All pages lazy-loaded for fast initial bundle (Admin is the heaviest at 200KB)
const AdminLogin      = lazyWithRetry(() => import("./pages/AdminLogin"));
const Categories      = lazyWithRetry(() => import("./pages/Categories"));
const TodaysDeals     = lazyWithRetry(() => import("./pages/TodaysDeals"));
const Bestsellers     = lazyWithRetry(() => import("./pages/Bestsellers"));
const FestiveOffers   = lazyWithRetry(() => import("./pages/FestiveOffers"));
const FestiveOfferDetail = lazyWithRetry(() => import("./pages/FestiveOfferDetail"));
const ProductDetail   = lazyWithRetry(() => import("./pages/ProductDetail"));
const Cart            = lazyWithRetry(() => import("./pages/Cart"));
const Checkout        = lazyWithRetry(() => import("./pages/Checkout"));
const Orders          = lazyWithRetry(() => import("./pages/Orders"));
const Profile         = lazyWithRetry(() => import("./pages/Profile"));
const Admin           = lazyWithRetry(() => import("./pages/Admin"));
const TrackOrder      = lazyWithRetry(() => import("./pages/TrackOrder"));
const Info            = lazyWithRetry(() => import("./pages/Info"));

// Prefetch all customer-facing page chunks in background after app mounts.
// This fires silent dynamic imports ~1.5s after first load so chunks are already
// cached in the browser when the user taps a nav link — giving instant navigation
// without a large initial bundle.
function usePrefetchPages() {
  useEffect(() => {
    const timer = setTimeout(() => {
      import("./pages/Categories");
      import("./pages/TodaysDeals");
      import("./pages/Bestsellers");
      import("./pages/Cart");
      import("./pages/Orders");
      import("./pages/ProductDetail");
      import("./pages/Checkout");
      import("./pages/Profile");
      import("./pages/FestiveOffers");
      import("./pages/FestiveOfferDetail");
      import("./pages/TrackOrder");
      import("./pages/Info");
      import("./pages/AdminLogin");
    }, 1500);
    return () => clearTimeout(timer);
  }, []);
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Clerk Publishable Key is missing. Please check your .env file.");
}

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ["/login", "/signup", "/admin-login", "/admin", "/sso-callback"].includes(
    location.pathname,
  );

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  // Prefetch all page chunks silently after initial render
  usePrefetchPages();

  return (
    <div className="app">
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <ScrollControls />}
      <main className="app__main">
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/sso-callback" element={<SsoCallback />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/home" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/todays-deals" element={<TodaysDeals />} />
            <Route path="/bestsellers" element={<Bestsellers />} />
            <Route path="/festive-offers" element={<FestiveOffers />} />
            <Route path="/festive-offer/:id" element={<FestiveOfferDetail />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/track/:orderId" element={<TrackOrder />} />
            <Route path="/info" element={<Info />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </main>
      {!isAuthPage && <BottomNav />}
      {!isAuthPage && <CartSummaryBar />}
    </div>
  );
};

function App() {
  if (!PUBLISHABLE_KEY) {
    return (
      <Router>
        <AuthProvider>
          <SiteDataProvider>
            <ProductProvider>
              <CartProvider>
                <AppLayout />
              </CartProvider>
            </ProductProvider>
          </SiteDataProvider>
        </AuthProvider>
      </Router>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      afterSignOutUrl="/"
      appearance={{
        layout: {
          unsafe_disableDevelopmentModeWarnings: true
        }
      }}
    >
      <Router>
        <AuthProvider>
          <SiteDataProvider>
            <ProductProvider>
              <CartProvider>
                <AppLayout />
              </CartProvider>
            </ProductProvider>
          </SiteDataProvider>
        </AuthProvider>
      </Router>
    </ClerkProvider>
  );
}

export default App;

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

import AdminLogin from "./pages/AdminLogin";
import Categories from "./pages/Categories";
import TodaysDeals from "./pages/TodaysDeals";
import Bestsellers from "./pages/Bestsellers";
import FestiveOffers from "./pages/FestiveOffers";
import FestiveOfferDetail from "./pages/FestiveOfferDetail";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import TrackOrder from "./pages/TrackOrder";
import Info from "./pages/Info";

const Admin = lazyWithRetry(() => import("./pages/Admin"));
import "./App.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Clerk Publishable Key is missing. Please check your .env file.");
}

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ["/login", "/signup", "/admin-login", "/admin", "/sso-callback"].includes(
    location.pathname,
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

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

import { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import ScrollControls from "./components/ScrollControls";
import CartSummaryBar from "./components/CartSummaryBar";
import ClerkSignIn from "./pages/ClerkSignIn";
import ClerkSignUp from "./pages/ClerkSignUp";
import { AuthenticateWithRedirectCallback } from "@clerk/react-router";

const SSOCallback = () => <AuthenticateWithRedirectCallback />;
import AdminLogin from "./pages/AdminLogin";
import Home from "./pages/Home/index.jsx";
import Categories from "./pages/Categories";
import TodaysDeals from "./pages/TodaysDeals";
import Bestsellers from "./pages/Bestsellers";
import FestiveOffers from "./pages/FestiveOffers";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import TrackOrder from "./pages/TrackOrder";
import Admin from "./pages/Admin";
import Info from "./pages/Info";

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ["/admin-login", "/admin"].includes(location.pathname)
    || location.pathname.startsWith("/sign-in")
    || location.pathname.startsWith("/sign-up");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="app">
      {!isAuthPage && <Navbar />}
      {!isAuthPage && <ScrollControls />}
      <main className="app__main">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/sign-in/sso-callback" element={<SSOCallback />} />
          <Route path="/sign-up/sso-callback" element={<SSOCallback />} />
          <Route path="/sign-in/*" element={<ClerkSignIn />} />
          <Route path="/sign-up/*" element={<ClerkSignUp />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/home" element={<Home />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/todays-deals" element={<TodaysDeals />} />
          <Route path="/bestsellers" element={<Bestsellers />} />
          <Route path="/festive-offers" element={<FestiveOffers />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/track/:orderId" element={<TrackOrder />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/info" element={<Info />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
      {!isAuthPage && <BottomNav />}
      {!isAuthPage && <CartSummaryBar />}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppLayout />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

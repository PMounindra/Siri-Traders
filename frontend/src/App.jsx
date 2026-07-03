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
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import ScrollControls from "./components/ScrollControls";
import CartSummaryBar from "./components/CartSummaryBar";
import Loading from "./components/Loading";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home/index.jsx";

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Categories = lazy(() => import("./pages/Categories"));
const TodaysDeals = lazy(() => import("./pages/TodaysDeals"));
const Bestsellers = lazy(() => import("./pages/Bestsellers"));
const FestiveOffers = lazy(() => import("./pages/FestiveOffers"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin        = lazy(() => import("./pages/Admin"));
const TrackOrder   = lazy(() => import("./pages/TrackOrder"));
const Info         = lazy(() => import("./pages/Info"));
import "./App.css";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn("Clerk Publishable Key is missing. Please check your .env file.");
}

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ["/login", "/signup", "/admin-login", "/admin"].includes(
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
          <ProductProvider>
            <CartProvider>
              <AppLayout />
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </Router>
    );
  }

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <Router>
        <AuthProvider>
          <ProductProvider>
            <CartProvider>
              <AppLayout />
            </CartProvider>
          </ProductProvider>
        </AuthProvider>
      </Router>
    </ClerkProvider>
  );
}

export default App;

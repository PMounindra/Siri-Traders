import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  HomeIcon,
  LeafIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { formatPrice } from "../utils/format";
import { toWebpImage } from "../utils/images";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";
import "./ProductDetail.css";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, updateQuantity, getItemQuantity } =
    useCart();
  const { customerType } = useAuth();
  const { getProductsForType, loading: productsLoading } = useProducts();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    // Scroll to top immediately before anything renders
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setLoading(true);
    setLocalQuantity(1);
    setImageFailed(false);

    if (productsLoading) return; // Wait until products are fetched from API

    const allProducts = getProductsForType(customerType);

    // Match by numeric id OR string id
    const nextProduct = allProducts.find(
      (p) => String(p.id) === String(id)
    );

    if (!nextProduct) {
      setProduct(null);
      setRelatedProducts([]);
      setLoading(false);
      return;
    }

    setProduct(nextProduct);
    setRelatedProducts(
      allProducts
        .filter(
          (item) =>
            item.category === nextProduct.category &&
            String(item.id) !== String(nextProduct.id)
        )
        .slice(0, 8),
    );
    // Set default variant
    const variants = nextProduct.variants || [
      { label: `${nextProduct.weight} ${nextProduct.unit}`, price: nextProduct.price }
    ];
    setSelectedVariant(variants[0]);
    setLoading(false);
  }, [id, productsLoading, customerType]); // Re-run when products load or customer type changes

  const variants = product
    ? (product.variants || [{ label: `${product.weight} ${product.unit}`, price: product.price }])
    : [];

  const activeVariant = selectedVariant || variants[0];
  const activeCartId = product ? `${customerType}-${product.id}-${activeVariant?.label}` : null;
  const cartQuantity = activeCartId ? getItemQuantity(activeCartId) : 0;
  const inCart = cartQuantity > 0;
  const displayQuantity = inCart ? cartQuantity : localQuantity;

  // Sync selectedVariant when switching to one that's already in cart
  const activeVariantInCart = useMemo(() => {
    if (!product) return null;
    return variants.find(v => getItemQuantity(`${customerType}-${product.id}-${v.label}`) > 0) || null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, customerType, getItemQuantity]);

  const categoryLabel = useMemo(() => {
    if (!product) return "";
    return product.category.replace(/-/g, " ");
  }, [product]);

  if (loading || productsLoading) return <Loading />;

  if (!product) {
    return (
      <div className="page-wrapper">
        <div className="pd__not-found">
          <span>😕</span>
          <h2>Product not found</h2>
          <button
            type="button"
            onClick={() => navigate("/home")}
            className="pd__back-home"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const isOrganic =
    product.isOrganic ?? product.category === "fruits-vegetables";

  const handleMinus = () => {
    if (inCart) {
      if (cartQuantity <= 1) {
        removeFromCart(activeCartId);
      } else {
        updateQuantity(activeCartId, cartQuantity - 1);
      }
      return;
    }
    setLocalQuantity((prev) => Math.max(1, prev - 1));
  };

  const handlePlus = () => {
    if (inCart) {
      updateQuantity(activeCartId, cartQuantity + 1);
      return;
    }
    setLocalQuantity((prev) => prev + 1);
  };

  const handleAddToCart = () => {
    if (inCart) return;
    const variantPrice = activeVariant?.price || product.price;
    const variantMrp = activeVariant?.mrp || Math.round(variantPrice * (product.mrp / (product.price || 1)));
    addToCart({
      ...product,
      id: activeCartId,
      productId: product.id,      price: variantPrice,
      mrp: variantMrp,
      discount: Math.max(0, Math.round(((variantMrp - variantPrice) / variantMrp) * 100)),
      weight: activeVariant?.label || `${product.weight} ${product.unit}`,
      unit: '',
      selectedVariant: activeVariant?.label || `${product.weight} ${product.unit}`,
    });
  };

  return (
    <div className="page-wrapper">
      <div className="pd">
        <div className="pd__shell">
          <nav className="pd__breadcrumb" aria-label="Breadcrumb">
            <Link to="/home" className="pd__crumb pd__crumb--icon">
              <HomeIcon className="pd__crumb-icon" />
            </Link>
            <span className="pd__crumb-separator">/</span>
            <Link to="/categories" className="pd__crumb">
              Products
            </Link>
            <span className="pd__crumb-separator">/</span>
            <Link
              to={`/categories?cat=${product.category}`}
              className="pd__crumb pd__crumb--muted"
            >
              {categoryLabel}
            </Link>
            <span className="pd__crumb-separator">/</span>
            <span className="pd__crumb pd__crumb--current">{product.name}</span>
          </nav>

          <button
            type="button"
            className="pd__back"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="pd__back-icon" /> Back
          </button>

          <section className="pd__hero">
            <div className="pd__media">
              {!imageFailed ? (
                <img
                  src={toWebpImage(product.image)}
                  alt={product.name}
                  className="pd__image"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="pd__image pd__image-fallback">
                  {product.name
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")}
                </div>
              )}

              <div className="pd__tags">
                {isOrganic && (
                  <span className="pd__tag pd__tag--green">
                    <LeafIcon className="pd__tag-icon" /> Organic
                  </span>
                )}
                {product.discount > 0 && (
                  <span className="pd__tag pd__tag--orange">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
            </div>

            <div className="pd__content">
              <span className="pd__category">{categoryLabel}</span>
              <h1 className="pd__name">{product.name}</h1>

              <div className="pd__price-row">
                <span className="pd__price">{formatPrice(activeVariant?.price || product.price)}</span>
                {(activeVariant?.mrp || product.mrp) > (activeVariant?.price || product.price) && (
                  <span className="pd__mrp">{formatPrice(activeVariant?.mrp || product.mrp)}</span>
                )}
              </div>

              <p className="pd__description">{product.description}</p>

              {/* Variant chips */}
              {variants.length > 1 && (
                <div className="pd__variants">
                  {variants.map((v) => (
                    <button
                      key={v.label}
                      type="button"
                      className={`pd__variant ${activeVariant?.label === v.label ? 'pd__variant--active' : ''}`}
                      onClick={() => {
                        setSelectedVariant(v);
                        setLocalQuantity(1);
                      }}
                    >
                      <span>{v.label}</span>
                      <strong>{formatPrice(v.price)}</strong>
                    </button>
                  ))}
                </div>
              )}

              {product.inStock === false && (
                <div className="pd__meta">
                  <span className="pd__stock pd__stock--out">Out of Stock</span>
                </div>
              )}

              <div className="pd__actions">
                {inCart ? (
                  <>
                    <div className="pd__stepper">
                      <button
                        type="button"
                        onClick={handleMinus}
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon className="pd__stepper-icon" />
                      </button>
                      <span>{displayQuantity}</span>
                      <button
                        type="button"
                        onClick={handlePlus}
                        aria-label="Increase quantity"
                      >
                        <PlusIcon className="pd__stepper-icon" />
                      </button>
                    </div>
                    <Link to="/cart" className="pd__cta pd__cta--secondary">
                      <ShoppingCartIcon className="pd__cta-icon" /> View Cart
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    className="pd__cta pd__cta--full"
                    onClick={handleAddToCart}
                    disabled={product.inStock === false}
                  >
                    <ShoppingCartIcon className="pd__cta-icon" /> Add to Cart
                  </button>
                )}
              </div>

              <div className="pd__highlights">
                <div className="pd__highlight">
                  <span className="pd__highlight-icon">⚡</span>
                  <div>
                    <strong>Fast delivery</strong>
                    <p>Delivered quickly from your nearest store.</p>
                  </div>
                </div>
                <div className="pd__highlight">
                  <span className="pd__highlight-icon">✓</span>
                  <div>
                    <strong>Quality checked</strong>
                    <p>Selected and packed for daily freshness.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {relatedProducts.length > 0 && (
            <section className="pd-related">
              <div className="pd-related__header">
                <div>
                  <h2 className="pd-related__title">Related Products</h2>
                  <p className="pd-related__subtitle">
                    More from {categoryLabel}
                  </p>
                </div>
                <Link
                  to={`/categories?cat=${product.category}`}
                  className="pd-related__link"
                >
                  View All <ArrowRightIcon className="pd-related__link-icon" />
                </Link>
              </div>

              <div className="pd-related__grid">
                {relatedProducts.slice(0, 5).map((relatedProduct) => (
                  <ProductCard
                    key={relatedProduct.id}
                    product={relatedProduct}
                    compact
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

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
  StarIcon,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { toWholesaleProduct } from "../data/products";
import { formatPrice } from "../utils/format";
import { toWebpImage } from "../utils/images";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";
import "./ProductDetail.css";

const getProductForm = (name = "", category = "") => {
  const n = (name || "").toLowerCase();
  const c = (category || "").toLowerCase();

  // Soap (Solid bar / Soap)
  if (/\b(soap|bar|bathing bar|beauty bar|soap bar)\b/i.test(n)) {
    return "soap_bar";
  }

  // Shampoo & Hair Care (Liquid / Gel)
  if (/\b(shampoo|conditioner|hair wash|hair serum|hair mask)\b/i.test(n)) {
    return "shampoo";
  }

  // Liquid Soap / Body Wash / Handwash / Face Wash
  if (/\b(body wash|shower gel|hand wash|handwash|face wash|facewash|liquid soap)\b/i.test(n)) {
    return "liquid_wash";
  }

  // Detergent Bar vs Detergent Powder vs Liquid Detergent
  if (/\b(detergent bar|dishwash bar|washing bar|soap cake)\b/i.test(n)) {
    return "detergent_bar";
  }
  if (/\b(detergent powder|washing powder|surf powder|dishwash powder)\b/i.test(n)) {
    return "detergent_powder";
  }
  if (/\b(liquid detergent|liquid wash|fabric conditioner|liquid cleaner)\b/i.test(n)) {
    return "detergent_liquid";
  }

  // Oil
  if (/\b(oil|hair oil|coconut oil|cooking oil|mustard oil|sunflower oil)\b/i.test(n)) {
    return "oil";
  }

  // Tea vs Coffee
  if (/\b(coffee|instant coffee)\b/i.test(n)) {
    return "coffee";
  }
  if (/\b(tea|green tea|tea powder|leaf tea)\b/i.test(n)) {
    return "tea";
  }

  // Generic Liquid vs Solid
  if (/\b(ml|l|liter|litres|liquid)\b/i.test(n)) {
    return "liquid_generic";
  }
  if (/\b(g|gm|grams|kg|pack|pcs|piece|pieces|sachet|bar)\b/i.test(n)) {
    return "solid_generic";
  }

  return c || "other";
};

const extractBaseName = (name = "") => {
  return name
    .toLowerCase()
    .replace(/\b(rs\.?|\u20b9)\s*\d+\b/gi, "")
    .replace(/\b\d+\s*(rs\.?|\u20b9)\b/gi, "")
    .replace(
      /\b\d+(\.\d+)?\s*(g|gm|grams|kg|ml|l|liter|litres|sachet|pkt|packet|pcs|piece|pieces|pads|oz)\b/gi,
      ""
    )
    .replace(/\bpack of \d+\b/gi, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const extractVariantLabel = (p, currentBrandStr) => {
  let label = p.name;
  if (currentBrandStr && currentBrandStr.length > 1) {
    const bRegex = new RegExp(`^${currentBrandStr}\\s*`, 'gi');
    label = label.replace(bRegex, '').trim();
  }
  label = label.replace(/\b(bathing bar|bath soap|beauty bar)\b/gi, '').trim();
  label = label.replace(/\s+/g, ' ').trim();

  if (!label) {
    if (p.weight && p.unit) label = `${p.weight} ${p.unit}`;
    else label = p.name;
  }
  return label;
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, removeFromCart, updateQuantity, getItemQuantity } = useCart();
  const { customerType } = useAuth();
  const { getProductsForType, loading: productsLoading } = useProducts();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localQuantity, setLocalQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!product?.id) {
      setReviews([]);
      return;
    }
    let active = true;
    fetch('/api/admin/auth?action=reviews')
      .then(r => (r.ok ? r.json() : []))
      .then(all => {
        if (!active) return;
        setReviews((all || []).filter(r => String(r.productId) === String(product.id) && r.status === 'Approved'));
      })
      .catch(() => {});
    return () => { active = false; };
  }, [product?.id]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setLoading(true);
    setLocalQuantity(1);
    setImageFailed(false);

    if (productsLoading) return;

    let isCancelled = false;
    async function loadProduct() {
      const allProducts = getProductsForType(customerType) || [];
      let found = allProducts.find(
        (p) => String(p.id) === String(id)
      );

      // Direct fallback fetch if product not present in local context
      if (!found && id) {
        try {
          const res = await fetch(`/api/products?id=${id}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.id) {
              found = customerType === 'wholesale' ? toWholesaleProduct(data) : data;
            }
          }
        } catch (e) {
          console.warn('Direct fetch for product detail failed:', e);
        }
      }

      if (isCancelled) return;

      if (!found) {
        setProduct(null);
        setRelatedProducts([]);
        setLoading(false);
        return;
      }

      setProduct(found);
      const categoryProducts = allProducts.filter(
        (item) =>
          item.category &&
          found.category &&
          String(item.category).toLowerCase() === String(found.category).toLowerCase() &&
          String(item.id) !== String(found.id)
      );
      setRelatedProducts(categoryProducts.slice(0, 8));

      const defaultWeightLabel = `${found.weight || ''} ${found.unit || ''}`.trim() || 'Standard Pack';
      const defaultVars = (customerType === 'wholesale' && Array.isArray(found.variants) && found.variants.length > 0)
        ? found.variants
        : [{ label: defaultWeightLabel, price: Number(found.price) || 0, mrp: Number(found.mrp) || Number(found.price) || 0 }];

      setSelectedVariant(defaultVars[0]);
      setLoading(false);
    }

    loadProduct();

    return () => {
      isCancelled = true;
    };
  }, [id, productsLoading, customerType]);

  const siblingVariants = useMemo(() => {
    if (!product) return [];
    const allProducts = getProductsForType(customerType) || [];
    const currentBase = extractBaseName(product.name);
    const currentBrand = (
      product.brand ||
      product.name.split(" ")[0] ||
      ""
    ).trim().toLowerCase();
    const currentForm = getProductForm(product.name, product.category);

    // Match catalog siblings
    const catalogMatches = allProducts.filter((p) => {
      if (String(p.id) === String(product.id)) return true;

      // Category check: if category is present on both, MUST match!
      if (
        product.category &&
        p.category &&
        String(product.category).toLowerCase().trim() !== String(p.category).toLowerCase().trim()
      ) {
        return false;
      }

      // Form / Type check: Soap vs Shampoo vs Liquid vs Powder MUST match!
      const pForm = getProductForm(p.name, p.category);
      if (currentForm !== pForm) {
        return false;
      }

      // 1. Match by exact base product name
      const pBase = extractBaseName(p.name);
      if (currentBase && pBase && currentBase === pBase && currentBase.length > 2) {
        return true;
      }

      // 2. Match by brand within the same product form (e.g. Cinthol Lime, Cinthol Original, Cinthol Cool)
      const pBrand = (p.brand || p.name.split(" ")[0] || "").trim().toLowerCase();
      if (currentBrand && currentBrand.length > 1 && pBrand === currentBrand) {
        return true;
      }

      return false;
    });

    let cards = catalogMatches.map((p) => ({
      id: p.id,
      label: extractVariantLabel(p, currentBrand),
      fullName: p.name,
      price: Number(p.price) || 0,
      mrp: Number(p.mrp) || Number(p.price) || 0,
      image: p.image,
      inStock: p.inStock !== false,
      isCatalogItem: true,
      rawProduct: p,
    }));

    const seen = new Set();
    const uniqueCards = [];
    for (const card of cards) {
      const key = `${card.id || card.label}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCards.push(card);
      }
    }

    uniqueCards.sort((a, b) => a.price - b.price);

    return uniqueCards;
  }, [product, customerType, getProductsForType]);

  const isCardActive = (card) => {
    if (!card || !product) return false;
    return String(card.id) === String(product.id);
  };

  const handleSelectVariantCard = (card) => {
    if (card.isCatalogItem) {
      if (String(card.id) !== String(product.id)) {
        navigate(`/product/${card.id}`);
      }
    }
  };

  const productPackVariants = useMemo(() => {
    if (!product) return [];
    if (Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.map((v, idx) => ({
        id: `pack-${idx}-${v.label}`,
        label: String(v.label || `${product.weight || ''} ${product.unit || ''}`).trim() || 'Standard Pack',
        price: Number(v.price) || Number(product.price) || 0,
        mrp: Number(v.mrp) || Number(product.mrp) || Number(v.price) || Number(product.price) || 0,
        rawVariant: v
      }));
    }
    const labelStr = `${product.weight || ''} ${product.unit || ''}`.trim() || 'Standard Pack';
    return [{
      id: `pack-0-${labelStr}`,
      label: labelStr,
      price: Number(product.price) || 0,
      mrp: Number(product.mrp) || Number(product.price) || 0,
      rawVariant: { label: labelStr, price: Number(product.price) || 0, mrp: Number(product.mrp) || Number(product.price) || 0 }
    }];
  }, [product]);

  const variants = productPackVariants;

  const activeVariant = selectedVariant || variants[0] || { label: 'Standard Pack', price: Number(product?.price) || 0, mrp: Number(product?.mrp) || Number(product?.price) || 0 };
  const activeCartId = product ? `${customerType}-${product.id}-${activeVariant?.label}` : null;
  const cartQuantity = activeCartId ? getItemQuantity(activeCartId) : 0;
  const inCart = cartQuantity > 0;
  const displayQuantity = inCart ? cartQuantity : localQuantity;

  const categoryLabel = useMemo(() => {
    if (!product?.category) return "Groceries";
    return String(product.category).replace(/-/g, " ");
  }, [product]);

  const reviewCount = (reviews || []).length;
  const avgRating = reviewCount
    ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviewCount
    : 0;

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

  const isOrganic = product.isOrganic ?? (product.category === "fruits-vegetables");

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
    if (inCart || !product) return;
    const variantPrice = Number(activeVariant?.price) || Number(product.price) || 0;
    const baseMrp = Number(activeVariant?.mrp) || Number(product.mrp) || variantPrice;
    const variantMrp = Math.max(variantPrice, baseMrp);
    const discountPercent = variantMrp > variantPrice ? Math.round(((variantMrp - variantPrice) / variantMrp) * 100) : 0;

    addToCart({
      ...product,
      id: activeCartId,
      productId: product.id,
      price: variantPrice,
      mrp: variantMrp,
      discount: discountPercent,
      weight: activeVariant?.label || `${product.weight || ''} ${product.unit || ''}`.trim() || 'Standard Pack',
      unit: '',
      selectedVariant: activeVariant?.label || `${product.weight || ''} ${product.unit || ''}`.trim() || 'Standard Pack',
    });
  };

  const productInitials = (product?.name || "Product")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

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
              to={`/categories?cat=${encodeURIComponent(product.category || '')}`}
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
              {!imageFailed && product.image ? (
                <img
                  src={toWebpImage(product.image)}
                  alt={product.name}
                  className="pd__image"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="pd__image pd__image-fallback">
                  {productInitials}
                </div>
              )}

              <div className="pd__tags">
                {isOrganic && (
                  <span className="pd__tag pd__tag--green">
                    <LeafIcon className="pd__tag-icon" /> Organic
                  </span>
                )}
                {(product.discount > 0) && (
                  <span className="pd__tag pd__tag--orange">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
            </div>

            <div className="pd__content">
              <span className="pd__category">{categoryLabel}</span>
              <h1 className="pd__name">{product.name}</h1>

              {reviewCount > 0 && (
                <div className="pd__rating-row">
                  <div className="pd__stars" aria-label={`Rated ${avgRating.toFixed(1)} out of 5`}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={star <= Math.round(avgRating) ? "pd__star pd__star--active" : "pd__star"}
                      />
                    ))}
                  </div>
                  <span className="pd__rating-value">{avgRating.toFixed(1)}</span>
                  <span className="pd__rating-count">({reviewCount} review{reviewCount === 1 ? '' : 's'})</span>
                </div>
              )}

              <div className="pd__price-row">
                <span className="pd__price">{formatPrice(activeVariant?.price || product.price)}</span>
                {(activeVariant?.mrp || product.mrp) > (activeVariant?.price || product.price) && (
                  <span className="pd__mrp">{formatPrice(activeVariant?.mrp || product.mrp)}</span>
                )}
              </div>

              {product.description && (
                <p className="pd__description">{product.description}</p>
              )}

              {/* Pack Size / Quantity Options */}
              {productPackVariants.length > 1 && (
                <div className="pd__pack-variants">
                  <div className="pd__amazon-variants-header">
                    <span className="pd__amazon-variants-title">Pack Size / Quantity Options:</span>
                    <span className="pd__amazon-variants-selected">
                      {activeVariant?.label || productPackVariants[0]?.label || ''}
                    </span>
                  </div>
                  <div className="pd__pack-variants-grid">
                    {productPackVariants.map((v) => {
                      const active = activeVariant && String(activeVariant.label) === String(v.label);
                      const discount = v.mrp > v.price
                        ? Math.round(((v.mrp - v.price) / v.mrp) * 100)
                        : 0;

                      return (
                        <button
                          key={v.id}
                          type="button"
                          className={`pd__pack-card ${active ? 'pd__pack-card--active' : ''}`}
                          onClick={() => {
                            setSelectedVariant(v.rawVariant);
                            setLocalQuantity(1);
                          }}
                        >
                          {active && <span className="pd__pack-card-check">✓</span>}
                          <span className="pd__pack-card-label">{v.label}</span>
                          <span className="pd__pack-card-price">{formatPrice(v.price)}</span>
                          {discount > 0 && <span className="pd__pack-card-discount">{discount}% OFF</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amazon-style Variety / Flavor Options */}
              {siblingVariants.length > 1 && (
                <div className="pd__amazon-variants">
                  <div className="pd__amazon-variants-header">
                    <span className="pd__amazon-variants-title">Variety / Flavor Options:</span>
                    <span className="pd__amazon-variants-selected">
                      {siblingVariants.find(isCardActive)?.label || product.name}
                    </span>
                  </div>
                  <div className="pd__amazon-variants-grid">
                    {siblingVariants.map((v) => {
                      const active = isCardActive(v);
                      const discount = v.mrp > v.price
                        ? Math.round(((v.mrp - v.price) / v.mrp) * 100)
                        : 0;

                      return (
                        <button
                          key={v.id || v.label}
                          type="button"
                          className={`pd__amazon-card ${active ? 'pd__amazon-card--active' : ''} ${!v.inStock ? 'pd__amazon-card--out-of-stock' : ''}`}
                          onClick={() => handleSelectVariantCard(v)}
                        >
                          {active && (
                            <div className="pd__amazon-card-check" aria-hidden="true">
                              ✓
                            </div>
                          )}
                          <div className="pd__amazon-card-media">
                            {v.image ? (
                              <img
                                src={toWebpImage(v.image)}
                                alt={v.label}
                                className="pd__amazon-card-img"
                              />
                            ) : (
                              <div className="pd__amazon-card-fallback">
                                {v.label.substring(0, 3)}
                              </div>
                            )}
                          </div>
                          <div className="pd__amazon-card-details">
                            <span className="pd__amazon-card-label">{v.label}</span>
                            <span className="pd__amazon-card-price">{formatPrice(v.price)}</span>
                            {discount > 0 ? (
                              <span className="pd__amazon-card-discount">{discount}% OFF</span>
                            ) : (
                              v.mrp > v.price && (
                                <span className="pd__amazon-card-mrp">{formatPrice(v.mrp)}</span>
                              )
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
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

          {reviewCount > 0 && (
            <section className="pd-reviews">
              <div className="pd-reviews__header">
                <div>
                  <h2 className="pd-reviews__title">Customer Reviews</h2>
                  <p className="pd-reviews__subtitle">What shoppers are saying about {product.name}</p>
                </div>
                <span className="pd-reviews__count">{reviewCount} review{reviewCount === 1 ? '' : 's'}</span>
              </div>

              <div className="pd-reviews__grid">
                {reviews.map((review) => {
                  const ratingVal = Math.max(0, Math.min(5, Math.round(Number(review.rating) || 0)));
                  return (
                    <article key={review.id} className="pd-reviews__card">
                      <div className="pd-reviews__meta">
                        <strong>{review.userName || 'Customer'}</strong>
                        <span>{"★".repeat(ratingVal)}{"☆".repeat(5 - ratingVal)}</span>
                      </div>
                      {review.title && <p style={{ fontWeight: 700 }}>{review.title}</p>}
                      {review.comment && <p>{review.comment}</p>}
                    </article>
                  );
                })}
              </div>
            </section>
          )}

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
                  to={`/categories?cat=${encodeURIComponent(product.category || '')}`}
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

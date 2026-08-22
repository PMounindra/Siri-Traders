import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBarChart2,
  FiEdit2,
  FiDollarSign,
  FiGift,
  FiLock,
  FiLogOut,
  FiPackage,
  FiPlus,
  FiSave,
  FiSearch,
  FiTag,
  FiShoppingBag,
  FiTrash2,
  FiTruck,
  FiUsers,
  FiX,
  FiMapPin,
  FiSettings,
  FiStar,
  FiCheck,
  FiTrendingUp,
  FiMail
} from 'react-icons/fi';
import { getAccounts } from '../context/AuthContext';
import { useAdminApi } from '../hooks/useAdminApi';
import { products as baseProducts, getProducts as getAllProducts } from '../data/products';
import { categories } from '../data/categories';
import { baseDailyOffers, baseFestivalOffers } from '../data/offers';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import { getUserStorageKey } from '../utils/userStorage';
import './Admin.css';

const ADMIN_PRODUCTS_RETAIL_KEY = 'siri-admin-products-retail';
const ADMIN_PRODUCTS_WHOLESALE_KEY = 'siri-admin-products-wholesale';

const readStorage = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const blankProduct = {
  id: '',
  name: '',
  category: 'pulses',
  brand: '',
  weight: '',
  unit: 'g',
  price: '',
  mrp: '',
  discount: '',
  image: '',
  description: '',
  inStock: true,
  stockNote: 'In stock',
  deliveryTime: '10 mins',
  isBestseller: false,
  isTodaysDeal: false
};

const blankWholesaleProduct = {
  id: '',
  name: '',
  category: 'pulses',
  brand: '',
  weight: '',
  unit: 'kg',
  price: '',
  mrp: '',
  discount: '',
  image: '',
  description: '',
  inStock: true,
  stockNote: 'In stock',
  deliveryTime: 'Same day',
  isBestseller: false,
  isTodaysDeal: false,
  wholesalePrice: '',
  bulkPackLabel: '',
  bulkPackPrice: '',
  wholesaleCaseLabel: '',
  wholesaleCasePrice: ''
};

const blankOffer = {
  id: '',
  title: '',
  subtitle: '',
  badge: '',
  price: '',
  mrp: '',
  image: '',
  group: 'daily',
  type: 'Sale offer',
  link: '/categories',
  active: true
};

const blankCoupon = {
  id: '',
  code: '',
  type: 'flat',
  value: '',
  minOrder: '',
  maxDiscount: '',
  title: '',
  description: '',
  customerType: 'retail',
  active: true
};

const blankAdmin = {
  name: '',
  email: '',
  password: '',
  role: 'Manager'
};

// Dummy payments kept for placeholder
const demoPayments = [
  {
    billNo: 'BILL-7821',
    orderId: 'ORD-1024',
    customer: 'Mounindra Pullepu',
    method: 'Cash on delivery',
    transactionId: 'COD-SIRI-829104',
    subtotal: 344,
    deliveryFee: 0,
    paid: 344,
    status: 'Paid'
  },
  {
    billNo: 'BILL-7822',
    orderId: 'ORD-1025',
    customer: 'Ravi Kumar',
    method: 'Cash on delivery',
    transactionId: 'COD-SIRI-492018',
    subtotal: 2000,
    deliveryFee: 0,
    paid: 2000,
    status: 'Paid'
  },
  {
    billNo: 'BILL-7823',
    orderId: 'ORD-1026',
    customer: 'Priya Sharma',
    method: 'Cash on delivery',
    transactionId: 'COD-SIRI-730245',
    subtotal: 1345,
    deliveryFee: 20,
    paid: 1365,
    status: 'Paid'
  }
];

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadCsv = (filename, rows) => {
  const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const getStoredList = (key) => {
  try {
    const saved = key ? localStorage.getItem(key) : null;
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const Admin = () => {
  const navigate = useNavigate();
  const editFormRef = useRef(null);
  const [adminSession, setAdminSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminMode, setAdminMode] = useState('retail'); // 'retail' | 'wholesale'
  const [searchQuery, setSearchQuery] = useState('');

  // ── Separate state for retail vs wholesale products ──
  const [retailProducts, setRetailProducts] = useState(() =>
    readStorage(ADMIN_PRODUCTS_RETAIL_KEY, baseProducts.map(product => ({
      ...product,
      stockNote: product.inStock ? 'In stock' : 'Out of stock'
    })))
  );
  const [wholesaleProducts, setWholesaleProducts] = useState(() =>
    readStorage(ADMIN_PRODUCTS_WHOLESALE_KEY, getAllProducts('wholesale').map(product => ({
      ...product,
      stockNote: product.inStock ? 'In stock' : 'Out of stock'
    })))
  );

  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [productDraft, setProductDraft] = useState(blankProduct);
  const [apiLoading, setApiLoading] = useState(false);
  const [saveToast, setSaveToast] = useState(null); // { type: 'success'|'error', msg }
  const [liveOrders, setLiveOrders] = useState(null); // null = not yet loaded
  const [liveCustomers, setLiveCustomers] = useState(null);
  const adminApi = useAdminApi();
  const [newOrderToast, setNewOrderToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null); // { type: 'success'|'error', msg }
  const [selectedMonth, setSelectedMonth] = useState('lifetime');

  const getCustomerName = (userId) => {
    if (!liveCustomers) return 'Customer';
    const c = liveCustomers.find(u => u.id === userId);
    return c ? (c.name || c.email || 'Customer') : 'Customer';
  };

  // Play synthetic ding-dong notification chime using Web Audio API
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.3);
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109.73, audioCtx.currentTime); // C#6
        gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.4);
      }, 120);
    } catch (err) {
      console.warn("Failed to play notification audio:", err);
    }
  };

  const [offerDraft, setOfferDraft] = useState(blankOffer);
  const [couponDraft, setCouponDraft] = useState(blankCoupon);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [adminDraft, setAdminDraft] = useState(blankAdmin);
  const [adminError, setAdminError] = useState('');
  const [contentSearch, setContentSearch] = useState('');
  const [bestsellerSearch, setBestsellerSearch] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [dbCategories, setDbCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: '', image: '', color: '#F7F4EE' });
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [newZone, setNewZone] = useState({ area: '', pincode: '', time: '30 mins', distance: '', deliveryFee: 0, freeDeliveryThreshold: 0, handlingCharge: 0 });
  const [savedZoneIds, setSavedZoneIds] = useState({});
  // Variant builder: predefined checkboxes + custom entries
  const defaultVariantOptions = ['100 g','200 g','250 g','500 g','1 kg','2 kg','5 kg','10 kg','100 ml','200 ml','500 ml','1 L','5 L','15 L'];
  const [checkedVariants, setCheckedVariants] = useState([]);
  const [variantPrices, setVariantPrices] = useState({});
  const [customVariants, setCustomVariants] = useState([{ label: '', price: '' }]);

  // ── Separate persist functions ──
  const persistRetailProducts = (next) => {
    setRetailProducts(next);
    writeStorage(ADMIN_PRODUCTS_RETAIL_KEY, next);
  };

  const persistWholesaleProducts = (next) => {
    setWholesaleProducts(next);
    writeStorage(ADMIN_PRODUCTS_WHOLESALE_KEY, next);
  };

  const normalizeOffer = (o) => ({ ...o, group: o.groupType || o.group || 'daily' });

  // ── Load products from DB on mount ──
  useEffect(() => {
    adminApi.fetchProducts().then(dbProducts => {
      if (!dbProducts || dbProducts.length === 0) return;
      // Separate retail (no wholesalePrice) vs wholesale
      const retail = dbProducts.filter(p => !p.wholesalePrice);
      const ws = dbProducts.filter(p => p.wholesalePrice);
      if (retail.length > 0) persistRetailProducts(retail.map(p => ({ ...p, stockNote: p.inStock ? 'In stock' : 'Out of stock' })));
      if (ws.length > 0) persistWholesaleProducts(ws.map(p => ({ ...p, stockNote: p.inStock ? 'In stock' : 'Out of stock' })));
    }).catch(() => { /* offline – localStorage fallback still works */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Check real admin session on mount ──
  useEffect(() => {
    adminApi.me().then(session => {
      setAdminSession(session);
      setSessionChecked(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load live orders, customers, offers, coupons, zones, categories, admins on mount ──
  useEffect(() => {
    adminApi.fetchAllOrders().then(setLiveOrders).catch(() => setLiveOrders([]));
    adminApi.fetchAllUsers().then(setLiveCustomers).catch(() => setLiveCustomers([]));
    adminApi.fetchOffers().then(data => setOffers(data.map(normalizeOffer))).catch(() => {});
    adminApi.fetchCoupons().then(setCoupons).catch(() => {});
    adminApi.fetchDeliveryZones().then(setDeliveryZones).catch(() => {});
    adminApi.fetchCategories().then(setDbCategories).catch(() => {});
    adminApi.fetchAdminUsers().then(setAdminAccounts).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for new orders every 10 seconds to notify active admin dashboard users
  useEffect(() => {
    if (!adminSession) return;

    const interval = setInterval(async () => {
      try {
        const freshOrders = await adminApi.fetchAllOrders();
        if (Array.isArray(freshOrders)) {
          setLiveOrders(prev => {
            if (prev !== null && freshOrders.length > prev.length) {
              const prevIds = new Set(prev.map(o => o.id));
              const newOrders = freshOrders.filter(o => !prevIds.has(o.id));
              if (newOrders.length > 0) {
                const latest = newOrders[0];
                playChime();
                setNewOrderToast({
                  id: latest.id,
                  total: latest.total,
                  msg: `New Order placed: Order #${latest.id} for ₹${latest.total}!`
                });
                // Auto dismiss toast after 8 seconds
                setTimeout(() => setNewOrderToast(null), 8000);
              }
            }
            return freshOrders;
          });
        }
      } catch (err) {
        console.error("Order polling failed:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [adminSession, adminApi]);

  // ── Switch mode and reset draft to appropriate blank ──
  const switchMode = (mode) => {
    setAdminMode(mode);
    setProductDraft(mode === 'wholesale' ? blankWholesaleProduct : blankProduct);
  };

  // ── Filtered products per tab ──
  const filteredRetailProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return retailProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }, [retailProducts, searchQuery]);

  const filteredWholesaleProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return wholesaleProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.brand || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }, [wholesaleProducts, searchQuery]);

  // keep for legacy references
  const filteredProducts = activeTab === 'wholesale-products' ? filteredWholesaleProducts : filteredRetailProducts;

  const allProducts = [...retailProducts, ...wholesaleProducts];

  const stats = [
    { label: 'Retail products', value: retailProducts.length, icon: FiPackage },
    { label: 'Wholesale products', value: wholesaleProducts.length, icon: FiPackage },
    { label: 'Live offers', value: offers.filter(offer => offer.active).length, icon: FiGift },
    { label: 'Coupons', value: coupons.filter(coupon => coupon.active).length, icon: FiTag },
    { label: 'Customers', value: liveCustomers ? liveCustomers.length : 0, icon: FiUsers },
    { label: 'Orders', value: liveOrders ? liveOrders.length : 0, icon: FiTruck },
  ];

  const productSales = useMemo(() => {
    const sales = {};
    if (liveOrders) {
      liveOrders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            const prodId = item.productId || item.id;
            const qty = parseInt(item.quantity || 1, 10);
            if (prodId) {
              if (!sales[prodId]) {
                const matchedProd = allProducts.find(p => p.id === prodId);
                sales[prodId] = {
                  id: prodId,
                  name: item.name || (matchedProd ? matchedProd.name : 'Unknown Product'),
                  weight: item.weight || (matchedProd ? matchedProd.weight : ''),
                  unit: item.unit || (matchedProd ? matchedProd.unit : ''),
                  category: matchedProd ? (wholesaleProducts.some(w => w.id === prodId) ? 'Wholesale' : 'Retail') : 'Retail',
                  price: item.price || (matchedProd ? matchedProd.price : 0),
                  quantitySold: 0,
                  ordersCount: 0,
                  totalRevenue: 0
                };
              }
              sales[prodId].quantitySold += qty;
              sales[prodId].ordersCount += 1;
              sales[prodId].totalRevenue += (item.price || 0) * qty;
            }
          });
        }
      });
    }
    return Object.values(sales).sort((a, b) => b.quantitySold - a.quantitySold);
  }, [liveOrders, allProducts, wholesaleProducts]);

  const parseOrderDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return dateVal;
    let cleanStr = String(dateVal).trim();
    if (cleanStr.includes(' ')) {
      cleanStr = cleanStr.replace(' ', 'T');
    }
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) {
      const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
      }
    }
    return d;
  };

  const availableMonths = useMemo(() => {
    if (!liveOrders) return [];
    const monthsMap = {};
    liveOrders.forEach(order => {
      if (order.createdAt) {
        const d = parseOrderDate(order.createdAt);
        if (d && !isNaN(d.getTime())) {
          const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
          monthsMap[monthKey] = label;
        }
      }
    });
    return Object.entries(monthsMap).sort((a, b) => b[0].localeCompare(a[0]));
  }, [liveOrders]);

  const periodStats = useMemo(() => {
    let filtered = liveOrders || [];
    if (selectedMonth !== 'lifetime') {
      filtered = (liveOrders || []).filter(order => {
        if (!order.createdAt) return false;
        const d = parseOrderDate(order.createdAt);
        if (!d || isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      });
    }

    let retailQty = 0;
    let retailRevenue = 0;
    let wholesaleQty = 0;
    let wholesaleRevenue = 0;
    const productSalesMap = {};

    filtered.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const prodId = item.productId || item.id;
          const qty = parseInt(item.quantity || 1, 10);
          const price = item.price || 0;
          const isWS = wholesaleProducts.some(w => w.id === prodId);

          if (isWS) {
            wholesaleQty += qty;
            wholesaleRevenue += price * qty;
          } else {
            retailQty += qty;
            retailRevenue += price * qty;
          }

          if (prodId) {
            if (!productSalesMap[prodId]) {
              const matchedProd = allProducts.find(p => p.id === prodId);
              productSalesMap[prodId] = {
                id: prodId,
                name: item.name || (matchedProd ? matchedProd.name : 'Unknown Product'),
                quantitySold: 0,
              };
            }
            productSalesMap[prodId].quantitySold += qty;
          }
        });
      }
    });

    const topItems = Object.values(productSalesMap)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    return {
      retailQty,
      retailRevenue,
      wholesaleQty,
      wholesaleRevenue,
      topItems
    };
  }, [liveOrders, selectedMonth, allProducts, wholesaleProducts]);

  const donutSegments = useMemo(() => {
    let filtered = liveOrders || [];
    if (selectedMonth !== 'lifetime') {
      filtered = (liveOrders || []).filter(order => {
        if (!order.createdAt) return false;
        const d = parseOrderDate(order.createdAt);
        if (!d || isNaN(d.getTime())) return false;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return key === selectedMonth;
      });
    }

    let totalQty = 0;
    const allItemsMap = {};

    filtered.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const qty = parseInt(item.quantity || 1, 10);
          const name = item.name;
          if (name) {
            allItemsMap[name] = (allItemsMap[name] || 0) + qty;
            totalQty += qty;
          }
        });
      }
    });

    const sortedAll = Object.entries(allItemsMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const top4 = sortedAll.slice(0, 4);
    const top4Sum = top4.reduce((sum, item) => sum + item.qty, 0);
    const othersQty = Math.max(0, totalQty - top4Sum);

    const result = top4.map((item, idx) => {
      const colors = ['#2D5016', '#5B8C3F', '#FCD34D', '#FF6B35'];
      return {
        name: item.name,
        qty: item.qty,
        pct: totalQty > 0 ? (item.qty / totalQty) * 100 : 0,
        color: colors[idx]
      };
    });

    if (othersQty > 0) {
      result.push({
        name: 'Others',
        qty: othersQty,
        pct: (othersQty / totalQty) * 100,
        color: '#9CA3AF'
      });
    }

    return result;
  }, [liveOrders, selectedMonth]);

  const exportItems = () => {
    const isWS = activeTab === 'wholesale-products' || activeTab === 'wholesale-content';
    const source = isWS ? wholesaleProducts : retailProducts;
    downloadCsv(`siri-traders-${isWS ? 'wholesale' : 'retail'}-items.csv`, [
      ['ID', 'Name', 'Brand', 'Category', 'Price', 'MRP', 'Discount', 'Stock', 'Description'],
      ...source.map(p => [p.id, p.name, p.brand, p.category, p.price, p.mrp, p.discount, p.stockNote, p.description])
    ]);
  };

  const exportCustomers = () => downloadCsv('siri-traders-customers.csv', [
    ['Name', 'Email', 'Phone', 'Orders', 'Total Spent'],
    ...(liveCustomers || []).map(customer => [
      customer.name,
      customer.email,
      customer.phone,
      customer.ordersCount || 0,
      customer.totalSpent || 0
    ])
  ]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProductDraft(prev => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleOfferImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setOfferDraft(prev => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    const isWholesale = activeTab === 'wholesale-products';

    // Build variants from checked options + custom entries
    const builtVariants = [
      ...checkedVariants
        .filter(label => variantPrices[label])
        .map(label => ({ label, price: Number(variantPrices[label]) || 0 })),
      ...customVariants
        .filter(v => v.label.trim() && v.price)
        .map(v => ({ label: v.label.trim(), price: Number(v.price) || 0 }))
    ];

    const baseNext = {
      ...productDraft,
      price: Number(productDraft.price) || (builtVariants[0]?.price || 0),
      mrp: Number(productDraft.mrp) || Number(productDraft.price) || 0,
      discount: Number(productDraft.discount) || 0,
      image: productDraft.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
      inStock: productDraft.stockNote !== 'Out of stock',
      isBestseller: Boolean(productDraft.isBestseller),
      isTodaysDeal: Boolean(productDraft.isTodaysDeal),
      variants: builtVariants.length > 0 ? builtVariants : undefined
    };

    let nextProduct = baseNext;
    if (isWholesale) {
      const variants = builtVariants.length > 0 ? builtVariants : [];
      if (baseNext.weight && baseNext.price && variants.length === 0) {
        variants.push({ label: `${baseNext.weight} ${baseNext.unit}`, price: baseNext.price });
      }
      if (productDraft.bulkPackLabel && productDraft.bulkPackPrice) {
        variants.push({ label: productDraft.bulkPackLabel, price: Number(productDraft.bulkPackPrice) || 0 });
      }
      if (productDraft.wholesaleCaseLabel && productDraft.wholesaleCasePrice) {
        variants.push({ label: productDraft.wholesaleCaseLabel, price: Number(productDraft.wholesaleCasePrice) || 0 });
      }
      nextProduct = {
        ...baseNext,
        wholesalePrice: Number(productDraft.wholesalePrice) || baseNext.price,
        bulkPackLabel: productDraft.bulkPackLabel || '',
        bulkPackPrice: Number(productDraft.bulkPackPrice) || 0,
        wholesaleCaseLabel: productDraft.wholesaleCaseLabel || '',
        wholesaleCasePrice: Number(productDraft.wholesaleCasePrice) || 0,
        variants: variants.length > 0 ? variants : undefined
      };
    }

    // ── API sync ──────────────────────────────────────────────────────
    setApiLoading(true);
    setSaveToast(null);
    try {
      const isEdit = Boolean(productDraft.id && typeof productDraft.id === 'number');
      // Strip UI-only fields that are not in the DB schema
      const { stockNote, id: _id, wholesalePrice, bulkPackLabel, bulkPackPrice,
              wholesaleCaseLabel, wholesaleCasePrice, ...apiPayload } = nextProduct;
      if (isEdit) {
        const saved = await adminApi.updateProduct(productDraft.id, apiPayload);
        nextProduct = { ...nextProduct, id: saved.id };
      } else {
        const saved = await adminApi.createProduct(apiPayload);
        nextProduct = { ...nextProduct, id: saved.id };
      }
      setSaveToast({ type: 'success', msg: `✅ “${nextProduct.name}” saved to database (ID: ${nextProduct.id})` });
      setTimeout(() => setSaveToast(null), 5000);
    } catch (err) {
      console.error('API sync failed:', err);
      if (!productDraft.id) nextProduct = { ...nextProduct, id: Date.now() };
      setSaveToast({ type: 'error', msg: `⚠️ Saved locally only. DB error: ${err.message}` });
      setTimeout(() => setSaveToast(null), 8000);
    } finally {
      setApiLoading(false);
    }

    if (isWholesale) {
      const exists = wholesaleProducts.some(p => String(p.id) === String(nextProduct.id));
      const next = exists
        ? wholesaleProducts.map(p => String(p.id) === String(nextProduct.id) ? nextProduct : p)
        : [nextProduct, ...wholesaleProducts];
      persistWholesaleProducts(next);
      setProductDraft(blankWholesaleProduct);
    } else {
      const exists = retailProducts.some(p => String(p.id) === String(nextProduct.id));
      const next = exists
        ? retailProducts.map(p => String(p.id) === String(nextProduct.id) ? nextProduct : p)
        : [nextProduct, ...retailProducts];
      persistRetailProducts(next);
      setProductDraft(blankProduct);
    }
    // Reset variant builder
    setCheckedVariants([]);
    setVariantPrices({});
    setCustomVariants([{ label: '', price: '' }]);
  };

  const editProduct = (product) => {
    const isWholesale = Boolean(product.wholesalePrice);
    const isProductsTab = activeTab === 'retail-products' || activeTab === 'wholesale-products';
    const targetTab = isProductsTab ? activeTab : (isWholesale ? 'wholesale-products' : 'retail-products');
    setProductDraft({
      ...product,
      price: String(product.price),
      mrp: String(product.mrp),
      discount: String(product.discount),
      wholesalePrice: product.wholesalePrice != null ? String(product.wholesalePrice) : '',
      bulkPackLabel: product.bulkPackLabel || '',
      bulkPackPrice: product.bulkPackPrice != null ? String(product.bulkPackPrice) : '',
      wholesaleCaseLabel: product.wholesaleCaseLabel || '',
      wholesaleCasePrice: product.wholesaleCasePrice != null ? String(product.wholesaleCasePrice) : ''
    });
    setActiveTab(targetTab);
    // Wait for tab to render then scroll to the edit form
    setTimeout(() => {
      const editForm = document.querySelector('.admin-workspace .admin-form');
      editForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // updateProductStock: applies to the correct array + syncs to API
  const updateProductStock = async (productId, stockNote, isWholesale) => {
    const inStock = stockNote !== 'Out of stock';
    if (isWholesale) {
      persistWholesaleProducts(wholesaleProducts.map(p =>
        p.id === productId ? { ...p, stockNote, inStock } : p
      ));
    } else {
      persistRetailProducts(retailProducts.map(p =>
        p.id === productId ? { ...p, stockNote, inStock } : p
      ));
    }
    // Only sync numeric IDs (DB rows)
    if (typeof productId === 'number') {
      adminApi.updateProduct(productId, { inStock }).catch(err =>
        console.warn('Stock sync failed:', err)
      );
    }
  };

  // removeProduct: removes from the correct mode's array + syncs to API
  const removeProduct = async (productId) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    if (activeTab === 'wholesale-products') {
      persistWholesaleProducts(wholesaleProducts.filter(p => p.id !== productId));
    } else {
      persistRetailProducts(retailProducts.filter(p => p.id !== productId));
    }
    // Only sync numeric IDs (DB rows)
    if (typeof productId === 'number') {
      adminApi.deleteProduct(productId).catch(err =>
        console.warn('Delete sync failed:', err)
      );
    }
  };

  const toggleProductFlag = async (productId, field, currentValue, isWholesale) => {
    const nextValue = !currentValue;
    const updater = (p) => p.id === productId ? { ...p, [field]: nextValue } : p;
    if (isWholesale) {
      persistWholesaleProducts(wholesaleProducts.map(updater));
    } else {
      persistRetailProducts(retailProducts.map(updater));
    }
    if (typeof productId === 'number') {
      try {
        await adminApi.updateProduct(productId, { [field]: nextValue });
      } catch (err) {
        console.warn(`${field} toggle failed:`, err);
        const reverter = (p) => p.id === productId ? { ...p, [field]: currentValue } : p;
        if (isWholesale) {
          persistWholesaleProducts(wholesaleProducts.map(reverter));
        } else {
          persistRetailProducts(retailProducts.map(reverter));
        }
        alert(`Failed to update ${field}: ${err.message}`);
      }
    }
  };

  const saveOffer = async (event) => {
    event.preventDefault();
    const festiveKeywords = /diwali|eid|holi|christmas|navratri|rakhi|onam|sankranti|ramzan|ugadi|ganesh|dussehra|festival|wedding|party/i;
    const group = festiveKeywords.test(offerDraft.title + ' ' + offerDraft.badge) ? 'festival' : 'daily';
    const payload = {
      ...offerDraft,
      group,
      price: Number(offerDraft.price) || 0,
      mrp: Number(offerDraft.mrp) || 0,
      active: true,
      image: offerDraft.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&q=80'
    };
    try {
      const saved = normalizeOffer(await adminApi.saveOffer(payload));
      setOffers(prev => [saved, ...prev.filter(offer => offer.id !== saved.id)]);
      setOfferDraft(blankOffer);
    } catch (err) {
      alert(err.message);
    }
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    const payload = {
      ...couponDraft,
      code: couponDraft.code.trim().toUpperCase(),
      value: Number(couponDraft.value) || 0,
      minOrder: Number(couponDraft.minOrder) || 0,
      maxDiscount: couponDraft.maxDiscount ? Number(couponDraft.maxDiscount) : null
    };
    try {
      const saved = await adminApi.saveCoupon(payload);
      setCoupons(prev => [saved, ...prev.filter(coupon => coupon.id !== saved.id)]);
      setCouponDraft(blankCoupon);
    } catch (err) {
      alert(err.message);
    }
  };

  const saveAdmin = async (event) => {
    event.preventDefault();
    setAdminError('');
    const email = adminDraft.email.trim().toLowerCase();
    if (!adminDraft.name.trim() || !email || !adminDraft.password.trim()) return;
    try {
      await adminApi.createAdminUser({
        name: adminDraft.name.trim(),
        email,
        password: adminDraft.password,
        role: adminDraft.role
      });
      const refreshed = await adminApi.fetchAdminUsers();
      setAdminAccounts(refreshed);
      setAdminDraft(blankAdmin);
    } catch (err) {
      setAdminError(err.message || 'Failed to create admin');
    }
  };

  const updateProductField = (productId, field, value, isWholesale) => {
    const updater = (p) =>
      p.id === productId
        ? {
            ...p,
            [field]: ['price', 'mrp', 'discount'].includes(field) ? Number(value) || 0 : value,
            inStock: field === 'stockNote' ? value !== 'Out of stock' : p.inStock
          }
        : p;
    if (isWholesale) {
      persistWholesaleProducts(wholesaleProducts.map(updater));
    } else {
      persistRetailProducts(retailProducts.map(updater));
    }
  };

  // filteredContentProducts uses the correct array based on active tab
  const filteredContentProducts = (activeTab === 'wholesale-content' ? wholesaleProducts : retailProducts).filter(product =>
    product.name.toLowerCase().includes(contentSearch.toLowerCase()) ||
    (product.brand || '').toLowerCase().includes(contentSearch.toLowerCase())
  );

  const handleAdminLogout = async () => {
    await adminApi.logout();
    setAdminSession(null);
    navigate('/admin-login');
  };

  if (!sessionChecked) {
    return <div className="admin-auth-required" />;
  }

  if (!adminSession) {
    return (
      <div className="admin-auth-required">
        <div className="admin-denied">
          <FiLock className="admin-denied__icon" />
          <h2>Admin login required</h2>
          <p>This admin page is separate from customer login.</p>
          <button className="admin-denied__btn" onClick={() => navigate('/admin-login')}>Go to Admin Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper admin-page-wrapper">
      {newOrderToast && (
        <div className="admin-new-order-toast">
          <div className="admin-new-order-toast__content">
            <span className="admin-new-order-toast__icon">🛍️</span>
            <div>
              <strong>New Order Received!</strong>
              <p>{newOrderToast.msg}</p>
            </div>
          </div>
          <button className="admin-new-order-toast__close" onClick={() => setNewOrderToast(null)}>×</button>
        </div>
      )}
      {/* Mobile top header bar */}
      <div className="admin-mobile-header">
        <div className="admin-mobile-header__brand">
          <img src="/logo-mark.webp" alt="Siri Traders" className="admin-mobile-logo" />
          <span>Siri Traders Admin</span>
        </div>
        <button className="admin-mobile-hamburger" onClick={() => setMobileMenuOpen(prev => !prev)} aria-label="Toggle menu">
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`hamburger-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        </button>
      </div>

      <div className="admin-layout">
        {/* Left Sidebar */}
        <aside className={`admin-sidebar ${mobileMenuOpen ? 'admin-sidebar--open' : ''}`}>
          <div className="admin-sidebar__brand">
            <img src="/logo-mark.webp" alt="Siri Traders" className="admin-sidebar__logo" />
            <div>
              <strong>SIRI TRADERS</strong>
              <span>Control Center</span>
            </div>
          </div>

          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">
              {adminSession.name ? adminSession.name[0].toUpperCase() : 'A'}
            </div>
            <div className="admin-sidebar__user-info">
              <strong>{adminSession.name || 'Admin'}</strong>
              <span>{String(adminSession.role || 'Administrator').toUpperCase()}</span>
            </div>
          </div>

          <nav className="admin-sidebar__nav">
            {[
              ['dashboard',          'Overview',          FiBarChart2],
              ['retail-products',    'Retail Items',      FiPackage],
              ['wholesale-products', 'Wholesale Items',   FiPackage],
              ['offers',             'Offers & coupons',  FiGift],
              ['bestsellers',        'Bestsellers',        FiStar],
              ['todays-deals',       "Today's Deals",      FiTag],
              ['customers',          'Customers',         FiUsers],
              ['orders',             'Orders & Bills',    FiShoppingBag],
              ['sales-stats',        'Product Sales',     FiTrendingUp],
              ['broadcast',          'Email Broadcast',   FiMail],
              ['retail-content',     'Retail Content',    FiEdit2],
              ['wholesale-content',  'Wholesale Content', FiEdit2],
              ['delivery-zones',     'Delivery Zones',    FiTruck],
              ['admins',             'Admins',            FiLock]
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                className={activeTab === id ? 'admin-sidebar__nav-item admin-sidebar__nav-item--active' : 'admin-sidebar__nav-item'}
                onClick={() => {
                  setActiveTab(id);
                  setMobileMenuOpen(false);
                }}
              >
                <Icon /> <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="admin-sidebar__footer">
            <button className="admin-sidebar__logout" onClick={handleAdminLogout}>
              <FiLogOut /> <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="admin-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Right Main Content area */}
        <main className="admin-main">
          <header className="admin-main-header">
            <div>
              <span className="admin-main-eyebrow">Control Panel / {activeTab.replace('-', ' ')}</span>
              <h1>{activeTab === 'dashboard' ? 'Overview Management' : activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</h1>
            </div>
            
            <div className="admin-main-header__actions">
              <a href="/home" target="_blank" rel="noopener noreferrer" className="admin-main-header__btn">
                Launch Site →
              </a>
            </div>
          </header>

          {/* Quick stats section (only visible on Overview / dashboard tab!) */}
          {activeTab === 'dashboard' && (
            <section className="admin__stats">
              {stats.map(stat => (
                <div key={stat.label} className="admin__stat-card">
                  <stat.icon />
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </section>
          )}

          {activeTab === 'dashboard' && (
            <section className="admin-card admin-card--wide" style={{ marginBottom: '20px' }}>
              <div className="admin-card__toolbar" style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Sales & Product Analytics</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                      Visual representation of product distribution and retail vs wholesale sales splits.
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>Select Period:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border-light)',
                        fontSize: '13px',
                        fontWeight: '600',
                        outline: 'none',
                        cursor: 'pointer',
                        background: '#FFFFFF'
                      }}
                    >
                      <option value="lifetime">Lifetime Sales</option>
                      {availableMonths.map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
                <div style={{ padding: '16px', background: '#FAF9F6', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#2D5016', fontWeight: 'bold' }}>Product Sales Distribution</h3>
                  
                  {liveOrders === null ? (
                    <p style={{ fontSize: '13px', color: '#687466' }}>Loading distribution data…</p>
                  ) : donutSegments.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#687466', textAlign: 'center', padding: '30px 0' }}>No sales data available for this period.</p>
                  ) : (() => {
                    const totalQty = donutSegments.reduce((sum, s) => sum + s.qty, 0);
                    const strokeWidth = 12;
                    const radius = 38;
                    const circ = 2 * Math.PI * radius;
                    let currentOffset = 0;

                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <div style={{ position: 'relative', width: '130px', height: '130px' }}>
                          <svg width="130" height="130" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                            <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="transparent"
                              stroke="#E5E7EB"
                              strokeWidth={strokeWidth}
                            />
                            {donutSegments.map((segment, idx) => {
                              const strokeLength = (segment.pct / 100) * circ;
                              const strokeOffset = currentOffset;
                              currentOffset -= strokeLength;

                              return (
                                <circle
                                  key={idx}
                                  cx="50"
                                  cy="50"
                                  r={radius}
                                  fill="transparent"
                                  stroke={segment.color}
                                  strokeWidth={strokeWidth}
                                  strokeDasharray={`${strokeLength} ${circ}`}
                                  strokeDashoffset={strokeOffset}
                                />
                              );
                            })}
                          </svg>
                          <div style={{
                            position: 'absolute',
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center'
                          }}>
                            <span style={{ fontSize: '10px', color: '#687466', textTransform: 'uppercase', display: 'block', fontWeight: 'bold' }}>Total Qty</span>
                            <strong style={{ fontSize: '18px', color: '#111827' }}>{totalQty}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px', maxWidth: '240px' }}>
                          {donutSegments.map((segment, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                              <div style={{ width: '10px', height: '10px', background: segment.color, borderRadius: '3px', marginTop: '3px', flexShrink: 0 }} />
                              <div style={{ lineHeight: '1.2' }}>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#111827', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '210px' }} title={segment.name}>
                                  {segment.name}
                                </span>
                                <span style={{ fontSize: '10px', color: '#687466' }}>
                                  {segment.qty} units ({segment.pct.toFixed(1)}%)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div style={{ padding: '16px', background: '#FAF9F6', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#2D5016', fontWeight: 'bold' }}>Top 5 Selling Items</h3>

                  {liveOrders === null ? (
                    <p style={{ fontSize: '13px', color: '#687466' }}>Loading top selling products…</p>
                  ) : periodStats.topItems.length === 0 ? (
                    <p style={{ fontSize: '13px', color: '#687466', textAlign: 'center', padding: '30px 0' }}>No sales data available for this period.</p>
                  ) : (() => {
                    const maxQty = Math.max(...periodStats.topItems.map(item => item.quantitySold), 1);
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {periodStats.topItems.map((item, idx) => {
                          const percentage = (item.quantitySold / maxQty) * 100;
                          return (
                            <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                <span style={{ fontWeight: '600', color: '#111827', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }} title={item.name}>
                                  {idx + 1}. {item.name}
                                </span>
                                <strong style={{ color: '#2D5016' }}>{item.quantitySold} units</strong>
                              </div>
                              <div style={{ height: '14px', background: '#E5E7EB', borderRadius: '8px', overflow: 'hidden' }}>
                                <div style={{
                                  width: `${percentage}%`,
                                  height: '100%',
                                  background: 'linear-gradient(90deg, #5B8C3F, #2D5016)',
                                  borderRadius: '8px'
                                }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

              </div>
            </section>
          )}

          {/* Store links banner */}
          {(activeTab === 'retail-products' || activeTab === 'retail-content') && (
            <div className="admin__mode-bar" style={{ marginBottom: '20px' }}>
              <span className="admin__mode-label">🛍️ Retail</span>
              <span className="admin__mode-desc">Products visible to retail customers at the home page in Retail mode</span>
              <a href="/home" target="_blank" rel="noopener noreferrer" className="admin__store-link">
                View Retail Store →
              </a>
            </div>
          )}
          {(activeTab === 'wholesale-products' || activeTab === 'wholesale-content') && (
            <div className="admin__mode-bar admin__mode-bar--wholesale" style={{ marginBottom: '20px' }}>
              <span className="admin__mode-label">📦 Wholesale</span>
              <span className="admin__mode-desc">Products visible to wholesale customers at the home page in Wholesale mode</span>
              <a href="/home" target="_blank" rel="noopener noreferrer" className="admin__store-link">
                View Wholesale Store →
              </a>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <section className="admin-grid">
              <div className="admin-card">
                <h2>Inventory health</h2>
                <div className="admin-scroll-list">
                  {allProducts.map(product => (
                    <button key={product.id} className="admin-row" onClick={() => editProduct(product)}>
                      <img src={toWebpImage(product.image)} alt={product.name} />
                      <span>{product.name}</span>
                      <strong>{product.stockNote}</strong>
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-card">
                <h2>Active campaigns</h2>
                <div className="admin-campaign-grid">
                  {offers.filter(offer => offer.active).map(offer => (
                    <div key={offer.id} className="admin-campaign">
                      {offer.image ? <img src={toWebpImage(offer.image)} alt={offer.title} /> : <FiGift />}
                      <div>
                        <span>{offer.group === 'festival' ? 'Festive offer' : 'Daily offer'}</span>
                        <strong>{offer.title}</strong>
                        <small>{offer.subtitle || offer.badge}</small>
                      </div>
                    </div>
                  ))}
                  {coupons.filter(coupon => coupon.active).map(coupon => (
                    <div key={coupon.id} className="admin-campaign">
                      <FiTag />
                      <div>
                        <span>Coupon</span>
                        <strong>{coupon.code}</strong>
                        <small>{coupon.discount}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {(activeTab === 'retail-products' || activeTab === 'wholesale-products') && (
            <section className="admin-workspace">
              <form className="admin-form" onSubmit={saveProduct}>
                <h2>{productDraft.id ? 'Edit item' : `Add ${activeTab === 'wholesale-products' ? 'Wholesale' : 'Retail'} Item`}</h2>
                <div className="admin-form__grid">
                  <input value={productDraft.name} onChange={(e) => setProductDraft(prev => ({ ...prev, name: e.target.value }))} placeholder="Product name" required />
                  <input value={productDraft.brand} onChange={(e) => setProductDraft(prev => ({ ...prev, brand: e.target.value }))} placeholder="Brand" required />
                  <select value={productDraft.category} onChange={(e) => setProductDraft(prev => ({ ...prev, category: e.target.value }))}>
                    {(dbCategories.length ? dbCategories : categories).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  <select value={productDraft.stockNote} onChange={(e) => setProductDraft(prev => ({ ...prev, stockNote: e.target.value }))}>
                    <option>In stock</option>
                    <option>Only few left</option>
                    <option>Only 10 left</option>
                    <option>Out of stock</option>
                  </select>
                  <input value={productDraft.price} onChange={(e) => setProductDraft(prev => ({ ...prev, price: e.target.value }))} placeholder="Price" type="number" required />
                  <input value={productDraft.mrp} onChange={(e) => setProductDraft(prev => ({ ...prev, mrp: e.target.value }))} placeholder="MRP" type="number" />
                  <input value={productDraft.discount} onChange={(e) => setProductDraft(prev => ({ ...prev, discount: e.target.value }))} placeholder="Discount %" type="number" />
                  <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2D5016', fontWeight: 600, cursor: 'pointer', gridColumn: 'span 1' }}>
                    <input type="checkbox" checked={Boolean(productDraft.isBestseller)} onChange={(e) => setProductDraft(prev => ({ ...prev, isBestseller: e.target.checked }))} style={{ width: 'auto', margin: 0 }} />
                    <span>Best Seller</span>
                  </label>
                  <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2D5016', fontWeight: 600, cursor: 'pointer', gridColumn: 'span 1' }}>
                    <input type="checkbox" checked={Boolean(productDraft.isTodaysDeal)} onChange={(e) => setProductDraft(prev => ({ ...prev, isTodaysDeal: e.target.checked }))} style={{ width: 'auto', margin: 0 }} />
                    <span>Today's Deal</span>
                  </label>
                  {/* Wholesale-only extra fields */}
                  {activeTab === 'wholesale-products' && (
                    <>
                      <input value={productDraft.wholesalePrice || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, wholesalePrice: e.target.value }))} placeholder="Wholesale price" type="number" />
                      <input value={productDraft.bulkPackLabel || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, bulkPackLabel: e.target.value }))} placeholder="Bulk pack label e.g. 10 kg bulk" />
                      <input value={productDraft.bulkPackPrice || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, bulkPackPrice: e.target.value }))} placeholder="Bulk pack price" type="number" />
                      <input value={productDraft.wholesaleCaseLabel || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, wholesaleCaseLabel: e.target.value }))} placeholder="Wholesale case label e.g. 25 kg case" />
                      <input value={productDraft.wholesaleCasePrice || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, wholesaleCasePrice: e.target.value }))} placeholder="Wholesale case price" type="number" />
                      <select value={productDraft.deliveryTime || 'Same day'} onChange={(e) => setProductDraft(prev => ({ ...prev, deliveryTime: e.target.value }))}>
                        <option>Same day</option>
                        <option>Next day</option>
                        <option>10 mins</option>
                        <option>15 mins</option>
                      </select>
                    </>
                  )}
                  <input value={productDraft.image} onChange={(e) => setProductDraft(prev => ({ ...prev, image: e.target.value }))} placeholder="Image URL" />
                  <label className="admin-file-input">
                    <span>Or upload image from Downloads/device</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                  </label>
                  <textarea value={productDraft.description} onChange={(e) => setProductDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" rows="3" />
                </div>

                {/* ── Variant quantity builder ── */}
                <div className="admin-variants-section">
                  <h3>Quantities / Variants</h3>
                  <p className="admin-variants-hint">Tick the sizes you want to offer, then enter a price for each. Add custom sizes below.</p>
                  <div className="admin-variants-grid">
                    {defaultVariantOptions.map(opt => (
                      <label key={opt} className={`admin-variant-check ${checkedVariants.includes(opt) ? 'admin-variant-check--active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checkedVariants.includes(opt)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCheckedVariants(prev => [...prev, opt]);
                            } else {
                              setCheckedVariants(prev => prev.filter(v => v !== opt));
                              setVariantPrices(prev => { const n = {...prev}; delete n[opt]; return n; });
                            }
                          }}
                        />
                        <span>{opt}</span>
                        {checkedVariants.includes(opt) && (
                          <input
                            type="number"
                            className="admin-variant-price"
                            placeholder="₹ price"
                            value={variantPrices[opt] || ''}
                            onChange={(e) => setVariantPrices(prev => ({ ...prev, [opt]: e.target.value }))}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="admin-custom-variants">
                    <strong>Custom quantities</strong>
                    {customVariants.map((cv, i) => (
                      <div key={i} className="admin-custom-variant-row">
                        <input
                          placeholder="Label e.g. 750 g"
                          value={cv.label}
                          onChange={(e) => {
                            const next = [...customVariants];
                            next[i] = { ...next[i], label: e.target.value };
                            setCustomVariants(next);
                          }}
                        />
                        <input
                          type="number"
                          placeholder="₹ price"
                          value={cv.price}
                          onChange={(e) => {
                            const next = [...customVariants];
                            next[i] = { ...next[i], price: e.target.value };
                            setCustomVariants(next);
                          }}
                        />
                        {customVariants.length > 1 && (
                          <button type="button" className="admin-danger admin-icon-btn" onClick={() => setCustomVariants(prev => prev.filter((_, idx) => idx !== i))}>
                            <FiTrash2 />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="admin__ghost admin-add-variant-btn" onClick={() => setCustomVariants(prev => [...prev, { label: '', price: '' }])}>
                      <FiPlus /> Add row
                    </button>
                  </div>
                </div>

                <div className="admin-form__actions" style={{ alignItems: 'center' }}>
                  <button type="submit" className="admin__primary" disabled={apiLoading}>
                    {apiLoading ? <div className="admin-spinner" /> : <FiSave />} Save item
                  </button>
                  {productDraft.id && (
                    <button type="button" className="admin__ghost" onClick={() => { setProductDraft(activeTab === 'wholesale-products' ? blankWholesaleProduct : blankProduct); setCheckedVariants([]); setVariantPrices({}); setCustomVariants([{ label: '', price: '' }]); }}>
                      <FiX /> Clear
                    </button>
                  )}
                  {saveToast && (
                    <div style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', background: saveToast.type === 'error' ? '#fee' : '#e6f4ea', color: saveToast.type === 'error' ? '#c00' : '#1e8e3e' }}>
                      {saveToast.msg}
                    </div>
                  )}
                </div>
              </form>

              {/* ── Add new category ── */}
              <div className="admin-card admin-new-cat">
                <h2>Add New Category</h2>
                <p className="admin-muted" style={{marginBottom:12}}>New category will appear in the website sidebar and shop page.</p>
                <div className="admin-form__grid">
                  <input
                    className="admin-input-box"
                    placeholder="Category name e.g. Herbal Products"
                    value={newCat.name}
                    onChange={(e) => setNewCat(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    className="admin-input-box"
                    placeholder="Image URL (from Unsplash or any link)"
                    value={newCat.image.startsWith('data:') ? '' : newCat.image}
                    onChange={(e) => setNewCat(prev => ({ ...prev, image: e.target.value }))}
                  />
                  <label className="admin-file-input">
                    <span>Or select image from your device</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => setNewCat(prev => ({ ...prev, image: reader.result }));
                        reader.readAsDataURL(file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {newCat.image && (
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <img src={newCat.image} alt="preview" style={{width:52,height:52,borderRadius:10,objectFit:'cover',border:'1px solid rgba(45,80,22,0.2)'}} />
                      <div style={{display:'flex',flexDirection:'column',gap:4}}>
                        <span style={{fontSize:12,color:'#687466'}}>Image preview</span>
                        <button
                          type="button"
                          className="admin-danger"
                          style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:6,height:'auto'}}
                          onClick={() => setNewCat(prev => ({ ...prev, image: '' }))}
                        >
                          <FiTrash2 size={12} /> Delete image
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="admin__primary"
                  style={{marginTop:12}}
                  onClick={async () => {
                    if (!newCat.name.trim()) return;
                    try {
                      const saved = await adminApi.createCategory({
                        name: newCat.name.trim(),
                        image: newCat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
                        color: '#F1F8E9'
                      });
                      setDbCategories(prev => [...prev, saved]);
                      setNewCat({ name: '', image: '', color: '#F1F8E9' });
                    } catch (err) {
                      alert(err.message);
                    }
                  }}
                >
                  <FiPlus /> Add Category
                </button>

                {dbCategories.length > 0 && (
                  <div style={{marginTop:16}}>
                    <strong style={{fontSize:12,color:'#687466',display:'block',marginBottom:8}}>Categories</strong>
                    {dbCategories.map(cat => (
                      <div key={cat.id} className="admin-row admin-row--plain" style={{marginTop:6,padding:'8px 10px',borderRadius:10,border:'1px solid rgba(45,80,22,0.1)',background:'#FAFFF6'}}>
                        {cat.image && <img src={cat.image} alt={cat.name} style={{width:38,height:38,borderRadius:8,objectFit:'cover',flexShrink:0}} />}
                        <span style={{flex:1}}>
                          {cat.name}
                          <small style={{marginLeft:8,color:'#687466',fontSize:11}}>{cat.id}</small>
                        </span>
                        <button
                          className="admin-danger"
                          style={{display:'flex',alignItems:'center',gap:4,fontSize:12,padding:'4px 10px',borderRadius:7,height:'auto'}}
                          onClick={async () => {
                            if (!window.confirm(`Delete "${cat.name}" and all its products?`)) return;
                            try {
                              await adminApi.deleteCategory(cat.id);
                              setDbCategories(prev => prev.filter(c => c.id !== cat.id));
                              persistRetailProducts(retailProducts.filter(p => p.category !== cat.id));
                              persistWholesaleProducts(wholesaleProducts.filter(p => p.category !== cat.id));
                            } catch (err) {
                              alert(err.message);
                            }
                          }}
                        >
                          <FiTrash2 size={13} /> Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-card admin-card--wide">
                <div className="admin-card__toolbar">
                  <h2>Items</h2>
                  <div className="admin-card__actions">
                    <button onClick={exportItems}>Download items</button>
                    <label><FiSearch /><input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search items" /></label>
                  </div>
                </div>
                <div className="admin-table">
                  {filteredProducts.map(product => (
                    <div key={product.id} className="admin-product">
                      <img src={toWebpImage(product.image)} alt={product.name} />
                      <div>
                        <strong>{product.name}</strong>
                        <span>{product.brand} / {product.weight}{product.unit} / {formatPrice(product.price)}</span>
                      </div>
                      <select value={product.stockNote} onChange={(e) => updateProductStock(product.id, e.target.value, adminMode === 'wholesale')}>
                        <option>In stock</option>
                        <option>Only few left</option>
                        <option>Only 10 left</option>
                        <option>Out of stock</option>
                      </select>
                      <label className="admin-toggle-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#687466', fontWeight: 600 }}>Best Seller</span>
                        <input
                          type="checkbox"
                          checked={Boolean(product.isBestseller)}
                          onChange={() => toggleProductFlag(product.id, 'isBestseller', product.isBestseller, adminMode === 'wholesale')}
                          style={{ width: 18, height: 18, cursor: 'pointer', margin: 0 }}
                        />
                      </label>
                      <label className="admin-toggle-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                        <span style={{ fontSize: 10, textTransform: 'uppercase', color: '#687466', fontWeight: 600 }}>Today's Deal</span>
                        <input
                          type="checkbox"
                          checked={Boolean(product.isTodaysDeal)}
                          onChange={() => toggleProductFlag(product.id, 'isTodaysDeal', product.isTodaysDeal, adminMode === 'wholesale')}
                          style={{ width: 18, height: 18, cursor: 'pointer', margin: 0 }}
                        />
                      </label>
                      <button onClick={() => editProduct(product)}><FiEdit2 /></button>
                      <button className="admin-danger" onClick={() => removeProduct(product.id)}><FiTrash2 /></button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'offers' && (
            <section className="admin-grid">
              <form className="admin-form" onSubmit={saveOffer}>
                <h2>Add offer or sale</h2>
                <input value={offerDraft.title} onChange={(e) => setOfferDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Offer title" required />
                <input value={offerDraft.subtitle} onChange={(e) => setOfferDraft(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="Subtitle / contents" />
                <input value={offerDraft.badge} onChange={(e) => setOfferDraft(prev => ({ ...prev, badge: e.target.value }))} placeholder="Badge text e.g. Save 20%" />
                <div className="admin-form__grid admin-form__grid--two">
                  <input value={offerDraft.price} onChange={(e) => setOfferDraft(prev => ({ ...prev, price: e.target.value }))} placeholder="Deal price (₹)" type="number" />
                  <input value={offerDraft.mrp} onChange={(e) => setOfferDraft(prev => ({ ...prev, mrp: e.target.value }))} placeholder="MRP (₹)" type="number" />
                </div>
                <div className="admin-offer-image">
                  {offerDraft.image ? (
                    <img src={toWebpImage(offerDraft.image)} alt="Offer preview" />
                  ) : (
                    <div className="admin-offer-image__empty"><FiGift /></div>
                  )}
                  <div>
                    <input value={offerDraft.image} onChange={(e) => setOfferDraft(prev => ({ ...prev, image: e.target.value }))} placeholder="Add offer image URL" />
                    <label className="admin-file-input admin-file-input--compact">
                      <span>Or choose image from files</span>
                      <input type="file" accept="image/*" onChange={handleOfferImageUpload} />
                    </label>
                  </div>
                </div>
                <button className="admin__primary"><FiPlus /> Add offer</button>
              </form>

              <form className="admin-form" onSubmit={saveCoupon}>
                <h2>Add coupon</h2>
                <input value={couponDraft.code} onChange={(e) => setCouponDraft(prev => ({ ...prev, code: e.target.value }))} placeholder="Coupon code e.g. WELCOME50" required />
                <input value={couponDraft.title} onChange={(e) => setCouponDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Banner title e.g. FLAT ₹50 OFF" />
                <input value={couponDraft.description} onChange={(e) => setCouponDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Banner subtext e.g. On your first order above ₹399" />
                <div className="admin-form__grid admin-form__grid--two">
                  <select value={couponDraft.type} onChange={(e) => setCouponDraft(prev => ({ ...prev, type: e.target.value }))}>
                    <option value="flat">Flat ₹ off</option>
                    <option value="percent">Percent % off</option>
                    <option value="freeDelivery">Free delivery</option>
                  </select>
                  <select value={couponDraft.customerType} onChange={(e) => setCouponDraft(prev => ({ ...prev, customerType: e.target.value }))}>
                    <option value="retail">Retail</option>
                    <option value="wholesale">Wholesale</option>
                  </select>
                </div>
                {couponDraft.type !== 'freeDelivery' && (
                  <div className="admin-form__grid admin-form__grid--two">
                    <input value={couponDraft.value} onChange={(e) => setCouponDraft(prev => ({ ...prev, value: e.target.value }))} placeholder={couponDraft.type === 'percent' ? 'Percent off e.g. 10' : 'Amount off (₹)'} type="number" />
                    {couponDraft.type === 'percent' && (
                      <input value={couponDraft.maxDiscount} onChange={(e) => setCouponDraft(prev => ({ ...prev, maxDiscount: e.target.value }))} placeholder="Max discount cap (₹, optional)" type="number" />
                    )}
                  </div>
                )}
                <input value={couponDraft.minOrder} onChange={(e) => setCouponDraft(prev => ({ ...prev, minOrder: e.target.value }))} placeholder="Minimum order value (₹)" type="number" />
                <button className="admin__primary"><FiPlus /> Add coupon</button>
              </form>

              {/* All Offers — unified list */}
              <div className="admin-card admin-card--wide" style={{gridColumn:'1 / -1'}}>
                <div className="admin-card__toolbar">
                  <h2>All Offers ({offers.length})</h2>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {offers.map(offer => (
                    <div key={offer.id} className="admin-row admin-row--plain admin-row--offer" style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:10,border:'1px solid rgba(45,80,22,0.1)',background:'#FAFFF6'}}>
                      {offer.image
                        ? <img src={toWebpImage(offer.image)} alt={offer.title} style={{width:52,height:40,objectFit:'cover',borderRadius:8,flexShrink:0}} />
                        : <div style={{width:52,height:40,borderRadius:8,background:'#E8F5E9',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><FiGift /></div>
                      }
                      <div style={{flex:1,minWidth:0}}>
                        <strong style={{display:'block',fontSize:13,color:'#2D5016'}}>{offer.title}</strong>
                        <span style={{fontSize:11,color:'#687466'}}>{offer.subtitle} · {offer.badge}</span>
                        {offer.price > 0 && <span style={{fontSize:11,color:'#3A6B1A',marginLeft:8}}>₹{offer.price}</span>}
                      </div>
                      <span style={{fontSize:10,fontWeight:800,padding:'3px 8px',borderRadius:6,background: offer.group === 'festival' ? '#FFF8E1' : '#E8F5E9',color: offer.group === 'festival' ? '#F57F17' : '#2D5016',flexShrink:0}}>
                        {offer.group === 'festival' ? 'Festive' : 'Daily'}
                      </span>
                      <button
                        style={{padding:'4px 10px',borderRadius:7,border:'1px solid rgba(45,80,22,0.2)',background: offer.active ? '#E8F5E9' : '#F5F5F5',color: offer.active ? '#2D5016' : '#9ca3af',fontSize:11,fontWeight:800,flexShrink:0,cursor:'pointer'}}
                        onClick={async () => {
                          try {
                            const updated = normalizeOffer(await adminApi.updateOffer(offer.id, { active: !offer.active }));
                            setOffers(prev => prev.map(item => item.id === offer.id ? updated : item));
                          } catch (err) { alert(err.message); }
                        }}
                      >
                        {offer.active ? 'Live' : 'Paused'}
                      </button>
                      <button className="admin-danger" style={{flexShrink:0,width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={async () => {
                        try {
                          await adminApi.deleteOffer(offer.id);
                          setOffers(prev => prev.filter(item => item.id !== offer.id));
                        } catch (err) { alert(err.message); }
                      }}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coupons */}
              <div className="admin-card">
                <h2>Coupons</h2>
                {coupons.map(coupon => (
                  <div key={coupon.id} className="admin-row admin-row--plain">
                    <FiTag />
                    <span>
                      {coupon.code} — {coupon.type === 'percent' ? `${coupon.value}% off` : coupon.type === 'freeDelivery' ? 'Free delivery' : `₹${coupon.value} off`}
                      {coupon.minOrder > 0 && <small> Min ₹{coupon.minOrder} · {coupon.customerType}</small>}
                    </span>
                    <button onClick={async () => {
                      try {
                        const updated = await adminApi.updateCoupon(coupon.id, { active: !coupon.active });
                        setCoupons(prev => prev.map(item => item.id === coupon.id ? updated : item));
                      } catch (err) { alert(err.message); }
                    }}>{coupon.active ? 'Active' : 'Off'}</button>
                    <button className="admin-danger" onClick={async () => {
                      try {
                        await adminApi.deleteCoupon(coupon.id);
                        setCoupons(prev => prev.filter(item => item.id !== coupon.id));
                      } catch (err) { alert(err.message); }
                    }}><FiTrash2 /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'bestsellers' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Bestsellers ({allProducts.filter(p => p.isBestseller).length})</h2>
                <label className="admin-search-label">
                  <FiSearch />
                  <input value={bestsellerSearch} onChange={(e) => setBestsellerSearch(e.target.value)} placeholder="Search products..." />
                </label>
              </div>
              <p className="admin-muted" style={{ marginBottom: 12 }}>
                Tick a product to feature it in the Bestsellers row on the home page and the Bestsellers page. Untick to remove it.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allProducts
                  .filter(p =>
                    p.name.toLowerCase().includes(bestsellerSearch.toLowerCase()) ||
                    (p.brand || '').toLowerCase().includes(bestsellerSearch.toLowerCase())
                  )
                  .map(product => (
                    <div key={product.id} className="admin-row admin-row--plain" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                      <img src={toWebpImage(product.image)} alt={product.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <strong>{product.name}</strong>
                        <span style={{ fontSize: 12, color: '#687466' }}>
                          {product.brand} / {product.weight}{product.unit} / {formatPrice(product.price)}
                          {product.wholesalePrice ? <strong style={{ marginLeft: 8, color: '#FF6B35' }}>(Wholesale)</strong> : null}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          type="button"
                          className="admin__ghost"
                          onClick={() => editProduct(product)}
                          style={{ padding: '6px 10px', height: 'auto', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: '1px solid rgba(45,80,22,0.2)' }}
                        >
                          <FiEdit2 size={13} /> Edit
                        </button>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: product.isBestseller ? '#2D5016' : '#687466', cursor: 'pointer', flexShrink: 0, margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(product.isBestseller)}
                            onChange={() => toggleProductFlag(product.id, 'isBestseller', product.isBestseller, Boolean(product.wholesalePrice))}
                            style={{ margin: 0, width: 'auto' }}
                          />
                          {product.isBestseller ? 'Bestseller' : 'Add'}
                        </label>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {activeTab === 'todays-deals' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Today's Deals ({allProducts.filter(p => p.isTodaysDeal).length})</h2>
                <label className="admin-search-label">
                  <FiSearch />
                  <input value={dealSearch} onChange={(e) => setDealSearch(e.target.value)} placeholder="Search products..." />
                </label>
              </div>
              <p className="admin-muted" style={{ marginBottom: 12 }}>
                Tick a product to feature it in Today's Deals on the home page and the Today's Deals page. Untick to remove it.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allProducts
                  .filter(p =>
                    p.name.toLowerCase().includes(dealSearch.toLowerCase()) ||
                    (p.brand || '').toLowerCase().includes(dealSearch.toLowerCase())
                  )
                  .map(product => (
                    <div key={product.id} className="admin-row admin-row--plain" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                      <img src={toWebpImage(product.image)} alt={product.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <strong>{product.name}</strong>
                        <span style={{ fontSize: 12, color: '#687466' }}>
                          {product.brand} / {product.weight}{product.unit} / {formatPrice(product.price)}
                          {product.wholesalePrice ? <strong style={{ marginLeft: 8, color: '#FF6B35' }}>(Wholesale)</strong> : null}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                          type="button"
                          className="admin__ghost"
                          onClick={() => editProduct(product)}
                          style={{ padding: '6px 10px', height: 'auto', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: '1px solid rgba(45,80,22,0.2)' }}
                        >
                          <FiEdit2 size={13} /> Edit
                        </button>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: product.isTodaysDeal ? '#2D5016' : '#687466', cursor: 'pointer', flexShrink: 0, margin: 0 }}>
                          <input
                            type="checkbox"
                            checked={Boolean(product.isTodaysDeal)}
                            onChange={() => toggleProductFlag(product.id, 'isTodaysDeal', product.isTodaysDeal, Boolean(product.wholesalePrice))}
                            style={{ margin: 0, width: 'auto' }}
                          />
                          {product.isTodaysDeal ? "Today's Deal" : 'Add'}
                        </label>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {activeTab === 'customers' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Customers</h2>
                <button className="admin__ghost" onClick={exportCustomers}>Download customers</button>
              </div>
              {liveCustomers === null ? (
                <p className="admin-muted">Loading customers...</p>
              ) : liveCustomers.length === 0 ? (
                <p className="admin-muted">No customers yet. New user signups will appear here automatically.</p>
              ) : liveCustomers.map(customer => (
                <div key={customer.email} className="admin-customer admin-customer--readonly">
                  <div><strong>{customer.name}</strong><span>{customer.phone} / {customer.email}</span></div>
                  <div><strong>Orders</strong><span>{customer.ordersCount || 0}</span></div>
                  <div><strong>Total spent</strong><span>{formatPrice(customer.totalSpent || 0)}</span></div>
                </div>
              ))}
            </section>
          )}

          {activeTab === 'orders' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Orders & Bills Management</h2>
                <button className="admin__ghost" onClick={() => adminApi.fetchAllOrders().then(setLiveOrders).catch(() => {})}>
                  ↻ Refresh
                </button>
              </div>
              {liveOrders === null && <p className="admin-muted">Loading orders & bills…</p>}
              {liveOrders !== null && liveOrders.length === 0 && (
                <p className="admin-muted">No orders yet. Orders placed by customers will appear here.</p>
              )}
              <div style={{ overflowX: 'auto' }}>
                <div className="admin-order-list" style={{ minWidth: '1150px' }}>
                  {[...(liveOrders || [])].reverse().map(order => {
                    const subtotal = order.items && order.items.length > 0 
                      ? order.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)
                      : order.total;
                    const deliveryFee = Math.max(0, order.total - subtotal);
                    const customerName = getCustomerName(order.userId);
                    const isPaid = order.status === 'Paid';
                    const transactionId = order.paymentMethod === 'cod' ? `COD-SIRI-${100000 + order.id}` : `TXN-SIRI-${200000 + order.id}`;

                    return (
                      <div key={order.id} className="admin-order-card" style={{ display: 'grid', gridTemplateColumns: '48px 1fr 1.2fr 0.9fr 1.1fr 1.1fr 0.8fr 1fr', gap: '12px', alignItems: 'center' }}>
                        <FiTruck />
                        
                        {/* Column 1: IDs & Customer */}
                        <div>
                          <strong style={{ fontSize: '13px' }}>Order #{order.id}</strong>
                          <span style={{ fontSize: '12px', color: '#2D5016', fontWeight: 'bold' }}>BILL-{order.id + 7820}</span>
                          <span style={{ fontSize: '11px', color: '#687466' }}>{customerName}</span>
                        </div>

                        {/* Column 2: Items Summary List */}
                        <div>
                          <strong>Items Summary</strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                            {(order.items || []).map((item, idx) => (
                              <span key={idx} style={{ fontSize: '11px', lineHeight: '1.2' }}>
                                • {item.name} {item.weight ? `(${item.weight}${item.unit})` : ''} <strong>x{item.quantity || 1}</strong>
                              </span>
                            ))}
                            {(order.items || []).length === 0 && <span style={{ fontSize: '11px', color: '#9ca3af' }}>—</span>}
                          </div>
                        </div>

                        {/* Column 3: Delivery Address */}
                        <div>
                          <strong>Delivery Address</strong>
                          <span style={{ fontSize: '11px', lineHeight: '1.3' }}>{order.deliveryAddress || '—'}</span>
                        </div>

                        {/* Column 4: Bill Summary (Delivery Cost & Summary) */}
                        <div>
                          <strong>Bill Summary</strong>
                          <span style={{ fontSize: '11px' }}>Subtotal: {formatPrice(subtotal)}</span>
                          <span style={{ fontSize: '11px', color: '#2D5016', fontWeight: '600' }}>Delivery Fee: {formatPrice(deliveryFee)}</span>
                          <span style={{ fontSize: '12px', fontWeight: '900', marginTop: '2px', color: '#111827' }}>Total: {formatPrice(order.total)}</span>
                        </div>

                        {/* Column 5: Payment & Transaction */}
                        <div>
                          <strong>Payment & Txn</strong>
                          <span style={{ fontSize: '11px' }}>Mode: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || '—')}</span>
                          <span style={{ fontSize: '11px', color: '#687466', fontFamily: 'monospace' }}>Ref: {transactionId}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '11px', color: isPaid ? '#2D5016' : '#FF6B35', fontWeight: 'bold' }}>
                              {isPaid ? 'Paid' : 'Pending'}
                            </span>
                            {!isPaid && (
                              <button
                                type="button"
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  background: '#FFF8DF',
                                  border: '1px solid #2D5016',
                                  borderRadius: '4px',
                                  color: '#2D5016',
                                  cursor: 'pointer',
                                  fontWeight: '700'
                                }}
                                onClick={async () => {
                                  try {
                                    await adminApi.updateOrderStatus(order.id, 'Paid');
                                    setLiveOrders(prev => prev.map(o =>
                                      o.id === order.id ? { ...o, status: 'Paid' } : o
                                    ));
                                  } catch (err) {
                                    alert('Failed to mark as paid: ' + err.message);
                                  }
                                }}
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Column 6: Date Placed */}
                        <div>
                          <strong>Placed On</strong>
                          <span style={{ fontSize: '11px' }}>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '—'}</span>
                        </div>

                        {/* Column 7: Status Action */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <strong>Status</strong>
                          <select
                            value={order.status}
                            className="admin-status-select"
                            style={{ height: '32px', fontSize: '12px', padding: '0 4px', width: '100%' }}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                await adminApi.updateOrderStatus(order.id, newStatus);
                                setLiveOrders(prev => prev.map(o =>
                                  o.id === order.id ? { ...o, status: newStatus } : o
                                ));
                              } catch (err) {
                                alert('Failed to update status: ' + err.message);
                              }
                            }}
                          >
                            {['Pending','Preparing','In Transit','Delivered','Paid'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'sales-stats' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Product Sales Frequency</h2>
                <span className="admin-muted">Ranked by total quantity sold</span>
              </div>
              {liveOrders === null && <p className="admin-muted">Loading stats…</p>}
              {liveOrders !== null && productSales.length === 0 && (
                <p className="admin-muted">No sales recorded yet.</p>
              )}
              {productSales.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #2D5016', textAlign: 'left', background: '#F7F4EE' }}>
                        <th style={{ padding: '12px 10px', fontSize: '13px', color: '#2D5016', fontWeight: '900' }}>ITEM NAME</th>
                        <th style={{ padding: '12px 10px', fontSize: '13px', color: '#2D5016', fontWeight: '900' }}>CATEGORY</th>
                        <th style={{ padding: '12px 10px', fontSize: '13px', color: '#2D5016', fontWeight: '900' }}>UNIT PRICE</th>
                        <th style={{ padding: '12px 10px', fontSize: '13px', color: '#2D5016', fontWeight: '900', textAlign: 'center' }}>ORDERS COUNT</th>
                        <th style={{ padding: '12px 10px', fontSize: '13px', color: '#2D5016', fontWeight: '900', textAlign: 'center' }}>TOTAL QUANTITY SOLD</th>
                        <th style={{ padding: '12px 10px', fontSize: '13px', color: '#2D5016', fontWeight: '900', textAlign: 'right' }}>TOTAL REVENUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productSales.map(sale => (
                        <tr key={sale.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                          <td style={{ padding: '12px 10px', fontSize: '13px', fontWeight: '500' }}>
                            {sale.name} {sale.weight ? `(${sale.weight} ${sale.unit})` : ''}
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '12px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: sale.category === 'Wholesale' ? '#FFF0EA' : '#FFF8DF',
                              color: sale.category === 'Wholesale' ? '#FF6B35' : '#2D5016',
                              fontWeight: '800',
                              fontSize: '11px'
                            }}>
                              {sale.category}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', fontSize: '13px' }}>{formatPrice(sale.price)}</td>
                          <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'center', fontWeight: '800' }}>{sale.ordersCount}</td>
                          <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'center', fontWeight: '800', color: '#2D5016' }}>{sale.quantitySold}</td>
                          <td style={{ padding: '12px 10px', fontSize: '13px', textAlign: 'right', fontWeight: '800' }}>{formatPrice(sale.totalRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeTab === 'broadcast' && (
            <section className="admin-card admin-card--wide" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="admin-card__toolbar" style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiMail size={24} style={{ color: '#2D5016' }} />
                  <div>
                    <h2 style={{ margin: 0 }}>Mail Broadcast Campaign</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                      Send promotions, festive offers, or store announcements to all registered customer emails for free.
                    </p>
                  </div>
                </div>
              </div>

              {broadcastStatus && (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  background: broadcastStatus.type === 'success' ? '#ECFDF5' : '#FEF2F2',
                  color: broadcastStatus.type === 'success' ? '#065F46' : '#991B1B',
                  border: broadcastStatus.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FCA5A5'
                }}>
                  {broadcastStatus.msg}
                </div>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
                  setBroadcastStatus({ type: 'error', msg: 'Please fill out both the Subject and Message fields.' });
                  return;
                }

                if (!confirm('Are you sure you want to send this email campaign to all registered customers?')) {
                  return;
                }

                setBroadcastSending(true);
                setBroadcastStatus(null);

                try {
                  const res = await adminApi.sendBroadcast({
                    subject: broadcastSubject,
                    messageText: broadcastMessage
                  });
                  setBroadcastStatus({ type: 'success', msg: `Campaign sent successfully! Received by ${res.count} customers.` });
                  setBroadcastSubject('');
                  setBroadcastMessage('');
                } catch (err) {
                  setBroadcastStatus({ type: 'error', msg: err.message || 'Failed to send mail broadcast.' });
                } finally {
                  setBroadcastSending(false);
                }
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#111827', marginBottom: '6px' }}>
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    disabled={broadcastSending}
                    placeholder="e.g., Special Festive Offer: 10% Off All Groceries!"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border-light)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#111827', marginBottom: '6px' }}>
                    Email Message Body (Plain text, supports line breaks)
                  </label>
                  <textarea
                    required
                    disabled={broadcastSending}
                    rows={8}
                    placeholder={`Dear Customers,\n\nWe are excited to bring you a special discount on all orders placed today!\nUse coupon code FESTIVE10 at checkout to get 10% discount.\n\nThank you for shopping with us!\nSiri Traders`}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border-light)',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="admin__primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: broadcastSending ? 0.7 : 1
                  }}
                >
                  {broadcastSending ? 'Sending Campaign Emails...' : '🚀 Send Broadcast Email to All Customers'}
                </button>
              </form>
            </section>
          )}

          {(activeTab === 'retail-content' || activeTab === 'wholesale-content') && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>{activeTab === 'retail-content' ? 'Retail' : 'Wholesale'} Product Content Editor</h2>
                <label className="admin-search-label">
                  <FiSearch />
                  <input value={contentSearch} onChange={(e) => setContentSearch(e.target.value)} placeholder="Search products..." />
                </label>
              </div>

              <div className="admin-content-list">
                <div className={`admin-content-header ${activeTab === 'wholesale-content' ? 'admin-content-header--ws' : ''}`}>
                  <span>Image</span>
                  <span>Item Name</span>
                  <span>MRP (₹)</span>
                  <span>Disc. Price (₹)</span>
                  <span>% Off</span>
                  <span>Availability</span>
                  <span>Quantity</span>
                  {activeTab === 'wholesale-content' && <span>WS Price (₹)</span>}
                  {activeTab === 'wholesale-content' && <span>Bulk Pack Label</span>}
                  {activeTab === 'wholesale-content' && <span>Bulk Pack Price (₹)</span>}
                  {activeTab === 'wholesale-content' && <span>WS Case Label</span>}
                  {activeTab === 'wholesale-content' && <span>WS Case Price (₹)</span>}
                  <span>Description</span>
                </div>

                {filteredContentProducts.length === 0 ? (
                  <div className="admin-content-empty">
                    <FiPackage size={32} />
                    <p>{contentSearch ? 'No products match your search.' : `Add products in the ${activeTab === 'retail-content' ? 'Retail Items' : 'Wholesale Items'} tab first.`}</p>
                  </div>
                ) : filteredContentProducts.map(product => {
                  const isWS = activeTab === 'wholesale-content';
                  return (
                    <div key={product.id} className={`admin-content-editor ${isWS ? 'admin-content-editor--ws' : ''}`}>
                      <img src={toWebpImage(product.image)} alt={product.name} />
                      <input
                        value={product.name || ''}
                        onChange={(e) => updateProductField(product.id, 'name', e.target.value, isWS)}
                        placeholder="Item name"
                      />
                      <input
                        value={product.mrp || ''}
                        onChange={(e) => updateProductField(product.id, 'mrp', e.target.value, isWS)}
                        type="number"
                        placeholder="MRP"
                      />
                      <input
                        value={product.price || ''}
                        onChange={(e) => updateProductField(product.id, 'price', e.target.value, isWS)}
                        type="number"
                        placeholder="Discounted price"
                      />
                      <input
                        value={product.discount || ''}
                        onChange={(e) => updateProductField(product.id, 'discount', e.target.value, isWS)}
                        type="number"
                        placeholder="% off"
                      />
                      <select
                        value={product.stockNote || 'In stock'}
                        onChange={(e) => updateProductField(product.id, 'stockNote', e.target.value, isWS)}
                      >
                        <option>In stock</option>
                        <option>Only few left</option>
                        <option>Only 10 left</option>
                        <option>Only 12 left</option>
                        <option>Out of stock</option>
                      </select>
                      <input
                        value={`${product.weight || ''} ${product.unit || ''}`.trim()}
                        onChange={(e) => {
                          const parts = e.target.value.trim().split(' ');
                          const unit = parts.length > 1 ? parts[parts.length - 1] : '';
                          const weight = parts.slice(0, parts.length - 1).join(' ') || parts[0];
                          updateProductField(product.id, 'weight', weight, isWS);
                          if (unit) updateProductField(product.id, 'unit', unit, isWS);
                        }}
                        placeholder="e.g. 500 g"
                      />
                      {isWS && (
                        <input
                          value={product.wholesalePrice || ''}
                          onChange={(e) => updateProductField(product.id, 'wholesalePrice', e.target.value, true)}
                          type="number"
                          placeholder="WS price"
                        />
                      )}
                      {isWS && (
                        <input
                          value={product.bulkPackLabel || ''}
                          onChange={(e) => updateProductField(product.id, 'bulkPackLabel', e.target.value, true)}
                          placeholder="e.g. 10 kg bulk"
                        />
                      )}
                      {isWS && (
                        <input
                          value={product.bulkPackPrice || ''}
                          onChange={(e) => updateProductField(product.id, 'bulkPackPrice', e.target.value, true)}
                          type="number"
                          placeholder="Bulk pack price"
                        />
                      )}
                      {isWS && (
                        <input
                          value={product.wholesaleCaseLabel || ''}
                          onChange={(e) => updateProductField(product.id, 'wholesaleCaseLabel', e.target.value, true)}
                          placeholder="e.g. 25 kg case"
                        />
                      )}
                      {isWS && (
                        <input
                          value={product.wholesaleCasePrice || ''}
                          onChange={(e) => updateProductField(product.id, 'wholesaleCasePrice', e.target.value, true)}
                          type="number"
                          placeholder="WS case price"
                        />
                      )}
                      <input
                        value={product.description || ''}
                        onChange={(e) => updateProductField(product.id, 'description', e.target.value, isWS)}
                        placeholder="Description"
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'delivery-zones' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Delivery Zones</h2>
              </div>

              {/* Shop address info */}
              <div style={{padding:'12px 14px',borderRadius:10,background:'#F1F8E9',border:'1px solid rgba(45,80,22,0.18)',marginBottom:18,display:'flex',gap:10,alignItems:'flex-start'}}>
                <FiMapPin size={18} style={{color:'#2D5016',marginTop:2,flexShrink:0}} />
                <div>
                  <p style={{fontSize:13,fontWeight:800,color:'#2D5016',marginBottom:2}}>Shop Address (Siri Traders)</p>
                  <p style={{fontSize:12,color:'#687466',lineHeight:1.5}}>H.No 10-152, Nagarjuna Colony Road No 12, Chitkul, Isnapur Municipality, Hyderabad — 502307</p>
                </div>
              </div>

              {/* Add new zone form */}
              <div style={{background:'#FAFFF6',border:'1px solid rgba(45,80,22,0.12)',borderRadius:12,padding:14,marginBottom:18}}>
                <p style={{fontSize:13,fontWeight:800,color:'#2D5016',marginBottom:10}}>Add / Update Zone</p>
                <div className="admin-form__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                  <input className="admin-input-box" placeholder="Area name e.g. Kukatpally" value={newZone.area} onChange={e => setNewZone(p => ({...p, area: e.target.value}))} />
                  <input className="admin-input-box" placeholder="Pincode e.g. 500072" value={newZone.pincode} onChange={e => setNewZone(p => ({...p, pincode: e.target.value}))} />
                  <select className="admin-input-box" value={newZone.time} onChange={e => setNewZone(p => ({...p, time: e.target.value}))}>
                    {['10 mins','15 mins','20 mins','25 mins','30 mins','35 mins','40 mins','45 mins','50 mins','55 mins','60 mins','75 mins','90 mins','2 hours','3 hours','Same day'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input className="admin-input-box" placeholder="Distance e.g. ~16 km (optional)" value={newZone.distance} onChange={e => setNewZone(p => ({...p, distance: e.target.value}))} />
                  <input className="admin-input-box" type="number" placeholder="Delivery Fee (₹)" value={newZone.deliveryFee || ''} onChange={e => setNewZone(p => ({...p, deliveryFee: Number(e.target.value) || 0}))} />
                  <input className="admin-input-box" type="number" placeholder="Handling Charge (₹)" value={newZone.handlingCharge || ''} onChange={e => setNewZone(p => ({...p, handlingCharge: Number(e.target.value) || 0}))} />
                </div>
                <button
                  type="button"
                  className="admin__primary"
                  style={{marginTop:10}}
                  onClick={async () => {
                    if (!newZone.area.trim() || !newZone.pincode.trim()) return;
                    try {
                      const saved = await adminApi.saveDeliveryZone({ ...newZone, area: newZone.area.trim(), pincode: newZone.pincode.trim() });
                      setDeliveryZones(prev => [...prev, saved]);
                      setNewZone({ area: '', pincode: '', time: '30 mins', distance: '', deliveryFee: 0, freeDeliveryThreshold: 0, handlingCharge: 0 });
                    } catch (err) {
                      alert(err.message);
                    }
                  }}
                >
                  <FiPlus /> Add Zone
                </button>
              </div>

              {/* Zones table */}
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                  <thead>
                    <tr style={{background:'#F1F8E9'}}>
                      {['Area','Pincode','Delivery Time','Distance','Fee (₹)','Handling (₹)','Action'].map(h => (
                        <th key={h} style={{padding:'10px 12px',textAlign:'left',fontWeight:800,color:'#2D5016',fontSize:11,textTransform:'uppercase',borderBottom:'1px solid rgba(45,80,22,0.12)'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryZones.map(zone => (
                      <tr key={zone.id} style={{borderBottom:'1px solid rgba(45,80,22,0.07)'}}>
                        <td style={{padding:'10px 12px',fontWeight:600,color:'#1c1c1c'}}>{zone.area}</td>
                        <td style={{padding:'10px 12px',color:'#687466'}}>{zone.pincode}</td>
                        <td style={{padding:'10px 12px'}}>
                          <select
                            value={zone.time}
                            onChange={e => {
                              const time = e.target.value;
                              setDeliveryZones(prev => prev.map(z => z.id === zone.id ? { ...z, time } : z));
                            }}
                            style={{padding:'4px 8px',borderRadius:7,border:'1px solid rgba(45,80,22,0.2)',background:'#F1F8E9',color:'#2D5016',fontWeight:700,fontSize:12,cursor:'pointer'}}
                          >
                            {['10 mins','15 mins','20 mins','25 mins','30 mins','35 mins','40 mins','45 mins','50 mins','55 mins','60 mins','75 mins','90 mins','2 hours','3 hours','Same day'].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td style={{padding:'10px 12px',color:'#687466',fontSize:12}}>{zone.distance}</td>
                        
                        {/* Delivery Fee Input */}
                        <td style={{padding:'10px 12px'}}>
                          <input
                            type="number"
                            value={zone.deliveryFee === 0 ? '' : zone.deliveryFee}
                            placeholder="0"
                            onChange={e => {
                              const val = Number(e.target.value) || 0;
                              setDeliveryZones(prev => prev.map(z => z.id === zone.id ? { ...z, deliveryFee: val } : z));
                            }}
                            style={{ width: '65px', padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(45,80,22,0.2)', fontSize: '12px' }}
                          />
                        </td>

                        {/* Handling Charge Input */}
                        <td style={{padding:'10px 12px'}}>
                          <input
                            type="number"
                            value={zone.handlingCharge === 0 ? '' : zone.handlingCharge}
                            placeholder="0"
                            onChange={e => {
                              const val = Number(e.target.value) || 0;
                              setDeliveryZones(prev => prev.map(z => z.id === zone.id ? { ...z, handlingCharge: val } : z));
                            }}
                            style={{ width: '65px', padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(45,80,22,0.2)', fontSize: '12px' }}
                          />
                        </td>

                        <td style={{padding:'10px 12px', display:'flex', gap:'6px'}}>
                          <button
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '7px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: savedZoneIds[zone.id] ? '#1e8e3e' : '#2D5016',
                              border: 'none',
                              color: '#fff',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              padding: 0
                            }}
                            title="Save changes to website"
                            onClick={async () => {
                              try {
                                const updated = await adminApi.updateDeliveryZone(zone.id, {
                                  time: zone.time,
                                  deliveryFee: zone.deliveryFee,
                                  handlingCharge: zone.handlingCharge
                                });
                                setDeliveryZones(prev => prev.map(z => z.id === zone.id ? updated : z));
                                setSavedZoneIds(prev => ({ ...prev, [zone.id]: true }));
                                setTimeout(() => {
                                  setSavedZoneIds(prev => ({ ...prev, [zone.id]: false }));
                                }, 2000);
                              } catch (err) { alert(err.message); }
                            }}
                          >
                            {savedZoneIds[zone.id] ? <FiCheck size={14} /> : <FiSave size={13} />}
                          </button>
                          <button
                            className="admin-danger"
                            style={{width:30,height:30,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center'}}
                            onClick={async () => {
                              if (!window.confirm(`Are you sure you want to delete the zone "${zone.area}"?`)) return;
                              try {
                                await adminApi.deleteDeliveryZone(zone.id);
                                setDeliveryZones(prev => prev.filter(z => z.id !== zone.id));
                              } catch (err) { alert(err.message); }
                            }}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{fontSize:11,color:'#687466',marginTop:12}}>
                💡 These settings are specific to each delivery zone and are applied dynamically at checkout based on the customer's selected area. Changes apply instantly.
              </p>
            </section>
          )}

          {activeTab === 'admins' && (
            <section className="admin-grid">
              <form className="admin-form" onSubmit={saveAdmin}>
                <h2>Add admin user</h2>
                <input value={adminDraft.name} onChange={(e) => setAdminDraft(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" required />
                <input value={adminDraft.email} onChange={(e) => setAdminDraft(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" type="email" required />
                <input value={adminDraft.password} onChange={(e) => setAdminDraft(prev => ({ ...prev, password: e.target.value }))} placeholder="Password (min 8 characters)" type="password" minLength={8} required />
                <select value={adminDraft.role} onChange={(e) => setAdminDraft(prev => ({ ...prev, role: e.target.value }))}>
                  <option>Manager</option>
                  <option>Editor</option>
                  <option>Super Admin</option>
                </select>
                {adminError && <p style={{color:'#FF6B35',fontSize:13,fontWeight:700}}>{adminError}</p>}
                <button type="submit" className="admin__primary"><FiPlus /> Add admin</button>
              </form>
              <div className="admin-card">
                <h2>Admin accounts</h2>
                {adminAccounts.map(account => (
                  <div key={account.id} className="admin-row admin-row--plain">
                    <FiLock />
                    <span>{account.name}<small>{account.email} / {account.role}</small></span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
};

export default Admin;

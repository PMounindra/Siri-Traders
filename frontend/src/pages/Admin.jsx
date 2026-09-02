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
  FiMail,
  FiLayers,
  FiAlertTriangle,
  FiAlertCircle,
  FiClock,
  FiRefreshCw,
  FiActivity,
  FiArchive,
  FiSliders,
  FiInfo,
  FiCheckCircle,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiPercent,
  FiGrid,
  FiPrinter,
  FiFileText,
  FiRotateCcw,
  FiCreditCard,
  FiNavigation,
  FiPhone,
  FiMessageCircle,
  FiCalendar,
  FiXCircle,
  FiThumbsUp,
  FiThumbsDown,
  FiPieChart,
  FiCompass,
  FiGlobe,
  FiCode,
  FiShare2,
  FiExternalLink,
  FiImage,
  FiHelpCircle,
  FiBookOpen
} from 'react-icons/fi';
import { useAdminApi } from '../hooks/useAdminApi';
import { products as baseProducts, getProducts as getAllProducts } from '../data/products';
import { categories } from '../data/categories';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import './Admin.css';

const formatWeightUnit = (weight, unit) => {
  if (!weight) return '';
  const wStr = String(weight).trim();
  const uStr = String(unit || '').trim();
  if (!uStr) return wStr;
  const wLower = wStr.toLowerCase();
  const uLower = uStr.toLowerCase();
  if (wLower.endsWith(uLower)) return wStr;
  return `${wStr} ${uStr}`;
};

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

const genSku = (category = 'GEN') => `SIRI-${(category || 'GEN').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
const genBarcode = () => `890${Math.floor(100000000 + Math.random() * 900000000)}`;

const blankProduct = {
  id: '',
  name: '',
  category: 'pulses',
  subcategory: '',
  brand: '',
  sku: '',
  barcode: '',
  weight: '',
  unit: 'g',
  packSize: '',
  price: '',
  mrp: '',
  costPrice: '',
  discount: '',
  gstRate: '0',
  hsnCode: '',
  batchNumber: '',
  mfgDate: '',
  expiryDate: '',
  image: '',
  description: '',
  inStock: true,
  stockNote: 'In stock',
  isPublished: true,
  isArchived: false,
  deliveryTime: '15 mins',
  isBestseller: false,
  isTodaysDeal: false,
  variants: []
};

const blankWholesaleProduct = {
  id: '',
  name: '',
  category: 'pulses',
  subcategory: '',
  brand: '',
  sku: '',
  barcode: '',
  weight: '',
  unit: 'kg',
  packSize: '',
  price: '',
  mrp: '',
  costPrice: '',
  discount: '',
  gstRate: '0',
  hsnCode: '',
  batchNumber: '',
  mfgDate: '',
  expiryDate: '',
  image: '',
  description: '',
  inStock: true,
  stockNote: 'In stock',
  isPublished: true,
  isArchived: false,
  deliveryTime: 'Same day',
  isBestseller: false,
  isTodaysDeal: false,
  wholesalePrice: '',
  bulkPackLabel: '',
  bulkPackPrice: '',
  wholesaleCaseLabel: '',
  wholesaleCasePrice: '',
  variants: []
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
  buyQty: 1,
  getQty: 1,
  targetCategory: '',
  targetProductId: '',
  startDate: '',
  endDate: '',
  usageLimit: '',
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
  buyQuantity: 1,
  getQuantity: 1,
  targetType: 'all',
  targetCategory: '',
  targetProductId: '',
  targetCustomerEmail: '',
  usageLimit: 500,
  perUserLimit: 1,
  startDate: '',
  endDate: '',
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

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const downloadCsv = (filename, rows) => {
  const csv = rows.map(row => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('link');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const ADMIN_ROLE_PERMISSIONS = {
  Owner: ['dashboard','inventory','sales-stats','orders','customers','reviews','cms','seo','retail-products','wholesale-products','offers','bestsellers','todays-deals','retail-content','wholesale-content','delivery-zones','broadcast','admins'],
  'Super Admin': ['dashboard','inventory','sales-stats','orders','customers','reviews','cms','seo','retail-products','wholesale-products','offers','bestsellers','todays-deals','retail-content','wholesale-content','delivery-zones','broadcast'],
  'Product Manager': ['dashboard','inventory','retail-products','wholesale-products','reviews','bestsellers','todays-deals'],
  'Order Manager': ['dashboard','inventory','orders','customers','delivery-zones'],
  'Marketing Manager': ['dashboard','offers','bestsellers','todays-deals','broadcast','reviews','cms','seo'],
  'Content Manager': ['dashboard','retail-content','wholesale-content','reviews','cms','seo'],
  'Customer Support': ['dashboard','inventory','customers','orders','reviews','delivery-zones'],
  Viewer: ['dashboard','inventory','sales-stats']
};

const ADMIN_NAV_SECTIONS = [
  {
    title: 'SALES & ORDERS',
    items: [
      ['dashboard', 'Overview', FiBarChart2],
      ['sales-stats', 'Sales Analytics', FiTrendingUp],
      ['orders', 'Orders & Payments', FiShoppingBag],
      ['customers', 'Customer Hub', FiUsers]
    ]
  },
  {
    title: 'INVENTORY & DELIVERY',
    items: [
      ['inventory', 'Inventory Hub', FiLayers],
      ['delivery-zones', 'Delivery & Slots', FiTruck],
      ['broadcast', 'Email Broadcast', FiMail]
    ]
  },
  {
    title: 'WEBSITE CMS & SEO',
    items: [
      ['cms', 'Website Content (CMS)', FiEdit2],
      ['seo', 'SEO Management', FiCompass],
      ['offers', 'Promos & Coupons', FiGift],
      ['reviews', 'Customer Reviews', FiStar]
    ]
  },
  {
    title: 'PRODUCT CATALOG',
    items: [
      ['retail-products', 'Retail Items', FiPackage],
      ['wholesale-products', 'Wholesale Items', FiPackage],
      ['bestsellers', 'Bestsellers', FiStar],
      ['todays-deals', "Today's Deals", FiTag],
      ['retail-content', 'Retail Content', FiEdit2],
      ['wholesale-content', 'Wholesale Content', FiEdit2]
    ]
  },
  {
    title: 'ADMINISTRATION',
    items: [
      ['admins', 'Admin Members', FiLock]
    ]
  }
];

const Admin = () => {
  const [selectedAdminRole, setSelectedAdminRole] = useState('Owner');
  const navigate = useNavigate();
  const [adminSession, setAdminSession] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminMode, setAdminMode] = useState('retail');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Products state ──
  const [retailProducts, setRetailProducts] = useState(() =>
    readStorage(ADMIN_PRODUCTS_RETAIL_KEY, baseProducts.map(product => ({
      ...product,
      stockNote: product.inStock ? 'In stock' : 'Out of stock',
      isPublished: product.isPublished ?? true,
      isArchived: product.isArchived ?? false
    })))
  );
  const [wholesaleProducts, setWholesaleProducts] = useState(() =>
    readStorage(ADMIN_PRODUCTS_WHOLESALE_KEY, getAllProducts('wholesale').map(product => ({
      ...product,
      stockNote: product.inStock ? 'In stock' : 'Out of stock',
      isPublished: product.isPublished ?? true,
      isArchived: product.isArchived ?? false
    })))
  );

  // Status & Brand filters for products
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [expandedVariantId, setExpandedVariantId] = useState(null);
  const [detailedVariants, setDetailedVariants] = useState([]);
  
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [productDraft, setProductDraft] = useState(blankProduct);
  const [apiLoading, setApiLoading] = useState(false);
  const [saveToast, setSaveToast] = useState(null);
  const [liveOrders, setLiveOrders] = useState(null);
  const [liveCustomers, setLiveCustomers] = useState(null);
  const adminApi = useAdminApi();
  const [newOrderToast, setNewOrderToast] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState(null);
  const [selectedBroadcastEmails, setSelectedBroadcastEmails] = useState([]);

  // ── Reviews & Ratings Management State ──
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');

  // ── Deep Analytics State ──
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('30');

  // ── CMS State ──
  const [cmsTab, setCmsTab] = useState('banners'); // 'banners'|'announcement'|'pages'|'faqs'|'blogs'|'media'
  const [cmsData, setCmsData] = useState({
    banners: [],
    pages: [],
    faqs: [],
    blogs: [],
    redirects: [],
    settings: {}
  });
  const [editingBanner, setEditingBanner] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [editingFaq, setEditingFaq] = useState(null);
  const [editingBlog, setEditingBlog] = useState(null);
  const [editingRedirect, setEditingRedirect] = useState(null);

  // ── SEO State ──
  const [seoForm, setSeoForm] = useState({
    metaTitle: 'Siri Traders — Fresh Groceries & Wholesale Supermarket in Hyderabad',
    metaDescription: 'Order fresh groceries, premium basmati rice, unpolished pulses, cold-pressed edible oils, and daily essentials online from Siri Traders with fast 15-minute delivery.',
    canonicalUrl: 'https://www.siritrader.com',
    ogImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80',
    robotsIndex: true,
    googleSiteVerification: 'google-site-verification-siri-traders-2026',
    schemaJson: '{"@context":"https://schema.org","@type":"GroceryStore","name":"Siri Traders","image":"https://www.siritrader.com/logo-mark.webp","telephone":"+919849012345","priceRange":"₹₹","address":{"@type":"PostalAddress","streetAddress":"Kukatpally Main Road","addressLocality":"Hyderabad","addressRegion":"Telangana","postalCode":"500072","addressCountry":"IN"}}',
    sitemapEnabled: true
  });

  // ── Orders & Payments Management State ──
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
  const [packingSlipModalOrder, setPackingSlipModalOrder] = useState(null);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: 'Customer return / out of stock' });
  const [orderNotesText, setOrderNotesText] = useState('');
  const [orderActionLoading, setOrderActionLoading] = useState(false);

  // ── Grocery Delivery Management State ──
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [deliveryZoneSearch, setDeliveryZoneSearch] = useState('');
  const [newZone, setNewZone] = useState({
    area: '',
    pincode: '',
    time: '30 mins',
    distance: '',
    deliveryFee: 0,
    freeDeliveryThreshold: 500,
    handlingCharge: 5,
    minOrderValue: 199,
    driverAssigned: ''
  });
  const [editingZoneModal, setEditingZoneModal] = useState(null);
  const [deliverySlotPresets, setDeliverySlotPresets] = useState([
    'Morning (7:00 AM - 10:00 AM)',
    'Afternoon (1:00 PM - 4:00 PM)',
    'Evening (6:00 PM - 9:00 PM)',
    'Express (15-30 mins)'
  ]);

  // ── Customer Management State ──
  const [customerSegmentFilter, setCustomerSegmentFilter] = useState('all');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerModal, setSelectedCustomerModal] = useState(null);

  // ── Inventory Management State ──
  const [inventoryData, setInventoryData] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('all');
  const [inventoryLogs, setInventoryLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Modals for Stock Adjustment, History & Reorder Config
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    changeType: 'ADD',
    quantity: '',
    targetField: 'availableStock',
    reason: 'Purchase / New Stock Received',
    notes: ''
  });
  const [adjustLoading, setAdjustLoading] = useState(false);

  const [historyModalItem, setHistoryModalItem] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [reorderModalItem, setReorderModalItem] = useState(null);
  const [reorderForm, setReorderForm] = useState({
    reorderLevel: 10,
    costPrice: 0,
    expiryDate: '',
    batchNumber: '',
    location: 'Main Shelf',
    incomingStock: 0
  });
  const [reorderLoading, setReorderLoading] = useState(false);

  const [offerDraft, setOfferDraft] = useState(blankOffer);
  const [couponDraft, setCouponDraft] = useState(blankCoupon);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [adminDraft, setAdminDraft] = useState(blankAdmin);
  const [adminError, setAdminError] = useState('');
  const [contentSearch, setContentSearch] = useState('');
  const [bestsellerSearch, setBestsellerSearch] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [dbCategories, setDbCategories] = useState([]);

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.3);
    } catch (err) {
      console.warn("Failed to play notification audio:", err);
    }
  };

  const persistRetailProducts = (next) => {
    setRetailProducts(next);
    writeStorage(ADMIN_PRODUCTS_RETAIL_KEY, next);
  };

  const persistWholesaleProducts = (next) => {
    setWholesaleProducts(next);
    writeStorage(ADMIN_PRODUCTS_WHOLESALE_KEY, next);
  };

  const normalizeOffer = (o) => ({ ...o, group: o.groupType || o.group || 'daily' });
  const allowedAdminTabs = ADMIN_ROLE_PERMISSIONS[selectedAdminRole] || ADMIN_ROLE_PERMISSIONS.Viewer;

  const loadOrders = async () => {
    try {
      const ords = await adminApi.fetchAllOrders();
      setLiveOrders(ords);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const loadCustomers = async () => {
    try {
      const usersList = await adminApi.fetchAllUsers();
      setLiveCustomers(usersList);
      if (Array.isArray(usersList)) {
        const emails = usersList.map(u => u.email).filter(Boolean);
        setSelectedBroadcastEmails(emails);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const loadReviews = async () => {
    try {
      const revs = await adminApi.fetchReviews();
      setReviewsList(revs);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    }
  };

  const loadCmsData = async () => {
    try {
      const data = await adminApi.fetchCmsAll();
      setCmsData(data);
      if (data.settings) {
        setSeoForm({
          metaTitle: data.settings.metaTitle || seoForm.metaTitle,
          metaDescription: data.settings.metaDescription || seoForm.metaDescription,
          canonicalUrl: data.settings.canonicalUrl || seoForm.canonicalUrl,
          ogImage: data.settings.ogImage || seoForm.ogImage,
          robotsIndex: data.settings.robotsIndex !== false,
          googleSiteVerification: data.settings.googleSiteVerification || seoForm.googleSiteVerification,
          schemaJson: data.settings.schemaJson || seoForm.schemaJson,
          sitemapEnabled: data.settings.sitemapEnabled !== false
        });
      }
    } catch (err) {
      console.error('Failed to load CMS content:', err);
    }
  };

  const loadInventory = async () => {
    setInventoryLoading(true);
    try {
      const data = await adminApi.fetchInventory();
      setInventoryData(data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadInventoryLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await adminApi.fetchInventoryLogs();
      setInventoryLogs(logs);
    } catch (err) {
      console.error('Failed to load inventory logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    adminApi.fetchProducts(true).then(dbProducts => {
      if (!dbProducts || dbProducts.length === 0) return;
      const retail = dbProducts.filter(p => !p.wholesalePrice);
      const ws = dbProducts.filter(p => p.wholesalePrice);
      if (retail.length > 0) persistRetailProducts(retail.map(p => ({
        ...p,
        stockNote: p.inStock ? 'In stock' : 'Out of stock',
        isPublished: p.isPublished ?? true,
        isArchived: p.isArchived ?? false
      })));
      if (ws.length > 0) persistWholesaleProducts(ws.map(p => ({
        ...p,
        stockNote: p.inStock ? 'In stock' : 'Out of stock',
        isPublished: p.isPublished ?? true,
        isArchived: p.isArchived ?? false
      })));
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    adminApi.me().then(session => {
      setAdminSession(session);
      setSessionChecked(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (adminSession?.role) {
      const sessionRole = String(adminSession.role);
      if (ADMIN_ROLE_PERMISSIONS[sessionRole]) {
        setSelectedAdminRole(sessionRole);
      }
    }
  }, [adminSession]);

  useEffect(() => {
    if (!allowedAdminTabs.includes(activeTab)) {
      setActiveTab(allowedAdminTabs[0] || 'dashboard');
    }
  }, [selectedAdminRole, activeTab, allowedAdminTabs]);

  useEffect(() => {
    loadOrders();
    loadCustomers();
    loadReviews();
    loadCmsData();
    adminApi.fetchOffers().then(data => setOffers(data.map(normalizeOffer))).catch(() => {});
    adminApi.fetchCoupons().then(setCoupons).catch(() => {});
    adminApi.fetchDeliveryZones().then(setDeliveryZones).catch(() => {});
    adminApi.fetchCategories().then(setDbCategories).catch(() => {});
    adminApi.fetchAdminUsers().then(setAdminAccounts).catch(() => {});
    loadInventory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
      if (inventoryFilter === 'logs') loadInventoryLogs();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'customers') {
      loadCustomers();
    } else if (activeTab === 'reviews') {
      loadReviews();
    } else if (activeTab === 'cms' || activeTab === 'seo') {
      loadCmsData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, inventoryFilter]);

  // Real-time order notifications
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

  const allProducts = useMemo(() => [...retailProducts, ...wholesaleProducts], [retailProducts, wholesaleProducts]);

  const filteredReviews = useMemo(() => {
    return reviewsList.filter(rev => {
      if (reviewFilter === '5' && rev.rating !== 5) return false;
      if (reviewFilter === '4' && rev.rating !== 4) return false;
      if (reviewFilter === '3' && rev.rating !== 3) return false;
      if (reviewFilter === 'low' && rev.rating > 2) return false;
      if (reviewFilter === 'pending' && rev.status !== 'Pending') return false;

      if (reviewSearchQuery.trim()) {
        const q = reviewSearchQuery.toLowerCase();
        const matchProd = (rev.productName || '').toLowerCase().includes(q);
        const matchUser = (rev.userName || '').toLowerCase().includes(q);
        const matchTitle = (rev.title || '').toLowerCase().includes(q);
        const matchComment = (rev.comment || '').toLowerCase().includes(q);
        if (!matchProd && !matchUser && !matchTitle && !matchComment) return false;
      }
      return true;
    });
  }, [reviewsList, reviewFilter, reviewSearchQuery]);

  const reviewStats = useMemo(() => {
    const total = reviewsList.length;
    if (total === 0) return { avg: 5.0, total: 0, counts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, lowCount: 0 };
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / total).toFixed(1));
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviewsList.forEach(r => {
      if (counts[r.rating] !== undefined) counts[r.rating] += 1;
    });
    const lowCount = reviewsList.filter(r => r.rating <= 2).length;
    return { avg, total, counts, lowCount };
  }, [reviewsList]);

  const filterProductList = (productsList) => {
    return productsList.filter(p => {
      if (productStatusFilter === 'published' && (p.isPublished === false || p.isArchived)) return false;
      if (productStatusFilter === 'draft' && (p.isPublished !== false || p.isArchived)) return false;
      if (productStatusFilter === 'archived' && !p.isArchived) return false;
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        const matchCategory = (p.category || '').toLowerCase().includes(q);
        const matchSubcategory = (p.subcategory || '').toLowerCase().includes(q);
        const matchSku = (p.sku || '').toLowerCase().includes(q);
        const matchBarcode = (p.barcode || '').toLowerCase().includes(q);
        if (!matchName && !matchBrand && !matchCategory && !matchSubcategory && !matchSku && !matchBarcode) {
          return false;
        }
      }
      return true;
    });
  };

  const filteredRetailProducts = useMemo(() => filterProductList(retailProducts), [retailProducts, searchQuery, productStatusFilter, productCategoryFilter]);
  const filteredWholesaleProducts = useMemo(() => filterProductList(wholesaleProducts), [wholesaleProducts, searchQuery, productStatusFilter, productCategoryFilter]);
  const filteredProducts = activeTab === 'wholesale-products' ? filteredWholesaleProducts : filteredRetailProducts;

  const filteredOrders = useMemo(() => {
    if (!liveOrders) return [];
    return liveOrders.filter(order => {
      if (orderStatusFilter === 'pending' && !['Pending', 'Preparing'].includes(order.status)) return false;
      if (orderStatusFilter === 'in-transit' && order.status !== 'In Transit') return false;
      if (orderStatusFilter === 'delivered' && !['Delivered', 'Paid'].includes(order.status)) return false;
      if (orderStatusFilter === 'cancelled' && order.status !== 'Cancelled') return false;
      if (orderStatusFilter === 'returns' && (!order.returnStatus || order.returnStatus === 'None')) return false;

      if (orderPaymentFilter === 'paid' && order.paymentStatus !== 'Paid') return false;
      if (orderPaymentFilter === 'pending' && order.paymentStatus !== 'Pending') return false;
      if (orderPaymentFilter === 'refunded' && !['Refunded', 'Partially Refunded'].includes(order.paymentStatus)) return false;

      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const matchId = String(order.id).includes(q);
        const matchBill = `bill-${order.id + 7820}`.includes(q);
        const matchCust = (order.customerName || '').toLowerCase().includes(q);
        const matchPhone = (order.customerPhone || '').toLowerCase().includes(q);
        const matchEmail = (order.customerEmail || '').toLowerCase().includes(q);
        const matchAddr = (order.deliveryAddress || '').toLowerCase().includes(q);
        const matchTxn = (order.paymentTxnId || '').toLowerCase().includes(q);
        const matchTracking = (order.trackingNumber || '').toLowerCase().includes(q);
        if (!matchId && !matchBill && !matchCust && !matchPhone && !matchEmail && !matchAddr && !matchTxn && !matchTracking) {
          return false;
        }
      }
      return true;
    });
  }, [liveOrders, orderStatusFilter, orderPaymentFilter, orderSearchQuery]);

  const filteredCustomers = useMemo(() => {
    if (!liveCustomers) return [];
    return liveCustomers.filter(customer => {
      if (customerSegmentFilter !== 'all' && customer.segment !== customerSegmentFilter) return false;
      if (customerSearchQuery.trim()) {
        const q = customerSearchQuery.toLowerCase();
        const matchName = (customer.name || '').toLowerCase().includes(q);
        const matchEmail = (customer.email || '').toLowerCase().includes(q);
        const matchPhone = (customer.phone || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [liveCustomers, customerSegmentFilter, customerSearchQuery]);

  const filteredInventoryItems = useMemo(() => {
    if (!inventoryData?.items) return [];
    let list = inventoryData.items;

    if (inventoryFilter === 'low-stock') {
      list = list.filter(i => i.isLowStock);
    } else if (inventoryFilter === 'out-of-stock') {
      list = list.filter(i => i.isOutOfStock);
    } else if (inventoryFilter === 'near-expiry') {
      list = list.filter(i => i.isNearExpiry);
    } else if (inventoryFilter === 'expired') {
      list = list.filter(i => i.isExpired);
    } else if (inventoryFilter === 'incoming') {
      list = list.filter(i => i.incomingStock > 0);
    }

    if (inventoryCategory !== 'all') {
      list = list.filter(i => i.category === inventoryCategory);
    }

    if (inventorySearch.trim()) {
      const q = inventorySearch.toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.brand || '').toLowerCase().includes(q) ||
        (i.batchNumber || '').toLowerCase().includes(q) ||
        String(i.productId).includes(q)
      );
    }

    return list;
  }, [inventoryData, inventoryFilter, inventoryCategory, inventorySearch]);

  const stats = [
    { label: 'Retail products', value: retailProducts.length, icon: FiPackage },
    { label: 'Total Orders', value: liveOrders ? liveOrders.length : 0, icon: FiShoppingBag },
    { label: 'Registered Customers', value: liveCustomers ? liveCustomers.length : 0, icon: FiUsers },
    { label: 'Customer Reviews', value: reviewsList.length, icon: FiStar },
    { label: 'Hero Banners', value: cmsData.banners.length, icon: FiImage },
    { label: 'Active Pages', value: cmsData.pages.length, icon: FiBookOpen }
  ];

  const exportInventoryCsv = () => {
    if (!inventoryData?.items) return;
    downloadCsv('siri-traders-inventory-report.csv', [
      ['Product ID', 'Name', 'Category', 'Brand', 'Weight/Unit', 'Available Stock', 'Reserved Stock', 'Damaged Stock', 'Returned Stock', 'Expired Stock', 'Incoming Stock', 'Reorder Level', 'Cost Price (₹)', 'Selling Price (₹)', 'Stock Valuation (₹)', 'Expiry Date', 'Batch Number', 'Status'],
      ...inventoryData.items.map(i => [
        i.productId,
        i.name,
        i.category,
        i.brand || '',
        `${i.weight || ''} ${i.unit || ''}`.trim(),
        i.availableStock,
        i.reservedStock,
        i.damagedStock,
        i.returnedStock,
        i.expiredStock,
        i.incomingStock,
        i.reorderLevel,
        i.costPrice,
        i.price,
        i.stockValuation,
        i.expiryDate || 'N/A',
        i.batchNumber || 'N/A',
        i.isOutOfStock ? 'OUT OF STOCK' : (i.isLowStock ? 'LOW STOCK' : 'IN STOCK')
      ])
    ]);
  };

  const exportOrdersCsv = () => {
    if (!liveOrders) return;
    downloadCsv('siri-traders-orders-report.csv', [
      ['Order ID', 'Bill Number', 'Customer Name', 'Phone', 'Email', 'Total (₹)', 'Payment Method', 'Payment Status', 'Txn Ref', 'Order Status', 'Delivery Address', 'Delivery Slot', 'Placed Date', 'Refund Amount (₹)'],
      ...liveOrders.map(o => [
        o.id,
        `BILL-${o.id + 7820}`,
        o.customerName || 'Customer',
        o.customerPhone || '',
        o.customerEmail || '',
        o.total,
        o.paymentMethod || 'COD',
        o.paymentStatus || 'Pending',
        o.paymentTxnId || '',
        o.status,
        o.deliveryAddress || '',
        o.deliverySlot || '',
        o.createdAt ? new Date(o.createdAt).toLocaleString('en-IN') : '',
        o.refundAmount || 0
      ])
    ]);
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    if (!adjustModalItem) return;
    const qty = parseInt(adjustForm.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a valid positive quantity');
      return;
    }

    setAdjustLoading(true);
    try {
      await adminApi.adjustStock({
        productId: adjustModalItem.productId,
        changeType: adjustForm.changeType,
        quantity: qty,
        targetField: adjustForm.targetField,
        reason: adjustForm.reason,
        notes: adjustForm.notes
      });
      await loadInventory();
      setAdjustModalItem(null);
      setAdjustForm({
        changeType: 'ADD',
        quantity: '',
        targetField: 'availableStock',
        reason: 'Purchase / New Stock Received',
        notes: ''
      });
      setSaveToast({ type: 'success', msg: `Stock adjusted successfully for ${adjustModalItem.name}` });
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      alert('Stock adjustment failed: ' + err.message);
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleReorderConfigSave = async (e) => {
    e.preventDefault();
    if (!reorderModalItem) return;

    setReorderLoading(true);
    try {
      await adminApi.updateInventoryConfig({
        productId: reorderModalItem.productId,
        reorderLevel: parseInt(reorderForm.reorderLevel, 10) || 10,
        costPrice: parseInt(reorderForm.costPrice, 10) || 0,
        expiryDate: reorderForm.expiryDate,
        batchNumber: reorderForm.batchNumber,
        location: reorderForm.location,
        incomingStock: parseInt(reorderForm.incomingStock, 10) || 0
      });
      await loadInventory();
      setReorderModalItem(null);
      setSaveToast({ type: 'success', msg: `Reorder & batch settings updated for ${reorderModalItem.name}` });
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      alert('Failed to update inventory settings: ' + err.message);
    } finally {
      setReorderLoading(false);
    }
  };

  const openProductHistory = async (item) => {
    setHistoryModalItem(item);
    setHistoryLoading(true);
    try {
      const logs = await adminApi.fetchInventoryLogs(item.productId);
      setHistoryLogs(logs);
    } catch (err) {
      console.error('Failed to load product history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleUpdateOrder = async (orderId, updatePayload, successMsg) => {
    setOrderActionLoading(true);
    try {
      const updated = await adminApi.updateOrder(orderId, updatePayload);
      setLiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updated } : o));
      if (selectedOrderModal && selectedOrderModal.id === orderId) {
        setSelectedOrderModal(prev => ({ ...prev, ...updated }));
      }
      setSaveToast({ type: 'success', msg: successMsg || `Order #${orderId} updated successfully` });
      setTimeout(() => setSaveToast(null), 4000);
      loadInventory();
    } catch (err) {
      alert('Failed to update order: ' + err.message);
    } finally {
      setOrderActionLoading(false);
    }
  };

  const parseOrderDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return dateVal;
    let cleanStr = String(dateVal).trim().replace(' ', 'T');
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const getOrderRevenue = (order) => {
    if (!order) return 0;
    if (order.status === 'Cancelled') return 0;
    if (typeof order.total === 'number') return order.total - (order.refundAmount || 0);
    if (order.total != null && !Number.isNaN(Number(order.total))) return Number(order.total) - (order.refundAmount || 0);
    return (order.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (parseInt(item.quantity || 1, 10)), 0);
  };

  const analyticsSummary = useMemo(() => {
    const days = parseInt(analyticsTimeRange, 10) || 30;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const periodOrders = (liveOrders || []).filter(order => {
      const d = parseOrderDate(order.createdAt);
      return d && d >= start && d <= end;
    });

    const grossRevenue = periodOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalRefunds = periodOrders.reduce((sum, o) => sum + Number(o.refundAmount || 0), 0);
    const netRevenue = grossRevenue - totalRefunds;
    const validOrdersCount = periodOrders.filter(o => o.status !== 'Cancelled').length;
    const aov = validOrdersCount > 0 ? Math.round(netRevenue / validOrdersCount) : 0;
    const totalUnitsSold = periodOrders.filter(o => o.status !== 'Cancelled').reduce((sum, o) => sum + (o.items || []).reduce((is, it) => is + parseInt(it.quantity || 1, 10), 0), 0);

    const categorySales = {};
    const brandSales = {};
    const prodSales = {};
    const areaSales = {};

    periodOrders.filter(o => o.status !== 'Cancelled').forEach(o => {
      const area = (o.deliveryAddress || '').split(',').slice(-2)[0]?.trim() || 'Kukatpally';
      if (!areaSales[area]) areaSales[area] = { orders: 0, revenue: 0 };
      areaSales[area].orders += 1;
      areaSales[area].revenue += getOrderRevenue(o);

      (o.items || []).forEach(it => {
        const prod = allProducts.find(p => p.id === it.productId || p.name === it.name) || {};
        const cat = prod.category || 'Grocery';
        const brand = prod.brand || 'Siri Select';
        const q = parseInt(it.quantity || 1, 10);
        const rev = (it.price || 0) * q;

        categorySales[cat] = (categorySales[cat] || 0) + rev;
        brandSales[brand] = (brandSales[brand] || 0) + rev;

        const pId = it.productId || it.name;
        if (!prodSales[pId]) prodSales[pId] = { name: it.name, brand, category: cat, units: 0, revenue: 0 };
        prodSales[pId].units += q;
        prodSales[pId].revenue += rev;
      });
    });

    const fastMoving = Object.values(prodSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const slowMoving = allProducts.filter(p => !prodSales[p.id] && p.inStock).slice(0, 5);
    const wastageLoss = (inventoryData?.items || []).reduce((sum, it) => sum + ((it.damagedStock || 0) + (it.expiredStock || 0)) * (it.costPrice || Math.round(it.price * 0.78)), 0);
    const totalCust = liveCustomers?.length || 1;
    const returningCust = (liveCustomers || []).filter(c => (c.ordersCount || 0) >= 2).length;
    const repeatRate = Math.round((returningCust / totalCust) * 100);

    return {
      grossRevenue,
      netRevenue,
      totalRefunds,
      ordersCount: validOrdersCount,
      totalUnitsSold,
      aov,
      repeatRate,
      wastageLoss,
      categorySales: Object.entries(categorySales).sort((a, b) => b[1] - a[1]),
      brandSales: Object.entries(brandSales).sort((a, b) => b[1] - a[1]),
      fastMoving,
      slowMoving,
      areaSales: Object.entries(areaSales).sort((a, b) => b[1].revenue - a[1].revenue)
    };
  }, [liveOrders, liveCustomers, inventoryData, allProducts, analyticsTimeRange]);

  const salesTrendData = useMemo(() => {
    const days = parseInt(analyticsTimeRange, 10) || 30;
    const now = new Date();
    return Array.from({ length: Math.min(days, 30) }, (_, index) => {
      const step = Math.min(days, 30);
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (step - 1 - index), 0, 0, 0, 0);
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
      const revenue = (liveOrders || []).reduce((sum, order) => {
        const date = parseOrderDate(order.createdAt);
        if (!date || date < day || date > dayEnd) return sum;
        return sum + getOrderRevenue(order);
      }, 0);
      return {
        date: day,
        label: day.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue
      };
    });
  }, [liveOrders, analyticsTimeRange]);

  const handleAdminLogout = async () => {
    await adminApi.logout();
    setAdminSession(null);
    navigate('/admin-login');
  };

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
    
    const validVariants = detailedVariants.filter(v => v.label && (v.price || v.price === 0)).map(v => ({
      id: v.id || `var-${Date.now()}-${Math.random()}`,
      label: v.label,
      packSize: v.packSize || '',
      unit: v.unit || productDraft.unit || 'g',
      price: Number(v.price) || 0,
      mrp: Number(v.mrp) || Number(v.price) || 0,
      costPrice: Number(v.costPrice) || 0,
      stock: Number(v.stock) || 0,
      sku: v.sku || '',
      barcode: v.barcode || '',
      inStock: v.inStock !== false
    }));

    const basePrice = Number(productDraft.price) || (validVariants[0]?.price || 0);
    const baseCost = Number(productDraft.costPrice) || (validVariants[0]?.costPrice || Math.round(basePrice * 0.78));
    const baseMrp = Number(productDraft.mrp) || basePrice;

    const baseNext = {
      ...productDraft,
      subcategory: productDraft.subcategory || '',
      sku: productDraft.sku || genSku(productDraft.category),
      barcode: productDraft.barcode || genBarcode(),
      price: basePrice,
      mrp: baseMrp,
      costPrice: baseCost,
      discount: Number(productDraft.discount) || (baseMrp > basePrice ? Math.round(((baseMrp - basePrice) / baseMrp) * 100) : 0),
      gstRate: Number(productDraft.gstRate) || 0,
      hsnCode: productDraft.hsnCode || '',
      batchNumber: productDraft.batchNumber || `BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      mfgDate: productDraft.mfgDate || '',
      expiryDate: productDraft.expiryDate || '',
      image: productDraft.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
      inStock: productDraft.stockNote !== 'Out of stock',
      isPublished: productDraft.isPublished !== false,
      isArchived: Boolean(productDraft.isArchived),
      isBestseller: Boolean(productDraft.isBestseller),
      isTodaysDeal: Boolean(productDraft.isTodaysDeal),
      variants: validVariants.length > 0 ? validVariants : undefined
    };
    
    let nextProduct = baseNext;
    if (isWholesale) {
      nextProduct = {
        ...baseNext,
        wholesalePrice: Number(productDraft.wholesalePrice) || baseNext.price,
        bulkPackLabel: productDraft.bulkPackLabel || '',
        bulkPackPrice: Number(productDraft.bulkPackPrice) || 0,
        wholesaleCaseLabel: productDraft.wholesaleCaseLabel || '',
        wholesaleCasePrice: Number(productDraft.wholesaleCasePrice) || 0
      };
    }
    
    setApiLoading(true);
    setSaveToast(null);
    try {
      const isEdit = Boolean(productDraft.id && typeof productDraft.id === 'number');
      const { stockNote, id: _id, ...apiPayload } = nextProduct;
      if (isEdit) {
        const saved = await adminApi.updateProduct(productDraft.id, apiPayload);
        nextProduct = { ...nextProduct, id: saved.id };
      } else {
        const saved = await adminApi.createProduct(apiPayload);
        nextProduct = { ...nextProduct, id: saved.id };
      }
      setSaveToast({ type: 'success', msg: `✅ “${nextProduct.name}” saved to database (SKU: ${nextProduct.sku})` });
      setTimeout(() => setSaveToast(null), 5000);
      loadInventory();
    } catch (err) {
      if (!productDraft.id) nextProduct = { ...nextProduct, id: Date.now() };
      setSaveToast({ type: 'error', msg: `⚠️ DB error: ${err.message}` });
      setTimeout(() => setSaveToast(null), 8000);
    } finally {
      setApiLoading(false);
    }
    
    if (isWholesale) {
      const exists = wholesaleProducts.some(p => String(p.id) === String(nextProduct.id));
      const next = exists ? wholesaleProducts.map(p => String(p.id) === String(nextProduct.id) ? nextProduct : p) : [nextProduct, ...wholesaleProducts];
      persistWholesaleProducts(next);
      setProductDraft(blankWholesaleProduct);
    } else {
      const exists = retailProducts.some(p => String(p.id) === String(nextProduct.id));
      const next = exists ? retailProducts.map(p => String(p.id) === String(nextProduct.id) ? nextProduct : p) : [nextProduct, ...retailProducts];
      persistRetailProducts(next);
      setProductDraft(blankProduct);
    }
    setDetailedVariants([]);
  };

  const editProduct = (product) => {
    const isWholesale = Boolean(product.wholesalePrice);
    const isProductsTab = activeTab === 'retail-products' || activeTab === 'wholesale-products';
    const targetTab = isProductsTab ? activeTab : (isWholesale ? 'wholesale-products' : 'retail-products');
    
    setProductDraft({
      ...product,
      subcategory: product.subcategory || '',
      sku: product.sku || genSku(product.category),
      barcode: product.barcode || genBarcode(),
      costPrice: product.costPrice != null ? String(product.costPrice) : '',
      gstRate: product.gstRate != null ? String(product.gstRate) : '0',
      hsnCode: product.hsnCode || '',
      batchNumber: product.batchNumber || '',
      mfgDate: product.mfgDate || '',
      expiryDate: product.expiryDate || '',
      isPublished: product.isPublished !== false,
      isArchived: Boolean(product.isArchived),
      price: String(product.price || ''),
      mrp: String(product.mrp || ''),
      discount: String(product.discount || ''),
      wholesalePrice: product.wholesalePrice != null ? String(product.wholesalePrice) : '',
      bulkPackLabel: product.bulkPackLabel || '',
      bulkPackPrice: product.bulkPackPrice != null ? String(product.bulkPackPrice) : '',
      wholesaleCaseLabel: product.wholesaleCaseLabel || '',
      wholesaleCasePrice: product.wholesaleCasePrice != null ? String(product.wholesaleCasePrice) : ''
    });

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      setDetailedVariants(product.variants);
    } else {
      setDetailedVariants([]);
    }

    setActiveTab(targetTab);
    setTimeout(() => {
      const editForm = document.querySelector('.admin-workspace .admin-form');
      editForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const duplicateProduct = (product) => {
    const isWholesale = Boolean(product.wholesalePrice);
    const targetTab = isWholesale ? 'wholesale-products' : 'retail-products';
    const clonedVariants = (product.variants || []).map(v => ({
      ...v,
      id: `var-${Date.now()}-${Math.random()}`,
      sku: genSku(product.category),
      barcode: genBarcode()
    }));

    setProductDraft({
      ...product,
      id: '',
      name: `Copy of ${product.name}`,
      sku: genSku(product.category),
      barcode: genBarcode(),
      price: String(product.price || ''),
      mrp: String(product.mrp || ''),
      costPrice: String(product.costPrice || ''),
      discount: String(product.discount || ''),
      gstRate: String(product.gstRate || '0'),
      hsnCode: product.hsnCode || '',
      batchNumber: `BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      isPublished: true,
      isArchived: false,
      wholesalePrice: product.wholesalePrice != null ? String(product.wholesalePrice) : '',
      bulkPackLabel: product.bulkPackLabel || '',
      bulkPackPrice: product.bulkPackPrice != null ? String(product.bulkPackPrice) : '',
      wholesaleCaseLabel: product.wholesaleCaseLabel || '',
      wholesaleCasePrice: product.wholesaleCasePrice != null ? String(product.wholesaleCasePrice) : ''
    });

    setDetailedVariants(clonedVariants);
    setActiveTab(targetTab);
    setSaveToast({ type: 'success', msg: `📋 Cloned "${product.name}" into editor draft.` });
    setTimeout(() => {
      const editForm = document.querySelector('.admin-workspace .admin-form');
      editForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const toggleArchiveProduct = async (product) => {
    const nextArchived = !product.isArchived;
    const isWholesale = Boolean(product.wholesalePrice);
    const updater = p => p.id === product.id ? { ...p, isArchived: nextArchived } : p;
    if (isWholesale) persistWholesaleProducts(wholesaleProducts.map(updater));
    else persistRetailProducts(retailProducts.map(updater));
    if (typeof product.id === 'number') {
      try {
        await adminApi.updateProduct(product.id, { isArchived: nextArchived });
      } catch (err) {
        console.error('Failed to update archive status:', err);
      }
    }
    setSaveToast({ type: 'success', msg: nextArchived ? `📁 Archived "${product.name}"` : `Restored "${product.name}" from archive` });
    setTimeout(() => setSaveToast(null), 3000);
  };

  const togglePublishProduct = async (product) => {
    const nextPub = product.isPublished === false ? true : false;
    const isWholesale = Boolean(product.wholesalePrice);
    const updater = p => p.id === product.id ? { ...p, isPublished: nextPub } : p;
    if (isWholesale) persistWholesaleProducts(wholesaleProducts.map(updater));
    else persistRetailProducts(retailProducts.map(updater));
    if (typeof product.id === 'number') {
      try {
        await adminApi.updateProduct(product.id, { isPublished: nextPub });
      } catch (err) {
        console.error('Failed to update published status:', err);
      }
    }
    setSaveToast({ type: 'success', msg: nextPub ? `🟢 Published "${product.name}" to store` : `🟡 Hidden "${product.name}" (Draft)` });
    setTimeout(() => setSaveToast(null), 3000);
  };

  const updateProductStock = async (productId, stockNote, isWholesale) => {
    const inStock = stockNote !== 'Out of stock';
    if (isWholesale) {
      persistWholesaleProducts(wholesaleProducts.map(p => p.id === productId ? { ...p, stockNote, inStock } : p));
    } else {
      persistRetailProducts(retailProducts.map(p => p.id === productId ? { ...p, stockNote, inStock } : p));
    }
    if (typeof productId === 'number') {
      adminApi.updateProduct(productId, { inStock }).catch(() => {});
    }
  };

  const removeProduct = async (productId) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    if (activeTab === 'wholesale-products') {
      persistWholesaleProducts(wholesaleProducts.filter(p => p.id !== productId));
    } else {
      persistRetailProducts(retailProducts.filter(p => p.id !== productId));
    }
    if (typeof productId === 'number') {
      adminApi.deleteProduct(productId).catch(() => {});
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
        alert(`Failed to update ${field}: ${err.message}`);
      }
    }
  };

  const saveOffer = async (event) => {
    event.preventDefault();
    const festiveKeywords = /diwali|eid|holi|christmas|navratri|rakhi|onam|sankranti|ramzan|ugadi|ganesh|dussehra|festival|wedding|party/i;
    const group = festiveKeywords.test(offerDraft.title + ' ' + offerDraft.badge) ? 'festival' : (offerDraft.group || 'daily');
    const payload = {
      ...offerDraft,
      group,
      price: Number(offerDraft.price) || 0,
      mrp: Number(offerDraft.mrp) || 0,
      buyQty: Number(offerDraft.buyQty) || 1,
      getQty: Number(offerDraft.getQty) || 1,
      targetCategory: offerDraft.targetCategory || null,
      targetProductId: offerDraft.targetProductId ? Number(offerDraft.targetProductId) : null,
      startDate: offerDraft.startDate || null,
      endDate: offerDraft.endDate || null,
      usageLimit: offerDraft.usageLimit ? Number(offerDraft.usageLimit) : null,
      active: true,
      image: offerDraft.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&q=80'
    };
    try {
      const saved = normalizeOffer(await adminApi.saveOffer(payload));
      setOffers(prev => [saved, ...prev.filter(offer => offer.id !== saved.id)]);
      setOfferDraft(blankOffer);
      setSaveToast({ type: 'success', msg: `🎁 Promotion "${saved.title}" saved successfully!` });
      setTimeout(() => setSaveToast(null), 4000);
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
      maxDiscount: couponDraft.maxDiscount ? Number(couponDraft.maxDiscount) : null,
      buyQuantity: Number(couponDraft.buyQuantity) || 1,
      getQuantity: Number(couponDraft.getQuantity) || 1,
      targetType: couponDraft.targetType || 'all',
      targetCategory: couponDraft.targetCategory || null,
      targetProductId: couponDraft.targetProductId ? Number(couponDraft.targetProductId) : null,
      targetCustomerEmail: couponDraft.targetCustomerEmail || null,
      usageLimit: couponDraft.usageLimit ? Number(couponDraft.usageLimit) : 500,
      perUserLimit: Number(couponDraft.perUserLimit) || 1,
      startDate: couponDraft.startDate || null,
      endDate: couponDraft.endDate || null
    };
    try {
      const saved = await adminApi.saveCoupon(payload);
      setCoupons(prev => [saved, ...prev.filter(coupon => coupon.id !== saved.id)]);
      setCouponDraft(blankCoupon);
      setSaveToast({ type: 'success', msg: `🎟️ Coupon "${saved.code}" saved and active!` });
      setTimeout(() => setSaveToast(null), 4000);
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
            [field]: ['price', 'mrp', 'discount', 'costPrice', 'gstRate'].includes(field) ? Number(value) || 0 : value,
            inStock: field === 'stockNote' ? value !== 'Out of stock' : p.inStock
          }
        : p;
    if (isWholesale) {
      persistWholesaleProducts(wholesaleProducts.map(updater));
    } else {
      persistRetailProducts(retailProducts.map(updater));
    }
  };

  const filteredContentProducts = (activeTab === 'wholesale-content' ? wholesaleProducts : retailProducts).filter(product =>
    product.name.toLowerCase().includes(contentSearch.toLowerCase()) ||
    (product.brand || '').toLowerCase().includes(contentSearch.toLowerCase())
  );

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

  const invSummary = inventoryData?.summary || {
    totalValuation: 0,
    totalRetailValuation: 0,
    totalAvailableUnits: 0,
    totalReservedUnits: 0,
    totalDamagedUnits: 0,
    totalReturnedUnits: 0,
    totalExpiredUnits: 0,
    totalIncomingUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    nearExpiryCount: 0,
    expiredCount: 0
  };

  const currSellPrice = Number(productDraft.price) || 0;
  const currCostPrice = Number(productDraft.costPrice) || 0;
  const currProfitAmount = currSellPrice - currCostPrice;
  const currProfitMarginPct = currSellPrice > 0 ? Math.round(((currSellPrice - currCostPrice) / currSellPrice) * 100) : 0;

  return (
    <div className="page-wrapper admin-page-wrapper admin-habane">
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

          <div className="admin-role-selector">
            <label htmlFor="admin-role">SELECT ADMIN ROLE</label>
            <select
              id="admin-role"
              value={selectedAdminRole}
              onChange={(e) => setSelectedAdminRole(e.target.value)}
            >
              <option value="Owner">Owner</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Product Manager">Product Manager</option>
              <option value="Order Manager">Order Manager</option>
              <option value="Marketing Manager">Marketing Manager</option>
              <option value="Content Manager">Content Manager</option>
              <option value="Customer Support">Customer Support</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          <nav className="admin-sidebar__nav">
            {ADMIN_NAV_SECTIONS.map(section => {
              const visibleItems = section.items.filter(([id]) => allowedAdminTabs.includes(id));
              if (visibleItems.length === 0) return null;

              return (
                <div className="admin-sidebar__section" key={section.title}>
                  <div className="admin-sidebar__section-title">
                    <span>{section.title}</span>
                  </div>

                  {visibleItems.map(([id, label, Icon]) => (
                    <button
                      key={id}
                      type="button"
                      className={activeTab === id ? 'admin-sidebar__nav-item admin-sidebar__nav-item--active' : 'admin-sidebar__nav-item'}
                      onClick={() => {
                        setActiveTab(id);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon />
                      <span>{label}</span>
                      {id === 'inventory' && invSummary.lowStockCount + invSummary.outOfStockCount > 0 && (
                        <span style={{ marginLeft: 'auto', background: '#EF4444', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                          {invSummary.lowStockCount + invSummary.outOfStockCount}
                        </span>
                      )}
                      {id === 'orders' && liveOrders && (
                        <span style={{ marginLeft: 'auto', background: '#2D5016', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                          {liveOrders.filter(o => ['Pending', 'Preparing'].includes(o.status)).length}
                        </span>
                      )}
                      {id === 'reviews' && reviewsList.length > 0 && (
                        <span style={{ marginLeft: 'auto', background: '#F59E0B', color: '#fff', fontSize: '10px', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                          {reviewsList.length}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              );
            })}
          </nav>

          <div className="admin-sidebar__footer">
            <button className="admin-sidebar__logout" onClick={handleAdminLogout}>
              <FiLogOut /> <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div className="admin-sidebar-backdrop" onClick={() => setMobileMenuOpen(false)} />
        )}

        {/* Right Main Content area */}
        <main className="admin-main">
          <header className="admin-main-header">
            <div>
              <span className="admin-main-eyebrow">Control Panel / {activeTab.replace('-', ' ')}</span>
              <h1>
                {activeTab === 'dashboard' && 'Overview Management'}
                {activeTab === 'cms' && 'Website Content Management (CMS)'}
                {activeTab === 'seo' && 'Search Engine Optimization (SEO)'}
                {activeTab === 'inventory' && 'Grocery Inventory Hub'}
                {activeTab === 'orders' && 'Order & Payment Management'}
                {activeTab === 'customers' && 'Customer Management & Segmentation'}
                {activeTab === 'reviews' && 'Customer Reviews & Rating Moderation'}
                {activeTab === 'offers' && 'Grocery Promotions & Coupon Engine'}
                {activeTab === 'delivery-zones' && 'Grocery Delivery & Slots'}
                {activeTab === 'retail-products' && 'Grocery Products & Variants'}
                {activeTab === 'wholesale-products' && 'Wholesale Products & Bulk Packs'}
                {activeTab === 'sales-stats' && 'Grocery Sales & Performance Analytics'}
                {activeTab !== 'dashboard' && activeTab !== 'cms' && activeTab !== 'seo' && activeTab !== 'inventory' && activeTab !== 'orders' && activeTab !== 'customers' && activeTab !== 'reviews' && activeTab !== 'offers' && activeTab !== 'delivery-zones' && activeTab !== 'retail-products' && activeTab !== 'wholesale-products' && activeTab !== 'sales-stats' && activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h1>
            </div>
            
            <div className="admin-main-header__actions">
              <a href="/home" target="_blank" rel="noopener noreferrer" className="admin-main-header__btn">
                Launch Site →
              </a>
            </div>
          </header>

          {/* Quick stats on dashboard */}
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

          {/* =========================================================================
             MODULE 1: WEBSITE CONTENT MANAGEMENT (CMS)
             ========================================================================= */}
          {activeTab === 'cms' && (
            <div className="admin-cms-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Sub-Navigation */}
              <div className="admin-cms-nav">
                <button
                  className={`admin-cms-nav-btn ${cmsTab === 'banners' ? 'admin-cms-nav-btn--active' : ''}`}
                  onClick={() => setCmsTab('banners')}
                >
                  <FiImage /> 🎪 Hero Banners ({cmsData.banners.length})
                </button>
                <button
                  className={`admin-cms-nav-btn ${cmsTab === 'announcement' ? 'admin-cms-nav-btn--active' : ''}`}
                  onClick={() => setCmsTab('announcement')}
                >
                  <FiVolume2 size={14} /> 📢 Announcement Bar
                </button>
                <button
                  className={`admin-cms-nav-btn ${cmsTab === 'pages' ? 'admin-cms-nav-btn--active' : ''}`}
                  onClick={() => setCmsTab('pages')}
                >
                  <FiFileText /> 📄 Pages & Policies ({cmsData.pages.length})
                </button>
                <button
                  className={`admin-cms-nav-btn ${cmsTab === 'faqs' ? 'admin-cms-nav-btn--active' : ''}`}
                  onClick={() => setCmsTab('faqs')}
                >
                  <FiHelpCircle /> ❓ FAQs ({cmsData.faqs.length})
                </button>
                <button
                  className={`admin-cms-nav-btn ${cmsTab === 'blogs' ? 'admin-cms-nav-btn--active' : ''}`}
                  onClick={() => setCmsTab('blogs')}
                >
                  <FiBookOpen /> ✍️ Blog & Recipes ({cmsData.blogs.length})
                </button>
              </div>

              {/* 1. HERO BANNERS */}
              {cmsTab === 'banners' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="admin-card admin-card--wide">
                    <h2 style={{ margin: '0 0 12px' }}>{editingBanner ? 'Edit Hero Banner' : 'Add New Hero Banner'}</h2>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target;
                      const title = form.title.value.trim();
                      const subtitle = form.subtitle.value.trim();
                      const image = form.image.value.trim();
                      const ctaText = form.ctaText.value.trim();
                      const ctaLink = form.ctaLink.value.trim();
                      const sortOrder = Number(form.sortOrder.value) || 0;

                      if (!title || !image) return;
                      try {
                        if (editingBanner) {
                          const updated = await adminApi.updateBanner(editingBanner.id, { title, subtitle, image, ctaText, ctaLink, sortOrder });
                          setCmsData(prev => ({ ...prev, banners: prev.banners.map(b => b.id === updated.id ? updated : b) }));
                          setEditingBanner(null);
                        } else {
                          const saved = await adminApi.saveBanner({ title, subtitle, image, ctaText, ctaLink, sortOrder, active: true });
                          setCmsData(prev => ({ ...prev, banners: [...prev.banners, saved] }));
                        }
                        form.reset();
                        setSaveToast({ type: 'success', msg: 'Hero banner saved successfully' });
                        setTimeout(() => setSaveToast(null), 3000);
                      } catch (err) { alert(err.message); }
                    }}>
                      <div className="admin-form__grid">
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Headline / Title *</label>
                          <input name="title" defaultValue={editingBanner?.title || ''} className="admin-input-box" placeholder="e.g. Farm Fresh Groceries at Wholesale Rates" required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Subheading</label>
                          <input name="subtitle" defaultValue={editingBanner?.subtitle || ''} className="admin-input-box" placeholder="e.g. Save up to 35% on daily staples" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Banner Image URL *</label>
                          <input name="image" defaultValue={editingBanner?.image || ''} className="admin-input-box" placeholder="https://images.unsplash.com/..." required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>CTA Button Label</label>
                          <input name="ctaText" defaultValue={editingBanner?.ctaText || 'Shop Now'} className="admin-input-box" placeholder="Shop Now" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Target Link</label>
                          <input name="ctaLink" defaultValue={editingBanner?.ctaLink || '/categories'} className="admin-input-box" placeholder="/categories" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Sort Order</label>
                          <input name="sortOrder" type="number" defaultValue={editingBanner?.sortOrder || 1} className="admin-input-box" />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button type="submit" className="admin__primary"><FiPlus /> {editingBanner ? 'Save Banner' : 'Add Banner'}</button>
                        {editingBanner && <button type="button" className="admin__ghost" onClick={() => setEditingBanner(null)}>Cancel</button>}
                      </div>
                    </form>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {cmsData.banners.map(banner => (
                      <div key={banner.id} className="admin-banner-card">
                        <img src={toWebpImage(banner.image)} alt={banner.title} className="admin-banner-card__img" />
                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <strong style={{ fontSize: '13.5px', color: '#111827' }}>{banner.title}</strong>
                          {banner.subtitle && <span style={{ fontSize: '12px', color: '#687466' }}>{banner.subtitle}</span>}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#687466' }}>
                            <span>CTA: <strong>{banner.ctaText}</strong> ➔ {banner.ctaLink}</span>
                            <span>Order: #{banner.sortOrder}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F3ED', paddingTop: '8px', marginTop: '4px' }}>
                            <button
                              type="button"
                              style={{
                                background: banner.active !== false ? '#DCFCE7' : '#F3F4F6',
                                color: banner.active !== false ? '#166534' : '#6B7280',
                                border: 'none',
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                              onClick={async () => {
                                const nextActive = banner.active === false ? true : false;
                                const updated = await adminApi.updateBanner(banner.id, { active: nextActive });
                                setCmsData(prev => ({ ...prev, banners: prev.banners.map(b => b.id === updated.id ? updated : b) }));
                              }}
                            >
                              {banner.active !== false ? '🟢 Active' : '⚪ Inactive'}
                            </button>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="admin__ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setEditingBanner(banner)}>
                                <FiEdit2 size={11} /> Edit
                              </button>
                              <button className="admin-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={async () => {
                                if (window.confirm('Delete banner?')) {
                                  await adminApi.deleteBanner(banner.id);
                                  setCmsData(prev => ({ ...prev, banners: prev.banners.filter(b => b.id !== banner.id) }));
                                }
                              }}>
                                <FiTrash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. ANNOUNCEMENT BAR */}
              {cmsTab === 'announcement' && (
                <div className="admin-card admin-card--wide" style={{ maxWidth: '780px' }}>
                  <h2 style={{ margin: '0 0 12px' }}>Header Announcement Bar Configuration</h2>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#687466', display: 'block', marginBottom: '6px' }}>Live Storefront Preview:</span>
                    <div
                      className="admin-announcement-preview"
                      style={{
                        backgroundColor: cmsData.settings?.announcementBg || '#1C4B12',
                        color: cmsData.settings?.announcementColor || '#FFFFFF'
                      }}
                    >
                      <span>{cmsData.settings?.announcementText || '⚡ Free 15-min delivery across Hyderabad on orders above ₹499!'}</span>
                      <a href={cmsData.settings?.announcementLink || '/categories'} style={{ color: '#FCD34D', textDecoration: 'underline', fontSize: '12px' }}>
                        Shop Now →
                      </a>
                    </div>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target;
                    const announcementText = form.announcementText.value;
                    const announcementBg = form.announcementBg.value;
                    const announcementColor = form.announcementColor.value;
                    const announcementLink = form.announcementLink.value;
                    const announcementActive = form.announcementActive.checked;

                    try {
                      const updated = await adminApi.updateSettings({
                        ...cmsData.settings,
                        announcementText,
                        announcementBg,
                        announcementColor,
                        announcementLink,
                        announcementActive
                      });
                      setCmsData(prev => ({ ...prev, settings: updated }));
                      setSaveToast({ type: 'success', msg: 'Announcement bar settings published live!' });
                      setTimeout(() => setSaveToast(null), 3000);
                    } catch (err) { alert(err.message); }
                  }}>
                    <div className="admin-form__grid">
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Announcement Message Text</label>
                        <input
                          name="announcementText"
                          defaultValue={cmsData.settings?.announcementText || '⚡ Free 15-min delivery across Hyderabad on orders above ₹499!'}
                          className="admin-input-box"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Background Color (Hex)</label>
                        <input name="announcementBg" defaultValue={cmsData.settings?.announcementBg || '#1C4B12'} className="admin-input-box" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Text Color (Hex)</label>
                        <input name="announcementColor" defaultValue={cmsData.settings?.announcementColor || '#FFFFFF'} className="admin-input-box" />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Target Link</label>
                        <input name="announcementLink" defaultValue={cmsData.settings?.announcementLink || '/categories'} className="admin-input-box" />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                        <input type="checkbox" name="announcementActive" defaultChecked={cmsData.settings?.announcementActive !== false} />
                        <span>Show Announcement Bar on Storefront</span>
                      </label>
                    </div>

                    <button type="submit" className="admin__primary" style={{ marginTop: '14px' }}>
                      <FiSave /> Save & Publish Announcement Bar
                    </button>
                  </form>
                </div>
              )}

              {/* 3. STATIC & LEGAL PAGES */}
              {cmsTab === 'pages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="admin-card admin-card--wide">
                    <h2 style={{ margin: '0 0 12px' }}>{editingPage ? `Edit Page: ${editingPage.title}` : 'Add New Website / Policy Page'}</h2>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target;
                      const title = form.title.value.trim();
                      const slug = form.slug.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      const category = form.category.value;
                      const content = form.content.value;
                      const metaTitle = form.metaTitle.value;
                      const metaDescription = form.metaDescription.value;

                      try {
                        if (editingPage) {
                          const updated = await adminApi.updatePage(editingPage.id, { title, slug, category, content, metaTitle, metaDescription, isPublished: true });
                          setCmsData(prev => ({ ...prev, pages: prev.pages.map(p => p.id === updated.id ? updated : p) }));
                          setEditingPage(null);
                        } else {
                          const saved = await adminApi.savePage({ title, slug, category, content, metaTitle, metaDescription, isPublished: true });
                          setCmsData(prev => ({ ...prev, pages: [saved, ...prev.pages] }));
                        }
                        form.reset();
                        setSaveToast({ type: 'success', msg: 'Page published successfully' });
                        setTimeout(() => setSaveToast(null), 3000);
                      } catch (err) { alert(err.message); }
                    }}>
                      <div className="admin-form__grid">
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Page Title *</label>
                          <input name="title" defaultValue={editingPage?.title || ''} className="admin-input-box" placeholder="e.g. Terms of Trade" required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>URL Slug *</label>
                          <input name="slug" defaultValue={editingPage?.slug || ''} className="admin-input-box" placeholder="e.g. terms-of-trade" required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Category</label>
                          <select name="category" defaultValue={editingPage?.category || 'general'} className="admin-input-box">
                            <option value="general">General Page</option>
                            <option value="legal">Legal Page</option>
                            <option value="policy">Delivery / Refund Policy</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>SEO Meta Title</label>
                          <input name="metaTitle" defaultValue={editingPage?.metaTitle || ''} className="admin-input-box" placeholder="Page Title — Siri Traders" />
                        </div>
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Page Body Content (Markdown / HTML)</label>
                        <textarea name="content" defaultValue={editingPage?.content || ''} rows={6} className="admin-input-box" style={{ height: 'auto' }} required />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button type="submit" className="admin__primary"><FiSave /> {editingPage ? 'Save Changes' : 'Publish Page'}</button>
                        {editingPage && <button type="button" className="admin__ghost" onClick={() => setEditingPage(null)}>Cancel</button>}
                      </div>
                    </form>
                  </div>

                  <div className="admin-card admin-card--wide">
                    <h2>Live Website Pages ({cmsData.pages.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {cmsData.pages.map(page => (
                        <div key={page.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #E1E6DC', borderRadius: '8px' }}>
                          <div>
                            <strong style={{ fontSize: '13.5px', color: '#111827' }}>{page.title}</strong>
                            <span style={{ fontSize: '11.5px', color: '#687466', display: 'block' }}>
                              URL: <code>/info?tab={page.slug}</code> · Category: <strong>{page.category}</strong>
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="admin__ghost" style={{ padding: '6px 10px', fontSize: '11.5px' }} onClick={() => setEditingPage(page)}>
                              <FiEdit2 size={12} /> Edit
                            </button>
                            <button className="admin-danger" style={{ padding: '6px 10px', fontSize: '11.5px' }} onClick={async () => {
                              if (window.confirm(`Delete page "${page.title}"?`)) {
                                await adminApi.deletePage(page.id);
                                setCmsData(prev => ({ ...prev, pages: prev.pages.filter(p => p.id !== page.id) }));
                              }
                            }}>
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. FAQS */}
              {cmsTab === 'faqs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="admin-card admin-card--wide">
                    <h2 style={{ margin: '0 0 12px' }}>{editingFaq ? 'Edit FAQ' : 'Add FAQ'}</h2>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target;
                      const question = form.question.value.trim();
                      const answer = form.answer.value.trim();
                      const category = form.category.value;
                      const sortOrder = Number(form.sortOrder.value) || 0;

                      if (!question || !answer) return;
                      try {
                        if (editingFaq) {
                          const updated = await adminApi.updateFaq(editingFaq.id, { question, answer, category, sortOrder });
                          setCmsData(prev => ({ ...prev, faqs: prev.faqs.map(f => f.id === updated.id ? updated : f) }));
                          setEditingFaq(null);
                        } else {
                          const saved = await adminApi.saveFaq({ question, answer, category, sortOrder, active: true });
                          setCmsData(prev => ({ ...prev, faqs: [...prev.faqs, saved] }));
                        }
                        form.reset();
                        setSaveToast({ type: 'success', msg: 'FAQ saved successfully' });
                        setTimeout(() => setSaveToast(null), 3000);
                      } catch (err) { alert(err.message); }
                    }}>
                      <div className="admin-form__grid">
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Question *</label>
                          <input name="question" defaultValue={editingFaq?.question || ''} className="admin-input-box" placeholder="e.g. How fast is grocery delivery in Hyderabad?" required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Category</label>
                          <select name="category" defaultValue={editingFaq?.category || 'General'} className="admin-input-box">
                            <option>Delivery</option>
                            <option>Orders</option>
                            <option>Payments</option>
                            <option>Quality</option>
                            <option>General</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Sort Order</label>
                          <input name="sortOrder" type="number" defaultValue={editingFaq?.sortOrder || 1} className="admin-input-box" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Answer *</label>
                          <textarea name="answer" defaultValue={editingFaq?.answer || ''} rows={3} className="admin-input-box" style={{ height: 'auto' }} required />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button type="submit" className="admin__primary"><FiPlus /> {editingFaq ? 'Save FAQ' : 'Add FAQ'}</button>
                        {editingFaq && <button type="button" className="admin__ghost" onClick={() => setEditingFaq(null)}>Cancel</button>}
                      </div>
                    </form>
                  </div>

                  <div className="admin-card admin-card--wide">
                    <h2>Storefront FAQs ({cmsData.faqs.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {cmsData.faqs.map(faq => (
                        <div key={faq.id} style={{ padding: '12px 14px', background: '#FFFFFF', border: '1px solid #E1E6DC', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                            <div>
                              <strong style={{ fontSize: '13px', color: '#111827' }}>Q: {faq.question}</strong>
                              <span style={{ fontSize: '11px', background: '#F1F3ED', padding: '1px 6px', borderRadius: '4px', marginLeft: '8px' }}>
                                {faq.category}
                              </span>
                              <p style={{ fontSize: '12px', color: '#4B5563', margin: '4px 0 0' }}>A: {faq.answer}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="admin__ghost" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setEditingFaq(faq)}>
                                <FiEdit2 size={11} /> Edit
                              </button>
                              <button className="admin-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={async () => {
                                if (window.confirm('Delete FAQ?')) {
                                  await adminApi.deleteFaq(faq.id);
                                  setCmsData(prev => ({ ...prev, faqs: prev.faqs.filter(f => f.id !== faq.id) }));
                                }
                              }}>
                                <FiTrash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. BLOG & RECIPES */}
              {cmsTab === 'blogs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="admin-card admin-card--wide">
                    <h2 style={{ margin: '0 0 12px' }}>{editingBlog ? 'Edit Blog Article' : 'Write New Blog Article / Recipe'}</h2>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target;
                      const title = form.title.value.trim();
                      const slug = form.slug.value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      const author = form.author.value.trim();
                      const category = form.category.value;
                      const coverImage = form.coverImage.value.trim();
                      const excerpt = form.excerpt.value.trim();
                      const tags = form.tags.value.trim();
                      const content = form.content.value;

                      try {
                        if (editingBlog) {
                          const updated = await adminApi.updateBlog(editingBlog.id, { title, slug, author, category, coverImage, excerpt, tags, content, isPublished: true });
                          setCmsData(prev => ({ ...prev, blogs: prev.blogs.map(b => b.id === updated.id ? updated : b) }));
                          setEditingBlog(null);
                        } else {
                          const saved = await adminApi.saveBlog({ title, slug, author, category, coverImage, excerpt, tags, content, isPublished: true });
                          setCmsData(prev => ({ ...prev, blogs: [saved, ...prev.blogs] }));
                        }
                        form.reset();
                        setSaveToast({ type: 'success', msg: 'Blog article published!' });
                        setTimeout(() => setSaveToast(null), 3000);
                      } catch (err) { alert(err.message); }
                    }}>
                      <div className="admin-form__grid">
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Article Title *</label>
                          <input name="title" defaultValue={editingBlog?.title || ''} className="admin-input-box" placeholder="e.g. How to Choose the Best Basmati Rice" required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>URL Slug *</label>
                          <input name="slug" defaultValue={editingBlog?.slug || ''} className="admin-input-box" placeholder="e.g. how-to-choose-best-basmati-rice" required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Author</label>
                          <input name="author" defaultValue={editingBlog?.author || 'Siri Traders Team'} className="admin-input-box" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Category</label>
                          <select name="category" defaultValue={editingBlog?.category || 'Grocery Tips'} className="admin-input-box">
                            <option>Recipes</option>
                            <option>Healthy Eating</option>
                            <option>Grocery Tips</option>
                            <option>Company News</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Cover Image URL</label>
                          <input name="coverImage" defaultValue={editingBlog?.coverImage || ''} className="admin-input-box" placeholder="https://images.unsplash.com/..." />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Tags (Comma-separated)</label>
                          <input name="tags" defaultValue={editingBlog?.tags || ''} className="admin-input-box" placeholder="Basmati, Biryani, Rice" />
                        </div>
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Short Summary / Excerpt</label>
                        <input name="excerpt" defaultValue={editingBlog?.excerpt || ''} className="admin-input-box" placeholder="Brief 1-2 sentence preview" />
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Full Article Body</label>
                        <textarea name="content" defaultValue={editingBlog?.content || ''} rows={6} className="admin-input-box" style={{ height: 'auto' }} required />
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button type="submit" className="admin__primary"><FiSave /> {editingBlog ? 'Save Article' : 'Publish Article'}</button>
                        {editingBlog && <button type="button" className="admin__ghost" onClick={() => setEditingBlog(null)}>Cancel</button>}
                      </div>
                    </form>
                  </div>

                  <div className="admin-card admin-card--wide">
                    <h2>Published Articles ({cmsData.blogs.length})</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {cmsData.blogs.map(blog => (
                        <div key={blog.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#FFFFFF', border: '1px solid #E1E6DC', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {blog.coverImage && <img src={toWebpImage(blog.coverImage)} alt={blog.title} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />}
                            <div>
                              <strong style={{ fontSize: '13.5px', color: '#111827' }}>{blog.title}</strong>
                              <span style={{ fontSize: '11.5px', color: '#687466', display: 'block' }}>
                                By <strong>{blog.author}</strong> · {blog.category} · {new Date(blog.createdAt).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="admin__ghost" style={{ padding: '6px 10px', fontSize: '11.5px' }} onClick={() => setEditingBlog(blog)}>
                              <FiEdit2 size={12} /> Edit
                            </button>
                            <button className="admin-danger" style={{ padding: '6px 10px', fontSize: '11.5px' }} onClick={async () => {
                              if (window.confirm(`Delete article "${blog.title}"?`)) {
                                await adminApi.deleteBlog(blog.id);
                                setCmsData(prev => ({ ...prev, blogs: prev.blogs.filter(b => b.id !== blog.id) }));
                              }
                            }}>
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
             MODULE 2: SEO MANAGEMENT
             ========================================================================= */}
          {activeTab === 'seo' && (
            <div className="admin-seo-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Top SEO Audit Checklist Card */}
              <div className="admin-card admin-card--wide" style={{ padding: '18px 20px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '28px' }}>🚀</div>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#166534' }}>SEO Health Score: 96 / 100 (Optimal)</strong>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#15803D' }}>
                        Structured Data schema, Canonical URL, Open Graph metadata and XML Sitemap are fully configured.
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="admin__ghost" style={{ fontSize: '11.5px', background: '#FFFFFF' }}>
                      <FiExternalLink /> View XML Sitemap
                    </a>
                  </div>
                </div>
              </div>

              {/* SERP & Social Share Live Previews */}
              <div className="admin-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                {/* Google Search Result Preview */}
                <div className="admin-card">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#687466', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    🔍 Google Search Snippet Live Preview
                  </span>
                  <div className="admin-serp-preview">
                    <span className="admin-serp-url">https://www.siritrader.com</span>
                    <span className="admin-serp-title">{seoForm.metaTitle}</span>
                    <p className="admin-serp-desc">{seoForm.metaDescription}</p>
                  </div>
                </div>

                {/* Social Media Open Graph Preview */}
                <div className="admin-card">
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#687466', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    📱 Social Share (Facebook / WhatsApp / X) Preview
                  </span>
                  <div className="admin-og-preview">
                    <img src={toWebpImage(seoForm.ogImage)} alt="Social preview" />
                    <div className="admin-og-preview-content">
                      <span style={{ fontSize: '10.5px', color: '#687466', textTransform: 'uppercase' }}>SIRITRADER.COM</span>
                      <strong style={{ fontSize: '13px', color: '#111827', display: 'block', margin: '2px 0' }}>{seoForm.metaTitle}</strong>
                      <p style={{ fontSize: '11.5px', color: '#4B5563', margin: 0 }}>{seoForm.metaDescription.slice(0, 100)}...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Global SEO Settings Form */}
              <div className="admin-card admin-card--wide">
                <h2 style={{ margin: '0 0 14px' }}>Store-Wide Search Engine Optimization (SEO)</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const updated = await adminApi.updateSettings({
                      ...cmsData.settings,
                      ...seoForm
                    });
                    setCmsData(prev => ({ ...prev, settings: updated }));
                    setSaveToast({ type: 'success', msg: 'SEO settings saved and deployed to metadata headers!' });
                    setTimeout(() => setSaveToast(null), 3000);
                  } catch (err) { alert(err.message); }
                }}>
                  <div className="admin-form__grid">
                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Meta Title (Optimal: 50-60 chars)</label>
                        <span className={`admin-char-count ${seoForm.metaTitle.length >= 40 && seoForm.metaTitle.length <= 65 ? 'admin-char-count--good' : 'admin-char-count--warn'}`}>
                          {seoForm.metaTitle.length} chars
                        </span>
                      </div>
                      <input
                        className="admin-input-box"
                        value={seoForm.metaTitle}
                        onChange={(e) => setSeoForm(p => ({ ...p, metaTitle: e.target.value }))}
                        required
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Meta Description (Optimal: 120-160 chars)</label>
                        <span className={`admin-char-count ${seoForm.metaDescription.length >= 120 && seoForm.metaDescription.length <= 165 ? 'admin-char-count--good' : 'admin-char-count--warn'}`}>
                          {seoForm.metaDescription.length} chars
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        className="admin-input-box"
                        style={{ height: 'auto' }}
                        value={seoForm.metaDescription}
                        onChange={(e) => setSeoForm(p => ({ ...p, metaDescription: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Canonical Domain URL</label>
                      <input
                        className="admin-input-box"
                        value={seoForm.canonicalUrl}
                        onChange={(e) => setSeoForm(p => ({ ...p, canonicalUrl: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Social Share (OG) Image URL</label>
                      <input
                        className="admin-input-box"
                        value={seoForm.ogImage}
                        onChange={(e) => setSeoForm(p => ({ ...p, ogImage: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Google Search Console Token</label>
                      <input
                        className="admin-input-box"
                        value={seoForm.googleSiteVerification}
                        onChange={(e) => setSeoForm(p => ({ ...p, googleSiteVerification: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Robots Indexing</label>
                      <select
                        className="admin-input-box"
                        value={seoForm.robotsIndex ? 'true' : 'false'}
                        onChange={(e) => setSeoForm(p => ({ ...p, robotsIndex: e.target.value === 'true' }))}
                      >
                        <option value="true">🟢 Index, Follow (Recommended)</option>
                        <option value="false">🔴 NoIndex, NoFollow</option>
                      </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>JSON-LD Structured Data Schema (GroceryStore)</label>
                      <textarea
                        rows={4}
                        className="admin-input-box"
                        style={{ height: 'auto', fontFamily: 'monospace', fontSize: '11.5px' }}
                        value={seoForm.schemaJson}
                        onChange={(e) => setSeoForm(p => ({ ...p, schemaJson: e.target.value }))}
                      />
                    </div>
                  </div>

                  <button type="submit" className="admin__primary" style={{ marginTop: '14px' }}>
                    <FiSave /> Save & Deploy SEO Settings
                  </button>
                </form>
              </div>

              {/* 301 / 302 URL Redirects Manager */}
              <div className="admin-card admin-card--wide">
                <div className="admin-card__toolbar">
                  <div>
                    <h2 style={{ margin: 0 }}>301 / 302 URL Redirects Manager</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                      Prevent 404 broken links by redirecting old campaign or product paths to new URLs.
                    </p>
                  </div>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target;
                  const sourcePath = form.sourcePath.value.trim();
                  const targetPath = form.targetPath.value.trim();
                  const statusCode = Number(form.statusCode.value) || 301;

                  if (!sourcePath || !targetPath) return;
                  try {
                    const saved = await adminApi.saveRedirect({ sourcePath, targetPath, statusCode, active: true });
                    setCmsData(prev => ({ ...prev, redirects: [saved, ...prev.redirects] }));
                    form.reset();
                    setSaveToast({ type: 'success', msg: `Redirect for ${sourcePath} created` });
                    setTimeout(() => setSaveToast(null), 3000);
                  } catch (err) { alert(err.message); }
                }} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '14px 0' }}>
                  <input name="sourcePath" className="admin-input-box" placeholder="Old Path e.g. /rice-deals" style={{ width: '220px' }} required />
                  <input name="targetPath" className="admin-input-box" placeholder="Target Path e.g. /categories" style={{ width: '220px' }} required />
                  <select name="statusCode" className="admin-input-box" style={{ width: '140px' }}>
                    <option value="301">301 (Permanent)</option>
                    <option value="302">302 (Temporary)</option>
                  </select>
                  <button type="submit" className="admin__primary"><FiPlus /> Add Redirect</button>
                </form>

                <div style={{ overflowX: 'auto' }}>
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>SOURCE PATH</th>
                        <th>TARGET DESTINATION</th>
                        <th>TYPE</th>
                        <th>HITS</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cmsData.redirects.map(r => (
                        <tr key={r.id}>
                          <td><code>{r.sourcePath}</code></td>
                          <td><code>{r.targetPath}</code></td>
                          <td><span style={{ fontWeight: 800, color: '#166534' }}>{r.statusCode}</span></td>
                          <td>{r.hits || 0} hits</td>
                          <td>
                            <span style={{ fontSize: '11px', color: r.active !== false ? '#15803D' : '#9CA3AF', fontWeight: 800 }}>
                              {r.active !== false ? '🟢 Active' : '⚪ Inactive'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="admin-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={async () => {
                              if (window.confirm(`Delete redirect for ${r.sourcePath}?`)) {
                                await adminApi.deleteRedirect(r.id);
                                setCmsData(prev => ({ ...prev, redirects: prev.redirects.filter(x => x.id !== r.id) }));
                              }
                            }}>
                              <FiTrash2 size={11} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             OTHER MODULES: REVIEWS, OFFERS, SALES STATS, ORDERS, CUSTOMERS, ETC.
             ========================================================================= */}
          {activeTab === 'reviews' && (
            <div className="admin-reviews-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-card admin-card--wide" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderRight: '1px solid #E1E6DC', paddingRight: '20px' }}>
                    <div style={{ fontSize: '48px', fontWeight: 900, color: '#2D5016', lineHeight: 1 }}>
                      {reviewStats.avg}
                    </div>
                    <div>
                      <div className="admin-rating-stars">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s}>{s <= Math.round(reviewStats.avg) ? '★' : '☆'}</span>
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: '#687466', display: 'block', marginTop: '4px' }}>
                        Based on <strong>{reviewStats.total}</strong> verified customer reviews
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[5, 4, 3, 2, 1].map(stars => {
                      const count = reviewStats.counts[stars] || 0;
                      const pct = reviewStats.total > 0 ? Math.round((count / reviewStats.total) * 100) : 0;
                      return (
                        <div key={stars} className="admin-dist-bar-row">
                          <span style={{ width: '35px', fontWeight: 700 }}>{stars} ★</span>
                          <div className="admin-dist-bar-track">
                            <div className="admin-dist-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ width: '45px', textAlign: 'right', color: '#687466' }}>{count} ({pct}%)</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ background: reviewStats.lowCount > 0 ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${reviewStats.lowCount > 0 ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <FiAlertTriangle style={{ color: reviewStats.lowCount > 0 ? '#DC2626' : '#16A34A' }} />
                      <strong style={{ fontSize: '13px', color: reviewStats.lowCount > 0 ? '#991B1B' : '#166534' }}>
                        {reviewStats.lowCount > 0 ? `${reviewStats.lowCount} Low-Rated Reviews` : 'High Customer Satisfaction'}
                      </strong>
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#4B5563', margin: 0 }}>
                      {reviewStats.lowCount > 0
                        ? 'Items with 1-2 star ratings require quality check.'
                        : 'No critical negative reviews found. Over 90% positive store rating.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="admin-card admin-card--wide" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="inventory-filters-tabs">
                    <button
                      className={`inventory-filter-btn ${reviewFilter === 'all' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setReviewFilter('all')}
                    >
                      All Reviews <span className="inventory-badge-count">{reviewsList.length}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${reviewFilter === '5' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setReviewFilter('5')}
                    >
                      ⭐ 5 Stars <span className="inventory-badge-count">{reviewStats.counts[5]}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${reviewFilter === '4' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setReviewFilter('4')}
                    >
                      ⭐ 4 Stars <span className="inventory-badge-count">{reviewStats.counts[4]}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${reviewFilter === '3' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setReviewFilter('3')}
                    >
                      ⭐ 3 Stars <span className="inventory-badge-count">{reviewStats.counts[3]}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${reviewFilter === 'low' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setReviewFilter('low')}
                    >
                      ⚠️ 1-2 Stars <span className="inventory-badge-count">{reviewStats.lowCount}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${reviewFilter === 'pending' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setReviewFilter('pending')}
                    >
                      🟡 Pending <span className="inventory-badge-count">{reviewsList.filter(r => r.status === 'Pending').length}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <div className="admin-search-label" style={{ flex: 1, minWidth: '280px', maxWidth: '500px' }}>
                      <FiSearch />
                      <input
                        placeholder="Search by product, customer name or review text..."
                        value={reviewSearchQuery}
                        onChange={(e) => setReviewSearchQuery(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button className="admin__ghost" onClick={loadReviews}>
                      <FiRefreshCw size={13} /> Refresh Reviews
                    </button>
                  </div>
                </div>
              </div>

              <div className="admin-reviews-grid">
                {filteredReviews.map(rev => (
                  <div key={rev.id} className={`admin-review-card ${rev.status === 'Pending' ? 'admin-review-card--pending' : (rev.status === 'Rejected' ? 'admin-review-card--rejected' : '')}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: '#111827', display: 'block' }}>
                          {rev.productName}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#687466' }}>SKU Product #{rev.productId}</span>
                      </div>
                      <span style={{
                        fontSize: '10.5px',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        background: rev.status === 'Approved' ? '#DCFCE7' : (rev.status === 'Pending' ? '#FEF9C3' : '#FEE2E2'),
                        color: rev.status === 'Approved' ? '#166534' : (rev.status === 'Pending' ? '#854D0E' : '#991B1B')
                      }}>
                        {rev.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="admin-rating-stars">
                        {[1, 2, 3, 4, 5].map(s => (
                          <span key={s}>{s <= rev.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                      {rev.title && <strong style={{ fontSize: '12.5px', color: '#374151' }}>"{rev.title}"</strong>}
                    </div>

                    {rev.comment && (
                      <p style={{ fontSize: '12px', color: '#4B5563', margin: 0, lineHeight: 1.4, background: '#FAF9F5', padding: '8px 10px', borderRadius: '6px' }}>
                        {rev.comment}
                      </p>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#687466', marginTop: '4px' }}>
                      <span>👤 <strong>{rev.userName}</strong> (Verified Customer)</span>
                      <span>{new Date(rev.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', borderTop: '1px solid #F1F3ED', paddingTop: '8px' }}>
                      {rev.status !== 'Approved' && (
                        <button
                          type="button"
                          className="admin__ghost"
                          style={{ flex: 1, height: '30px', fontSize: '11.5px', color: '#166534' }}
                          onClick={async () => {
                            await adminApi.updateReviewStatus(rev.id, 'Approved');
                            setReviewsList(prev => prev.map(r => r.id === rev.id ? { ...r, status: 'Approved' } : r));
                          }}
                        >
                          <FiCheck size={12} /> Approve
                        </button>
                      )}
                      {rev.status !== 'Rejected' && (
                        <button
                          type="button"
                          className="admin__ghost"
                          style={{ flex: 1, height: '30px', fontSize: '11.5px', color: '#DC2626' }}
                          onClick={async () => {
                            await adminApi.updateReviewStatus(rev.id, 'Rejected');
                            setReviewsList(prev => prev.map(r => r.id === rev.id ? { ...r, status: 'Rejected' } : r));
                          }}
                        >
                          <FiX size={12} /> Reject
                        </button>
                      )}
                      <button
                        type="button"
                        className="admin-danger"
                        style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={async () => {
                          if (window.confirm('Delete review?')) {
                            await adminApi.deleteReview(rev.id);
                            setReviewsList(prev => prev.filter(r => r.id !== rev.id));
                          }
                        }}
                      >
                        <FiTrash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* OFFERS & PROMOS */}
          {activeTab === 'offers' && (
            <div className="admin-promos-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                <form className="admin-form" onSubmit={saveCoupon}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiGift size={18} style={{ color: '#2D5016' }} />
                    <h2 style={{ margin: 0 }}>Create Coupon / Promotion</h2>
                  </div>

                  <div className="admin-form__grid admin-form__grid--two">
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Coupon Code *</label>
                      <input value={couponDraft.code} onChange={(e) => setCouponDraft(prev => ({ ...prev, code: e.target.value }))} placeholder="e.g. WELCOME50, BOGO2026" required />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Promotion Type *</label>
                      <select value={couponDraft.type} onChange={(e) => setCouponDraft(prev => ({ ...prev, type: e.target.value }))}>
                        <option value="flat">Flat ₹ Discount</option>
                        <option value="percent">Percentage % Off</option>
                        <option value="bogo">BOGO (Buy 1 Get 1 Free)</option>
                        <option value="buyXgetY">Buy X Get Y Free</option>
                        <option value="freeDelivery">Free Delivery</option>
                      </select>
                    </div>
                  </div>

                  {(couponDraft.type === 'bogo' || couponDraft.type === 'buyXgetY') && (
                    <div className="admin-form__grid admin-form__grid--two" style={{ background: '#FAF9F5', padding: '10px', borderRadius: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Buy Quantity (X)</label>
                        <input type="number" value={couponDraft.buyQuantity} onChange={(e) => setCouponDraft(prev => ({ ...prev, buyQuantity: e.target.value }))} placeholder="2" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Get Free Quantity (Y)</label>
                        <input type="number" value={couponDraft.getQuantity} onChange={(e) => setCouponDraft(prev => ({ ...prev, getQuantity: e.target.value }))} placeholder="1" />
                      </div>
                    </div>
                  )}

                  {couponDraft.type !== 'freeDelivery' && couponDraft.type !== 'bogo' && couponDraft.type !== 'buyXgetY' && (
                    <div className="admin-form__grid admin-form__grid--two">
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>
                          {couponDraft.type === 'percent' ? 'Discount (%)' : 'Discount (₹)'}
                        </label>
                        <input value={couponDraft.value} onChange={(e) => setCouponDraft(prev => ({ ...prev, value: e.target.value }))} placeholder="50" type="number" required />
                      </div>
                      {couponDraft.type === 'percent' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Max Discount (₹)</label>
                          <input value={couponDraft.maxDiscount || ''} onChange={(e) => setCouponDraft(prev => ({ ...prev, maxDiscount: e.target.value }))} placeholder="150" type="number" />
                        </div>
                      )}
                    </div>
                  )}

                  <div className="admin-form__grid admin-form__grid--two">
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Minimum Order (₹)</label>
                      <input value={couponDraft.minOrder} onChange={(e) => setCouponDraft(prev => ({ ...prev, minOrder: e.target.value }))} placeholder="499" type="number" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Target Scope</label>
                      <select value={couponDraft.targetType} onChange={(e) => setCouponDraft(prev => ({ ...prev, targetType: e.target.value }))}>
                        <option value="all">Entire Store</option>
                        <option value="category">Specific Category</option>
                        <option value="product">Specific Product ID</option>
                        <option value="customer">Specific Customer Email</option>
                      </select>
                    </div>
                  </div>

                  <input value={couponDraft.title} onChange={(e) => setCouponDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Banner title e.g. FLAT ₹50 OFF" />
                  <input value={couponDraft.description} onChange={(e) => setCouponDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Banner subtext e.g. On orders above ₹399" />

                  <button className="admin__primary"><FiPlus /> Save Coupon</button>
                </form>

                <form className="admin-form" onSubmit={saveOffer}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiTag size={18} style={{ color: '#2D5016' }} />
                    <h2 style={{ margin: 0 }}>Add Deal Banner</h2>
                  </div>

                  <input value={offerDraft.title} onChange={(e) => setOfferDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Deal Title e.g. Diwali Mega Rice Fest" required />
                  <input value={offerDraft.subtitle} onChange={(e) => setOfferDraft(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="Subtitle e.g. Flat 20% off on all Basmati Rice" />
                  <input value={offerDraft.badge} onChange={(e) => setOfferDraft(prev => ({ ...prev, badge: e.target.value }))} placeholder="Badge e.g. Save ₹80" />

                  <div className="admin-form__grid admin-form__grid--two">
                    <input value={offerDraft.price} onChange={(e) => setOfferDraft(prev => ({ ...prev, price: e.target.value }))} placeholder="Deal Price (₹)" type="number" />
                    <input value={offerDraft.mrp} onChange={(e) => setOfferDraft(prev => ({ ...prev, mrp: e.target.value }))} placeholder="MRP (₹)" type="number" />
                  </div>

                  <div className="admin-offer-image">
                    {offerDraft.image ? (
                      <img src={toWebpImage(offerDraft.image)} alt="Offer preview" />
                    ) : (
                      <div className="admin-offer-image__empty"><FiGift /></div>
                    )}
                    <div>
                      <input value={offerDraft.image} onChange={(e) => setOfferDraft(prev => ({ ...prev, image: e.target.value }))} placeholder="Add offer banner image URL" />
                      <label className="admin-file-input admin-file-input--compact">
                        <span>Or choose file</span>
                        <input type="file" accept="image/*" onChange={handleOfferImageUpload} />
                      </label>
                    </div>
                  </div>

                  <button className="admin__primary"><FiPlus /> Publish Deal Banner</button>
                </form>
              </div>

              <div className="admin-card admin-card--wide">
                <h2>Active Coupons ({coupons.length})</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                  {coupons.map(coupon => (
                    <div key={coupon.id} className="admin-promo-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '15px', color: '#1C4B12' }}>{coupon.code}</strong>
                        <span className={`admin-promo-pill admin-promo-pill--${coupon.type}`}>
                          {coupon.type === 'bogo' ? '🎁 BOGO' : (coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: '#4B5563' }}>{coupon.title || coupon.description || 'Promotional coupon'}</p>
                      <div style={{ background: '#FAF9F5', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <span>Min Order: <strong>₹{coupon.minOrder || 0}</strong></span>
                        <span>Used: <strong>{coupon.timesUsed || 0} times</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SALES ANALYTICS */}
          {activeTab === 'sales-stats' && (
            <div className="sales-analytics-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-card admin-card--wide" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Grocery Sales & Performance Analytics</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                      Real-time revenue, margins, wastage, turnover, and delivery area analytics.
                    </p>
                  </div>
                  <div className="admin-analytics-range-bar">
                    <button type="button" className={`admin-range-btn ${analyticsTimeRange === '1' ? 'admin-range-btn--active' : ''}`} onClick={() => setAnalyticsTimeRange('1')}>Today</button>
                    <button type="button" className={`admin-range-btn ${analyticsTimeRange === '7' ? 'admin-range-btn--active' : ''}`} onClick={() => setAnalyticsTimeRange('7')}>7 Days</button>
                    <button type="button" className={`admin-range-btn ${analyticsTimeRange === '30' ? 'admin-range-btn--active' : ''}`} onClick={() => setAnalyticsTimeRange('30')}>30 Days</button>
                    <button type="button" className={`admin-range-btn ${analyticsTimeRange === '90' ? 'admin-range-btn--active' : ''}`} onClick={() => setAnalyticsTimeRange('90')}>90 Days</button>
                    <button type="button" className={`admin-range-btn ${analyticsTimeRange === '365' ? 'admin-range-btn--active' : ''}`} onClick={() => setAnalyticsTimeRange('365')}>1 Year</button>
                  </div>
                </div>
              </div>

              <div className="admin-analytics-grid-4">
                <div className="sales-kpi-card">
                  <span>GROSS REVENUE</span>
                  <strong>{formatPrice(analyticsSummary.grossRevenue)}</strong>
                  <small>Net: {formatPrice(analyticsSummary.netRevenue)}</small>
                </div>
                <div className="sales-kpi-card">
                  <span>ORDERS & UNITS</span>
                  <strong>{analyticsSummary.ordersCount} orders</strong>
                  <small>{analyticsSummary.totalUnitsSold} grocery units</small>
                </div>
                <div className="sales-kpi-card">
                  <span>AVG ORDER VALUE</span>
                  <strong>{formatPrice(analyticsSummary.aov)}</strong>
                  <small>Repeat Rate: <strong>{analyticsSummary.repeatRate}%</strong></small>
                </div>
                <div className="sales-kpi-card" style={{ background: '#FFFDF7', borderColor: '#FDE68A' }}>
                  <span style={{ color: '#92400E' }}>WASTAGE / EXPIRED LOSSES</span>
                  <strong style={{ color: '#B45309' }}>{formatPrice(analyticsSummary.wastageLoss)}</strong>
                  <small>Damaged + Expired stock value</small>
                </div>
              </div>

              <section className="sales-chart-card">
                <div className="sales-section-label">REVENUE TREND ({analyticsTimeRange} DAYS)</div>
                <div className="sales-line-chart-wrap">
                  {(() => {
                    const maxRevenue = Math.max(...salesTrendData.map(item => item.revenue), 1);
                    const chartWidth = 1000;
                    const chartHeight = 280;
                    const left = 52;
                    const right = 12;
                    const top = 18;
                    const bottom = 38;
                    const innerWidth = chartWidth - left - right;
                    const innerHeight = chartHeight - top - bottom;
                    const points = salesTrendData.map((item, index) => {
                      const x = left + (index / (Math.max(salesTrendData.length - 1, 1))) * innerWidth;
                      const y = top + innerHeight - (item.revenue / maxRevenue) * innerHeight;
                      return { ...item, x, y };
                    });
                    const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
                    const areaPath = `${linePath} L ${points[points.length - 1].x} ${top + innerHeight} L ${points[0].x} ${top + innerHeight} Z`;
                    return (
                      <svg className="sales-line-chart" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                        {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
                          const y = top + innerHeight - tick * innerHeight;
                          return (
                            <g key={tick}>
                              <line x1={left} x2={chartWidth - right} y1={y} y2={y} className="sales-chart-grid" />
                              <text x={left - 12} y={y + 4} textAnchor="end" className="sales-chart-axis">{formatPrice(maxRevenue * tick)}</text>
                            </g>
                          );
                        })}
                        <path d={areaPath} className="sales-chart-area" />
                        <path d={linePath} className="sales-chart-line" />
                      </svg>
                    );
                  })()}
                </div>
              </section>
            </div>
          )}

          {/* RETAIL CONTENT & WHOLESALE CONTENT */}
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
                  <span>Description</span>
                </div>

                {filteredContentProducts.map(product => {
                  const isWS = activeTab === 'wholesale-content';
                  return (
                    <div key={product.id} className={`admin-content-editor ${isWS ? 'admin-content-editor--ws' : ''}`}>
                      <img src={toWebpImage(product.image)} alt={product.name} />
                      <input value={product.name || ''} onChange={(e) => updateProductField(product.id, 'name', e.target.value, isWS)} placeholder="Item name" />
                      <input value={product.mrp || ''} onChange={(e) => updateProductField(product.id, 'mrp', e.target.value, isWS)} type="number" placeholder="MRP" />
                      <input value={product.price || ''} onChange={(e) => updateProductField(product.id, 'price', e.target.value, isWS)} type="number" placeholder="Price" />
                      <input value={product.discount || ''} onChange={(e) => updateProductField(product.id, 'discount', e.target.value, isWS)} type="number" placeholder="% off" />
                      <select value={product.stockNote || 'In stock'} onChange={(e) => updateProductField(product.id, 'stockNote', e.target.value, isWS)}>
                        <option>In stock</option>
                        <option>Only few left</option>
                        <option>Only 10 left</option>
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
                      {isWS && <input value={product.wholesalePrice || ''} onChange={(e) => updateProductField(product.id, 'wholesalePrice', e.target.value, true)} type="number" placeholder="WS price" />}
                      <input value={product.description || ''} onChange={(e) => updateProductField(product.id, 'description', e.target.value, isWS)} placeholder="Description" />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ADMINS */}
          {activeTab === 'admins' && (
            <section className="admin-grid">
              <form className="admin-form" onSubmit={saveAdmin}>
                <h2>Add admin user</h2>
                <input value={adminDraft.name} onChange={(e) => setAdminDraft(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" required />
                <input value={adminDraft.email} onChange={(e) => setAdminDraft(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" type="email" required />
                <input value={adminDraft.password} onChange={(e) => setAdminDraft(prev => ({ ...prev, password: e.target.value }))} placeholder="Password (min 8 chars)" type="password" minLength={8} required />
                <select value={adminDraft.role} onChange={(e) => setAdminDraft(prev => ({ ...prev, role: e.target.value }))}>
                  <option value="Owner">Owner</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Product Manager">Product Manager</option>
                  <option value="Order Manager">Order Manager</option>
                  <option value="Marketing Manager">Marketing Manager</option>
                  <option value="Content Manager">Content Manager</option>
                  <option value="Customer Support">Customer Support</option>
                  <option value="Viewer">Viewer</option>
                </select>
                {adminError && <p style={{ color: '#FF6B35', fontSize: 13, fontWeight: 700 }}>{adminError}</p>}
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

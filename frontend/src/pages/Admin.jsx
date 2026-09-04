import { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  FiVolume2,
  FiImage,
  FiHelpCircle,
  FiBookOpen
} from 'react-icons/fi';
import { useAdminApi } from '../hooks/useAdminApi';
import { products as baseProducts, getProducts as getAllProducts } from '../data/products';
import { categories } from '../data/categories';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import { broadcastSync, SYNC_EVENTS } from '../utils/syncChannel';
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
  type: 'flat', // 'flat' | 'percent' | 'bogo' | 'buyXgetY' | 'freeDelivery'
  value: '',
  minOrder: '',
  maxDiscount: '',
  buyQuantity: 1,
  getQuantity: 1,
  targetType: 'all', // 'all' | 'category' | 'product' | 'customer'
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
  role: 'Viewer'
};

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

const ADMIN_ROLE_PERMISSIONS = {
  Owner: ['dashboard','inventory','sales-stats','orders','customers','reviews','cms','retail-products','wholesale-products','offers','festive-offers','bestsellers','delivery-zones','broadcast','admins'],
  'Super Admin': ['dashboard','inventory','sales-stats','orders','customers','reviews','cms','retail-products','wholesale-products','offers','festive-offers','bestsellers','delivery-zones','broadcast'],
  'Product Manager': ['dashboard','inventory','retail-products','wholesale-products','festive-offers','reviews','bestsellers'],
  'Order Manager': ['dashboard','inventory','orders','customers','delivery-zones'],
  'Marketing Manager': ['dashboard','offers','festive-offers','cms','bestsellers','broadcast','reviews'],
  'Content Manager': ['dashboard','cms','reviews'],
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
      ['delivery-zones', 'Delivery Zones', FiTruck],
      ['broadcast', 'Email Broadcast', FiMail]
    ]
  },
  {
    title: 'WEBSITE CONTENT',
    items: [
      ['cms', 'Terms & Policy', FiEdit2]
    ]
  },
  {
    title: 'PROMOTIONS & REVIEWS',
    items: [
      ['offers', 'Promos & Coupons', FiGift],
      ['reviews', 'Customer Reviews', FiStar]
    ]
  },
  {
    title: 'PRODUCT CATALOG',
    items: [
      ['retail-products', 'Retail Items', FiPackage],
      ['wholesale-products', 'Wholesale Items', FiPackage],
      ['festive-offers', 'Festive Offers', FiGift],
      ['bestsellers', 'Bestsellers & Deals', FiStar]
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
  const [selectedAdminRole, setSelectedAdminRole] = useState('Viewer');
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
  const [showProductModal, setShowProductModal] = useState(false);
  // Decoupled from activeTab so the modal can be opened from Inventory Hub
  // (which stays on its own tab) and still know whether to save/show as
  // retail or wholesale.
  const [productModalMode, setProductModalMode] = useState('retail');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState({ name: '', image: '', color: '#F1F8E9' });
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

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

  // ── CMS State ──
  const [cmsData, setCmsData] = useState({
    pages: [],
    redirects: [],
    settings: {}
  });
  const [editingPage, setEditingPage] = useState(null);
  const [newPageDraft, setNewPageDraft] = useState(null);

  const loadCmsData = async () => {
    try {
      const data = await adminApi.fetchCmsAll();
      setCmsData(data);
    } catch (err) {
      console.error('Failed to load CMS content:', err);
    }
  };

  // ── Reviews & Ratings Management State ──
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all'|'5'|'4'|'3'|'low'|'pending'
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // ── Deep Analytics State ──
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('30'); // '1'|'7'|'30'|'90'|'365'

  // ── Orders & Payments Management State ──
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [invoiceModalOrder, setInvoiceModalOrder] = useState(null);
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
    handlingCharge: 5,
    driverAssigned: ''
  });
  const [editingZoneModal, setEditingZoneModal] = useState(null);
  const [showZonesModal, setShowZonesModal] = useState(false);
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);

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

  // Modals for Stock Adjustment & History
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

  const [offerDraft, setOfferDraft] = useState(blankOffer);
  const [couponDraft, setCouponDraft] = useState(blankCoupon);
  const [adminAccounts, setAdminAccounts] = useState([]);
  const [adminDraft, setAdminDraft] = useState(blankAdmin);
  const [adminError, setAdminError] = useState('');
  const [promoTagSearch, setPromoTagSearch] = useState('');
  const [dbCategories, setDbCategories] = useState([]);
  const [newCat, setNewCat] = useState({ name: '', image: '', color: '#F7F4EE' });

  const groceryUnitPresets = [
    '100 g', '250 g', '500 g', '1 kg', '2 kg', '5 kg', '10 kg', '25 kg',
    '100 ml', '200 ml', '500 ml', '1 L', '2 L', '5 L', '15 L',
    '1 pc', 'Pack of 2', 'Pack of 4', 'Pack of 6', 'Pack of 12', 'Box (10 pcs)'
  ];

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
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109.73, audioCtx.currentTime);
        gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc2.start(audioCtx.currentTime);
        osc2.stop(audioCtx.currentTime + 0.4);
      }, 120);
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

  // ── Load Orders ──
  const loadOrders = async () => {
    try {
      const ords = await adminApi.fetchAllOrders();
      setLiveOrders(ords);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  // ── Load Customers ──
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

  // ── Manual customer segment (VIP / Returning / New / Inactive) ──
  // Pass null to clear the override and fall back to the auto-computed segment.
  const setCustomerSegmentOverride = async (customer, nextSegment) => {
    try {
      const updated = await adminApi.setCustomerSegment(customer.id, nextSegment);
      setLiveCustomers(prev => (prev || []).map(c => c.id === customer.id ? { ...c, ...updated } : c));
    } catch (err) {
      alert(`Failed to update segment: ${err.message}`);
    }
  };

  // ── Broadcast recipient selection (individual customers or a whole segment) ──
  const toggleCustomerSelection = (email) => {
    if (!email) return;
    setSelectedBroadcastEmails(prev =>
      prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
    );
  };

  const selectFilteredCustomers = () => {
    setSelectedBroadcastEmails(filteredCustomers.map(c => c.email).filter(Boolean));
  };

  const clearCustomerSelection = () => setSelectedBroadcastEmails([]);

  // ── Load Reviews ──
  const loadReviews = async () => {
    setReviewsLoading(true);
    try {
      const revs = await adminApi.fetchReviews();
      setReviewsList(revs);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  // ── Load Inventory ──
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

  // ── Load Inventory Movement Logs ──
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

  // ── Load initial data ──
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
      // An unrecognized role (e.g. old/bad data) must fall back to the least-
      // privileged Viewer tab set, not silently keep whatever selectedAdminRole
      // happened to already be — leaving it unset here let an unrecognized
      // role keep the component's initial 'Owner' state, i.e. full access.
      setSelectedAdminRole(ADMIN_ROLE_PERMISSIONS[sessionRole] ? sessionRole : 'Viewer');
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
    if (activeTab === 'cms') {
      loadCmsData();
    } else if (activeTab === 'inventory') {
      loadInventory();
      if (inventoryFilter === 'logs') loadInventoryLogs();
    } else if (activeTab === 'orders') {
      loadOrders();
    } else if (activeTab === 'customers') {
      loadCustomers();
    } else if (activeTab === 'reviews') {
      loadReviews();
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

  // ── Filtered Reviews ──
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

  // Review statistics
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

  // ── Product filtering ──
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

  // ── Filtered Orders ──
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

  // ── Filtered Customers ──
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

  // ── Filtered Inventory Items ──
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
    { label: 'Wholesale products', value: wholesaleProducts.length, icon: FiPackage },
    { label: 'Total Orders', value: liveOrders ? liveOrders.length : 0, icon: FiShoppingBag },
    { label: 'Registered Customers', value: liveCustomers ? liveCustomers.length : 0, icon: FiUsers },
    { label: 'Customer Reviews', value: reviewsList.length, icon: FiStar },
    { label: 'Active Coupons', value: coupons.filter(c => c.active !== false).length, icon: FiGift },
  ];

  // ── Export Inventory CSV ──
  const exportInventoryCsv = () => {
    if (!inventoryData?.items) return;
    downloadCsv('siri-traders-inventory-report.csv', [
      ['Product ID', 'Name', 'Category', 'Brand', 'Weight/Unit', 'Available Stock', 'Damaged Stock', 'Returned Stock', 'Expired Stock', 'Incoming Stock', 'Cost Price (₹)', 'Selling Price (₹)', 'Stock Valuation (₹)', 'Expiry Date', 'Batch Number', 'Status'],
      ...inventoryData.items.map(i => [
        i.productId,
        i.name,
        i.category,
        i.brand || '',
        `${i.weight || ''} ${i.unit || ''}`.trim(),
        i.availableStock,
        i.damagedStock,
        i.returnedStock,
        i.expiredStock,
        i.incomingStock,
        i.costPrice,
        i.price,
        i.stockValuation,
        i.expiryDate || 'N/A',
        i.batchNumber || 'N/A',
        i.isOutOfStock ? 'OUT OF STOCK' : (i.isLowStock ? 'LOW STOCK' : 'IN STOCK')
      ])
    ]);
  };

  // ── Export Orders CSV ──
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

  // ── Handle Stock Adjustment Submit ──
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

  // ── Open Product History Modal ──
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

  // ── Handle Order Update (Status / Notes / Refund / Cancel) ──
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

  // ── Comprehensive Analytics Engine ──
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

    // Category breakdown
    const categorySales = {};
    // Brand breakdown
    const brandSales = {};
    // Product sales
    const prodSales = {};
    // Area breakdown
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

    // Wastage & Expired losses from inventory
    const wastageLoss = (inventoryData?.items || []).reduce((sum, it) => sum + ((it.damagedStock || 0) + (it.expiredStock || 0)) * (it.costPrice || Math.round(it.price * 0.78)), 0);

    // Customer repeat rate
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

  // ── Wholesale price range tier rows ──
  const addVariantRow = (label = '', price = '') => {
    setDetailedVariants(prev => [...prev, { id: `var-${Date.now()}-${Math.random()}`, label, price, unit: productDraft.unit || 'kg' }]);
  };
  const updateVariantRow = (idx, field, value) => {
    setDetailedVariants(prev => prev.map((v, i) => (i === idx ? { ...v, [field]: value } : v)));
  };
  const removeVariantRow = (idx) => setDetailedVariants(prev => prev.filter((_, i) => i !== idx));

  // Downscales/re-encodes large phone-camera photos before upload — a raw
  // 4-8MB photo could take a very long time to upload over a slow mobile
  // connection (or hit the server's size cap outright). Falls back to the
  // original file untouched on anything unexpected (small file, unusual
  // type, decode error) rather than risk blocking the upload entirely.
  const compressImageFile = (file, maxDimension = 1280, quality = 0.8) => new Promise((resolve) => {
    if (file.size < 300 * 1024 || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
      resolve(file);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob || blob.size >= file.size) {
          resolve(file);
          return;
        }
        resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    img.src = objectUrl;
  });

  // Uploads the picked file to Vercel Blob storage and stores the returned
  // URL on the draft — images used to be embedded as base64 text directly in
  // the DB row, which is what blew through the Neon data-transfer quota.
  const uploadDraftImage = async (file, setDraft) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setDraft(prev => ({ ...prev, image: previewUrl }));
    setImageUploading(true);
    try {
      const compressed = await compressImageFile(file);
      const url = await adminApi.uploadImage(compressed);
      setDraft(prev => ({ ...prev, image: url }));
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      alert(err.message || 'Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  // ── Category management ──
  const handleCategoryImageUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    uploadDraftImage(file, setCategoryDraft);
  };

  const saveCategory = async () => {
    if (!categoryDraft.name.trim()) return;
    setCategoryLoading(true);
    try {
      const saved = await adminApi.createCategory({
        name: categoryDraft.name.trim(),
        image: categoryDraft.image || '',
        color: categoryDraft.color || '#F1F8E9'
      });
      setDbCategories(prev => [...prev, saved]);
      setCategoryDraft({ name: '', image: '', color: '#F1F8E9' });
      setSaveToast({ type: 'success', msg: `Category "${saved.name}" added` });
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setCategoryLoading(false);
    }
  };

  const deleteCategoryHandler = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This also deletes all products in this category.`)) return;
    try {
      await adminApi.deleteCategory(cat.id);
      setDbCategories(prev => prev.filter(c => c.id !== cat.id));
    } catch (err) { alert(err.message); }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    uploadDraftImage(file, setProductDraft);
  };

  const handleOfferImageUpload = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    uploadDraftImage(file, setOfferDraft);
  };

  // ── Save Product ──
  const saveProduct = async (event) => {
    event.preventDefault();
    const isWholesale = productModalMode === 'wholesale';

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
    } catch (err) {
      // Save actually failed — show the real error and leave the modal open
      // so it's obvious nothing was saved, instead of pretending it worked.
      setSaveToast({ type: 'error', msg: `⚠️ DB error: ${err.message}` });
      setTimeout(() => setSaveToast(null), 8000);
      setApiLoading(false);
      return;
    }
    setApiLoading(false);

    setSaveToast({ type: 'success', msg: `✅ “${nextProduct.name}” saved to database` });
    setTimeout(() => setSaveToast(null), 5000);
    loadInventory();
    broadcastSync(SYNC_EVENTS.PRODUCTS_CHANGED);

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
    setShowProductModal(false);
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
    setProductModalMode(isWholesale ? 'wholesale' : 'retail');
    setShowProductModal(true);
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
    setProductModalMode(isWholesale ? 'wholesale' : 'retail');
    setSaveToast({ type: 'success', msg: `📋 Cloned "${product.name}" into editor draft.` });
    setShowProductModal(true);
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
      adminApi.deleteProduct(productId)
        .then(() => broadcastSync(SYNC_EVENTS.PRODUCTS_CHANGED))
        .catch(() => {});
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
        broadcastSync(SYNC_EVENTS.PRODUCTS_CHANGED);
      } catch (err) {
        alert(`Failed to update ${field}: ${err.message}`);
      }
    }
  };

  const saveOffer = async (event, forceGroup) => {
    event.preventDefault();
    const festiveKeywords = /diwali|eid|holi|christmas|navratri|rakhi|onam|sankranti|ramzan|ugadi|ganesh|dussehra|festival|wedding|party/i;
    const group = forceGroup || (festiveKeywords.test(offerDraft.title + ' ' + offerDraft.badge) ? 'festival' : (offerDraft.group || 'daily'));
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
      active: offerDraft.active !== false,
      image: offerDraft.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&q=80'
    };
    try {
      const saved = normalizeOffer(await adminApi.saveOffer(payload));
      setOffers(prev => [saved, ...prev.filter(offer => offer.id !== saved.id)]);
      setOfferDraft(blankOffer);
      setSaveToast({ type: 'success', msg: `🎁 Promotion "${saved.title}" saved successfully!` });
      setTimeout(() => setSaveToast(null), 4000);
      broadcastSync(SYNC_EVENTS.SITE_DATA_CHANGED);
    } catch (err) {
      alert(err.message);
    }
  };

  const editFestiveOffer = (offer) => {
    setOfferDraft({ ...blankOffer, ...offer });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      broadcastSync(SYNC_EVENTS.SITE_DATA_CHANGED);
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
      const created = await adminApi.createAdminUser({
        name: adminDraft.name.trim(),
        email,
        password: adminDraft.password,
        role: adminDraft.role
      });
      const refreshed = await adminApi.fetchAdminUsers();
      setAdminAccounts(refreshed);
      setAdminDraft(blankAdmin);
      setSaveToast({
        type: created.emailSent ? 'success' : 'error',
        msg: created.emailSent
          ? `✅ ${created.name} added as ${created.role}. Welcome email with login details sent.`
          : `⚠️ ${created.name} added as ${created.role}, but the welcome email failed to send — share their password manually.`
      });
      setTimeout(() => setSaveToast(null), 6000);
    } catch (err) {
      setAdminError(err.message || 'Failed to create admin');
    }
  };

  // ── Change an existing admin's role or password ──
  const updateAdminRole = async (account, nextRole) => {
    try {
      const updated = await adminApi.updateAdminUser(account.id, { role: nextRole });
      setAdminAccounts(prev => prev.map(a => a.id === account.id ? { ...a, ...updated } : a));
    } catch (err) {
      alert(`Failed to update role: ${err.message}`);
    }
  };

  const resetAdminPassword = async (account) => {
    const nextPassword = window.prompt(`New password for ${account.name} (min 8 characters):`);
    if (!nextPassword) return;
    if (nextPassword.trim().length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    try {
      const updated = await adminApi.updateAdminUser(account.id, { password: nextPassword.trim() });
      setSaveToast({
        type: updated.emailSent ? 'success' : 'error',
        msg: updated.emailSent
          ? `✅ Password changed for ${account.name}. Notification email sent.`
          : `⚠️ Password changed for ${account.name}, but the notification email failed to send — share the new password manually.`
      });
      setTimeout(() => setSaveToast(null), 6000);
    } catch (err) {
      alert(`Failed to change password: ${err.message}`);
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

          {/* ADMIN ROLE SELECTOR */}
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
                {activeTab === 'cms' && 'Terms & Policy'}
                {activeTab === 'inventory' && 'Grocery Inventory Hub'}
                {activeTab === 'orders' && 'Order & Payment Management'}
                {activeTab === 'customers' && 'Customer Management & Segmentation'}
                {activeTab === 'reviews' && 'Customer Reviews & Rating Moderation'}
                {activeTab === 'offers' && 'Grocery Promotions & Coupon Engine'}
                {activeTab === 'delivery-zones' && 'Delivery Zones & Coverage'}
                {activeTab === 'retail-products' && 'Grocery Products & Variants'}
                {activeTab === 'wholesale-products' && 'Wholesale Products & Bulk Packs'}
                {activeTab === 'sales-stats' && 'Grocery Sales & Performance Analytics'}
                {activeTab !== 'dashboard' && activeTab !== 'inventory' && activeTab !== 'orders' && activeTab !== 'customers' && activeTab !== 'reviews' && activeTab !== 'offers' && activeTab !== 'delivery-zones' && activeTab !== 'retail-products' && activeTab !== 'wholesale-products' && activeTab !== 'sales-stats' && activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </h1>
            </div>
            
            <div className="admin-main-header__actions">
              <a href="/home" target="_blank" rel="noopener noreferrer" className="admin-main-header__btn">
                Launch Site →
              </a>
            </div>
          </header>

          {/* =========================================================================
             EXECUTIVE DASHBOARD OVERVIEW
             ========================================================================= */}
          {activeTab === 'dashboard' && (
            <div className="admin-overview-page" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top 6 KPI Stat Cards */}
              <section className="admin__stats">
                {stats.map(stat => (
                  <div key={stat.label} className="admin__stat-card">
                    <stat.icon />
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </section>

              {/* Operational Action Center & Critical Alerts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                {/* Pending Orders Action Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E1E6DC', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#687466', textTransform: 'uppercase' }}>Orders To Fulfill</span>
                    <span style={{ background: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                      {liveOrders ? liveOrders.filter(o => ['Pending', 'Preparing'].includes(o.status)).length : 0} Pending
                    </span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '20px', color: '#111827' }}>
                      {liveOrders ? liveOrders.filter(o => ['Pending', 'Preparing'].includes(o.status)).length : 0}
                    </strong>
                    <span style={{ fontSize: '12px', color: '#687466', display: 'block', marginTop: '2px' }}>Orders requiring dispatch</span>
                  </div>
                  <button
                    type="button"
                    className="admin__primary"
                    style={{ width: '100%', height: '32px', fontSize: '12px', justifyContent: 'center' }}
                    onClick={() => setActiveTab('orders')}
                  >
                    <FiShoppingBag size={12} /> Manage Orders →
                  </button>
                </div>

                {/* Stock Alerts Action Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E1E6DC', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#687466', textTransform: 'uppercase' }}>Inventory Alerts</span>
                    <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                      {invSummary.lowStockCount + invSummary.outOfStockCount} Low/Out
                    </span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '20px', color: '#111827' }}>
                      {invSummary.outOfStockCount} Out · {invSummary.lowStockCount} Low
                    </strong>
                    <span style={{ fontSize: '12px', color: '#687466', display: 'block', marginTop: '2px' }}>Items needing replenishment</span>
                  </div>
                  <button
                    type="button"
                    className="admin__ghost"
                    style={{ width: '100%', height: '32px', fontSize: '12px', justifyContent: 'center' }}
                    onClick={() => setActiveTab('inventory')}
                  >
                    <FiLayers size={12} /> View Stock Hub →
                  </button>
                </div>

                {/* Reviews Moderation Action Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E1E6DC', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#687466', textTransform: 'uppercase' }}>Store Rating</span>
                    <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                      ⭐ {reviewStats.avg} / 5.0
                    </span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '20px', color: '#111827' }}>
                      {reviewsList.length} Verified Reviews
                    </strong>
                    <span style={{ fontSize: '12px', color: '#687466', display: 'block', marginTop: '2px' }}>
                      {reviewsList.filter(r => r.status === 'Pending').length} pending approval
                    </span>
                  </div>
                  <button
                    type="button"
                    className="admin__ghost"
                    style={{ width: '100%', height: '32px', fontSize: '12px', justifyContent: 'center' }}
                    onClick={() => setActiveTab('reviews')}
                  >
                    <FiStar size={12} /> Moderate Reviews →
                  </button>
                </div>

                {/* Delivery & Logistics Action Card */}
                <div style={{ background: '#FFFFFF', border: '1px solid #E1E6DC', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#687466', textTransform: 'uppercase' }}>Delivery Network</span>
                    <span style={{ background: '#F1F5F9', color: '#334155', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                      {deliveryZones.length} Zones Active
                    </span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '20px', color: '#111827' }}>Hyderabad Hyperlocal</strong>
                    <span style={{ fontSize: '12px', color: '#687466', display: 'block', marginTop: '2px' }}>15-30 min express delivery active</span>
                  </div>
                  <button
                    type="button"
                    className="admin__ghost"
                    style={{ width: '100%', height: '32px', fontSize: '12px', justifyContent: 'center' }}
                    onClick={() => setActiveTab('delivery-zones')}
                  >
                    <FiTruck size={12} /> Delivery Zones →
                  </button>
                </div>
              </div>

              {/* Recent Customer Orders Live Table (Full Width) */}
              <div className="admin-card admin-card--wide">
                <div className="admin-card__toolbar" style={{ marginBottom: '14px' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '15.5px' }}>Recent Customer Orders</h2>
                    <span style={{ fontSize: '12px', color: '#687466' }}>Live incoming grocery delivery orders across Hyderabad</span>
                  </div>
                  <button className="admin__ghost" style={{ fontSize: '12px', padding: '6px 12px' }} onClick={() => setActiveTab('orders')}>
                    View All Orders ({liveOrders ? liveOrders.length : 0}) →
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="inventory-table" style={{ fontSize: '12.5px' }}>
                    <thead>
                      <tr>
                        <th>ORDER #</th>
                        <th>BILL NO.</th>
                        <th>CUSTOMER</th>
                        <th>ITEMS</th>
                        <th>TOTAL (₹)</th>
                        <th>PAYMENT</th>
                        <th>ORDER STATUS</th>
                        <th style={{ textAlign: 'center' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(liveOrders || []).slice(0, 8).map(order => (
                        <tr key={order.id}>
                          <td>
                            <strong>#{order.id}</strong>
                          </td>
                          <td>
                            <code style={{ fontSize: '11px', background: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>
                              BILL-{order.id + 7820}
                            </code>
                          </td>
                          <td>
                            <strong>{order.customerName || 'Customer'}</strong>
                            <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>{order.customerPhone || 'Direct App Order'}</span>
                          </td>
                          <td>{(order.items || []).length} items</td>
                          <td>
                            <strong style={{ color: '#166534', fontSize: '13.5px' }}>{formatPrice(order.total)}</strong>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: order.paymentStatus === 'Paid' ? '#166534' : '#D97706'
                            }}>
                              {order.paymentStatus || 'Pending'} ({order.paymentMethod || 'COD'})
                            </span>
                          </td>
                          <td>
                            <span style={{
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              background: order.status === 'Delivered' ? '#DCFCE7' : (order.status === 'Cancelled' ? '#FEE2E2' : '#FEF3C7'),
                              color: order.status === 'Delivered' ? '#166534' : (order.status === 'Cancelled' ? '#991B1B' : '#854D0E')
                            }}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="admin__ghost"
                              style={{ padding: '5px 10px', fontSize: '11.5px' }}
                              onClick={() => {
                                setSelectedOrderModal(order);
                                setActiveTab('orders');
                              }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                      {(!liveOrders || liveOrders.length === 0) && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#687466' }}>
                            No orders found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


          {/* =========================================================================
             MODULE: TERMS & POLICY PAGES
             ========================================================================= */}
          {activeTab === 'cms' && (
            <div className="admin-cms-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-card admin-card--wide">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px' }}>Terms & Policy Pages ({cmsData.pages.length})</h2>
                    <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#687466' }}>
                      Edit the content shown on each legal, general and policy page of the website.
                    </p>
                  </div>
                  <button
                    className="admin__primary"
                    style={{ flexShrink: 0 }}
                    onClick={() => setNewPageDraft({ title: '', slug: '', category: 'general', content: '' })}
                  >
                    <FiPlus /> New Page
                  </button>
                </div>
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

              {editingPage && (
                <div className="inventory-modal-backdrop" onClick={() => setEditingPage(null)}>
                  <div className="inventory-modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <h2 style={{ margin: 0 }}>Edit Page: {editingPage.title}</h2>
                      <button className="inventory-modal__close" onClick={() => setEditingPage(null)}>✕</button>
                    </div>

                    <div className="inventory-modal__body">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Page Body Content</label>
                        <textarea
                          rows={16}
                          className="admin-input-box"
                          style={{ height: 'auto' }}
                          value={editingPage.content || ''}
                          onChange={e => setEditingPage(p => ({ ...p, content: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="inventory-modal__footer">
                      <button type="button" className="admin__ghost" onClick={() => setEditingPage(null)}>Cancel</button>
                      <button
                        type="button"
                        className="admin__primary"
                        onClick={async () => {
                          try {
                            const updated = await adminApi.updatePage(editingPage.id, { ...editingPage, isPublished: true });
                            setCmsData(prev => ({ ...prev, pages: prev.pages.map(p => p.id === updated.id ? updated : p) }));
                            setEditingPage(null);
                            setSaveToast({ type: 'success', msg: 'Page content updated' });
                            setTimeout(() => setSaveToast(null), 3000);
                          } catch (err) { alert(err.message); }
                        }}
                      >
                        <FiSave /> Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {newPageDraft && (
                <div className="inventory-modal-backdrop" onClick={() => setNewPageDraft(null)}>
                  <div className="inventory-modal" style={{ maxWidth: '720px' }} onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <h2 style={{ margin: 0 }}>New Page</h2>
                      <button className="inventory-modal__close" onClick={() => setNewPageDraft(null)}>✕</button>
                    </div>

                    <div className="inventory-modal__body">
                      <div className="admin-form__grid admin-form__grid--two">
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Title *</label>
                          <input
                            className="admin-input-box"
                            placeholder="e.g. Shipping Policy"
                            value={newPageDraft.title}
                            onChange={e => setNewPageDraft(p => ({ ...p, title: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Slug (URL: /info?tab=...)</label>
                          <input
                            className="admin-input-box"
                            placeholder="auto-generated from title if left blank"
                            value={newPageDraft.slug}
                            onChange={e => setNewPageDraft(p => ({ ...p, slug: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Category</label>
                        <select
                          className="admin-input-box"
                          value={newPageDraft.category}
                          onChange={e => setNewPageDraft(p => ({ ...p, category: e.target.value }))}
                        >
                          <option value="general">General</option>
                          <option value="legal">Legal</option>
                          <option value="policy">Policy</option>
                        </select>
                      </div>
                      <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Page Body Content</label>
                        <textarea
                          rows={16}
                          className="admin-input-box"
                          style={{ height: 'auto' }}
                          placeholder={newPageDraft.slug === 'contact' ? 'Phone: 812570286\nEmail: siritraders250925@gmail.com\nAddress: Your address here' : ''}
                          value={newPageDraft.content}
                          onChange={e => setNewPageDraft(p => ({ ...p, content: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="inventory-modal__footer">
                      <button type="button" className="admin__ghost" onClick={() => setNewPageDraft(null)}>Cancel</button>
                      <button
                        type="button"
                        className="admin__primary"
                        disabled={!newPageDraft.title.trim()}
                        onClick={async () => {
                          try {
                            const saved = await adminApi.savePage({ ...newPageDraft, isPublished: true });
                            setCmsData(prev => ({ ...prev, pages: [...prev.pages, saved] }));
                            setNewPageDraft(null);
                            setSaveToast({ type: 'success', msg: `Page "${saved.title}" created` });
                            setTimeout(() => setSaveToast(null), 3000);
                          } catch (err) { alert(err.message); }
                        }}
                      >
                        <FiSave /> Create Page
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
             MODULE 1: REVIEWS & RATINGS MANAGEMENT
             ========================================================================= */}
          {activeTab === 'reviews' && (
            <div className="admin-reviews-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Review KPI & Rating Distribution Card */}
              <div className="admin-card admin-card--wide" style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'center' }}>
                  {/* Big Average Score */}
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

                  {/* Rating Breakdown Bars */}
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

                  {/* Low Rating Watchlist Banner */}
                  <div style={{ background: reviewStats.lowCount > 0 ? '#FEF2F2' : '#F0FDF4', border: `1px solid ${reviewStats.lowCount > 0 ? '#FECACA' : '#BBF7D0'}`, borderRadius: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <FiAlertTriangle style={{ color: reviewStats.lowCount > 0 ? '#DC2626' : '#16A34A' }} />
                      <strong style={{ fontSize: '13px', color: reviewStats.lowCount > 0 ? '#991B1B' : '#166534' }}>
                        {reviewStats.lowCount > 0 ? `${reviewStats.lowCount} Low-Rated Reviews` : 'High Customer Satisfaction'}
                      </strong>
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#4B5563', margin: 0 }}>
                      {reviewStats.lowCount > 0
                        ? 'Items with 1-2 star ratings require quality check or packaging review.'
                        : 'No critical negative reviews found. Over 90% positive store rating.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
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

              {/* Reviews Cards Grid */}
              <div className="admin-reviews-grid">
                {filteredReviews.length === 0 ? (
                  <div className="admin-card admin-card--wide" style={{ textAlign: 'center', padding: '36px', color: '#687466', gridColumn: '1 / -1' }}>
                    No customer reviews found matching your filter criteria.
                  </div>
                ) : filteredReviews.map(rev => (
                  <div key={rev.id} className={`admin-review-card ${rev.status === 'Pending' ? 'admin-review-card--pending' : (rev.status === 'Rejected' ? 'admin-review-card--rejected' : '')}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '13.5px', color: '#111827', display: 'block' }}>
                          {rev.productName}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#687466' }}>Product #{rev.productId}</span>
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

                    {/* Moderation actions */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', borderTop: '1px solid #F1F3ED', paddingTop: '8px' }}>
                      {rev.status !== 'Approved' && (
                        <button
                          type="button"
                          className="admin__ghost"
                          style={{ flex: 1, height: '30px', fontSize: '11.5px', color: '#166534' }}
                          onClick={async () => {
                            await adminApi.updateReviewStatus(rev.id, 'Approved');
                            setReviewsList(prev => prev.map(r => r.id === rev.id ? { ...r, status: 'Approved' } : r));
                            setSaveToast({ type: 'success', msg: 'Review approved and published' });
                            setTimeout(() => setSaveToast(null), 3000);
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
                            setSaveToast({ type: 'success', msg: 'Review rejected & hidden' });
                            setTimeout(() => setSaveToast(null), 3000);
                          }}
                        >
                          <FiX size={12} /> Reject
                        </button>
                      )}

                      <button
                        type="button"
                        className="admin-danger"
                        style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete Review"
                        onClick={async () => {
                          if (window.confirm('Delete this review permanently?')) {
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

          {/* =========================================================================
             MODULE 2: GROCERY PROMOTIONS & COUPONS
             ========================================================================= */}
          {activeTab === 'offers' && (
            <div className="admin-promos-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                {/* Advanced Coupon Builder Form */}
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

                  {/* BOGO & Buy X Get Y Quantities */}
                  {(couponDraft.type === 'bogo' || couponDraft.type === 'buyXgetY') && (
                    <div className="admin-form__grid admin-form__grid--two" style={{ background: '#FAF9F5', padding: '10px', borderRadius: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Buy Quantity (X)</label>
                        <input type="number" value={couponDraft.buyQuantity} onChange={(e) => setCouponDraft(prev => ({ ...prev, buyQuantity: e.target.value }))} placeholder="e.g. 2" />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Get Free Quantity (Y)</label>
                        <input type="number" value={couponDraft.getQuantity} onChange={(e) => setCouponDraft(prev => ({ ...prev, getQuantity: e.target.value }))} placeholder="e.g. 1" />
                      </div>
                    </div>
                  )}

                  {/* Discount values */}
                  {couponDraft.type !== 'freeDelivery' && couponDraft.type !== 'bogo' && couponDraft.type !== 'buyXgetY' && (
                    <div className="admin-form__grid admin-form__grid--two">
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>
                          {couponDraft.type === 'percent' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                        </label>
                        <input value={couponDraft.value} onChange={(e) => setCouponDraft(prev => ({ ...prev, value: e.target.value }))} placeholder={couponDraft.type === 'percent' ? '15' : '50'} type="number" required />
                      </div>
                      {couponDraft.type === 'percent' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Max Discount Cap (₹)</label>
                          <input value={couponDraft.maxDiscount || ''} onChange={(e) => setCouponDraft(prev => ({ ...prev, maxDiscount: e.target.value }))} placeholder="e.g. 150 (optional)" type="number" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Target Scope */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Target Scope</label>
                    <select value={couponDraft.targetType} onChange={(e) => setCouponDraft(prev => ({ ...prev, targetType: e.target.value }))}>
                      <option value="all">Entire Store</option>
                      <option value="category">Specific Category</option>
                      <option value="product">Specific Product ID</option>
                      <option value="customer">Specific Customer Email</option>
                    </select>
                  </div>

                  {couponDraft.targetType === 'category' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Select Category</label>
                      <select value={couponDraft.targetCategory} onChange={(e) => setCouponDraft(prev => ({ ...prev, targetCategory: e.target.value }))}>
                        <option value="">Choose category...</option>
                        {(dbCategories.length ? dbCategories : categories).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  )}

                  {couponDraft.targetType === 'customer' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Target Customer Email</label>
                      <input value={couponDraft.targetCustomerEmail || ''} onChange={(e) => setCouponDraft(prev => ({ ...prev, targetCustomerEmail: e.target.value }))} placeholder="customer@gmail.com" />
                    </div>
                  )}

                  {/* Scheduling & Limits */}
                  <div className="admin-form__grid admin-form__grid--two">
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Start Date</label>
                      <input type="date" value={couponDraft.startDate || ''} onChange={(e) => setCouponDraft(prev => ({ ...prev, startDate: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '3px' }}>End Date (Expiry)</label>
                      <input type="date" value={couponDraft.endDate || ''} onChange={(e) => setCouponDraft(prev => ({ ...prev, endDate: e.target.value }))} />
                    </div>
                  </div>

                  <div className="admin-form__grid admin-form__grid--two">
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Total Usage Limit</label>
                      <input type="number" value={couponDraft.usageLimit} onChange={(e) => setCouponDraft(prev => ({ ...prev, usageLimit: e.target.value }))} placeholder="500" />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '3px' }}>Customer Type</label>
                      <select value={couponDraft.customerType} onChange={(e) => setCouponDraft(prev => ({ ...prev, customerType: e.target.value }))}>
                        <option value="retail">Retail Store</option>
                        <option value="wholesale">Wholesale B2B</option>
                        <option value="all">Both Retail & Wholesale</option>
                      </select>
                    </div>
                  </div>

                  <input value={couponDraft.title} onChange={(e) => setCouponDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Coupon title e.g. FLAT ₹50 OFF" />
                  <input value={couponDraft.description} onChange={(e) => setCouponDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Coupon subtext e.g. On first grocery order" />

                  <button className="admin__primary"><FiPlus /> Save & Activate Coupon</button>
                </form>

                {/* Promotional Banners & Sale Deals Form */}
                <form className="admin-form" onSubmit={saveOffer}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiTag size={18} style={{ color: '#2D5016' }} />
                    <h2 style={{ margin: 0 }}>Add Festive / Daily Deal Promotion</h2>
                  </div>

                  <input value={offerDraft.title} onChange={(e) => setOfferDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Deal Title e.g. Diwali Mega Rice Fest" required />
                  <input value={offerDraft.subtitle} onChange={(e) => setOfferDraft(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="Subtitle e.g. Flat 20% off on all Basmati Rice" />
                  <input value={offerDraft.badge} onChange={(e) => setOfferDraft(prev => ({ ...prev, badge: e.target.value }))} placeholder="Badge e.g. Save ₹80 / BOGO" />

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
                      <input value={offerDraft.image} onChange={(e) => setOfferDraft(prev => ({ ...prev, image: e.target.value }))} placeholder="Add offer image URL" />
                      <label className="admin-file-input admin-file-input--compact">
                        <span>Or choose file from device</span>
                        <input type="file" accept="image/*" onChange={handleOfferImageUpload} />
                      </label>
                    </div>
                  </div>

                  <button className="admin__primary" disabled={imageUploading}>{imageUploading ? 'Uploading image...' : <><FiPlus /> Publish Promotion Deal</>}</button>
                </form>
              </div>

              {/* Active Coupons Grid with Usage Analytics */}
              <div className="admin-card admin-card--wide">
                <div className="admin-card__toolbar">
                  <h2>Active Coupons & Promo Codes ({coupons.length})</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                  {coupons.map(coupon => (
                    <div key={coupon.id} className="admin-promo-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '15px', color: '#1C4D12', letterSpacing: '0.5px' }}>{coupon.code}</strong>
                        <span className={`admin-promo-pill admin-promo-pill--${coupon.type}`}>
                          {coupon.type === 'bogo' ? '🎁 BOGO'
                            : coupon.type === 'buyXgetY' ? `🎁 Buy ${coupon.buyQuantity} Get ${coupon.getQuantity}`
                            : coupon.type === 'freeDelivery' ? '🚚 FREE Delivery'
                            : coupon.type === 'percent' ? `${coupon.value}% OFF`
                            : `₹${coupon.value} OFF`}
                        </span>
                      </div>

                      <p style={{ margin: 0, fontSize: '12px', color: '#4B5563' }}>
                        {coupon.title || coupon.description || 'Promotional coupon'}
                      </p>

                      <div style={{ background: '#FAF9F5', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <span>Scope: <strong>{coupon.targetType || 'All'}</strong></span>
                        <span>Customer: <strong>{coupon.customerType === 'all' ? 'Retail & Wholesale' : (coupon.customerType || 'Retail')}</strong></span>
                        <span>Used: <strong>{coupon.timesUsed || 0} times</strong></span>
                        <span>Discount Given: <strong>₹{coupon.totalDiscountGiven || 0}</strong></span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <button
                          type="button"
                          style={{
                            background: coupon.active !== false ? '#DCFCE7' : '#F3F4F6',
                            color: coupon.active !== false ? '#166534' : '#6B7280',
                            border: 'none',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          onClick={async () => {
                            const nextActive = coupon.active === false ? true : false;
                            try {
                              const updated = await adminApi.updateCoupon(coupon.id, { active: nextActive });
                              setCoupons(prev => prev.map(c => c.id === updated.id ? updated : c));
                              broadcastSync(SYNC_EVENTS.SITE_DATA_CHANGED);
                            } catch (err) { alert(err.message); }
                          }}
                        >
                          {coupon.active !== false ? '🟢 Active' : '⚪ Inactive'}
                        </button>

                        <button
                          type="button"
                          className="admin-danger"
                          style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={async () => {
                            if (window.confirm(`Delete coupon code ${coupon.code}?`)) {
                              await adminApi.deleteCoupon(coupon.id);
                              setCoupons(prev => prev.filter(c => c.id !== coupon.id));
                              broadcastSync(SYNC_EVENTS.SITE_DATA_CHANGED);
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
            </div>
          )}

          {/* =========================================================================
             MODULE 2B: FESTIVE OFFERS — dedicated view/manage page for the
             storefront's /festive-offers deals (a subset of the "offers" table
             filtered to group === 'festival'). Creating here always tags the
             deal festival, unlike the generic Promos & Coupons form above
             which only auto-detects it from festive keywords in the title.
             ========================================================================= */}
          {activeTab === 'festive-offers' && (
            <div className="admin-promos-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                <form className="admin-form" onSubmit={(e) => saveOffer(e, 'festival')}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiGift size={18} style={{ color: '#2D5016' }} />
                      <h2 style={{ margin: 0 }}>{offerDraft.id ? 'Edit Festive Offer' : 'Add Festive Offer'}</h2>
                    </div>
                    {offerDraft.id && (
                      <button type="button" className="admin__ghost" style={{ padding: '4px 10px', fontSize: '11.5px' }} onClick={() => setOfferDraft(blankOffer)}>
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <input value={offerDraft.title} onChange={(e) => setOfferDraft(prev => ({ ...prev, title: e.target.value }))} placeholder="Deal Title e.g. Diwali Mega Rice Fest" required />
                  <input value={offerDraft.subtitle} onChange={(e) => setOfferDraft(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="Subtitle e.g. Flat 20% off on all Basmati Rice" />
                  <input value={offerDraft.badge} onChange={(e) => setOfferDraft(prev => ({ ...prev, badge: e.target.value }))} placeholder="Badge e.g. Save ₹80 / BOGO" />

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
                      <input value={offerDraft.image} onChange={(e) => setOfferDraft(prev => ({ ...prev, image: e.target.value }))} placeholder="Add offer image URL" />
                      <label className="admin-file-input admin-file-input--compact">
                        <span>Or choose file from device</span>
                        <input type="file" accept="image/*" onChange={handleOfferImageUpload} />
                      </label>
                    </div>
                  </div>

                  <button className="admin__primary" disabled={imageUploading}>
                    {imageUploading ? 'Uploading image...' : <><FiPlus /> {offerDraft.id ? 'Update Festive Offer' : 'Publish Festive Offer'}</>}
                  </button>
                </form>

                <div className="admin-card">
                  <h2>About this page</h2>
                  <p style={{ fontSize: '12.5px', color: '#687466', lineHeight: 1.6 }}>
                    Deals published here appear on the storefront's <strong>Festive Offers</strong> page
                    (linked from the home screen). Toggle a deal off or delete it any time — changes
                    go live immediately.
                  </p>
                </div>
              </div>

              <div className="admin-card admin-card--wide">
                <div className="admin-card__toolbar">
                  <h2>Festive Offers ({offers.filter(o => o.group === 'festival').length})</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                  {offers.filter(o => o.group === 'festival').map(offer => (
                    <div key={offer.id} className="admin-promo-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '15px', color: '#1C4D12' }}>{offer.title}</strong>
                        {offer.badge && (
                          <span className="admin-promo-pill">{offer.badge}</span>
                        )}
                      </div>

                      <p style={{ margin: 0, fontSize: '12px', color: '#4B5563' }}>
                        {offer.subtitle || 'Festive promotion'}
                      </p>

                      {offer.price > 0 && (
                        <div style={{ background: '#FAF9F5', padding: '8px 10px', borderRadius: '8px', fontSize: '11.5px' }}>
                          <span>Price: <strong>{formatPrice(offer.price)}</strong>{offer.mrp > offer.price && <> (MRP {formatPrice(offer.mrp)})</>}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <button
                          type="button"
                          style={{
                            background: offer.active !== false ? '#DCFCE7' : '#F3F4F6',
                            color: offer.active !== false ? '#166534' : '#6B7280',
                            border: 'none',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          onClick={async () => {
                            const nextActive = offer.active === false ? true : false;
                            try {
                              const updated = normalizeOffer(await adminApi.updateOffer(offer.id, { active: nextActive }));
                              setOffers(prev => prev.map(o => o.id === updated.id ? updated : o));
                              broadcastSync(SYNC_EVENTS.SITE_DATA_CHANGED);
                            } catch (err) { alert(err.message); }
                          }}
                        >
                          {offer.active !== false ? '🟢 Active' : '⚪ Inactive'}
                        </button>

                        <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="admin__ghost"
                          style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={() => editFestiveOffer(offer)}
                        >
                          <FiEdit2 size={12} />
                        </button>
                        <button
                          type="button"
                          className="admin-danger"
                          style={{ width: '28px', height: '28px', padding: 0, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          onClick={async () => {
                            if (window.confirm(`Delete festive offer "${offer.title}"?`)) {
                              await adminApi.deleteOffer(offer.id);
                              setOffers(prev => prev.filter(o => o.id !== offer.id));
                              broadcastSync(SYNC_EVENTS.SITE_DATA_CHANGED);
                            }
                          }}
                        >
                          <FiTrash2 size={12} />
                        </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {offers.filter(o => o.group === 'festival').length === 0 && (
                  <p style={{ fontSize: '12.5px', color: '#687466', padding: '8px 4px' }}>
                    No festive offers yet — add one using the form above.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* =========================================================================
             MODULE 3: GROCERY SALES & INVENTORY ANALYTICS
             ========================================================================= */}
          {activeTab === 'sales-stats' && (
            <div className="sales-analytics-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header & Range Bar */}
              <div className="admin-card admin-card--wide" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ margin: 0 }}>Grocery Sales & Inventory Analytics</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                      Real-time revenue, margins, wastage, turnover, and delivery area analytics.
                    </p>
                  </div>

                  <div className="admin-analytics-range-bar">
                    <button
                      type="button"
                      className={`admin-range-btn ${analyticsTimeRange === '1' ? 'admin-range-btn--active' : ''}`}
                      onClick={() => setAnalyticsTimeRange('1')}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      className={`admin-range-btn ${analyticsTimeRange === '7' ? 'admin-range-btn--active' : ''}`}
                      onClick={() => setAnalyticsTimeRange('7')}
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      className={`admin-range-btn ${analyticsTimeRange === '30' ? 'admin-range-btn--active' : ''}`}
                      onClick={() => setAnalyticsTimeRange('30')}
                    >
                      30 Days
                    </button>
                    <button
                      type="button"
                      className={`admin-range-btn ${analyticsTimeRange === '90' ? 'admin-range-btn--active' : ''}`}
                      onClick={() => setAnalyticsTimeRange('90')}
                    >
                      90 Days
                    </button>
                    <button
                      type="button"
                      className={`admin-range-btn ${analyticsTimeRange === '365' ? 'admin-range-btn--active' : ''}`}
                      onClick={() => setAnalyticsTimeRange('365')}
                    >
                      1 Year
                    </button>
                  </div>
                </div>
              </div>

              {/* 4-KPI Grid */}
              <div className="admin-analytics-grid-4">
                <div className="sales-kpi-card">
                  <span>GROSS REVENUE</span>
                  <strong>{formatPrice(analyticsSummary.grossRevenue)}</strong>
                  <small>Net: {formatPrice(analyticsSummary.netRevenue)} (after {formatPrice(analyticsSummary.totalRefunds)} refunds)</small>
                </div>

                <div className="sales-kpi-card">
                  <span>ORDERS & UNITS</span>
                  <strong>{analyticsSummary.ordersCount} orders</strong>
                  <small>{analyticsSummary.totalUnitsSold} grocery units delivered</small>
                </div>

                <div className="sales-kpi-card">
                  <span>AVG ORDER VALUE (AOV)</span>
                  <strong>{formatPrice(analyticsSummary.aov)}</strong>
                  <small>Repeat Customer Rate: <strong>{analyticsSummary.repeatRate}%</strong></small>
                </div>

                <div className="sales-kpi-card" style={{ background: '#FFFDF7', borderColor: '#FDE68A' }}>
                  <span style={{ color: '#92400E' }}>WASTAGE / EXPIRED LOSSES</span>
                  <strong style={{ color: '#B45309' }}>{formatPrice(analyticsSummary.wastageLoss)}</strong>
                  <small>Damaged + Expired stock valuation</small>
                </div>
              </div>

              {/* Revenue Trend SVG Chart */}
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

              {/* Category & Brand Performance Breakdown Cards */}
              <div className="admin-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="admin-breakdown-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13.5px', color: '#1C4B12' }}>Category Revenue Share</strong>
                    <FiPieChart size={16} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsSummary.categorySales.slice(0, 6).map(([cat, rev]) => {
                      const maxCat = analyticsSummary.categorySales[0]?.[1] || 1;
                      const pct = Math.round((rev / (analyticsSummary.grossRevenue || 1)) * 100);
                      return (
                        <div key={cat} className="admin-breakdown-item">
                          <span style={{ textTransform: 'capitalize', fontWeight: 600, width: '100px' }}>{cat}</span>
                          <div className="admin-progress-bar-wrap">
                            <div className="admin-progress-bar-fill" style={{ width: `${(rev / maxCat) * 100}%` }} />
                          </div>
                          <strong>{formatPrice(rev)} ({pct}%)</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="admin-breakdown-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13.5px', color: '#1C4B12' }}>Brand Performance Share</strong>
                    <FiTag size={16} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsSummary.brandSales.slice(0, 6).map(([brand, rev]) => {
                      const maxBrand = analyticsSummary.brandSales[0]?.[1] || 1;
                      const pct = Math.round((rev / (analyticsSummary.grossRevenue || 1)) * 100);
                      return (
                        <div key={brand} className="admin-breakdown-item">
                          <span style={{ fontWeight: 600, width: '100px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{brand}</span>
                          <div className="admin-progress-bar-wrap">
                            <div className="admin-progress-bar-fill" style={{ width: `${(rev / maxBrand) * 100}%`, background: '#3B82F6' }} />
                          </div>
                          <strong>{formatPrice(rev)} ({pct}%)</strong>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Fast-Moving vs Slow-Moving Products */}
              <div className="admin-grid" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
                <div className="admin-card">
                  <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#1C4B12', margin: '0 0 10px' }}>
                    🚀 Fast-Moving Products (Top Sellers)
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsSummary.fastMoving.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FAF9F5', borderRadius: '8px', fontSize: '12px' }}>
                        <div>
                          <strong>{idx + 1}. {p.name}</strong>
                          <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>{p.brand} · {p.category}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#15803D' }}>{formatPrice(p.revenue)}</strong>
                          <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>{p.units} units sold</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="admin-card">
                  <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#B45309', margin: '0 0 10px' }}>
                    ⏳ Slow-Moving / Low Turnover Watchlist
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {analyticsSummary.slowMoving.map((p, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#FFFDF7', border: '1px solid #FEF3C7', borderRadius: '8px', fontSize: '12px' }}>
                        <div>
                          <strong>{p.name}</strong>
                          <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>Stock: {p.stockNote}</span>
                        </div>
                        <button
                          type="button"
                          className="admin__ghost"
                          style={{ height: '28px', fontSize: '11px' }}
                          onClick={() => {
                            setActiveTab('offers');
                            setCouponDraft(prev => ({
                              ...prev,
                              code: `DEAL-${p.category.toUpperCase()}`,
                              title: `Special Promo on ${p.name}`,
                              targetType: 'product',
                              targetProductId: p.id
                            }));
                          }}
                        >
                          + Create Promo
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Delivery Area & Pincode Performance Table */}
              <div className="admin-card admin-card--wide">
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#1C4B12', margin: '0 0 10px' }}>
                  🚚 Locality & Delivery Area Performance
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>LOCALITY / AREA</th>
                        <th>ORDERS FULFILLED</th>
                        <th>REVENUE (₹)</th>
                        <th>AVG ORDER VALUE (₹)</th>
                        <th>SHARE (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsSummary.areaSales.map(([area, data]) => {
                        const pct = Math.round((data.revenue / (analyticsSummary.grossRevenue || 1)) * 100);
                        return (
                          <tr key={area}>
                            <td><strong>{area}</strong></td>
                            <td>{data.orders}</td>
                            <td><strong style={{ color: '#15803D' }}>{formatPrice(data.revenue)}</strong></td>
                            <td>{formatPrice(Math.round(data.revenue / (data.orders || 1)))}</td>
                            <td>
                              <span className="admin-dist-bar-fill" style={{ display: 'inline-block', width: `${Math.max(10, pct)}%`, padding: '2px 6px', color: '#fff', fontSize: '10.5px', borderRadius: '4px', textAlign: 'center' }}>
                                {pct}%
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
             OTHER MODULES: ORDERS, CUSTOMERS, INVENTORY, DELIVERY, CATALOG
             ========================================================================= */}
          {activeTab === 'orders' && (
            <div className="admin-orders-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Top Filter and Search Toolbar */}
              <div className="admin-card admin-card--wide" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="inventory-filters-tabs">
                    <button
                      className={`inventory-filter-btn ${orderStatusFilter === 'all' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setOrderStatusFilter('all')}
                    >
                      All Orders <span className="inventory-badge-count">{liveOrders?.length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${orderStatusFilter === 'pending' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setOrderStatusFilter('pending')}
                    >
                      🟡 Pending / Preparing <span className="inventory-badge-count">{liveOrders?.filter(o => ['Pending', 'Preparing'].includes(o.status)).length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${orderStatusFilter === 'in-transit' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setOrderStatusFilter('in-transit')}
                    >
                      🚚 In Transit <span className="inventory-badge-count">{liveOrders?.filter(o => o.status === 'In Transit').length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${orderStatusFilter === 'delivered' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setOrderStatusFilter('delivered')}
                    >
                      ✅ Delivered <span className="inventory-badge-count">{liveOrders?.filter(o => ['Delivered', 'Paid'].includes(o.status)).length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${orderStatusFilter === 'cancelled' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setOrderStatusFilter('cancelled')}
                    >
                      ❌ Cancelled <span className="inventory-badge-count">{liveOrders?.filter(o => o.status === 'Cancelled').length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${orderStatusFilter === 'returns' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setOrderStatusFilter('returns')}
                    >
                      ↩️ Returns <span className="inventory-badge-count">{liveOrders?.filter(o => o.returnStatus && o.returnStatus !== 'None').length || 0}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
                      <div className="admin-search-label" style={{ flex: 1 }}>
                        <FiSearch />
                        <input
                          placeholder="Search by Order ID, Bill No, Customer Name, Phone, Address or Txn Ref..."
                          value={orderSearchQuery}
                          onChange={(e) => setOrderSearchQuery(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <select
                        className="admin-input-box"
                        style={{ width: '170px', height: '38px', borderRadius: '10px' }}
                        value={orderPaymentFilter}
                        onChange={(e) => setOrderPaymentFilter(e.target.value)}
                      >
                        <option value="all">All Payments</option>
                        <option value="paid">🟢 Paid</option>
                        <option value="pending">🟡 Payment Pending</option>
                        <option value="refunded">🟣 Refunded</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="admin__ghost" onClick={loadOrders} style={{ height: '38px', padding: '0 12px', fontSize: '12px' }}>
                        <FiRefreshCw size={13} /> Refresh
                      </button>
                      <button className="admin__primary" onClick={exportOrdersCsv} style={{ height: '38px', padding: '0 14px', fontSize: '12px' }}>
                        📥 Export Orders CSV
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Cards List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredOrders.length === 0 ? (
                  <div className="admin-card admin-card--wide" style={{ textAlign: 'center', padding: '40px', color: '#687466' }}>
                    No orders matching your filter or search criteria.
                  </div>
                ) : filteredOrders.map(order => (
                  <div key={order.id} className="admin-order-card-enhanced">
                    <div className="admin-order-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#F1F8E9', color: '#2D5016', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiShoppingBag size={18} />
                        </div>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#111827' }}>Order #{order.id}</strong>
                          <span style={{ fontSize: '12px', color: '#2D5016', fontWeight: '800', marginLeft: '8px' }}>BILL-{order.id + 7820}</span>
                          <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>
                            Placed on: {order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '—'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`admin-order-status-pill admin-order-status-pill--${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.status}
                        </span>
                        <span className={`admin-payment-pill admin-payment-pill--${(order.paymentStatus || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                          {order.paymentStatus === 'Paid' ? '✓ Paid' : (order.paymentStatus || 'Pending')}
                        </span>
                        {order.deliverySlot && (
                          <span style={{ fontSize: '11px', background: '#FAF9F5', border: '1px solid #E1E6DC', padding: '2px 7px', borderRadius: '4px', color: '#4B5563' }}>
                            🕒 {order.deliverySlot}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          className="admin__ghost"
                          style={{ height: '32px', fontSize: '11.5px', padding: '0 10px', borderRadius: '6px' }}
                          onClick={() => {
                            setSelectedOrderModal(order);
                            setOrderNotesText(order.orderNotes || '');
                            setRefundForm({ amount: '', reason: 'Customer return / out of stock' });
                          }}
                        >
                          <FiEye size={12} /> View Details
                        </button>
                        <button
                          className="admin__ghost"
                          style={{ height: '32px', fontSize: '11.5px', padding: '0 10px', borderRadius: '6px' }}
                          title="Print Tax Invoice"
                          onClick={() => setInvoiceModalOrder(order)}
                        >
                          <FiPrinter size={12} /> Invoice
                        </button>
                      </div>
                    </div>

                    <div className="admin-order-body-grid">
                      <div>
                        <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Customer</span>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#111827', marginTop: '2px' }}>
                          {order.customerName || 'Customer'}
                        </strong>
                        {order.customerPhone && <span style={{ fontSize: '11.5px', color: '#4B5563', display: 'block' }}>📞 {order.customerPhone}</span>}
                        {order.customerEmail && <span style={{ fontSize: '11.5px', color: '#4B5563', display: 'block' }}>✉️ {order.customerEmail}</span>}
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Items ({order.items?.length || 0})</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '3px' }}>
                          {(order.items || []).slice(0, 3).map((item, idx) => (
                            <span key={idx} style={{ fontSize: '11.5px', color: '#374151' }}>
                              • {item.name} {item.weight ? `(${item.weight}${item.unit})` : ''} <strong>x{item.quantity || 1}</strong>
                            </span>
                          ))}
                          {(order.items || []).length > 3 && (
                            <span style={{ fontSize: '11px', color: '#687466' }}>+{(order.items || []).length - 3} more item(s)...</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Delivery Details</span>
                        <span style={{ display: 'block', fontSize: '11.5px', color: '#374151', marginTop: '2px', lineHeight: '1.3' }}>
                          {order.deliveryAddress || 'Store Pickup'}
                        </span>
                        {order.trackingNumber && (
                          <span style={{ fontSize: '10.5px', color: '#687466', display: 'block', marginTop: '2px' }}>
                            Tracking: <strong>{order.trackingNumber}</strong>
                          </span>
                        )}
                      </div>

                      <div>
                        <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Payment & Txn</span>
                        <strong style={{ display: 'block', fontSize: '12.5px', color: '#111827', marginTop: '2px' }}>
                          {order.paymentGateway || order.paymentMethod || 'COD'}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#687466', fontFamily: 'monospace', display: 'block' }}>
                          {order.paymentTxnId || `TXN-SIRI-${order.id}`}
                        </span>
                        {order.refundAmount > 0 && (
                          <span style={{ fontSize: '11px', color: '#7E22CE', fontWeight: 'bold', display: 'block' }}>
                            Refunded: {formatPrice(order.refundAmount)}
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Grand Total</span>
                        <strong style={{ display: 'block', fontSize: '16px', color: '#111827', marginTop: '2px' }}>
                          {formatPrice(order.total)}
                        </strong>
                        <select
                          value={order.status}
                          className="admin-status-select"
                          style={{ marginTop: '6px', height: '32px', fontSize: '11.5px' }}
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            const payload = { status: newStatus };
                            // "Paid" as a status is payment-complete by definition, and COD
                            // payment is only actually collected on delivery — flip paymentStatus
                            // to Paid in both cases so the payment pill/filter stay truthful
                            // instead of sitting on "Pending" forever after the fact.
                            const isCod = (order.paymentMethod || '').toLowerCase().includes('cod');
                            const impliesPaid = newStatus === 'Paid' || (newStatus === 'Delivered' && isCod);
                            if (impliesPaid && order.paymentStatus !== 'Paid') {
                              payload.paymentStatus = 'Paid';
                            }
                            handleUpdateOrder(order.id, payload);
                          }}
                        >
                          {['Pending', 'Preparing', 'In Transit', 'Delivered', 'Paid', 'Cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* MODAL: DETAILED ORDER DRILLDOWN & PAYMENT ACTIONS */}
              {selectedOrderModal && (
                <div className="inventory-modal-backdrop" onClick={() => setSelectedOrderModal(null)}>
                  <div className="inventory-modal" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <div>
                        <h2>Order #{selectedOrderModal.id} — BILL-{selectedOrderModal.id + 7820}</h2>
                        <span style={{ fontSize: '11.5px', color: '#687466' }}>
                          Placed on: {selectedOrderModal.createdAt ? new Date(selectedOrderModal.createdAt).toLocaleString('en-IN') : '—'}
                        </span>
                      </div>
                      <button className="inventory-modal__close" onClick={() => setSelectedOrderModal(null)}>✕</button>
                    </div>

                    <div className="inventory-modal__body" style={{ gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: '#FAF9F5', padding: '14px', borderRadius: '10px' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px', color: '#1C4B12', marginBottom: '4px' }}>Customer Contact</strong>
                          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                            <div>Name: <strong>{selectedOrderModal.customerName || 'Customer'}</strong></div>
                            <div>Phone: <strong>{selectedOrderModal.customerPhone || 'Not provided'}</strong></div>
                            <div>Email: <strong>{selectedOrderModal.customerEmail || 'Not provided'}</strong></div>
                          </div>
                        </div>
                        <div>
                          <strong style={{ display: 'block', fontSize: '13px', color: '#1C4B12', marginBottom: '4px' }}>Delivery Details</strong>
                          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                            <div>Address: <strong>{selectedOrderModal.deliveryAddress || 'Store Pickup'}</strong></div>
                            <div>Slot: <strong>{selectedOrderModal.deliverySlot || 'Standard Delivery'}</strong></div>
                            <div>Tracking: <strong>{selectedOrderModal.trackingNumber || 'TRK-SIRI-DEFAULT'}</strong></div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '12.5px', textTransform: 'uppercase', color: '#1C4B12', margin: '0 0 8px', fontWeight: 800 }}>
                          Order Items ({(selectedOrderModal.items || []).length})
                        </h3>
                        <table className="admin-variant-table">
                          <thead>
                            <tr>
                              <th>PRODUCT</th>
                              <th>PACK SIZE</th>
                              <th>PRICE (₹)</th>
                              <th>QTY</th>
                              <th style={{ textAlign: 'right' }}>TOTAL (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedOrderModal.items || []).map((it, i) => (
                              <tr key={i}>
                                <td><strong>{it.name}</strong></td>
                                <td>{it.weight ? `${it.weight}${it.unit}` : 'Standard'}</td>
                                <td>{formatPrice(it.price)}</td>
                                <td>x{it.quantity || 1}</td>
                                <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatPrice(it.price * (it.quantity || 1))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ background: '#FFFFFF', border: '1px solid #E1E6DC', borderRadius: '10px', padding: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <strong style={{ fontSize: '13px', color: '#111827' }}>Payment & Transaction Record</strong>
                          <span className={`admin-payment-pill admin-payment-pill--${(selectedOrderModal.paymentStatus || 'pending').toLowerCase().replace(/\s+/g, '-')}`}>
                            {selectedOrderModal.paymentStatus || 'Pending'}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontSize: '12px' }}>
                          <div>Method: <strong>{selectedOrderModal.paymentGateway || selectedOrderModal.paymentMethod || 'COD'}</strong></div>
                          <div>Txn Ref: <strong style={{ fontFamily: 'monospace' }}>{selectedOrderModal.paymentTxnId || `TXN-SIRI-${selectedOrderModal.id}`}</strong></div>
                          <div>Total Billed: <strong>{formatPrice(selectedOrderModal.total)}</strong></div>
                          <div>Refunded: <strong style={{ color: '#7E22CE' }}>{formatPrice(selectedOrderModal.refundAmount || 0)}</strong></div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#687466' }}>Update Payment Status:</span>
                          <button
                            type="button"
                            className="admin__ghost"
                            style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                            onClick={() => handleUpdateOrder(selectedOrderModal.id, { paymentStatus: 'Paid' }, 'Marked payment as Paid')}
                          >
                            Mark Paid
                          </button>
                          <button
                            type="button"
                            className="admin__ghost"
                            style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
                            onClick={() => handleUpdateOrder(selectedOrderModal.id, { paymentStatus: 'Pending' }, 'Marked payment as Pending')}
                          >
                            Mark Pending
                          </button>
                        </div>
                      </div>

                      <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '10px', padding: '14px' }}>
                        <strong style={{ display: 'block', fontSize: '12.5px', color: '#6B21A8', marginBottom: '8px' }}>
                          💸 Issue Refund / Partial Refund
                        </strong>
                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr auto', gap: '8px' }}>
                          <input
                            type="number"
                            className="admin-input-box"
                            placeholder="Amount (₹)"
                            value={refundForm.amount}
                            onChange={(e) => setRefundForm(p => ({ ...p, amount: e.target.value }))}
                          />
                          <input
                            type="text"
                            className="admin-input-box"
                            placeholder="Reason for refund (e.g. Item out of stock)"
                            value={refundForm.reason}
                            onChange={(e) => setRefundForm(p => ({ ...p, reason: e.target.value }))}
                          />
                          <button
                            type="button"
                            className="admin__primary"
                            style={{ height: '38px', background: '#7E22CE', padding: '0 14px', fontSize: '12px' }}
                            disabled={!refundForm.amount || Number(refundForm.amount) <= 0 || orderActionLoading}
                            onClick={() => {
                              handleUpdateOrder(
                                selectedOrderModal.id,
                                { refundAmount: Number(refundForm.amount), refundReason: refundForm.reason },
                                `Issued refund of ₹${refundForm.amount}`
                              );
                              setRefundForm({ amount: '', reason: 'Customer return / out of stock' });
                            }}
                          >
                            Process Refund
                          </button>
                        </div>
                      </div>

                      {selectedOrderModal.status !== 'Cancelled' && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '12px 14px' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: '12.5px', color: '#991B1B' }}>Cancel Order & Restock</strong>
                            <span style={{ fontSize: '11px', color: '#7F1D1D' }}>Cancel order and automatically restore stock in inventory database.</span>
                          </div>
                          <button
                            type="button"
                            className="admin-danger"
                            style={{ height: '32px', padding: '0 12px', fontSize: '11.5px', borderRadius: '6px' }}
                            onClick={() => {
                              if (window.confirm('Cancel order and restock items back into inventory?')) {
                                handleUpdateOrder(
                                  selectedOrderModal.id,
                                  { status: 'Cancelled', cancellationReason: 'Admin / Customer cancellation', restockOnCancel: true },
                                  `Order #${selectedOrderModal.id} cancelled and inventory restocked`
                                );
                              }
                            }}
                          >
                            Cancel & Restock
                          </button>
                        </div>
                      )}

                      <div>
                        <strong style={{ display: 'block', fontSize: '12px', color: '#111827', marginBottom: '4px' }}>Internal Order Notes & Instructions</strong>
                        <textarea
                          rows={2}
                          className="admin-input-box"
                          placeholder="Add driver delivery instructions, customer phone verification notes..."
                          value={orderNotesText}
                          onChange={(e) => setOrderNotesText(e.target.value)}
                        />
                        <button
                          type="button"
                          className="admin__ghost"
                          style={{ marginTop: '6px', height: '30px', fontSize: '11.5px' }}
                          onClick={() => handleUpdateOrder(selectedOrderModal.id, { orderNotes: orderNotesText }, 'Order notes saved')}
                        >
                          Save Notes
                        </button>
                      </div>
                    </div>

                    <div className="inventory-modal__footer">
                      <button className="admin__ghost" onClick={() => setSelectedOrderModal(null)}>Close</button>
                      <button className="admin__primary" onClick={() => { setInvoiceModalOrder(selectedOrderModal); setSelectedOrderModal(null); }}>
                        <FiPrinter /> Print Tax Invoice
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL: TAX INVOICE GENERATOR & PRINT VIEW */}
              {invoiceModalOrder && createPortal(
                <div className="inventory-modal-backdrop" onClick={() => setInvoiceModalOrder(null)}>
                  <div className="admin-invoice-modal" onClick={e => e.stopPropagation()}>
                    <div className="admin-invoice-paper">
                      <div className="admin-invoice-header">
                        <div>
                          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1C4B12', letterSpacing: '0.5px' }}>
                            SIRI TRADERS
                          </h1>
                          <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#4B5563' }}>
                            Premium Grocery & Wholesale Merchant<br />
                            Hyderabad, Telangana — 500072<br />
                            <strong>GSTIN: 36AAACS7820Q1Z5</strong> | Phone: +91 98490 12345
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <h2 style={{ margin: 0, fontSize: '16px', color: '#2D5016', fontWeight: 800 }}>TAX INVOICE</h2>
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>
                            <div>Invoice No: <strong>BILL-{invoiceModalOrder.id + 7820}</strong></div>
                            <div>Order Ref: <strong>#{invoiceModalOrder.id}</strong></div>
                            <div>Date: <strong>{new Date(invoiceModalOrder.createdAt || Date.now()).toLocaleDateString('en-IN')}</strong></div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', paddingBottom: '14px', borderBottom: '1px solid #E2E8F0', fontSize: '12px' }}>
                        <div>
                          <strong style={{ color: '#2D5016', display: 'block', marginBottom: '2px' }}>Billed / Delivered To:</strong>
                          <div style={{ fontWeight: 800 }}>{invoiceModalOrder.customerName || 'Customer'}</div>
                          <div>{invoiceModalOrder.deliveryAddress || 'Store Pickup'}</div>
                          {invoiceModalOrder.customerPhone && <div>Phone: {invoiceModalOrder.customerPhone}</div>}
                          {invoiceModalOrder.customerEmail && <div>Email: {invoiceModalOrder.customerEmail}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ color: '#2D5016', display: 'block', marginBottom: '2px' }}>Payment & Delivery Details:</strong>
                          <div>Payment Mode: <strong>{invoiceModalOrder.paymentGateway || invoiceModalOrder.paymentMethod || 'COD'}</strong></div>
                          <div>Payment Status: <strong>{invoiceModalOrder.paymentStatus || 'Pending'}</strong></div>
                          <div>Txn Ref: <strong>{invoiceModalOrder.paymentTxnId || `TXN-SIRI-${invoiceModalOrder.id}`}</strong></div>
                          <div>Delivery Slot: <strong>{invoiceModalOrder.deliverySlot || 'Standard Delivery'}</strong></div>
                        </div>
                      </div>

                      <table className="admin-invoice-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>ITEM DESCRIPTION</th>
                            <th>PACK SIZE</th>
                            <th>RATE (₹)</th>
                            <th>QTY</th>
                            <th style={{ textAlign: 'right' }}>AMOUNT (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(invoiceModalOrder.items || []).map((it, idx) => (
                            <tr key={idx}>
                              <td>{idx + 1}</td>
                              <td><strong>{it.name}</strong></td>
                              <td>{it.weight ? `${it.weight}${it.unit}` : 'Standard'}</td>
                              <td>{formatPrice(it.price)}</td>
                              <td>{it.quantity || 1}</td>
                              <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatPrice(it.price * (it.quantity || 1))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                        <div style={{ width: '260px', fontSize: '12.5px', lineHeight: '1.6' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Subtotal:</span>
                            <span>{formatPrice((invoiceModalOrder.items || []).reduce((s, i) => s + i.price * (i.quantity || 1), 0) || invoiceModalOrder.total)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>GST / Taxes:</span>
                            <span>Included</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Delivery Fee:</span>
                            <span>₹0</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1.5px solid #2D5016', paddingTop: '4px', marginTop: '4px', fontWeight: 900, fontSize: '15px', color: '#1C4B12' }}>
                            <span>Grand Total:</span>
                            <span>{formatPrice(invoiceModalOrder.total)}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '36px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', fontSize: '11px', color: '#687466' }}>
                        <div>
                          Thank you for choosing Siri Traders!<br />
                          For queries, contact support@siritrader.com
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ width: '140px', borderBottom: '1px solid #374151', marginBottom: '4px' }}></div>
                          <strong>Authorized Signatory</strong>
                        </div>
                      </div>
                    </div>

                    <div className="inventory-modal__footer admin-invoice-actions">
                      <button className="admin__ghost" onClick={() => setInvoiceModalOrder(null)}>Close</button>
                      <button className="admin__primary" onClick={() => window.print()}>
                        <FiPrinter /> Print Invoice
                      </button>
                    </div>
                  </div>
                </div>,
                document.getElementById('print-root')
              )}
            </div>
          )}

          {/* CUSTOMER HUB */}
          {activeTab === 'customers' && (
            <div className="admin-customers-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-card admin-card--wide" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="inventory-filters-tabs">
                    <button
                      className={`inventory-filter-btn ${customerSegmentFilter === 'all' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setCustomerSegmentFilter('all')}
                    >
                      All Customers <span className="inventory-badge-count">{liveCustomers?.length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${customerSegmentFilter === 'VIP' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setCustomerSegmentFilter('VIP')}
                    >
                      🌟 VIP / High-Value <span className="inventory-badge-count">{liveCustomers?.filter(c => c.segment === 'VIP').length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${customerSegmentFilter === 'Returning' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setCustomerSegmentFilter('Returning')}
                    >
                      🔁 Returning <span className="inventory-badge-count">{liveCustomers?.filter(c => c.segment === 'Returning').length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${customerSegmentFilter === 'New' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setCustomerSegmentFilter('New')}
                    >
                      🌱 New <span className="inventory-badge-count">{liveCustomers?.filter(c => c.segment === 'New').length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${customerSegmentFilter === 'Inactive' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setCustomerSegmentFilter('Inactive')}
                    >
                      💤 Inactive (30d+) <span className="inventory-badge-count">{liveCustomers?.filter(c => c.segment === 'Inactive').length || 0}</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div className="admin-search-label" style={{ flex: 1, minWidth: '280px', maxWidth: '500px' }}>
                      <FiSearch />
                      <input
                        placeholder="Search by customer name, email or phone..."
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <button className="admin__ghost" onClick={loadCustomers}>
                      <FiRefreshCw size={13} /> Refresh Customers
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', borderTop: '1px solid #E1E6DC', paddingTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#687466' }}>
                      {selectedBroadcastEmails.length > 0
                        ? <strong style={{ color: '#2D5016' }}>{selectedBroadcastEmails.length} customer(s) selected for messaging</strong>
                        : 'No customers selected — check customers below, or select a whole segment tab above'}
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="admin__ghost" style={{ fontSize: '11.5px', padding: '6px 12px' }} onClick={selectFilteredCustomers}>
                        Select {customerSegmentFilter === 'all' ? 'All' : customerSegmentFilter} ({filteredCustomers.length})
                      </button>
                      <button className="admin__ghost" style={{ fontSize: '11.5px', padding: '6px 12px' }} disabled={selectedBroadcastEmails.length === 0} onClick={clearCustomerSelection}>
                        Clear Selection
                      </button>
                      <button
                        className="admin__primary"
                        style={{ fontSize: '11.5px', padding: '6px 12px' }}
                        disabled={selectedBroadcastEmails.length === 0}
                        onClick={() => {
                          setActiveTab('broadcast');
                          setBroadcastSubject('');
                        }}
                      >
                        <FiMail size={12} /> Message Selected ({selectedBroadcastEmails.length})
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="admin-customer-grid">
                {filteredCustomers.length === 0 ? (
                  <div className="admin-card admin-card--wide" style={{ textAlign: 'center', padding: '36px', color: '#687466', gridColumn: '1 / -1' }}>
                    No customer accounts found matching your filter.
                  </div>
                ) : filteredCustomers.map(customer => {
                  const initial = (customer.name || customer.email || 'C')[0].toUpperCase();

                  return (
                    <div key={customer.id} className="admin-customer-card">
                      <div className="admin-customer-card__header">
                        <input
                          type="checkbox"
                          className="admin-customer-select"
                          checked={selectedBroadcastEmails.includes(customer.email)}
                          onChange={() => toggleCustomerSelection(customer.email)}
                          aria-label={`Select ${customer.name || customer.email} for messaging`}
                        />
                        <div className="admin-customer-avatar">{initial}</div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '13.5px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {customer.name || 'Customer'}
                            </strong>
                            <span className={`admin-segment-pill admin-segment-pill--${(customer.segment || 'new').toLowerCase()}`}>
                              {customer.segment === 'VIP' ? '🌟 VIP' : (customer.segment || 'New')}
                            </span>
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#687466', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {customer.email}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        <span style={{ color: '#687466' }}>Segment:</span>
                        <select
                          className="admin-segment-select"
                          value={customer.segmentOverride || ''}
                          onChange={(e) => setCustomerSegmentOverride(customer, e.target.value || null)}
                        >
                          <option value="">Auto ({customer.autoSegment || 'New'})</option>
                          <option value="VIP">VIP</option>
                          <option value="Returning">Returning</option>
                          <option value="New">New</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>

                      <div className="admin-customer-stats-row">
                        <div>
                          <span>Total Spent</span>
                          <strong>{formatPrice(customer.totalSpent || 0)}</strong>
                        </div>
                        <div>
                          <span>Orders</span>
                          <strong>{customer.ordersCount || 0}</strong>
                        </div>
                        <div>
                          <span>Avg Order</span>
                          <strong>{formatPrice(customer.averageOrderValue || 0)}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#687466' }}>
                        <span>Phone: {customer.phone || '—'}</span>
                        <span>Joined: {new Date(customer.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                        <button
                          type="button"
                          className="admin__ghost"
                          style={{ flex: 1, height: '32px', fontSize: '11.5px' }}
                          onClick={() => setSelectedCustomerModal(customer)}
                        >
                          <FiEye size={12} /> View Profile & History
                        </button>
                        <button
                          type="button"
                          className="admin__primary"
                          style={{ height: '32px', padding: '0 12px', fontSize: '11.5px' }}
                          onClick={() => {
                            setActiveTab('broadcast');
                            setBroadcastSubject(`Special Offer for ${customer.name || 'Valued Customer'}`);
                            setSelectedBroadcastEmails([customer.email]);
                          }}
                        >
                          <FiMail size={12} /> Message
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedCustomerModal && (
                <div className="inventory-modal-backdrop" onClick={() => setSelectedCustomerModal(null)}>
                  <div className="inventory-modal" style={{ maxWidth: '780px' }} onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="admin-customer-avatar">
                          {(selectedCustomerModal.name || selectedCustomerModal.email || 'C')[0].toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ margin: 0 }}>{selectedCustomerModal.name || 'Customer Profile'}</h2>
                          <span style={{ fontSize: '11.5px', color: '#687466' }}>{selectedCustomerModal.email} · Phone: {selectedCustomerModal.phone || 'Not provided'}</span>
                        </div>
                      </div>
                      <button className="inventory-modal__close" onClick={() => setSelectedCustomerModal(null)}>✕</button>
                    </div>

                    <div className="inventory-modal__body" style={{ gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: '#FAF9F5', padding: '12px', borderRadius: '10px' }}>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Total Spent</span>
                          <strong style={{ display: 'block', fontSize: '15px', color: '#1C4B12' }}>{formatPrice(selectedCustomerModal.totalSpent || 0)}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Total Orders</span>
                          <strong style={{ display: 'block', fontSize: '15px' }}>{selectedCustomerModal.ordersCount || 0}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Average Order</span>
                          <strong style={{ display: 'block', fontSize: '15px' }}>{formatPrice(selectedCustomerModal.averageOrderValue || 0)}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '10.5px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Segment</span>
                          <div style={{ marginTop: '2px' }}>
                            <span className={`admin-segment-pill admin-segment-pill--${(selectedCustomerModal.segment || 'new').toLowerCase()}`}>
                              {selectedCustomerModal.segment || 'New'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 style={{ fontSize: '13px', color: '#1C4B12', margin: '0 0 8px', fontWeight: 800 }}>
                          Order History ({selectedCustomerModal.orderHistory?.length || 0})
                        </h3>
                        {(!selectedCustomerModal.orderHistory || selectedCustomerModal.orderHistory.length === 0) ? (
                          <p style={{ color: '#687466', fontSize: '12px', padding: '12px 0' }}>No past orders found for this customer.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                            {selectedCustomerModal.orderHistory.map(order => (
                              <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#FFFFFF', border: '1px solid #E1E6DC', borderRadius: '8px', fontSize: '12px' }}>
                                <div>
                                  <strong>Order #{order.id}</strong> <span style={{ color: '#2D5016', fontWeight: 700 }}>BILL-{order.id + 7820}</span>
                                  <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>
                                    {new Date(order.createdAt).toLocaleString('en-IN')} · {order.items?.length || 0} items
                                  </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <strong style={{ fontSize: '13px', display: 'block' }}>{formatPrice(order.total)}</strong>
                                  <span className={`admin-order-status-pill admin-order-status-pill--${order.status.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: '10px', padding: '1px 6px' }}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="inventory-modal__footer">
                      <button className="admin__primary" onClick={() => setSelectedCustomerModal(null)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GROCERY DELIVERY ZONES */}
          {activeTab === 'delivery-zones' && (
            <div className="admin-delivery-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-card admin-card--wide">
                <div className="admin-card__toolbar">
                  <div>
                    <h2 style={{ margin: 0 }}>Delivery Zones & Coverage</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                      Manage serviceable areas, pincodes, delivery fees and assigned drivers.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="admin__ghost"
                      onClick={() => { setEditingZoneModal(null); setShowZonesModal(true); }}
                    >
                      <FiMapPin /> Delivery Zones ({deliveryZones.length})
                    </button>
                    <button
                      type="button"
                      className="admin__primary"
                      onClick={() => {
                        setNewZone({
                          area: '',
                          pincode: '',
                          time: '30 mins',
                          distance: '',
                          deliveryFee: 0,
                          handlingCharge: 5,
                          driverAssigned: ''
                        });
                        setShowAddZoneModal(true);
                      }}
                    >
                      <FiPlus /> Add New Delivery Area
                    </button>
                  </div>
                </div>
              </div>

              {showZonesModal && (
                <div className="inventory-modal-backdrop" onClick={() => { setShowZonesModal(false); setEditingZoneModal(null); }}>
                  <div className="inventory-modal" style={{ maxWidth: '980px' }} onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <h2 style={{ margin: 0 }}>
                        {editingZoneModal ? `Edit ${editingZoneModal.area || 'Delivery Area'}` : `Serviceable Pincodes & Coverage (${deliveryZones.length})`}
                      </h2>
                      <button className="inventory-modal__close" onClick={() => { setShowZonesModal(false); setEditingZoneModal(null); }}>✕</button>
                    </div>

                    <div className="inventory-modal__body" style={{ gap: '14px' }}>
                      {editingZoneModal ? (
                        <>
                          <div className="admin-form__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Area / Locality Name *</label>
                              <input
                                className="admin-input-box"
                                placeholder="e.g. Kukatpally, Madhapur"
                                value={editingZoneModal.area}
                                onChange={e => setEditingZoneModal(p => ({ ...p, area: e.target.value }))}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Pincode *</label>
                              <input
                                className="admin-input-box"
                                placeholder="e.g. 500072"
                                value={editingZoneModal.pincode}
                                onChange={e => setEditingZoneModal(p => ({ ...p, pincode: e.target.value }))}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Delivery Time Estimate</label>
                              <input
                                className="admin-input-box"
                                placeholder="e.g. 30 mins"
                                value={editingZoneModal.time}
                                onChange={e => setEditingZoneModal(p => ({ ...p, time: e.target.value }))}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Delivery Fee (₹)</label>
                              <input
                                className="admin-input-box"
                                type="number"
                                placeholder="e.g. 25"
                                value={editingZoneModal.deliveryFee}
                                onChange={e => setEditingZoneModal(p => ({ ...p, deliveryFee: Number(e.target.value) || 0 }))}
                              />
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Assigned Driver / Partner</label>
                              <input
                                className="admin-input-box"
                                placeholder="e.g. Ramesh Kumar"
                                value={editingZoneModal.driverAssigned || ''}
                                onChange={e => setEditingZoneModal(p => ({ ...p, driverAssigned: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              className="admin__primary"
                              onClick={async () => {
                                try {
                                  const updated = await adminApi.updateDeliveryZone(editingZoneModal.id, editingZoneModal);
                                  setDeliveryZones(prev => prev.map(z => z.id === updated.id ? updated : z));
                                  setEditingZoneModal(null);
                                  setSaveToast({ type: 'success', msg: `Zone ${updated.area} updated successfully` });
                                  setTimeout(() => setSaveToast(null), 3000);
                                } catch (err) { alert(err.message); }
                              }}
                            >
                              <FiSave /> Save Changes
                            </button>
                            <button type="button" className="admin__ghost" onClick={() => setEditingZoneModal(null)}>
                              ← Back to List
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="admin-search-label" style={{ width: '260px' }}>
                            <FiSearch />
                            <input
                              placeholder="Search area or pincode..."
                              value={deliveryZoneSearch}
                              onChange={(e) => setDeliveryZoneSearch(e.target.value)}
                            />
                          </div>

                          <div style={{ overflowX: 'auto' }}>
                            <table className="inventory-table" style={{ minWidth: 0, width: '100%' }}>
                              <thead>
                                <tr>
                                  <th>AREA / LOCALITY</th>
                                  <th>PINCODE</th>
                                  <th>DELIVERY TIME</th>
                                  <th>FEE (₹)</th>
                                  <th>DRIVER ASSIGNED</th>
                                  <th>STATUS</th>
                                  <th style={{ textAlign: 'center' }}>ACTIONS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {deliveryZones
                                  .filter(z => (z.area || '').toLowerCase().includes(deliveryZoneSearch.toLowerCase()) || (z.pincode || '').includes(deliveryZoneSearch))
                                  .map(zone => (
                                    <tr key={zone.id}>
                                      <td><strong>{zone.area}</strong></td>
                                      <td><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{zone.pincode}</span></td>
                                      <td>{zone.time}</td>
                                      <td>₹{zone.deliveryFee}</td>
                                      <td>{zone.driverAssigned || <span style={{ color: '#9CA3AF' }}>Unassigned</span>}</td>
                                      <td>
                                        <button
                                          type="button"
                                          style={{
                                            background: zone.active !== false ? '#DCFCE7' : '#F3F4F6',
                                            color: zone.active !== false ? '#166534' : '#6B7280',
                                            border: 'none',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '11px',
                                            fontWeight: 800,
                                            cursor: 'pointer'
                                          }}
                                          onClick={async () => {
                                            const nextActive = zone.active === false ? true : false;
                                            try {
                                              const updated = await adminApi.updateDeliveryZone(zone.id, { active: nextActive });
                                              setDeliveryZones(prev => prev.map(z => z.id === updated.id ? updated : z));
                                            } catch (err) { alert(err.message); }
                                          }}
                                        >
                                          {zone.active !== false ? '🟢 Active' : '⚪ Inactive'}
                                        </button>
                                      </td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                          <button
                                            className="admin__ghost"
                                            style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={() => setEditingZoneModal(zone)}
                                          >
                                            <FiEdit2 size={12} />
                                          </button>
                                          <button
                                            className="admin-danger"
                                            style={{ width: '30px', height: '30px', padding: 0, borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                            onClick={async () => {
                                              if (window.confirm(`Delete ${zone.area} pincode zone?`)) {
                                                try {
                                                  await adminApi.deleteDeliveryZone(zone.id);
                                                  setDeliveryZones(prev => prev.filter(z => z.id !== zone.id));
                                                } catch (err) { alert(err.message); }
                                              }
                                            }}
                                          >
                                            <FiTrash2 size={12} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="inventory-modal__footer">
                      <button className="admin__primary" onClick={() => { setShowZonesModal(false); setEditingZoneModal(null); }}>Close</button>
                    </div>
                  </div>
                </div>
              )}

              {showAddZoneModal && (
                <div className="inventory-modal-backdrop" onClick={() => setShowAddZoneModal(false)}>
                  <div className="inventory-modal" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <h2 style={{ margin: 0 }}>Add New Delivery Area</h2>
                      <button className="inventory-modal__close" onClick={() => setShowAddZoneModal(false)}>✕</button>
                    </div>

                    <div className="inventory-modal__body">
                      <div className="admin-form__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Area / Locality Name *</label>
                          <input
                            className="admin-input-box"
                            placeholder="e.g. Kukatpally, Madhapur"
                            value={newZone.area}
                            onChange={e => setNewZone(p => ({ ...p, area: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Pincode *</label>
                          <input
                            className="admin-input-box"
                            placeholder="e.g. 500072"
                            value={newZone.pincode}
                            onChange={e => setNewZone(p => ({ ...p, pincode: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Delivery Time Estimate</label>
                          <input
                            className="admin-input-box"
                            placeholder="e.g. 30 mins"
                            value={newZone.time}
                            onChange={e => setNewZone(p => ({ ...p, time: e.target.value }))}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Delivery Fee (₹)</label>
                          <input
                            className="admin-input-box"
                            type="number"
                            placeholder="e.g. 25"
                            value={newZone.deliveryFee}
                            onChange={e => setNewZone(p => ({ ...p, deliveryFee: Number(e.target.value) || 0 }))}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Assigned Driver / Partner</label>
                          <input
                            className="admin-input-box"
                            placeholder="e.g. Ramesh Kumar"
                            value={newZone.driverAssigned}
                            onChange={e => setNewZone(p => ({ ...p, driverAssigned: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="inventory-modal__footer">
                      <button type="button" className="admin__ghost" onClick={() => setShowAddZoneModal(false)}>Cancel</button>
                      <button
                        type="button"
                        className="admin__primary"
                        onClick={async () => {
                          if (!newZone.area.trim() || !newZone.pincode.trim()) return;
                          try {
                            const saved = await adminApi.saveDeliveryZone({
                              ...newZone,
                              area: newZone.area.trim(),
                              pincode: newZone.pincode.trim()
                            });
                            setDeliveryZones(prev => [...prev, saved]);
                            setNewZone({
                              area: '',
                              pincode: '',
                              time: '30 mins',
                              distance: '',
                              deliveryFee: 0,
                              handlingCharge: 5,
                              driverAssigned: ''
                            });
                            setShowAddZoneModal(false);
                            setSaveToast({ type: 'success', msg: `Zone ${saved.area} created` });
                            setTimeout(() => setSaveToast(null), 3000);
                          } catch (err) { alert(err.message); }
                        }}
                      >
                        <FiPlus /> Add Delivery Zone
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GROCERY INVENTORY HUB */}
          {activeTab === 'inventory' && (
            <div className="admin-inventory-page">
              <div className="inventory-alerts-container">
                {invSummary.outOfStockCount > 0 && (
                  <div className="inventory-alert-banner inventory-alert-banner--danger">
                    <div className="inventory-alert-banner__content">
                      <FiAlertCircle size={20} />
                      <span><strong>Out of Stock Alert:</strong> {invSummary.outOfStockCount} grocery product(s) have 0 available units.</span>
                    </div>
                    <button className="inventory-alert-banner__btn" onClick={() => setInventoryFilter('out-of-stock')}>View Out of Stock</button>
                  </div>
                )}
                {invSummary.lowStockCount > 0 && (
                  <div className="inventory-alert-banner inventory-alert-banner--warning">
                    <div className="inventory-alert-banner__content">
                      <FiAlertTriangle size={20} />
                      <span><strong>Low Stock Alert:</strong> {invSummary.lowStockCount} product(s) are low in stock.</span>
                    </div>
                    <button className="inventory-alert-banner__btn" onClick={() => setInventoryFilter('low-stock')}>View Low Stock</button>
                  </div>
                )}
              </div>

              <section className="inventory-kpi-grid">
                <div className="inventory-kpi-card">
                  <div className="inventory-kpi-card__header">
                    <span className="inventory-kpi-card__label">Total Inventory Valuation</span>
                    <FiDollarSign className="inventory-kpi-card__icon" />
                  </div>
                  <strong>{formatPrice(invSummary.totalValuation)}</strong>
                  <small>Retail Value: {formatPrice(invSummary.totalRetailValuation)}</small>
                </div>

                <div className="inventory-kpi-card">
                  <div className="inventory-kpi-card__header">
                    <span className="inventory-kpi-card__label">Total Stock Units</span>
                    <FiPackage className="inventory-kpi-card__icon" />
                  </div>
                  <strong>{invSummary.totalAvailableUnits.toLocaleString('en-IN')}</strong>
                  <small>Available for customer orders</small>
                </div>

                <div className={`inventory-kpi-card ${invSummary.lowStockCount > 0 ? 'inventory-kpi-card--warning' : ''}`}>
                  <div className="inventory-kpi-card__header">
                    <span className="inventory-kpi-card__label">Low Stock Alerts</span>
                    <FiAlertTriangle className="inventory-kpi-card__icon" style={{ color: invSummary.lowStockCount > 0 ? '#F59E0B' : undefined }} />
                  </div>
                  <strong style={{ color: invSummary.lowStockCount > 0 ? '#B45309' : undefined }}>{invSummary.lowStockCount}</strong>
                  <small>Low stock count</small>
                </div>

                <div className={`inventory-kpi-card ${invSummary.outOfStockCount > 0 ? 'inventory-kpi-card--danger' : ''}`}>
                  <div className="inventory-kpi-card__header">
                    <span className="inventory-kpi-card__label">Out of Stock</span>
                    <FiAlertCircle className="inventory-kpi-card__icon" style={{ color: invSummary.outOfStockCount > 0 ? '#EF4444' : undefined }} />
                  </div>
                  <strong style={{ color: invSummary.outOfStockCount > 0 ? '#B91C1C' : undefined }}>{invSummary.outOfStockCount}</strong>
                  <small>0 available units</small>
                </div>
              </section>

              <div className="admin-card admin-card--wide" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="inventory-filters-tabs">
                    <button
                      className={`inventory-filter-btn ${inventoryFilter === 'all' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setInventoryFilter('all')}
                    >
                      All Items <span className="inventory-badge-count">{inventoryData?.items?.length || 0}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${inventoryFilter === 'low-stock' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setInventoryFilter('low-stock')}
                    >
                      ⚠️ Low Stock <span className="inventory-badge-count">{invSummary.lowStockCount}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${inventoryFilter === 'out-of-stock' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setInventoryFilter('out-of-stock')}
                    >
                      ❌ Out of Stock <span className="inventory-badge-count">{invSummary.outOfStockCount}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${inventoryFilter === 'logs' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setInventoryFilter('logs')}
                    >
                      📋 Movement & Adjustments Log
                    </button>
                  </div>

                  {inventoryFilter !== 'logs' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px', maxWidth: '600px' }}>
                        <div className="admin-search-label" style={{ flex: 1 }}>
                          <FiSearch />
                          <input
                            placeholder="Search item name, brand, or batch..."
                            value={inventorySearch}
                            onChange={(e) => setInventorySearch(e.target.value)}
                            style={{ width: '100%' }}
                          />
                        </div>
                        <select
                          className="admin-input-box"
                          style={{ width: '160px', height: '38px', borderRadius: '10px' }}
                          value={inventoryCategory}
                          onChange={(e) => setInventoryCategory(e.target.value)}
                        >
                          <option value="all">All Categories</option>
                          {(dbCategories.length ? dbCategories : categories).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="admin__ghost" onClick={loadInventory} style={{ height: '38px', padding: '0 12px', fontSize: '12px' }}>
                          <FiRefreshCw size={13} /> Refresh
                        </button>
                        <button className="admin__ghost" onClick={exportInventoryCsv} style={{ height: '38px', padding: '0 14px', fontSize: '12px' }}>
                          📥 Export CSV
                        </button>
                        <button
                          className="admin__ghost"
                          style={{ height: '38px', padding: '0 14px', fontSize: '12px' }}
                          onClick={() => {
                            setProductDraft(blankProduct);
                            setProductModalMode('retail');
                            setDetailedVariants([]);
                            setShowProductModal(true);
                          }}
                        >
                          <FiPlus size={13} /> Add Retail Item
                        </button>
                        <button
                          className="admin__primary"
                          style={{ height: '38px', padding: '0 14px', fontSize: '12px' }}
                          onClick={() => {
                            setProductDraft(blankWholesaleProduct);
                            setProductModalMode('wholesale');
                            setDetailedVariants([]);
                            setShowProductModal(true);
                          }}
                        >
                          <FiPlus size={13} /> Add Wholesale Item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {inventoryFilter !== 'logs' ? (
                <div className="inventory-table-wrap">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>ITEM / BATCH DETAILS</th>
                        <th>CATEGORY</th>
                        <th>AVAILABLE</th>
                        <th>DAMAGED / RETURNED</th>
                        <th>INCOMING</th>
                        <th>UNIT COST / VALUE</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryLoading ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#687466' }}>
                            Loading live inventory tracking...
                          </td>
                        </tr>
                      ) : filteredInventoryItems.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#687466' }}>
                            No inventory items matching your filter/search.
                          </td>
                        </tr>
                      ) : filteredInventoryItems.map(item => (
                        <tr key={item.productId}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={toWebpImage(item.image)} alt={item.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: '#F7F4EE' }} />
                              <div>
                                <strong style={{ fontSize: '13px', color: '#111827' }}>{item.name}</strong>
                                <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>
                                  {item.brand ? `${item.brand} · ` : ''}{item.weight}{item.unit}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'capitalize', color: '#2D5016' }}>
                              {item.category}
                            </span>
                          </td>

                          <td>
                            <span className={`inventory-pill ${item.isOutOfStock ? 'inventory-pill--out' : (item.isLowStock ? 'inventory-pill--low' : 'inventory-pill--available')}`}>
                              {item.availableStock} units
                            </span>
                          </td>

                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                              {item.damagedStock > 0 && <span style={{ color: '#9D174D' }}>Damaged: {item.damagedStock}</span>}
                              {item.returnedStock > 0 && <span style={{ color: '#6B21A8' }}>Returned: {item.returnedStock}</span>}
                              {item.damagedStock === 0 && item.returnedStock === 0 && <span style={{ color: '#9CA3AF' }}>0</span>}
                            </div>
                          </td>

                          <td>{item.incomingStock > 0 ? `+${item.incomingStock}` : 0}</td>

                          <td>
                            <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>Cost: {formatPrice(item.costPrice)}</span>
                            <span style={{ fontSize: '11px', color: '#2D5016', display: 'block' }}>Sell: {formatPrice(item.price)}</span>
                          </td>

                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button
                                className="admin__primary"
                                style={{ height: '32px', padding: '0 12px', fontSize: '11px', borderRadius: '6px' }}
                                onClick={() => {
                                  setAdjustModalItem(item);
                                  setAdjustForm({
                                    changeType: 'ADD',
                                    quantity: '',
                                    targetField: 'availableStock',
                                    reason: 'Purchase / New Stock Received',
                                    notes: ''
                                  });
                                }}
                              >
                                Update Stock
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-card admin-card--wide">
                  <div className="admin-card__toolbar">
                    <h2>Stock Movement & Adjustment History</h2>
                    <button className="admin__ghost" onClick={loadInventoryLogs}>
                      <FiRefreshCw size={13} /> Refresh Logs
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="inventory-table">
                      <thead>
                        <tr>
                          <th>DATE & TIME</th>
                          <th>PRODUCT</th>
                          <th>ACTION</th>
                          <th>BEFORE ➔ AFTER</th>
                          <th>REASON</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryLogs.map(log => (
                          <tr key={log.id}>
                            <td style={{ fontSize: '11.5px', color: '#687466' }}>{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                            <td><strong>{log.productName}</strong></td>
                            <td>{log.changeType}</td>
                            <td>{log.stockBefore} ➔ {log.stockAfter}</td>
                            <td>{log.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MODALS FOR INVENTORY */}
              {adjustModalItem && (() => {
                const currentStock = adjustModalItem.availableStock ?? 0;
                const qty = parseInt(adjustForm.quantity, 10) || 0;
                const previewStock = adjustForm.changeType === 'ADD'
                  ? currentStock + qty
                  : adjustForm.changeType === 'SET'
                  ? qty
                  : currentStock;
                const actionDescriptions = {
                  ADD: 'Increases the available stock count. Use this when new goods arrive.',
                  SET: 'Directly sets the stock to the exact number you enter. Use this after a physical count.',
                  DAMAGE: 'Moves items out of available stock and records them as damaged.',
                  EXPIRED: 'Moves items out of available stock and records them as expired.',
                };
                return (
                  <div className="inventory-modal-backdrop" onClick={() => setAdjustModalItem(null)}>
                    <div className="inventory-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px', width: '100%' }}>
                      <div className="inventory-modal__header">
                        <div>
                          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1C4B12' }}>Update Stock</h2>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>{adjustModalItem.name}</p>
                        </div>
                        <button className="inventory-modal__close" onClick={() => setAdjustModalItem(null)}>✕</button>
                      </div>

                      {/* Current Stock Banner */}
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '10px 14px', margin: '14px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Current Available Stock</span>
                        <strong style={{ fontSize: '18px', color: '#166534' }}>{currentStock} units</strong>
                      </div>

                      <form onSubmit={handleStockAdjustment}>
                        <div className="inventory-modal__body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                          {/* Action Type */}
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                              What do you want to do?
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              {[
                                { value: 'ADD', label: '+ Add Stock', emoji: '📦', desc: 'New goods arrived' },
                                { value: 'SET', label: '= Set Count', emoji: '📝', desc: 'After physical count' },
                                { value: 'DAMAGE', label: '⚠ Damaged', emoji: '⚠️', desc: 'Goods are damaged' },
                                { value: 'EXPIRED', label: '⛔ Expired', emoji: '🗑️', desc: 'Goods have expired' },
                              ].map(opt => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setAdjustForm(prev => ({
                                    ...prev,
                                    changeType: opt.value,
                                    targetField: opt.value === 'DAMAGE' ? 'damagedStock' : opt.value === 'EXPIRED' ? 'expiredStock' : 'availableStock',
                                    reason: opt.value === 'ADD' ? 'Purchase / New Stock Received' : opt.value === 'DAMAGE' ? 'Damaged in transit' : opt.value === 'EXPIRED' ? 'Expired goods' : 'Stock count correction',
                                  }))}
                                  style={{
                                    padding: '10px 8px',
                                    borderRadius: '8px',
                                    border: adjustForm.changeType === opt.value ? '2px solid #2D5016' : '1px solid #E1E6DC',
                                    background: adjustForm.changeType === opt.value ? '#F0FDF4' : '#FAFAF8',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'all 0.15s'
                                  }}
                                >
                                  <div style={{ fontSize: '13px', fontWeight: 700, color: adjustForm.changeType === opt.value ? '#1C4B12' : '#374151' }}>{opt.label}</div>
                                  <div style={{ fontSize: '11px', color: '#687466', marginTop: '2px' }}>{opt.desc}</div>
                                </button>
                              ))}
                            </div>
                            <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#687466', fontStyle: 'italic' }}>
                              {actionDescriptions[adjustForm.changeType]}
                            </p>
                          </div>

                          {/* Quantity with live preview */}
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                              Quantity (number of units)
                            </label>
                            <input
                              type="number"
                              className="admin-input-box"
                              min="1"
                              placeholder="e.g. 50"
                              value={adjustForm.quantity}
                              onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
                              required
                              style={{ fontSize: '15px', fontWeight: 600 }}
                            />
                            {adjustForm.quantity && (adjustForm.changeType === 'ADD' || adjustForm.changeType === 'SET') && (
                              <div style={{ marginTop: '6px', padding: '6px 10px', background: '#EFF6FF', borderRadius: '6px', fontSize: '11.5px', color: '#1E40AF', fontWeight: 600 }}>
                                {adjustForm.changeType === 'ADD'
                                  ? `After adding: ${currentStock} + ${qty} = ${previewStock} units`
                                  : `Stock will be set to exactly: ${qty} units`}
                              </div>
                            )}
                          </div>

                          {/* Reason */}
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: '#374151' }}>
                              Reason <span style={{ fontWeight: 400, color: '#687466' }}>(for your records)</span>
                            </label>
                            <input
                              type="text"
                              className="admin-input-box"
                              placeholder="e.g. Received from supplier"
                              value={adjustForm.reason}
                              onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div className="inventory-modal__footer">
                          <button type="button" className="admin__ghost" onClick={() => setAdjustModalItem(null)}>Cancel</button>
                          <button
                            type="submit"
                            className="admin__primary"
                            disabled={adjustLoading || !adjustForm.quantity}
                            style={{ minWidth: '120px' }}
                          >
                            {adjustLoading ? 'Saving...' : '✓ Confirm Update'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                );
              })()}

              {historyModalItem && (
                <div className="inventory-modal-backdrop" onClick={() => setHistoryModalItem(null)}>
                  <div className="inventory-modal" onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <h2>Movement History — {historyModalItem.name}</h2>
                      <button className="inventory-modal__close" onClick={() => setHistoryModalItem(null)}>✕</button>
                    </div>
                    <div className="inventory-modal__body">
                      {historyLogs.map(log => (
                        <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '12px' }}>
                          <div>
                            <strong>{log.reason} ({log.changeType})</strong>
                            <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong>{log.quantity > 0 ? `+${log.quantity}` : log.quantity}</strong>
                            <span style={{ fontSize: '11px', color: '#2D5016', display: 'block' }}>{log.stockBefore} ➔ {log.stockAfter}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="inventory-modal__footer">
                      <button className="admin__primary" onClick={() => setHistoryModalItem(null)}>Close</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GROCERY PRODUCTS (RETAIL / WHOLESALE) */}
          {(activeTab === 'retail-products' || activeTab === 'wholesale-products') && (
            <div className="admin-products-page" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-card admin-card--wide">
                <div className="admin-card__toolbar">
                  <div>
                    <h2 style={{ margin: 0 }}>{activeTab === 'wholesale-products' ? 'Wholesale Items' : 'Retail Items'} ({filteredProducts.length})</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                      Manage {activeTab === 'wholesale-products' ? 'wholesale bulk' : 'retail'} grocery products and categories.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="admin__ghost" onClick={() => setShowCategoryModal(true)}>
                      <FiLayers /> Add New Category
                    </button>
                    <button
                      type="button"
                      className="admin__primary"
                      onClick={() => {
                        const wholesale = activeTab === 'wholesale-products';
                        setProductDraft(wholesale ? blankWholesaleProduct : blankProduct);
                        setProductModalMode(wholesale ? 'wholesale' : 'retail');
                        setDetailedVariants([]);
                        setShowProductModal(true);
                      }}
                    >
                      <FiPlus /> Add New Item
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '12px' }}>
                  <div className="admin-search-label" style={{ flex: 1, minWidth: '220px', maxWidth: '420px' }}>
                    <FiSearch />
                    <input
                      placeholder="Search by name, brand, SKU, barcode..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                  <select
                    className="admin-input-box"
                    style={{ width: 'auto', minWidth: '160px' }}
                    value={productCategoryFilter}
                    onChange={(e) => setProductCategoryFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {(dbCategories.length ? dbCategories : categories).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    className="admin-input-box"
                    style={{ width: 'auto', minWidth: '140px' }}
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Listing */}
              <div className="admin-card admin-card--wide">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredProducts.map(product => (
                    <div key={product.id} className="admin-product-card-enhanced">
                      <div className="admin-product-top-row">
                        <div className="admin-product-info">
                          <img src={toWebpImage(product.image)} alt={product.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          <div style={{ minWidth: 0 }}>
                            <strong className="admin-product-info__name">{product.name}</strong>
                            <span className="admin-product-info__meta">{product.brand} · {product.category} · {product.weight}{product.unit}</span>
                          </div>
                        </div>
                        <div className="admin-product-price">
                          <strong style={{ fontSize: '15px' }}>{formatPrice(product.price)}</strong>
                        </div>
                        <div className="admin-product-actions">
                          <button className="admin__ghost" style={{ padding: '6px 10px', fontSize: '11.5px' }} onClick={() => editProduct(product)}>
                            <FiEdit2 size={12} /> Edit
                          </button>
                          <button className="admin-danger" style={{ padding: '6px 10px', fontSize: '11.5px' }} onClick={() => removeProduct(product.id)}>
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {showCategoryModal && (
                <div className="inventory-modal-backdrop" onClick={() => setShowCategoryModal(false)}>
                  <div className="inventory-modal" style={{ maxWidth: '620px' }} onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <h2 style={{ margin: 0 }}>Add New Category</h2>
                      <button className="inventory-modal__close" onClick={() => setShowCategoryModal(false)}>✕</button>
                    </div>

                    <div className="inventory-modal__body">
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Category Name *</label>
                        <input
                          className="admin-input-box"
                          placeholder="e.g. Snacks & Namkeen"
                          value={categoryDraft.name}
                          onChange={(e) => setCategoryDraft(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '3px' }}>Category Image URL</label>
                        <input
                          className="admin-input-box"
                          placeholder="https://images.unsplash.com/..."
                          value={categoryDraft.image}
                          onChange={(e) => setCategoryDraft(prev => ({ ...prev, image: e.target.value }))}
                        />
                        <label className="admin-file-input" style={{ marginTop: '6px' }}>
                          <span>Or choose image from device</span>
                          <input type="file" accept="image/*" onChange={handleCategoryImageUpload} />
                        </label>
                        {categoryDraft.image && (
                          <img src={toWebpImage(categoryDraft.image)} alt="Category preview" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', marginTop: '8px' }} />
                        )}
                      </div>

                      <div style={{ marginTop: '18px', borderTop: '1px solid #E1E6DC', paddingTop: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#687466', textTransform: 'uppercase' }}>
                          Existing Categories ({(dbCategories.length ? dbCategories : categories).length})
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                          {(dbCategories.length ? dbCategories : categories).map(cat => (
                            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#FAF9F5', borderRadius: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {cat.image && <img src={toWebpImage(cat.image)} alt={cat.name} style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />}
                                <span style={{ fontSize: '12.5px', fontWeight: 700 }}>{cat.name}</span>
                              </div>
                              <button className="admin-danger" style={{ padding: '4px 8px' }} onClick={() => deleteCategoryHandler(cat)}>
                                <FiTrash2 size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="inventory-modal__footer">
                      <button type="button" className="admin__ghost" onClick={() => setShowCategoryModal(false)}>Close</button>
                      <button type="button" className="admin__primary" disabled={categoryLoading || imageUploading} onClick={saveCategory}>
                        {categoryLoading ? 'Saving...' : <><FiPlus /> Add Category</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add/Edit product modal — lives outside the tab check above so it can
              also be opened from the Inventory Hub's "Add New Item" button
              without switching tabs. */}
          {showProductModal && (
            <div className="inventory-modal-backdrop" onClick={() => setShowProductModal(false)}>
              <div className="inventory-modal" style={{ maxWidth: '860px' }} onClick={e => e.stopPropagation()}>
                <div className="inventory-modal__header">
                  <div>
                    <h2 style={{ margin: 0 }}>{productDraft.id ? 'Edit Grocery Item' : `Add New ${productModalMode === 'wholesale' ? 'Wholesale' : 'Retail'} Item`}</h2>
                    {productDraft.id && (
                      <span style={{ fontSize: '11px', color: '#687466' }}>Editing ID #{productDraft.id}</span>
                    )}
                  </div>
                  <button className="inventory-modal__close" onClick={() => setShowProductModal(false)}>✕</button>
                </div>

                <form onSubmit={saveProduct}>
                  <div className="inventory-modal__body">
                    <div className="admin-form-section">
                      <h3 className="admin-form-section__title"><FiPackage /> 1. General Product Information</h3>
                      <div className="admin-form__grid">
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Product Name *</label>
                          <input className="admin-input-box" value={productDraft.name} onChange={(e) => setProductDraft(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Dawat Lovely Gold Biryani Rice" required />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Category *</label>
                          <select className="admin-input-box" value={productDraft.category} onChange={(e) => setProductDraft(prev => ({ ...prev, category: e.target.value }))}>
                            {(dbCategories.length ? dbCategories : categories).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Brand</label>
                          <input className="admin-input-box" value={productDraft.brand || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, brand: e.target.value }))} placeholder="e.g. Daawat, Fortune, Siri Select" required />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Pack Size / Weight</label>
                          <input className="admin-input-box" value={productDraft.weight || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, weight: e.target.value }))} placeholder="e.g. 500, 1, 5" />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Unit</label>
                          <select className="admin-input-box" value={productDraft.unit || 'g'} onChange={(e) => setProductDraft(prev => ({ ...prev, unit: e.target.value }))}>
                            <option value="g">Grams (g)</option>
                            <option value="kg">Kilograms (kg)</option>
                            <option value="ml">Millilitres (ml)</option>
                            <option value="L">Litres (L)</option>
                            <option value="pcs">Pieces (pcs)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Product Image URL</label>
                        <input className="admin-input-box" value={productDraft.image || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, image: e.target.value }))} placeholder="https://images.unsplash.com/..." />
                        <label className="admin-file-input" style={{ marginTop: '6px' }}>
                          <span>Or choose image from device</span>
                          <input type="file" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Description</label>
                        <textarea
                          className="admin-input-box"
                          style={{ height: 'auto' }}
                          rows={3}
                          value={productDraft.description || ''}
                          onChange={(e) => setProductDraft(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Shown on the product page — e.g. Urad Dal (Split Black Gram). Essential for dal makhani and idli batter."
                        />
                      </div>
                    </div>

                    <div className="admin-form-section">
                      <h3 className="admin-form-section__title"><FiDollarSign /> 2. Pricing & Cost</h3>
                      <div className="admin-form__grid">
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Selling Price (₹) *</label>
                          <input className="admin-input-box" value={productDraft.price} onChange={(e) => setProductDraft(prev => ({ ...prev, price: e.target.value }))} placeholder="420" type="number" required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>MRP (₹)</label>
                          <input className="admin-input-box" value={productDraft.mrp} onChange={(e) => setProductDraft(prev => ({ ...prev, mrp: e.target.value }))} placeholder="490" type="number" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, marginBottom: '4px' }}>Cost Price (₹)</label>
                          <input className="admin-input-box" value={productDraft.costPrice} onChange={(e) => setProductDraft(prev => ({ ...prev, costPrice: e.target.value }))} placeholder="330" type="number" />
                        </div>
                      </div>
                    </div>

                    {productModalMode === 'wholesale' && (
                      <div className="admin-form-section">
                        <h3 className="admin-form-section__title"><FiLayers /> 3. Wholesale Price Ranges</h3>
                        <p style={{ fontSize: '11.5px', color: '#687466', margin: '0 0 10px' }}>
                          Define the bulk price tiers shown to wholesale customers (e.g. 1 kg, 5 kg bulk, 10 kg bulk). Leave empty to auto-calculate from the selling price above.
                        </p>

                        {detailedVariants.map((v, idx) => (
                          <div key={v.id || idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                            <input
                              className="admin-input-box"
                              style={{ flex: 2 }}
                              placeholder="e.g. 5 kg bulk"
                              value={v.label}
                              onChange={(e) => updateVariantRow(idx, 'label', e.target.value)}
                            />
                            <input
                              className="admin-input-box"
                              style={{ flex: 1 }}
                              type="number"
                              placeholder="Price ₹"
                              value={v.price}
                              onChange={(e) => updateVariantRow(idx, 'price', e.target.value)}
                            />
                            <button type="button" className="admin-danger" style={{ padding: '8px', flexShrink: 0 }} onClick={() => removeVariantRow(idx)}>
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        ))}

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                          <button type="button" className="admin__ghost" onClick={() => addVariantRow(`${productDraft.weight || '1'} ${productDraft.unit || 'kg'}`, productDraft.price)}>
                            <FiPlus /> Base ({productDraft.weight || '1'}{productDraft.unit || 'kg'})
                          </button>
                          <button type="button" className="admin__ghost" onClick={() => addVariantRow(`5 ${productDraft.unit || 'kg'} bulk`, '')}>
                            <FiPlus /> 5{productDraft.unit || 'kg'} Bulk
                          </button>
                          <button type="button" className="admin__ghost" onClick={() => addVariantRow(`10 ${productDraft.unit || 'kg'} bulk`, '')}>
                            <FiPlus /> 10{productDraft.unit || 'kg'} Bulk
                          </button>
                          <button type="button" className="admin__primary" onClick={() => addVariantRow('', '')}>
                            <FiPlus /> Custom Price Range
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="inventory-modal__footer">
                    <button type="button" className="admin__ghost" onClick={() => setShowProductModal(false)}>Cancel</button>
                    <button type="submit" className="admin__primary" disabled={apiLoading || imageUploading}>
                      {imageUploading ? 'Uploading image...' : apiLoading ? 'Saving...' : <><FiSave /> Save Item</>}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* BESTSELLERS & TODAY'S DEALS */}
          {activeTab === 'bestsellers' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Bestsellers & Today's Deals</h2>
                <div className="admin-search-label" style={{ width: '260px' }}>
                  <FiSearch />
                  <input
                    placeholder="Search products..."
                    value={promoTagSearch}
                    onChange={(e) => setPromoTagSearch(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allProducts
                  .filter(product => {
                    const q = promoTagSearch.trim().toLowerCase();
                    if (!q) return true;
                    return product.name.toLowerCase().includes(q) || (product.brand || '').toLowerCase().includes(q);
                  })
                  .map(product => (
                    <div key={product.id} className="admin-row admin-row--plain" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                      <img src={toWebpImage(product.image)} alt={product.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <strong>{product.name}</strong>
                        <span style={{ fontSize: 12, color: '#687466' }}>{product.brand} / {product.weight}{product.unit} / {formatPrice(product.price)}</span>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: product.isBestseller ? '#2D5016' : '#687466', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(product.isBestseller)}
                          onChange={() => toggleProductFlag(product.id, 'isBestseller', product.isBestseller, Boolean(product.wholesalePrice))}
                        />
                        Bestseller
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: product.isTodaysDeal ? '#2D5016' : '#687466', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(product.isTodaysDeal)}
                          onChange={() => toggleProductFlag(product.id, 'isTodaysDeal', product.isTodaysDeal, Boolean(product.wholesalePrice))}
                        />
                        Today's Deal
                      </label>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* BROADCAST */}
          {activeTab === 'broadcast' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="admin-card admin-card--wide">
              <div className="admin-card__toolbar" style={{ borderBottom: '1px solid #E1E6DC', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiMail size={24} style={{ color: '#2D5016' }} />
                  <div>
                    <h2 style={{ margin: 0 }}>Mail Broadcast Campaign</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                      Send promotions, festive offers, or updates to registered customers.
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
                  color: broadcastStatus.type === 'success' ? '#065F46' : '#991B1B'
                }}>
                  {broadcastStatus.msg}
                </div>
              )}

              {selectedBroadcastEmails.length > 0 && (
                <p style={{ fontSize: '11.5px', color: '#687466', margin: '0 0 12px' }}>
                  Sending to: <strong>{selectedBroadcastEmails.length === 1 ? selectedBroadcastEmails[0] : `${selectedBroadcastEmails.length} customers`}</strong>
                </p>
              )}

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!broadcastSubject.trim() || !broadcastMessage.trim()) {
                  setBroadcastStatus({ type: 'error', msg: 'Please fill in both the subject and message body before sending.' });
                  return;
                }
                if (selectedBroadcastEmails.length === 0) {
                  setBroadcastStatus({ type: 'error', msg: 'No recipients selected — nothing to send.' });
                  return;
                }
                setBroadcastSending(true);
                setBroadcastStatus(null);
                try {
                  const res = await adminApi.sendBroadcast({
                    subject: broadcastSubject,
                    messageText: broadcastMessage,
                    recipients: selectedBroadcastEmails
                  });
                  setBroadcastStatus({ type: 'success', msg: `Campaign sent successfully to ${res.count} customer(s). Ask them to check their spam/promotions folder if it doesn't show up in the inbox.` });
                  setBroadcastSubject('');
                  setBroadcastMessage('');
                } catch (err) {
                  setBroadcastStatus({ type: 'error', msg: err.message || 'Failed to send mail broadcast.' });
                } finally {
                  setBroadcastSending(false);
                }
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Email Subject</label>
                  <input
                    type="text"
                    required
                    className="admin-input-box"
                    placeholder="e.g. Special Offer: 10% Off on All Grocery Items!"
                    value={broadcastSubject}
                    onChange={(e) => setBroadcastSubject(e.target.value)}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Message Body</label>
                  <textarea
                    required
                    rows={6}
                    className="admin-input-box"
                    style={{ height: 'auto', padding: '10px 12px' }}
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={broadcastSending} className="admin__primary" style={{ width: '100%' }}>
                  {broadcastSending ? 'Sending Campaign...' : '🚀 Send Broadcast Email'}
                </button>
              </form>
              </div>
            </div>
          )}

          {/* ADMIN ACCOUNTS */}
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
                <h2>Admin accounts ({adminAccounts.length})</h2>
                {adminAccounts.map(account => {
                  const isSelf = account.email === adminSession?.email;
                  return (
                    <div key={account.id} className="admin-row admin-row--plain">
                      <FiLock />
                      <span>{account.name}<small>{account.email}</small></span>
                      <select
                        className="admin-segment-select"
                        value={account.role}
                        disabled={isSelf}
                        title={isSelf ? "You can't change your own role" : 'Change role'}
                        onChange={(e) => updateAdminRole(account, e.target.value)}
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
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="admin__ghost admin-row-action-btn"
                          style={{ padding: '6px 10px', fontSize: '11.5px' }}
                          onClick={() => resetAdminPassword(account)}
                        >
                          <FiLock size={12} /> Reset Password
                        </button>
                        {isSelf ? (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#687466' }}>You</span>
                        ) : (
                          <button
                            type="button"
                            className="admin-danger admin-row-action-btn"
                            style={{ padding: '6px 10px', fontSize: '11.5px' }}
                            onClick={async () => {
                              if (window.confirm(`Remove admin access for ${account.name} (${account.email})?`)) {
                                try {
                                  await adminApi.deleteAdminUser(account.id);
                                  setAdminAccounts(prev => prev.filter(a => a.id !== account.id));
                                } catch (err) { alert(err.message); }
                              }
                            }}
                          >
                            <FiTrash2 size={12} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;

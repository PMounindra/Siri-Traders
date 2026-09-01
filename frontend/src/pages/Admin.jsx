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
  FiGrid
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
  Owner: ['dashboard','inventory','sales-stats','orders','customers','retail-products','wholesale-products','offers','bestsellers','todays-deals','retail-content','wholesale-content','delivery-zones','broadcast','admins'],
  'Super Admin': ['dashboard','inventory','sales-stats','orders','customers','retail-products','wholesale-products','offers','bestsellers','todays-deals','retail-content','wholesale-content','delivery-zones','broadcast'],
  'Product Manager': ['dashboard','inventory','retail-products','wholesale-products','bestsellers','todays-deals'],
  'Order Manager': ['dashboard','inventory','orders','customers','delivery-zones'],
  'Marketing Manager': ['dashboard','offers','bestsellers','todays-deals','broadcast'],
  'Content Manager': ['dashboard','retail-content','wholesale-content'],
  'Customer Support': ['dashboard','inventory','customers','orders','delivery-zones'],
  Viewer: ['dashboard','inventory','sales-stats']
};

const ADMIN_NAV_SECTIONS = [
  {
    title: 'SALES & ANALYTICS',
    items: [
      ['dashboard', 'Overview', FiBarChart2],
      ['sales-stats', 'Product Sales', FiTrendingUp],
      ['orders', 'Orders & Bills', FiShoppingBag],
      ['customers', 'Customers', FiUsers]
    ]
  },
  {
    title: 'INVENTORY & OPERATIONS',
    items: [
      ['inventory', 'Inventory Hub', FiLayers],
      ['delivery-zones', 'Delivery Zones', FiTruck],
      ['broadcast', 'Email Broadcast', FiMail]
    ]
  },
  {
    title: 'PRODUCT MANAGEMENT',
    items: [
      ['retail-products', 'Retail Items', FiPackage],
      ['wholesale-products', 'Wholesale Items', FiPackage],
      ['offers', 'Offers & Coupons', FiGift],
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
  const [adminMode, setAdminMode] = useState('retail'); // 'retail' | 'wholesale'
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
  const [productStatusFilter, setProductStatusFilter] = useState('all'); // 'all'|'published'|'draft'|'archived'
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [expandedVariantId, setExpandedVariantId] = useState(null);

  // Detailed Variant Table Builder state in Editor
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
  const [newCat, setNewCat] = useState({ name: '', image: '', color: '#F7F4EE' });
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [newZone, setNewZone] = useState({ area: '', pincode: '', time: '30 mins', distance: '', deliveryFee: 0, freeDeliveryThreshold: 0, handlingCharge: 0 });

  const groceryUnitPresets = [
    '100 g', '250 g', '500 g', '1 kg', '2 kg', '5 kg', '10 kg', '25 kg',
    '100 ml', '200 ml', '500 ml', '1 L', '2 L', '5 L', '15 L',
    '1 pc', 'Pack of 2', 'Pack of 4', 'Pack of 6', 'Pack of 12', 'Box (10 pcs)'
  ];

  const getCustomerName = (userId) => {
    if (!liveCustomers) return 'Customer';
    const c = liveCustomers.find(u => u.id === userId);
    return c ? (c.name || c.email || 'Customer') : 'Customer';
  };

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
    adminApi.fetchAllOrders().then(setLiveOrders).catch(() => setLiveOrders([]));
    adminApi.fetchAllUsers().then(usersList => {
      setLiveCustomers(usersList);
      if (Array.isArray(usersList)) {
        const emails = usersList.map(u => u.email).filter(Boolean);
        setSelectedBroadcastEmails(emails);
      }
    }).catch(() => setLiveCustomers([]));
    adminApi.fetchOffers().then(data => setOffers(data.map(normalizeOffer))).catch(() => {});
    adminApi.fetchCoupons().then(setCoupons).catch(() => {});
    adminApi.fetchDeliveryZones().then(setDeliveryZones).catch(() => {});
    adminApi.fetchCategories().then(setDbCategories).catch(() => {});
    adminApi.fetchAdminUsers().then(setAdminAccounts).catch(() => {});
    loadInventory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch inventory whenever active tab is inventory
  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventory();
      if (inventoryFilter === 'logs') {
        loadInventoryLogs();
      }
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

  // ── Product filtering with Search, Category, and Status (Published, Draft, Archived) ──
  const filterProductList = (productsList) => {
    return productsList.filter(p => {
      // Status filter
      if (productStatusFilter === 'published' && (p.isPublished === false || p.isArchived)) return false;
      if (productStatusFilter === 'draft' && (p.isPublished !== false || p.isArchived)) return false;
      if (productStatusFilter === 'archived' && !p.isArchived) return false;

      // Category filter
      if (productCategoryFilter !== 'all' && p.category !== productCategoryFilter) return false;

      // Search query (matches Name, Brand, SKU, Barcode, Subcategory)
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
    { label: 'Live offers', value: offers.filter(offer => offer.active).length, icon: FiGift },
    { label: 'Inventory items', value: inventoryData?.items?.length || allProducts.length, icon: FiLayers },
    { label: 'Customers', value: liveCustomers ? liveCustomers.length : 0, icon: FiUsers },
    { label: 'Orders', value: liveOrders ? liveOrders.length : 0, icon: FiTruck },
  ];

  // ── Export Inventory CSV ──
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

  // ── Handle Reorder Level & Batch Configuration Submit ──
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

  const parseOrderDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return dateVal;
    let cleanStr = String(dateVal).trim().replace(' ', 'T');
    const d = new Date(cleanStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const getOrderRevenue = (order) => {
    if (!order) return 0;
    if (typeof order.total === 'number') return order.total;
    if (order.total != null && !Number.isNaN(Number(order.total))) return Number(order.total);
    return (order.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * (parseInt(item.quantity || 1, 10)), 0);
  };

  const getRangeSummary = (days) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const orders = (liveOrders || []).filter(order => {
      const date = parseOrderDate(order.createdAt);
      return date && date >= start && date <= end;
    });
    const revenue = orders.reduce((sum, order) => sum + getOrderRevenue(order), 0);
    const units = orders.reduce((sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + parseInt(item.quantity || 1, 10), 0), 0);
    return { revenue, orders: orders.length, units };
  };

  const salesToday = getRangeSummary(1);
  const salesLast7 = getRangeSummary(7);
  const salesLast30 = getRangeSummary(30);
  const averageOrderValue = salesLast30.orders ? salesLast30.revenue / salesLast30.orders : 0;

  const revenueLast30Days = Array.from({ length: 30 }, (_, index) => {
    const now = new Date();
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (29 - index), 0, 0, 0, 0);
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

  const topProductStats = useMemo(() => {
    const sales = {};
    (liveOrders || []).forEach(order => {
      (order.items || []).forEach(item => {
        const pId = item.productId || item.id;
        if (!pId) return;
        if (!sales[pId]) {
          sales[pId] = { id: pId, name: item.name, quantitySold: 0, ordersCount: 0, totalRevenue: 0 };
        }
        const q = parseInt(item.quantity || 1, 10);
        sales[pId].quantitySold += q;
        sales[pId].ordersCount += 1;
        sales[pId].totalRevenue += (item.price || 0) * q;
      });
    });
    return Object.values(sales).sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
  }, [liveOrders]);

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

  // ── Save Product ──
  const saveProduct = async (event) => {
    event.preventDefault();
    const isWholesale = activeTab === 'wholesale-products';
    
    // Clean and validate variants
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

  // ── Duplicate Product Helper ──
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
      id: '', // cleared to trigger create
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
    setSaveToast({ type: 'success', msg: `📋 Cloned "${product.name}" into editor. Adjust details and click "Save item"!` });
    setTimeout(() => {
      const editForm = document.querySelector('.admin-workspace .admin-form');
      editForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // ── Archive / Restore Product ──
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

  // ── Publish / Hide Product ──
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

  // Profit margin calculation for currently edited product
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
                {activeTab === 'inventory' && 'Grocery Inventory Hub'}
                {activeTab === 'retail-products' && 'Grocery Products & Variants'}
                {activeTab === 'wholesale-products' && 'Wholesale Products & Bulk Packs'}
                {activeTab === 'sales-stats' && 'Product Sales & Analytics'}
                {activeTab !== 'dashboard' && activeTab !== 'inventory' && activeTab !== 'retail-products' && activeTab !== 'wholesale-products' && activeTab !== 'sales-stats' && activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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

          {/* Store links banner */}
          {(activeTab === 'retail-products' || activeTab === 'retail-content') && (
            <div className="admin__mode-bar" style={{ marginBottom: '20px' }}>
              <span className="admin__mode-label">🛍️ Retail Grocery Store</span>
              <span className="admin__mode-desc">Manage item variants, barcodes, brands, profit margins, and GST rates for retail shoppers.</span>
              <a href="/home" target="_blank" rel="noopener noreferrer" className="admin__store-link">
                View Retail Store →
              </a>
            </div>
          )}
          {(activeTab === 'wholesale-products' || activeTab === 'wholesale-content') && (
            <div className="admin__mode-bar" style={{ marginBottom: '20px' }}>
              <span className="admin__mode-label">📦 Wholesale & Bulk Packs</span>
              <span className="admin__mode-desc">Manage bulk pack variants, case quantities, wholesale pricing, and tax settings for business accounts.</span>
              <a href="/home" target="_blank" rel="noopener noreferrer" className="admin__store-link">
                View Wholesale Store →
              </a>
            </div>
          )}

          {/* =========================================================================
             GROCERY PRODUCT MANAGEMENT (RETAIL & WHOLESALE)
             ========================================================================= */}
          {(activeTab === 'retail-products' || activeTab === 'wholesale-products') && (
            <section className="admin-workspace">
              {/* Product Editor Form */}
              <form className="admin-form" onSubmit={saveProduct}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2>{productDraft.id ? 'Edit Grocery Item' : `Add New ${activeTab === 'wholesale-products' ? 'Wholesale' : 'Retail'} Item`}</h2>
                  {productDraft.id && (
                    <span style={{ fontSize: '11px', background: '#F3F4F6', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                      Editing ID #{productDraft.id}
                    </span>
                  )}
                </div>

                {/* ── Section 1: General Product Details ── */}
                <div className="admin-form-section">
                  <h3 className="admin-form-section__title"><FiPackage /> 1. General Product Information</h3>
                  <div className="admin-form__grid">
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Product Name *</label>
                      <input value={productDraft.name} onChange={(e) => setProductDraft(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Dawat Lovely Gold Biryani Rice" required />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Category *</label>
                      <select value={productDraft.category} onChange={(e) => setProductDraft(prev => ({ ...prev, category: e.target.value }))}>
                        {(dbCategories.length ? dbCategories : categories).map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Subcategory</label>
                      <input value={productDraft.subcategory || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, subcategory: e.target.value }))} placeholder="e.g. Basmati Rice, Sunflower Oil, Toor Dal" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Brand</label>
                      <input value={productDraft.brand || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, brand: e.target.value }))} placeholder="e.g. Daawat, Fortune, Siri Select" required />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Pack Size / Weight</label>
                      <input value={productDraft.weight || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, weight: e.target.value }))} placeholder="e.g. 500, 1, 5" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Unit of Measure</label>
                      <select value={productDraft.unit || 'g'} onChange={(e) => setProductDraft(prev => ({ ...prev, unit: e.target.value }))}>
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="ml">Millilitres (ml)</option>
                        <option value="L">Litres (L)</option>
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                        <option value="bottle">Bottle</option>
                        <option value="can">Can</option>
                      </select>
                    </div>

                    {/* SKU with Auto-generate */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#111827' }}>SKU Code</label>
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', color: '#2D5016', fontSize: '11px', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                          onClick={() => setProductDraft(prev => ({ ...prev, sku: genSku(prev.category) }))}
                        >
                          ⚡ Auto-Gen
                        </button>
                      </div>
                      <input value={productDraft.sku || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, sku: e.target.value }))} placeholder="e.g. SIRI-RIC-0021" />
                    </div>

                    {/* Barcode with Auto-generate */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11.5px', fontWeight: '700', color: '#111827' }}>Barcode (EAN/UPC)</label>
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', color: '#2D5016', fontSize: '11px', fontWeight: '800', cursor: 'pointer', padding: 0 }}
                          onClick={() => setProductDraft(prev => ({ ...prev, barcode: genBarcode() }))}
                        >
                          ⚡ Auto-Gen
                        </button>
                      </div>
                      <input value={productDraft.barcode || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, barcode: e.target.value }))} placeholder="e.g. 8901234567890" />
                    </div>
                  </div>

                  <div style={{ marginTop: '8px' }}>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Product Image URL</label>
                    <input value={productDraft.image || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, image: e.target.value }))} placeholder="https://images.unsplash.com/..." />
                    <label className="admin-file-input" style={{ marginTop: '6px' }}>
                      <span>Or choose image from device</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Description</label>
                    <textarea value={productDraft.description || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Fresh, high-grade basmati rice, suitable for biryani and daily cooking." rows="2" />
                  </div>
                </div>

                {/* ── Section 2: Pricing, Cost & Profit Margin ── */}
                <div className="admin-form-section">
                  <h3 className="admin-form-section__title"><FiDollarSign /> 2. Pricing, Cost & Profit Margin Tracking</h3>
                  <div className="admin-form__grid">
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Selling Price (₹) *</label>
                      <input value={productDraft.price} onChange={(e) => setProductDraft(prev => ({ ...prev, price: e.target.value }))} placeholder="e.g. 420" type="number" required />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>MRP / Market Price (₹)</label>
                      <input value={productDraft.mrp} onChange={(e) => setProductDraft(prev => ({ ...prev, mrp: e.target.value }))} placeholder="e.g. 490" type="number" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Cost Price / Purchase Price (₹)</label>
                      <input value={productDraft.costPrice} onChange={(e) => setProductDraft(prev => ({ ...prev, costPrice: e.target.value }))} placeholder="e.g. 330" type="number" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>GST / Tax Rate</label>
                      <select value={productDraft.gstRate || '0'} onChange={(e) => setProductDraft(prev => ({ ...prev, gstRate: e.target.value }))}>
                        <option value="0">0% — Exempt / Fresh Produce</option>
                        <option value="5">5% — Essential Packaged Foods</option>
                        <option value="12">12% — Processed Grocery / Butter / Ghee</option>
                        <option value="18">18% — Packaged Snacks / Branded Goods</option>
                        <option value="28">28% — Luxury / Aerated Goods</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>HSN Code</label>
                      <input value={productDraft.hsnCode || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, hsnCode: e.target.value }))} placeholder="e.g. 1006 (Rice), 1512 (Oil), 0713 (Pulses)" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Discount % (Calculated or Custom)</label>
                      <input value={productDraft.discount} onChange={(e) => setProductDraft(prev => ({ ...prev, discount: e.target.value }))} placeholder="e.g. 14" type="number" />
                    </div>

                    {activeTab === 'wholesale-products' && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Wholesale Price (₹)</label>
                          <input value={productDraft.wholesalePrice || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, wholesalePrice: e.target.value }))} placeholder="e.g. 380" type="number" />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Bulk Pack Label & Price (₹)</label>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <input value={productDraft.bulkPackLabel || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, bulkPackLabel: e.target.value }))} placeholder="e.g. 10 kg bag" />
                            <input value={productDraft.bulkPackPrice || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, bulkPackPrice: e.target.value }))} placeholder="₹ Price" type="number" style={{ width: '100px' }} />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Real-time Profit Margin Card */}
                  {currSellPrice > 0 && currCostPrice > 0 && (
                    <div className="admin-profit-card" style={{ marginTop: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Profit per Unit</span>
                        <strong style={{ display: 'block', fontSize: '16px', color: currProfitAmount >= 0 ? '#15803D' : '#DC2626' }}>
                          {formatPrice(currProfitAmount)}
                        </strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Profit Margin</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '16px', color: '#111827' }}>{currProfitMarginPct}%</strong>
                          <span className={`admin-profit-pill ${currProfitMarginPct >= 20 ? 'admin-profit-pill--high' : (currProfitMarginPct >= 10 ? 'admin-profit-pill--med' : 'admin-profit-pill--low')}`}>
                            {currProfitMarginPct >= 20 ? '🔥 High Margin' : (currProfitMarginPct >= 10 ? '⚖️ Balanced' : '⚠️ Low Margin')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase', fontWeight: 800 }}>Markup on Cost</span>
                        <strong style={{ display: 'block', fontSize: '14px', color: '#4B5563' }}>
                          {Math.round(((currSellPrice - currCostPrice) / currCostPrice) * 100)}%
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Section 3: Pack-Size & Unit Variants ── */}
                <div className="admin-form-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h3 className="admin-form-section__title" style={{ border: 'none', padding: 0 }}><FiGrid /> 3. Pack-Size & Unit Variants</h3>
                    <button
                      type="button"
                      className="admin__ghost"
                      style={{ height: '30px', fontSize: '11.5px', padding: '0 10px' }}
                      onClick={() => setDetailedVariants(prev => [
                        ...prev,
                        {
                          id: `var-${Date.now()}`,
                          label: '',
                          packSize: '',
                          unit: productDraft.unit || 'g',
                          price: '',
                          mrp: '',
                          costPrice: '',
                          stock: 50,
                          sku: genSku(productDraft.category),
                          barcode: genBarcode(),
                          inStock: true
                        }
                      ])}
                    >
                      <FiPlus /> Add Variant
                    </button>
                  </div>

                  {/* Quick Preset Chips */}
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#687466', marginBottom: '6px' }}>Quick Add Preset Pack Sizes:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {groceryUnitPresets.map(preset => {
                        const isAdded = detailedVariants.some(v => v.label === preset);
                        return (
                          <button
                            key={preset}
                            type="button"
                            style={{
                              padding: '3px 9px',
                              borderRadius: '16px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: isAdded ? '1px solid #2D5016' : '1px solid #DCE3D8',
                              background: isAdded ? '#E8F5E9' : '#FFFFFF',
                              color: isAdded ? '#2D5016' : '#4B5563'
                            }}
                            onClick={() => {
                              if (isAdded) {
                                setDetailedVariants(prev => prev.filter(v => v.label !== preset));
                              } else {
                                setDetailedVariants(prev => [
                                  ...prev,
                                  {
                                    id: `var-${Date.now()}-${preset}`,
                                    label: preset,
                                    packSize: preset.split(' ')[0] || '',
                                    unit: preset.split(' ')[1] || 'g',
                                    price: '',
                                    mrp: '',
                                    costPrice: '',
                                    stock: 50,
                                    sku: `${genSku(productDraft.category)}-${preset.replace(/\s+/g, '')}`,
                                    barcode: genBarcode(),
                                    inStock: true
                                  }
                                ]);
                              }
                            }}
                          >
                            {isAdded ? `✓ ${preset}` : `+ ${preset}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Variant Table */}
                  {detailedVariants.length > 0 && (
                    <div className="admin-variant-table-wrap" style={{ marginTop: '8px' }}>
                      <table className="admin-variant-table">
                        <thead>
                          <tr>
                            <th>VARIANT SIZE</th>
                            <th>PRICE (₹)</th>
                            <th>MRP (₹)</th>
                            <th>COST (₹)</th>
                            <th>STOCK</th>
                            <th>SKU</th>
                            <th>MARGIN %</th>
                            <th>STATUS</th>
                            <th>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedVariants.map((variant, idx) => {
                            const vPrice = Number(variant.price) || 0;
                            const vCost = Number(variant.costPrice) || 0;
                            const vMargin = vPrice > 0 ? Math.round(((vPrice - vCost) / vPrice) * 100) : 0;

                            return (
                              <tr key={variant.id || idx}>
                                <td>
                                  <input
                                    placeholder="e.g. 1 kg"
                                    value={variant.label}
                                    style={{ width: '90px' }}
                                    onChange={(e) => {
                                      const next = [...detailedVariants];
                                      next[idx] = { ...next[idx], label: e.target.value };
                                      setDetailedVariants(next);
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    placeholder="Price"
                                    value={variant.price}
                                    style={{ width: '70px' }}
                                    onChange={(e) => {
                                      const next = [...detailedVariants];
                                      next[idx] = { ...next[idx], price: e.target.value };
                                      setDetailedVariants(next);
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    placeholder="MRP"
                                    value={variant.mrp}
                                    style={{ width: '70px' }}
                                    onChange={(e) => {
                                      const next = [...detailedVariants];
                                      next[idx] = { ...next[idx], mrp: e.target.value };
                                      setDetailedVariants(next);
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    placeholder="Cost"
                                    value={variant.costPrice}
                                    style={{ width: '70px' }}
                                    onChange={(e) => {
                                      const next = [...detailedVariants];
                                      next[idx] = { ...next[idx], costPrice: e.target.value };
                                      setDetailedVariants(next);
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    placeholder="Stock"
                                    value={variant.stock}
                                    style={{ width: '60px' }}
                                    onChange={(e) => {
                                      const next = [...detailedVariants];
                                      next[idx] = { ...next[idx], stock: e.target.value };
                                      setDetailedVariants(next);
                                    }}
                                  />
                                </td>
                                <td>
                                  <input
                                    placeholder="SKU"
                                    value={variant.sku || ''}
                                    style={{ width: '100px' }}
                                    onChange={(e) => {
                                      const next = [...detailedVariants];
                                      next[idx] = { ...next[idx], sku: e.target.value };
                                      setDetailedVariants(next);
                                    }}
                                  />
                                </td>
                                <td>
                                  <span style={{ fontWeight: 800, fontSize: '11px', color: vMargin >= 20 ? '#166534' : (vMargin >= 10 ? '#92400E' : '#991B1B') }}>
                                    {vMargin}%
                                  </span>
                                </td>
                                <td>
                                  <label style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={variant.inStock !== false}
                                      onChange={(e) => {
                                        const next = [...detailedVariants];
                                        next[idx] = { ...next[idx], inStock: e.target.checked };
                                        setDetailedVariants(next);
                                      }}
                                    />
                                    <span>{variant.inStock !== false ? 'In Stock' : 'Out'}</span>
                                  </label>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="admin-danger"
                                    style={{ width: '28px', height: '28px', borderRadius: '6px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => setDetailedVariants(prev => prev.filter((_, i) => i !== idx))}
                                  >
                                    <FiTrash2 size={12} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ── Section 4: Batch, Expiry & Visibility ── */}
                <div className="admin-form-section">
                  <h3 className="admin-form-section__title"><FiClock /> 4. Batch, Expiry & Storefront Visibility</h3>
                  <div className="admin-form__grid">
                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Batch / Lot Number</label>
                      <input value={productDraft.batchNumber || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, batchNumber: e.target.value }))} placeholder="e.g. BAT-2026-09" />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Mfg Date</label>
                      <input type="date" value={productDraft.mfgDate || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, mfgDate: e.target.value }))} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Expiry Date</label>
                      <input type="date" value={productDraft.expiryDate || ''} onChange={(e) => setProductDraft(prev => ({ ...prev, expiryDate: e.target.value }))} />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Stock Status Note</label>
                      <select value={productDraft.stockNote} onChange={(e) => setProductDraft(prev => ({ ...prev, stockNote: e.target.value }))}>
                        <option>In stock</option>
                        <option>Only few left</option>
                        <option>Only 10 left</option>
                        <option>Out of stock</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11.5px', fontWeight: '700', marginBottom: '4px', color: '#111827' }}>Delivery Time Estimate</label>
                      <select value={productDraft.deliveryTime || '15 mins'} onChange={(e) => setProductDraft(prev => ({ ...prev, deliveryTime: e.target.value }))}>
                        <option>10 mins</option>
                        <option>15 mins</option>
                        <option>20 mins</option>
                        <option>30 mins</option>
                        <option>Same day</option>
                        <option>Next day</option>
                      </select>
                    </div>
                  </div>

                  {/* Checkbox Controls */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', paddingTop: '6px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#2D5016', fontWeight: '700', cursor: 'pointer' }}>
                      <input type="checkbox" checked={productDraft.isPublished !== false} onChange={(e) => setProductDraft(prev => ({ ...prev, isPublished: e.target.checked }))} style={{ width: 'auto', margin: 0 }} />
                      <span>🟢 Published on Storefront</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#2D5016', fontWeight: '700', cursor: 'pointer' }}>
                      <input type="checkbox" checked={Boolean(productDraft.isBestseller)} onChange={(e) => setProductDraft(prev => ({ ...prev, isBestseller: e.target.checked }))} style={{ width: 'auto', margin: 0 }} />
                      <span>⭐ Best Seller Item</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#2D5016', fontWeight: '700', cursor: 'pointer' }}>
                      <input type="checkbox" checked={Boolean(productDraft.isTodaysDeal)} onChange={(e) => setProductDraft(prev => ({ ...prev, isTodaysDeal: e.target.checked }))} style={{ width: 'auto', margin: 0 }} />
                      <span>🏷️ Today's Deal</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#B91C1C', fontWeight: '700', cursor: 'pointer' }}>
                      <input type="checkbox" checked={Boolean(productDraft.isArchived)} onChange={(e) => setProductDraft(prev => ({ ...prev, isArchived: e.target.checked }))} style={{ width: 'auto', margin: 0 }} />
                      <span>📁 Archived Product</span>
                    </label>
                  </div>
                </div>

                <div className="admin-form__actions" style={{ alignItems: 'center', marginTop: '10px' }}>
                  <button type="submit" className="admin__primary" disabled={apiLoading}>
                    {apiLoading ? 'Saving...' : <><FiSave /> Save item</>}
                  </button>
                  {productDraft.id && (
                    <button
                      type="button"
                      className="admin__ghost"
                      onClick={() => {
                        setProductDraft(activeTab === 'wholesale-products' ? blankWholesaleProduct : blankProduct);
                        setDetailedVariants([]);
                      }}
                    >
                      <FiX /> Clear
                    </button>
                  )}
                  {saveToast && (
                    <div style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: '6px', fontSize: '13px', background: saveToast.type === 'error' ? '#fee' : '#e6f4ea', color: saveToast.type === 'error' ? '#c00' : '#1e8e3e' }}>
                      {saveToast.msg}
                    </div>
                  )}
                </div>
              </form>

              {/* Add new category card */}
              <div className="admin-card admin-new-cat">
                <h2>Add New Category</h2>
                <div className="admin-form__grid">
                  <input
                    className="admin-input-box"
                    placeholder="Category name e.g. Herbal Products"
                    value={newCat.name}
                    onChange={(e) => setNewCat(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    className="admin-input-box"
                    placeholder="Image URL"
                    value={newCat.image.startsWith('data:') ? '' : newCat.image}
                    onChange={(e) => setNewCat(prev => ({ ...prev, image: e.target.value }))}
                  />
                </div>
                <button
                  type="button"
                  className="admin__primary"
                  style={{ marginTop: 12 }}
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
              </div>

              {/* Enhanced Products Listing */}
              <div className="admin-card admin-card--wide">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Status filter tabs */}
                  <div className="inventory-filters-tabs">
                    <button
                      type="button"
                      className={`inventory-filter-btn ${productStatusFilter === 'all' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setProductStatusFilter('all')}
                    >
                      All Items <span className="inventory-badge-count">{activeTab === 'wholesale-products' ? wholesaleProducts.length : retailProducts.length}</span>
                    </button>
                    <button
                      type="button"
                      className={`inventory-filter-btn ${productStatusFilter === 'published' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setProductStatusFilter('published')}
                    >
                      🟢 Published <span className="inventory-badge-count">{(activeTab === 'wholesale-products' ? wholesaleProducts : retailProducts).filter(p => p.isPublished !== false && !p.isArchived).length}</span>
                    </button>
                    <button
                      type="button"
                      className={`inventory-filter-btn ${productStatusFilter === 'draft' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setProductStatusFilter('draft')}
                    >
                      🟡 Draft / Hidden <span className="inventory-badge-count">{(activeTab === 'wholesale-products' ? wholesaleProducts : retailProducts).filter(p => p.isPublished === false && !p.isArchived).length}</span>
                    </button>
                    <button
                      type="button"
                      className={`inventory-filter-btn ${productStatusFilter === 'archived' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setProductStatusFilter('archived')}
                    >
                      📁 Archived <span className="inventory-badge-count">{(activeTab === 'wholesale-products' ? wholesaleProducts : retailProducts).filter(p => p.isArchived).length}</span>
                    </button>
                  </div>

                  {/* Toolbar & Search Bar */}
                  <div className="admin-card__toolbar" style={{ margin: 0, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '280px' }}>
                      <label className="admin-search-label" style={{ flex: 1 }}>
                        <FiSearch />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by name, brand, subcategory, SKU or barcode..."
                          style={{ width: '100%' }}
                        />
                      </label>
                      <select
                        className="admin-input-box"
                        style={{ width: '160px', height: '38px', borderRadius: '9px' }}
                        value={productCategoryFilter}
                        onChange={(e) => setProductCategoryFilter(e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        {(dbCategories.length ? dbCategories : categories).map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="admin__ghost"
                      onClick={() => adminApi.fetchProducts(true).then(dbProducts => {
                        const retail = dbProducts.filter(p => !p.wholesalePrice);
                        const ws = dbProducts.filter(p => p.wholesalePrice);
                        if (retail.length) persistRetailProducts(retail);
                        if (ws.length) persistWholesaleProducts(ws);
                      })}
                    >
                      ↻ Refresh
                    </button>
                  </div>
                </div>

                {/* Enhanced Product Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                  {filteredProducts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px', color: '#687466' }}>
                      No products found matching your search and filter criteria.
                    </div>
                  ) : filteredProducts.map(product => {
                    const price = Number(product.price) || 0;
                    const mrp = Number(product.mrp) || price;
                    const cost = Number(product.costPrice) || Math.round(price * 0.78);
                    const profit = price - cost;
                    const margin = price > 0 ? Math.round((profit / price) * 100) : 0;
                    const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
                    const isExpanded = expandedVariantId === product.id;

                    return (
                      <div
                        key={product.id}
                        className={`admin-product-card-enhanced ${product.isArchived ? 'admin-product-card-enhanced--archived' : ''}`}
                      >
                        <div className="admin-product-top-row">
                          {/* Left: Image & Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '260px' }}>
                            <img src={toWebpImage(product.image)} alt={product.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', background: '#F7F4EE' }} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <strong style={{ fontSize: '14px', color: '#111827' }}>{product.name}</strong>
                                {product.isArchived ? (
                                  <span className="admin-status-badge admin-status-badge--archived">📁 Archived</span>
                                ) : product.isPublished === false ? (
                                  <span className="admin-status-badge admin-status-badge--draft">🟡 Hidden (Draft)</span>
                                ) : (
                                  <span className="admin-status-badge admin-status-badge--published">🟢 Active</span>
                                )}
                              </div>
                              <span style={{ fontSize: '12px', color: '#687466', display: 'block', marginTop: '2px' }}>
                                {product.brand ? <strong>{product.brand}</strong> : 'Unbranded'} · {product.category} {product.subcategory ? `(${product.subcategory})` : ''} · {product.weight}{product.unit}
                              </span>
                            </div>
                          </div>

                          {/* Middle: Badges Strip */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {product.sku && <span className="admin-tag-pill admin-tag-pill--sku">SKU: {product.sku}</span>}
                            {product.barcode && <span className="admin-tag-pill admin-tag-pill--barcode">Barcode: {product.barcode}</span>}
                            <span className="admin-tag-pill admin-tag-pill--gst">GST: {product.gstRate || 0}%</span>
                            {product.batchNumber && <span className="admin-tag-pill admin-tag-pill--batch">Batch: {product.batchNumber}</span>}
                          </div>

                          {/* Right: Pricing, Margin & Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ fontSize: '15px', color: '#111827', display: 'block' }}>{formatPrice(price)}</strong>
                              <span style={{ fontSize: '11px', color: '#687466' }}>
                                Cost: {formatPrice(cost)} · MRP: {formatPrice(mrp)}
                              </span>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                                <span className={`admin-profit-pill ${margin >= 20 ? 'admin-profit-pill--high' : (margin >= 10 ? 'admin-profit-pill--med' : 'admin-profit-pill--low')}`}>
                                  {formatPrice(profit)} ({margin}%)
                                </span>
                              </div>
                            </div>

                            <select
                              value={product.stockNote || (product.inStock ? 'In stock' : 'Out of stock')}
                              onChange={(e) => updateProductStock(product.id, e.target.value, adminMode === 'wholesale')}
                              className="admin-status-select"
                              style={{ height: '34px', fontSize: '12px' }}
                            >
                              <option>In stock</option>
                              <option>Only few left</option>
                              <option>Only 10 left</option>
                              <option>Out of stock</option>
                            </select>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <button
                                className="admin__ghost"
                                style={{ width: '34px', height: '34px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                title="Edit Product"
                                onClick={() => editProduct(product)}
                              >
                                <FiEdit2 size={13} />
                              </button>

                              <button
                                className="admin__ghost"
                                style={{ width: '34px', height: '34px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                title="Duplicate / Clone Product"
                                onClick={() => duplicateProduct(product)}
                              >
                                <FiCopy size={13} />
                              </button>

                              <button
                                className="admin__ghost"
                                style={{ width: '34px', height: '34px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                title={product.isPublished === false ? 'Publish to Store' : 'Hide from Store (Make Draft)'}
                                onClick={() => togglePublishProduct(product)}
                              >
                                {product.isPublished === false ? <FiEyeOff size={13} style={{ color: '#F59E0B' }} /> : <FiEye size={13} style={{ color: '#16A34A' }} />}
                              </button>

                              <button
                                className="admin__ghost"
                                style={{ width: '34px', height: '34px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                title={product.isArchived ? 'Restore from Archive' : 'Archive Product'}
                                onClick={() => toggleArchiveProduct(product)}
                              >
                                <FiArchive size={13} style={{ color: product.isArchived ? '#2D5016' : '#6B7280' }} />
                              </button>

                              <button
                                className="admin-danger"
                                style={{ width: '34px', height: '34px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                                title="Delete Permanently"
                                onClick={() => removeProduct(product.id)}
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Variants Strip */}
                        {hasVariants && (
                          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: '8px', marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <button
                                type="button"
                                style={{ background: 'transparent', border: 'none', color: '#2D5016', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                                onClick={() => setExpandedVariantId(isExpanded ? null : product.id)}
                              >
                                <span>{isExpanded ? '▲ Hide' : '▼ View'} {product.variants.length} Pack Variants</span>
                              </button>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {product.variants.slice(0, 4).map(v => (
                                  <span key={v.label} style={{ fontSize: '10.5px', background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '1px 6px', borderRadius: '4px' }}>
                                    {v.label}: {formatPrice(v.price)}
                                  </span>
                                ))}
                                {product.variants.length > 4 && <span style={{ fontSize: '10px', color: '#687466' }}>+{product.variants.length - 4} more</span>}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="admin-variant-table-wrap" style={{ marginTop: '8px' }}>
                                <table className="admin-variant-table">
                                  <thead>
                                    <tr>
                                      <th>VARIANT</th>
                                      <th>PRICE</th>
                                      <th>MRP</th>
                                      <th>COST</th>
                                      <th>PROFIT MARGIN</th>
                                      <th>STOCK</th>
                                      <th>SKU / BARCODE</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {product.variants.map((v, i) => {
                                      const vp = Number(v.price) || 0;
                                      const vc = Number(v.costPrice) || Math.round(vp * 0.78);
                                      const vm = vp > 0 ? Math.round(((vp - vc) / vp) * 100) : 0;
                                      return (
                                        <tr key={i}>
                                          <td style={{ fontWeight: '700' }}>{v.label}</td>
                                          <td style={{ fontWeight: '800', color: '#2D5016' }}>{formatPrice(vp)}</td>
                                          <td style={{ color: '#687466' }}>{formatPrice(v.mrp || vp)}</td>
                                          <td style={{ color: '#4B5563' }}>{formatPrice(vc)}</td>
                                          <td>
                                            <span className={`admin-profit-pill ${vm >= 20 ? 'admin-profit-pill--high' : (vm >= 10 ? 'admin-profit-pill--med' : 'admin-profit-pill--low')}`}>
                                              {formatPrice(vp - vc)} ({vm}%)
                                            </span>
                                          </td>
                                          <td>{v.stock || 50} units</td>
                                          <td style={{ fontSize: '10.5px', color: '#687466' }}>{v.sku || '—'} {v.barcode ? `· ${v.barcode}` : ''}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allProducts
                  .filter(p => p.name.toLowerCase().includes(bestsellerSearch.toLowerCase()) || (p.brand || '').toLowerCase().includes(bestsellerSearch.toLowerCase()))
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
                        {product.isBestseller ? 'Bestseller' : 'Add'}
                      </label>
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allProducts
                  .filter(p => p.name.toLowerCase().includes(dealSearch.toLowerCase()) || (p.brand || '').toLowerCase().includes(dealSearch.toLowerCase()))
                  .map(product => (
                    <div key={product.id} className="admin-row admin-row--plain" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
                      <img src={toWebpImage(product.image)} alt={product.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                      <div style={{ flex: 1 }}>
                        <strong>{product.name}</strong>
                        <span style={{ fontSize: 12, color: '#687466' }}>{product.brand} / {product.weight}{product.unit} / {formatPrice(product.price)}</span>
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: product.isTodaysDeal ? '#2D5016' : '#687466', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(product.isTodaysDeal)}
                          onChange={() => toggleProductFlag(product.id, 'isTodaysDeal', product.isTodaysDeal, Boolean(product.wholesalePrice))}
                        />
                        {product.isTodaysDeal ? "Today's Deal" : 'Add'}
                      </label>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {activeTab === 'customers' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Customers</h2>
              </div>
              {liveCustomers === null ? (
                <p className="admin-muted">Loading customers...</p>
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
                        <div>
                          <strong style={{ fontSize: '13px' }}>Order #{order.id}</strong>
                          <span style={{ fontSize: '12px', color: '#2D5016', fontWeight: 'bold' }}>BILL-{order.id + 7820}</span>
                          <span style={{ fontSize: '11px', color: '#687466' }}>{customerName}</span>
                        </div>
                        <div>
                          <strong>Items Summary</strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                            {(order.items || []).map((item, idx) => (
                              <span key={idx} style={{ fontSize: '11px', lineHeight: '1.2' }}>
                                • {item.name} {item.weight ? `(${formatWeightUnit(item.weight, item.unit)})` : ''} <strong>x{item.quantity || 1}</strong>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <strong>Delivery Address</strong>
                          <span style={{ fontSize: '11px', lineHeight: '1.3' }}>{order.deliveryAddress || '—'}</span>
                        </div>
                        <div>
                          <strong>Bill Summary</strong>
                          <span style={{ fontSize: '11px' }}>Subtotal: {formatPrice(subtotal)}</span>
                          <span style={{ fontSize: '11px', color: '#2D5016', fontWeight: '600' }}>Delivery Fee: {formatPrice(deliveryFee)}</span>
                          <span style={{ fontSize: '12px', fontWeight: '900', color: '#111827' }}>Total: {formatPrice(order.total)}</span>
                        </div>
                        <div>
                          <strong>Payment & Txn</strong>
                          <span style={{ fontSize: '11px' }}>Mode: {order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.paymentMethod || '—')}</span>
                          <span style={{ fontSize: '11px', color: '#687466', fontFamily: 'monospace' }}>Ref: {transactionId}</span>
                          <span style={{ fontSize: '11px', color: isPaid ? '#2D5016' : '#FF6B35', fontWeight: 'bold' }}>
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                        <div>
                          <strong>Placed On</strong>
                          <span style={{ fontSize: '11px' }}>{order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN') : '—'}</span>
                        </div>
                        <div>
                          <strong>Status</strong>
                          <select
                            value={order.status}
                            className="admin-status-select"
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                await adminApi.updateOrderStatus(order.id, newStatus);
                                setLiveOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: newStatus } : o));
                                loadInventory();
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
            <div className="sales-analytics-page">
              <header className="sales-page-header">
                <div>
                  <div className="sales-eyebrow">PRODUCT SALES</div>
                  <h1>Sales Stats</h1>
                  <p>Track revenue, orders and product performance.</p>
                </div>
              </header>

              <section className="sales-kpi-grid">
                <div className="sales-kpi-card">
                  <span>TODAY</span>
                  <strong>{formatPrice(salesToday.revenue)}</strong>
                  <small>{salesToday.orders} orders</small>
                </div>
                <div className="sales-kpi-card">
                  <span>LAST 7 DAYS</span>
                  <strong>{formatPrice(salesLast7.revenue)}</strong>
                  <small>{salesLast7.orders} orders</small>
                </div>
                <div className="sales-kpi-card">
                  <span>LAST 30 DAYS</span>
                  <strong>{formatPrice(salesLast30.revenue)}</strong>
                  <small>{salesLast30.orders} orders</small>
                </div>
                <div className="sales-kpi-card">
                  <span>AVG ORDER VALUE</span>
                  <strong>{formatPrice(averageOrderValue)}</strong>
                  <small>30-day average</small>
                </div>
              </section>

              <section className="sales-chart-card">
                <div className="sales-section-label">REVENUE, LAST 30 DAYS</div>
                <div className="sales-line-chart-wrap">
                  {(() => {
                    const maxRevenue = Math.max(...revenueLast30Days.map(item => item.revenue), 1);
                    const chartWidth = 1000;
                    const chartHeight = 300;
                    const left = 52;
                    const right = 12;
                    const top = 18;
                    const bottom = 38;
                    const innerWidth = chartWidth - left - right;
                    const innerHeight = chartHeight - top - bottom;
                    const points = revenueLast30Days.map((item, index) => {
                      const x = left + (index / (revenueLast30Days.length - 1)) * innerWidth;
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

              <section className="sales-bottom-grid">
                <div className="sales-simple-card">
                  <div className="sales-card-heading">
                    <div className="sales-section-label">TOP PRODUCTS</div>
                    <span>Last 30 days</span>
                  </div>
                  <div className="sales-product-list">
                    {topProductStats.map((product, index) => {
                      const max = Math.max(topProductStats[0]?.totalRevenue || 1, 1);
                      return (
                        <div className="sales-product-row" key={product.id}>
                          <div className="sales-product-meta">
                            <span>{index + 1}. {product.name}</span>
                            <strong>{formatPrice(product.totalRevenue)}</strong>
                          </div>
                          <div className="sales-product-bar"><i style={{ width: `${Math.max(4, (product.totalRevenue / max) * 100)}%` }} /></div>
                          <small>{product.quantitySold} units · {product.ordersCount} orders</small>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="sales-simple-card">
                  <div className="sales-card-heading">
                    <div className="sales-section-label">INVENTORY VALUATION SUMMARY</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase' }}>Cost-Based Stock Value</span>
                      <strong style={{ display: 'block', fontSize: '22px', color: '#2D5016' }}>{formatPrice(invSummary.totalValuation)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase' }}>Potential Retail Value</span>
                      <strong style={{ display: 'block', fontSize: '20px', color: '#111827' }}>{formatPrice(invSummary.totalRetailValuation)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', color: '#687466', textTransform: 'uppercase' }}>Total Available Quantity</span>
                      <strong style={{ display: 'block', fontSize: '18px', color: '#111827' }}>{invSummary.totalAvailableUnits} units</strong>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'broadcast' && (
            <section className="admin-card admin-card--wide" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="admin-card__toolbar" style={{ borderBottom: '1px solid #E1E6DC', paddingBottom: '12px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FiMail size={24} style={{ color: '#2D5016' }} />
                  <div>
                    <h2 style={{ margin: 0 }}>Mail Broadcast Campaign</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                      Send promotions, festive offers, or announcements to registered customers.
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

              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!broadcastSubject.trim() || !broadcastMessage.trim()) return;
                setBroadcastSending(true);
                setBroadcastStatus(null);
                try {
                  const res = await adminApi.sendBroadcast({
                    subject: broadcastSubject,
                    messageText: broadcastMessage,
                    recipients: selectedBroadcastEmails
                  });
                  setBroadcastStatus({ type: 'success', msg: `Campaign sent successfully to ${res.count} customers.` });
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
                      {isWS && <input value={product.bulkPackLabel || ''} onChange={(e) => updateProductField(product.id, 'bulkPackLabel', e.target.value, true)} placeholder="Bulk label" />}
                      {isWS && <input value={product.bulkPackPrice || ''} onChange={(e) => updateProductField(product.id, 'bulkPackPrice', e.target.value, true)} type="number" placeholder="Bulk price" />}
                      {isWS && <input value={product.wholesaleCaseLabel || ''} onChange={(e) => updateProductField(product.id, 'wholesaleCaseLabel', e.target.value, true)} placeholder="Case label" />}
                      {isWS && <input value={product.wholesaleCasePrice || ''} onChange={(e) => updateProductField(product.id, 'wholesaleCasePrice', e.target.value, true)} type="number" placeholder="Case price" />}
                      <input value={product.description || ''} onChange={(e) => updateProductField(product.id, 'description', e.target.value, isWS)} placeholder="Description" />
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
              <div style={{ background: '#FAFFF6', border: '1px solid rgba(45,80,22,0.12)', borderRadius: 12, padding: 14, marginBottom: 18 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: '#2D5016', marginBottom: 10 }}>Add Delivery Zone</p>
                <div className="admin-form__grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <input className="admin-input-box" placeholder="Area name e.g. Kukatpally" value={newZone.area} onChange={e => setNewZone(p => ({...p, area: e.target.value}))} />
                  <input className="admin-input-box" placeholder="Pincode e.g. 500072" value={newZone.pincode} onChange={e => setNewZone(p => ({...p, pincode: e.target.value}))} />
                  <select className="admin-input-box" value={newZone.time} onChange={e => setNewZone(p => ({...p, time: e.target.value}))}>
                    {['10 mins','15 mins','20 mins','30 mins','45 mins','60 mins','Same day'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input className="admin-input-box" type="number" placeholder="Delivery Fee (₹)" value={newZone.deliveryFee || ''} onChange={e => setNewZone(p => ({...p, deliveryFee: Number(e.target.value) || 0}))} />
                </div>
                <button
                  type="button"
                  className="admin__primary"
                  style={{ marginTop: 10 }}
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

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F1F8E9' }}>
                      {['Area','Pincode','Delivery Time','Fee (₹)','Action'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: '#2D5016', fontSize: 11 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {deliveryZones.map(zone => (
                      <tr key={zone.id} style={{ borderBottom: '1px solid rgba(45,80,22,0.07)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{zone.area}</td>
                        <td style={{ padding: '10px 12px', color: '#687466' }}>{zone.pincode}</td>
                        <td style={{ padding: '10px 12px' }}>{zone.time}</td>
                        <td style={{ padding: '10px 12px' }}>₹{zone.deliveryFee}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <button
                            className="admin-danger"
                            style={{ width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={async () => {
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
            </section>
          )}

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

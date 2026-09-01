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
  FiCheckCircle
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
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // ── Inventory Management State ──
  const [inventoryData, setInventoryData] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryFilter, setInventoryFilter] = useState('all'); // 'all'|'low-stock'|'out-of-stock'|'near-expiry'|'expired'|'incoming'|'logs'
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
  const [savedZoneIds, setSavedZoneIds] = useState({});

  const defaultVariantOptions = ['100 g','200 g','250 g','500 g','1 kg','2 kg','5 kg','10 kg','100 ml','200 ml','500 ml','1 L','5 L','15 L'];
  const [checkedVariants, setCheckedVariants] = useState([]);
  const [variantPrices, setVariantPrices] = useState({});
  const [customVariants, setCustomVariants] = useState([{ label: '', price: '' }]);

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
    adminApi.fetchProducts().then(dbProducts => {
      if (!dbProducts || dbProducts.length === 0) return;
      const retail = dbProducts.filter(p => !p.wholesalePrice);
      const ws = dbProducts.filter(p => p.wholesalePrice);
      if (retail.length > 0) persistRetailProducts(retail.map(p => ({ ...p, stockNote: p.inStock ? 'In stock' : 'Out of stock' })));
      if (ws.length > 0) persistWholesaleProducts(ws.map(p => ({ ...p, stockNote: p.inStock ? 'In stock' : 'Out of stock' })));
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

  const filteredProducts = activeTab === 'wholesale-products' ? filteredWholesaleProducts : filteredRetailProducts;

  // ── Filtered Inventory Items ──
  const filteredInventoryItems = useMemo(() => {
    if (!inventoryData?.items) return [];
    let list = inventoryData.items;

    // Filter by tab
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

    // Category filter
    if (inventoryCategory !== 'all') {
      list = list.filter(i => i.category === inventoryCategory);
    }

    // Search query
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

  const saveProduct = async (event) => {
    event.preventDefault();
    const isWholesale = activeTab === 'wholesale-products';
    
    const builtVariants = [
      ...checkedVariants.filter(label => variantPrices[label]).map(label => ({ label, price: Number(variantPrices[label]) || 0 })),
      ...customVariants.filter(v => v.label.trim() && v.price).map(v => ({ label: v.label.trim(), price: Number(v.price) || 0 }))
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
    
    setApiLoading(true);
    setSaveToast(null);
    try {
      const isEdit = Boolean(productDraft.id && typeof productDraft.id === 'number');
      const { stockNote, id: _id, wholesalePrice, bulkPackLabel, bulkPackPrice, wholesaleCaseLabel, wholesaleCasePrice, ...apiPayload } = nextProduct;
      if (isEdit) {
        const saved = await adminApi.updateProduct(productDraft.id, apiPayload);
        nextProduct = { ...nextProduct, id: saved.id };
      } else {
        const saved = await adminApi.createProduct(apiPayload);
        nextProduct = { ...nextProduct, id: saved.id };
      }
      setSaveToast({ type: 'success', msg: `✅ “${nextProduct.name}” saved to database (ID: ${nextProduct.id})` });
      setTimeout(() => setSaveToast(null), 5000);
      loadInventory(); // reload inventory to track new product
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
    setTimeout(() => {
      const editForm = document.querySelector('.admin-workspace .admin-form');
      editForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
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
                {activeTab === 'sales-stats' && 'Product Sales & Analytics'}
                {activeTab !== 'dashboard' && activeTab !== 'inventory' && activeTab !== 'sales-stats' && activeTab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
             GROCERY INVENTORY MANAGEMENT MODULE
             ========================================================================= */}
          {activeTab === 'inventory' && (
            <div className="admin-inventory-page">
              {/* Critical Stock / Expiry Alerts Banners */}
              <div className="inventory-alerts-container">
                {invSummary.outOfStockCount > 0 && (
                  <div className="inventory-alert-banner inventory-alert-banner--danger">
                    <div className="inventory-alert-banner__content">
                      <FiAlertCircle size={20} />
                      <span><strong>Out of Stock Alert:</strong> {invSummary.outOfStockCount} grocery product(s) have 0 available units and are marked out of stock.</span>
                    </div>
                    <button className="inventory-alert-banner__btn" onClick={() => setInventoryFilter('out-of-stock')}>View Out of Stock Items</button>
                  </div>
                )}
                {invSummary.lowStockCount > 0 && (
                  <div className="inventory-alert-banner inventory-alert-banner--warning">
                    <div className="inventory-alert-banner__content">
                      <FiAlertTriangle size={20} />
                      <span><strong>Low Stock Alert:</strong> {invSummary.lowStockCount} product(s) are at or below their configured reorder threshold.</span>
                    </div>
                    <button className="inventory-alert-banner__btn" onClick={() => setInventoryFilter('low-stock')}>View Low Stock Items</button>
                  </div>
                )}
                {(invSummary.expiredCount > 0 || invSummary.nearExpiryCount > 0) && (
                  <div className="inventory-alert-banner inventory-alert-banner--warning" style={{ background: '#FFF7ED', borderColor: '#FDBA74', color: '#C2410C' }}>
                    <div className="inventory-alert-banner__content">
                      <FiClock size={20} />
                      <span>
                        <strong>Expiry Warning:</strong> {invSummary.expiredCount} expired product(s) & {invSummary.nearExpiryCount} item(s) expiring within 30 days.
                      </span>
                    </div>
                    <button className="inventory-alert-banner__btn" onClick={() => setInventoryFilter(invSummary.expiredCount > 0 ? 'expired' : 'near-expiry')}>
                      View Expiry Warnings
                    </button>
                  </div>
                )}
              </div>

              {/* Top KPI Metrics Overview */}
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
                  <small>{invSummary.totalReservedUnits} units currently reserved in orders</small>
                </div>

                <div className={`inventory-kpi-card ${invSummary.lowStockCount > 0 ? 'inventory-kpi-card--warning' : ''}`}>
                  <div className="inventory-kpi-card__header">
                    <span className="inventory-kpi-card__label">Low Stock Alerts</span>
                    <FiAlertTriangle className="inventory-kpi-card__icon" style={{ color: invSummary.lowStockCount > 0 ? '#F59E0B' : undefined }} />
                  </div>
                  <strong style={{ color: invSummary.lowStockCount > 0 ? '#B45309' : undefined }}>{invSummary.lowStockCount}</strong>
                  <small>Below configured reorder level</small>
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

              {/* Secondary Status Breakdown Bar */}
              <div className="inventory-breakdown-bar">
                <span className="inventory-breakdown-title">Stock Status:</span>
                <span className="inventory-pill inventory-pill--available">Available: {invSummary.totalAvailableUnits}</span>
                <span className="inventory-pill inventory-pill--reserved">Reserved in Orders: {invSummary.totalReservedUnits}</span>
                <span className="inventory-pill inventory-pill--damaged">Damaged: {invSummary.totalDamagedUnits}</span>
                <span className="inventory-pill inventory-pill--returned">Returned: {invSummary.totalReturnedUnits}</span>
                <span className="inventory-pill inventory-pill--expired">Expired: {invSummary.totalExpiredUnits}</span>
                <span className="inventory-pill inventory-pill--incoming">Incoming Shipment: {invSummary.totalIncomingUnits}</span>
              </div>

              {/* Toolbar & Filter Tabs */}
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
                      className={`inventory-filter-btn ${inventoryFilter === 'near-expiry' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setInventoryFilter('near-expiry')}
                    >
                      ⏳ Near Expiry <span className="inventory-badge-count">{invSummary.nearExpiryCount}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${inventoryFilter === 'expired' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setInventoryFilter('expired')}
                    >
                      ⛔ Expired <span className="inventory-badge-count">{invSummary.expiredCount}</span>
                    </button>
                    <button
                      className={`inventory-filter-btn ${inventoryFilter === 'incoming' ? 'inventory-filter-btn--active' : ''}`}
                      onClick={() => setInventoryFilter('incoming')}
                    >
                      📦 Incoming <span className="inventory-badge-count">{invSummary.totalIncomingUnits}</span>
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
                            placeholder="Search item name, brand, SKU or batch..."
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
                        <button className="admin__primary" onClick={exportInventoryCsv} style={{ height: '38px', padding: '0 14px', fontSize: '12px' }}>
                          📥 Export CSV
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Table Content */}
              {inventoryFilter !== 'logs' ? (
                <div className="inventory-table-wrap">
                  <table className="inventory-table">
                    <thead>
                      <tr>
                        <th>ITEM / BATCH DETAILS</th>
                        <th>CATEGORY</th>
                        <th>AVAILABLE</th>
                        <th>RESERVED</th>
                        <th>DAMAGED / RETURNED</th>
                        <th>INCOMING</th>
                        <th>UNIT COST / VALUE</th>
                        <th>REORDER LEVEL</th>
                        <th>EXPIRY DATE</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryLoading ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#687466' }}>
                            Loading live inventory tracking...
                          </td>
                        </tr>
                      ) : filteredInventoryItems.length === 0 ? (
                        <tr>
                          <td colSpan="10" style={{ textAlign: 'center', padding: '36px', color: '#687466' }}>
                            No inventory items matching your filter/search.
                          </td>
                        </tr>
                      ) : filteredInventoryItems.map(item => (
                        <tr key={item.productId}>
                          {/* Item details */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img src={toWebpImage(item.image)} alt={item.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', background: '#F7F4EE' }} />
                              <div>
                                <strong style={{ fontSize: '13px', color: '#111827' }}>{item.name}</strong>
                                <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>
                                  {item.brand ? `${item.brand} · ` : ''}{item.weight}{item.unit} · SKU #{item.productId}
                                </span>
                                {item.batchNumber && (
                                  <span style={{ fontSize: '10px', background: '#F3F4F6', color: '#374151', padding: '1px 5px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                                    Batch: {item.batchNumber}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Category */}
                          <td>
                            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'capitalize', color: '#2D5016' }}>
                              {item.category}
                            </span>
                            {item.isWholesale && (
                              <span style={{ display: 'block', fontSize: '10px', color: '#FF6B35', fontWeight: '800' }}>Wholesale</span>
                            )}
                          </td>

                          {/* Available Stock */}
                          <td>
                            <span className={`inventory-pill ${item.isOutOfStock ? 'inventory-pill--out' : (item.isLowStock ? 'inventory-pill--low' : 'inventory-pill--available')}`}>
                              {item.availableStock} units
                            </span>
                          </td>

                          {/* Reserved Stock */}
                          <td>
                            {item.reservedStock > 0 ? (
                              <span className="inventory-pill inventory-pill--reserved">{item.reservedStock} units</span>
                            ) : (
                              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>0</span>
                            )}
                          </td>

                          {/* Damaged & Returned */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px' }}>
                              {item.damagedStock > 0 && <span style={{ color: '#9D174D' }}>Damaged: <strong>{item.damagedStock}</strong></span>}
                              {item.returnedStock > 0 && <span style={{ color: '#6B21A8' }}>Returned: <strong>{item.returnedStock}</strong></span>}
                              {item.expiredStock > 0 && <span style={{ color: '#7F1D1D' }}>Expired: <strong>{item.expiredStock}</strong></span>}
                              {item.damagedStock === 0 && item.returnedStock === 0 && item.expiredStock === 0 && <span style={{ color: '#9CA3AF' }}>0</span>}
                            </div>
                          </td>

                          {/* Incoming Stock */}
                          <td>
                            {item.incomingStock > 0 ? (
                              <span className="inventory-pill inventory-pill--incoming">+{item.incomingStock}</span>
                            ) : (
                              <span style={{ color: '#9CA3AF', fontSize: '12px' }}>0</span>
                            )}
                          </td>

                          {/* Cost & Valuation */}
                          <td>
                            <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>Cost: {formatPrice(item.costPrice)}</span>
                            <span style={{ fontSize: '11px', color: '#2D5016', display: 'block' }}>Sell: {formatPrice(item.price)}</span>
                            <strong style={{ fontSize: '12px', color: '#111827' }}>Val: {formatPrice(item.stockValuation)}</strong>
                          </td>

                          {/* Reorder Level */}
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '12px', fontWeight: '700' }}>{item.reorderLevel} units</span>
                              {item.isLowStock && (
                                <span style={{ fontSize: '10px', color: '#B45309', fontWeight: '800' }}>⚠️ Reorder Now</span>
                              )}
                            </div>
                          </td>

                          {/* Expiry Date */}
                          <td>
                            {item.expiryDate ? (
                              <div>
                                <span style={{ fontSize: '11.5px', fontWeight: '600' }}>{item.expiryDate}</span>
                                {item.isExpired ? (
                                  <span style={{ display: 'block', fontSize: '10px', color: '#DC2626', fontWeight: '800' }}>⛔ Expired</span>
                                ) : item.isNearExpiry ? (
                                  <span style={{ display: 'block', fontSize: '10px', color: '#EA580C', fontWeight: '800' }}>
                                    ⏳ {item.daysUntilExpiry}d left
                                  </span>
                                ) : (
                                  <span style={{ display: 'block', fontSize: '10px', color: '#16A34A', fontWeight: '700' }}>Good</span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: '#9CA3AF', fontSize: '11px' }}>Not Set</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <button
                                className="admin__primary"
                                style={{ height: '32px', padding: '0 10px', fontSize: '11px', borderRadius: '6px' }}
                                title="Adjust product stock count"
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
                                Adjust
                              </button>

                              <button
                                className="admin__ghost"
                                style={{ height: '32px', padding: '0 8px', fontSize: '11px', borderRadius: '6px' }}
                                title="Configure reorder threshold, expiry date and batch number"
                                onClick={() => {
                                  setReorderModalItem(item);
                                  setReorderForm({
                                    reorderLevel: item.reorderLevel,
                                    costPrice: item.costPrice,
                                    expiryDate: item.expiryDate || '',
                                    batchNumber: item.batchNumber || '',
                                    location: item.location || 'Main Shelf',
                                    incomingStock: item.incomingStock || 0
                                  });
                                }}
                              >
                                <FiSliders size={13} />
                              </button>

                              <button
                                className="admin__ghost"
                                style={{ height: '32px', padding: '0 8px', fontSize: '11px', borderRadius: '6px' }}
                                title="View stock movement & transaction history"
                                onClick={() => openProductHistory(item)}
                              >
                                <FiActivity size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Inventory Movement & Adjustment Logs Tab */
                <div className="admin-card admin-card--wide">
                  <div className="admin-card__toolbar">
                    <div>
                      <h2 style={{ margin: 0 }}>Stock Movement & Adjustment History</h2>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#687466' }}>
                        Complete audit trail of all manual adjustments, purchase deliveries, and status changes.
                      </p>
                    </div>
                    <button className="admin__ghost" onClick={loadInventoryLogs}>
                      <FiRefreshCw size={13} /> Refresh Logs
                    </button>
                  </div>

                  {logsLoading ? (
                    <p style={{ color: '#687466', padding: '24px 0', textAlign: 'center' }}>Loading audit logs...</p>
                  ) : inventoryLogs.length === 0 ? (
                    <p style={{ color: '#687466', padding: '24px 0', textAlign: 'center' }}>No stock movement logs recorded yet.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="inventory-table">
                        <thead>
                          <tr>
                            <th>DATE & TIME</th>
                            <th>PRODUCT</th>
                            <th>ACTION / EVENT</th>
                            <th>QTY</th>
                            <th>STOCK BEFORE ➔ AFTER</th>
                            <th>REASON</th>
                            <th>NOTES</th>
                            <th>ADMIN USER</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inventoryLogs.map(log => (
                            <tr key={log.id}>
                              <td style={{ fontSize: '11.5px', color: '#687466', whiteSpace: 'nowrap' }}>
                                {new Date(log.createdAt).toLocaleString('en-IN')}
                              </td>
                              <td>
                                <strong>{log.productName}</strong>
                                <span style={{ fontSize: '11px', color: '#687466', display: 'block' }}>ID #{log.productId}</span>
                              </td>
                              <td>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '10.5px',
                                  fontWeight: '800',
                                  background: log.changeType === 'ADD' ? '#ECFDF5' : (log.changeType === 'DAMAGE' || log.changeType === 'EXPIRED' ? '#FEF2F2' : '#F3F4F6'),
                                  color: log.changeType === 'ADD' ? '#065F46' : (log.changeType === 'DAMAGE' || log.changeType === 'EXPIRED' ? '#991B1B' : '#374151')
                                }}>
                                  {log.changeType}
                                </span>
                              </td>
                              <td style={{ fontWeight: '800', fontSize: '13px', color: '#111827' }}>
                                {log.quantity > 0 ? `+${log.quantity}` : log.quantity}
                              </td>
                              <td>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#2D5016' }}>
                                  {log.stockBefore} ➔ {log.stockAfter}
                                </span>
                              </td>
                              <td style={{ fontSize: '12px' }}>{log.reason}</td>
                              <td style={{ fontSize: '11px', color: '#687466' }}>{log.notes || '—'}</td>
                              <td style={{ fontSize: '12px', fontWeight: '600' }}>{log.adminName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================
                 MODAL 1: STOCK ADJUSTMENT
                 ========================================================= */}
              {adjustModalItem && (
                <div className="inventory-modal-backdrop" onClick={() => setAdjustModalItem(null)}>
                  <div className="inventory-modal" onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <h2>Adjust Stock — {adjustModalItem.name}</h2>
                      <button className="inventory-modal__close" onClick={() => setAdjustModalItem(null)}>✕</button>
                    </div>

                    <form onSubmit={handleStockAdjustment}>
                      <div className="inventory-modal__body">
                        {/* Current info pill */}
                        <div style={{ display: 'flex', gap: '10px', background: '#FAFFF6', padding: '12px', borderRadius: '10px', border: '1px solid #DCE3D8' }}>
                          <img src={toWebpImage(adjustModalItem.image)} alt={adjustModalItem.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                          <div>
                            <strong style={{ fontSize: '13px', color: '#111827' }}>{adjustModalItem.name}</strong>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: '#687466' }}>
                              <span>Available Stock: <strong style={{ color: '#2D5016' }}>{adjustModalItem.availableStock}</strong></span>
                              <span>Reserved: <strong>{adjustModalItem.reservedStock}</strong></span>
                              <span>Reorder Level: <strong>{adjustModalItem.reorderLevel}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Adjustment Type / Reason */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
                            Adjustment Reason & Type
                          </label>
                          <select
                            className="admin-input-box"
                            value={adjustForm.reason}
                            onChange={(e) => {
                              const r = e.target.value;
                              let cType = 'ADD';
                              let tField = 'availableStock';

                              if (r.includes('Purchase') || r.includes('New Stock') || r.includes('Supplier')) {
                                cType = 'ADD';
                                tField = 'availableStock';
                              } else if (r.includes('Damaged')) {
                                cType = 'DAMAGE';
                                tField = 'damagedStock';
                              } else if (r.includes('Return')) {
                                cType = 'RETURN';
                                tField = 'returnedStock';
                              } else if (r.includes('Expired')) {
                                cType = 'EXPIRED';
                                tField = 'expiredStock';
                              } else if (r.includes('Audit') || r.includes('Physical Count')) {
                                cType = 'SET';
                                tField = 'availableStock';
                              } else if (r.includes('Deduction') || r.includes('Loss')) {
                                cType = 'SUBTRACT';
                                tField = 'availableStock';
                              }

                              setAdjustForm(prev => ({
                                ...prev,
                                reason: r,
                                changeType: cType,
                                targetField: tField
                              }));
                            }}
                          >
                            <option value="Purchase / New Stock Received">Purchase / New Stock Received (+ Available Stock)</option>
                            <option value="Damaged in Store / Warehouse">Damaged in Store / Warehouse (- Available, + Damaged)</option>
                            <option value="Customer Return">Customer Return (+ Returned, + Available)</option>
                            <option value="Expired Stock Removal">Expired Stock Removal (- Available, + Expired)</option>
                            <option value="Physical Inventory Count Audit">Physical Inventory Count Audit (Set Exact Count)</option>
                            <option value="Supplier Shipment Received">Supplier Shipment Received (Convert Incoming to Available)</option>
                            <option value="Internal Stock Correction / Write-off">Internal Stock Deduction / Write-off (- Available)</option>
                          </select>
                        </div>

                        {/* Quantity input */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
                            {adjustForm.changeType === 'SET' ? 'New Total Stock Count' : 'Quantity to Change (Units)'}
                          </label>
                          <input
                            type="number"
                            className="admin-input-box"
                            placeholder="e.g. 25"
                            required
                            min="1"
                            value={adjustForm.quantity}
                            onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
                          />
                        </div>

                        {/* Live calculation preview */}
                        {adjustForm.quantity && (
                          <div style={{ padding: '10px 14px', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', fontSize: '12.5px' }}>
                            <span>Preview: Current Available Stock (<strong>{adjustModalItem.availableStock}</strong>) ➔ New Available Stock (
                              <strong style={{ color: '#15803D' }}>
                                {(() => {
                                  const q = parseInt(adjustForm.quantity, 10) || 0;
                                  if (adjustForm.changeType === 'SET') return q;
                                  if (adjustForm.changeType === 'ADD' || adjustForm.changeType === 'RETURN' || adjustForm.changeType === 'RECEIVE_INCOMING') {
                                    return adjustModalItem.availableStock + q;
                                  }
                                  return Math.max(0, adjustModalItem.availableStock - q);
                                })()}
                              </strong> units)
                            </span>
                          </div>
                        )}

                        {/* Notes */}
                        <div>
                          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#111827', marginBottom: '6px' }}>
                            Notes / Reference (Optional)
                          </label>
                          <textarea
                            rows={2}
                            className="admin-input-box"
                            style={{ height: 'auto', padding: '8px 12px' }}
                            placeholder="e.g., Invoice #INV-8492 from supplier, or audit verification notes"
                            value={adjustForm.notes}
                            onChange={(e) => setAdjustForm(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="inventory-modal__footer">
                        <button type="button" className="admin__ghost" onClick={() => setAdjustModalItem(null)}>
                          Cancel
                        </button>
                        <button type="submit" className="admin__primary" disabled={adjustLoading}>
                          {adjustLoading ? 'Updating Stock...' : 'Confirm Stock Adjustment'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* =========================================================
                 MODAL 2: REORDER LEVEL & BATCH CONFIGURATION
                 ========================================================= */}
              {reorderModalItem && (
                <div className="inventory-modal-backdrop" onClick={() => setReorderModalItem(null)}>
                  <div className="inventory-modal" onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <h2>Inventory & Reorder Settings — {reorderModalItem.name}</h2>
                      <button className="inventory-modal__close" onClick={() => setReorderModalItem(null)}>✕</button>
                    </div>

                    <form onSubmit={handleReorderConfigSave}>
                      <div className="inventory-modal__body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                              Reorder Threshold (Min Units)
                            </label>
                            <input
                              type="number"
                              className="admin-input-box"
                              placeholder="e.g. 10"
                              value={reorderForm.reorderLevel}
                              onChange={(e) => setReorderForm(prev => ({ ...prev, reorderLevel: e.target.value }))}
                            />
                            <span style={{ fontSize: '11px', color: '#687466' }}>Triggers Low Stock warning when stock is below this.</span>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                              Cost Price (₹ per unit)
                            </label>
                            <input
                              type="number"
                              className="admin-input-box"
                              placeholder="e.g. 85"
                              value={reorderForm.costPrice}
                              onChange={(e) => setReorderForm(prev => ({ ...prev, costPrice: e.target.value }))}
                            />
                            <span style={{ fontSize: '11px', color: '#687466' }}>Used for total stock valuation calculation.</span>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                              Batch / Lot Number
                            </label>
                            <input
                              type="text"
                              className="admin-input-box"
                              placeholder="e.g. BAT-2026-09"
                              value={reorderForm.batchNumber}
                              onChange={(e) => setReorderForm(prev => ({ ...prev, batchNumber: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                              Expiry Date
                            </label>
                            <input
                              type="date"
                              className="admin-input-box"
                              value={reorderForm.expiryDate}
                              onChange={(e) => setReorderForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                              Storage Location
                            </label>
                            <input
                              type="text"
                              className="admin-input-box"
                              placeholder="e.g. Aisle 2, Rack C"
                              value={reorderForm.location}
                              onChange={(e) => setReorderForm(prev => ({ ...prev, location: e.target.value }))}
                            />
                          </div>

                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                              Incoming Expected Stock (Units)
                            </label>
                            <input
                              type="number"
                              className="admin-input-box"
                              placeholder="e.g. 50"
                              value={reorderForm.incomingStock}
                              onChange={(e) => setReorderForm(prev => ({ ...prev, incomingStock: e.target.value }))}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="inventory-modal__footer">
                        <button type="button" className="admin__ghost" onClick={() => setReorderModalItem(null)}>
                          Cancel
                        </button>
                        <button type="submit" className="admin__primary" disabled={reorderLoading}>
                          {reorderLoading ? 'Saving...' : 'Save Settings'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* =========================================================
                 MODAL 3: PRODUCT STOCK MOVEMENT HISTORY
                 ========================================================= */}
              {historyModalItem && (
                <div className="inventory-modal-backdrop" onClick={() => setHistoryModalItem(null)}>
                  <div className="inventory-modal" onClick={e => e.stopPropagation()}>
                    <div className="inventory-modal__header">
                      <h2>Movement History — {historyModalItem.name}</h2>
                      <button className="inventory-modal__close" onClick={() => setHistoryModalItem(null)}>✕</button>
                    </div>

                    <div className="inventory-modal__body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#FAF9F6', borderRadius: '8px', fontSize: '12px' }}>
                        <span>Current Available: <strong style={{ color: '#2D5016' }}>{historyModalItem.availableStock}</strong> units</span>
                        <span>Reserved in Orders: <strong>{historyModalItem.reservedStock}</strong> units</span>
                        <span>Reorder Level: <strong>{historyModalItem.reorderLevel}</strong></span>
                      </div>

                      {historyLoading ? (
                        <p style={{ textAlign: 'center', padding: '24px 0', color: '#687466' }}>Loading transaction history...</p>
                      ) : historyLogs.length === 0 ? (
                        <p style={{ textAlign: 'center', padding: '24px 0', color: '#687466' }}>No adjustment transactions recorded yet for this product.</p>
                      ) : (
                        <div className="inventory-timeline">
                          {historyLogs.map(log => (
                            <div key={log.id} className="inventory-timeline-item">
                              <div className="inventory-timeline-item__header">
                                <span style={{ fontSize: '12px', fontWeight: '800', color: '#1C4B12' }}>
                                  {log.reason} ({log.changeType})
                                </span>
                                <span style={{ fontSize: '11px', color: '#687466' }}>
                                  {new Date(log.createdAt).toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '2px' }}>
                                <span>Quantity: <strong>{log.quantity > 0 ? `+${log.quantity}` : log.quantity}</strong></span>
                                <span>Stock Transition: <strong>{log.stockBefore} ➔ {log.stockAfter}</strong></span>
                              </div>
                              {log.notes && (
                                <span style={{ fontSize: '11px', color: '#4B5563', marginTop: '2px', fontStyle: 'italic' }}>
                                  Note: {log.notes}
                                </span>
                              )}
                              <span style={{ fontSize: '10.5px', color: '#9CA3AF' }}>By: {log.adminName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="inventory-modal__footer">
                      <button className="admin__primary" onClick={() => setHistoryModalItem(null)}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Store links banner */}
          {(activeTab === 'retail-products' || activeTab === 'retail-content') && (
            <div className="admin__mode-bar" style={{ marginBottom: '20px' }}>
              <span className="admin__mode-label">🛍️ Retail</span>
              <span className="admin__mode-desc">Products visible to retail customers in Retail mode</span>
              <a href="/home" target="_blank" rel="noopener noreferrer" className="admin__store-link">
                View Retail Store →
              </a>
            </div>
          )}
          {(activeTab === 'wholesale-products' || activeTab === 'wholesale-content') && (
            <div className="admin__mode-bar" style={{ marginBottom: '20px' }}>
              <span className="admin__mode-label">📦 Wholesale</span>
              <span className="admin__mode-desc">Products visible to wholesale customers in Wholesale mode</span>
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
                  <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2D5016', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={Boolean(productDraft.isBestseller)} onChange={(e) => setProductDraft(prev => ({ ...prev, isBestseller: e.target.checked }))} style={{ width: 'auto', margin: 0 }} />
                    <span>Best Seller</span>
                  </label>
                  <label className="admin-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2D5016', fontWeight: 600, cursor: 'pointer' }}>
                    <input type="checkbox" checked={Boolean(productDraft.isTodaysDeal)} onChange={(e) => setProductDraft(prev => ({ ...prev, isTodaysDeal: e.target.checked }))} style={{ width: 'auto', margin: 0 }} />
                    <span>Today's Deal</span>
                  </label>
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
                    <span>Or upload image from device</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                  </label>
                  <textarea value={productDraft.description} onChange={(e) => setProductDraft(prev => ({ ...prev, description: e.target.value }))} placeholder="Description" rows="3" />
                </div>

                <div className="admin-variants-section">
                  <h3>Quantities / Variants</h3>
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
                    {apiLoading ? 'Saving...' : <><FiSave /> Save item</>}
                  </button>
                  {productDraft.id && (
                    <button type="button" className="admin__ghost" onClick={() => { setProductDraft(activeTab === 'wholesale-products' ? blankWholesaleProduct : blankProduct); setCheckedVariants([]); setVariantPrices({}); setCustomVariants([{ label: '', price: '' }]); }}>
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

              <div className="admin-card admin-card--wide">
                <div className="admin-card__toolbar">
                  <h2>Items</h2>
                  <div className="admin-card__actions">
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
                                loadInventory(); // update reserved stock calculations
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

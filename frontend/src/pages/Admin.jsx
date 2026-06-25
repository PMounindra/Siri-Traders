import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBarChart2,
  FiEdit2,
  FiCreditCard,
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
  FiMapPin
} from 'react-icons/fi';
import { getAccounts } from '../context/AuthContext';
import { products as baseProducts, getProducts as getAllProducts } from '../data/products';
import { categories, getAllCategories, getAdminCategories, saveAdminCategories } from '../data/categories';
import { baseDailyOffers, baseFestivalOffers } from '../data/offers';
import { formatPrice } from '../utils/format';
import { toWebpImage } from '../utils/images';
import { getAdminAccounts, getAdminSession, logoutAdmin, saveAdminAccounts, savePendingAdminAccount } from '../utils/adminAuth';
import { getUserStorageKey } from '../utils/userStorage';
import './Admin.css';

const ADMIN_PRODUCTS_RETAIL_KEY = 'siri-admin-products-retail';
const ADMIN_PRODUCTS_WHOLESALE_KEY = 'siri-admin-products-wholesale';
const ADMIN_OFFERS_KEY = 'siri-admin-offers';
const ADMIN_COUPONS_KEY = 'siri-admin-coupons';
const ADMIN_DELIVERY_ZONES_KEY = 'siri-admin-delivery-zones';

// Default Hyderabad delivery zones from shop at Isnapur
const defaultDeliveryZones = [
  { id: 'z1',  area: 'Isnapur / Chitkul',       pincode: '502307', time: '10 mins',   distance: '0 km (shop location)' },
  { id: 'z2',  area: 'Patancheru',               pincode: '502319', time: '15 mins',   distance: '~4 km' },
  { id: 'z3',  area: 'Miyapur',                  pincode: '500049', time: '25 mins',   distance: '~12 km' },
  { id: 'z4',  area: 'Kukatpally',               pincode: '500072', time: '30 mins',   distance: '~16 km' },
  { id: 'z5',  area: 'KPHB Colony',              pincode: '500085', time: '30 mins',   distance: '~17 km' },
  { id: 'z6',  area: 'Bachupally',               pincode: '500090', time: '20 mins',   distance: '~8 km' },
  { id: 'z7',  area: 'Nizampet',                 pincode: '500090', time: '20 mins',   distance: '~9 km' },
  { id: 'z8',  area: 'Kompally',                 pincode: '500014', time: '25 mins',   distance: '~14 km' },
  { id: 'z9',  area: 'Medchal',                  pincode: '501401', time: '40 mins',   distance: '~22 km' },
  { id: 'z10', area: 'Hitech City / Madhapur',   pincode: '500081', time: '45 mins',   distance: '~28 km' },
  { id: 'z11', area: 'Gachibowli',               pincode: '500032', time: '50 mins',   distance: '~32 km' },
  { id: 'z12', area: 'Banjara Hills',            pincode: '500034', time: '55 mins',   distance: '~36 km' },
  { id: 'z13', area: 'Secunderabad',             pincode: '500003', time: '60 mins',   distance: '~40 km' },
  { id: 'z14', area: 'LB Nagar',                 pincode: '500074', time: '75 mins',   distance: '~52 km' },
  { id: 'z15', area: 'Outside Hyderabad',        pincode: 'Other',  time: 'Same day',  distance: '50+ km' },
];

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
  isBestseller: false
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
  discount: '',
  limit: '',
  active: true
};

const blankAdmin = {
  name: '',
  email: '',
  password: '',
  role: 'Manager'
};

const sampleCustomers = [
  {
    name: 'Ravi Kumar',
    email: 'ravi.kumar@example.com',
    phone: '+91 98765 43210',
    address: 'Hitech City, Hyderabad, 500081',
    orders: 6,
    interest: 'Fresh vegetables',
    bought: 'Fresh Tomatoes, Red Onions, Aashirvaad Atta',
    purchases: [
      { item: 'Fresh Tomatoes', quantity: '20 kg', cost: 2000 },
      { item: 'Red Onions', quantity: '10 kg', cost: 650 },
      { item: 'Aashirvaad Atta', quantity: '2 packs', cost: 190 }
    ],
    totalSpent: 2840
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    phone: '+91 91234 56780',
    address: 'Kukatpally, Hyderabad, 500072',
    orders: 4,
    interest: 'Dairy and breakfast',
    bought: 'Amul Milk, Bread, Eggs, Butter',
    purchases: [
      { item: 'Amul Milk', quantity: '12 L', cost: 720 },
      { item: 'Bread', quantity: '6 packs', cost: 270 },
      { item: 'Eggs', quantity: '5 trays', cost: 625 },
      { item: 'Butter', quantity: '2 packs', cost: 150 }
    ],
    totalSpent: 1765
  },
  {
    name: 'Mohammed Imran',
    email: 'imran.m@example.com',
    phone: '+91 99887 76655',
    address: 'Madhapur, Hyderabad, 500081',
    orders: 8,
    interest: 'Rice and atta',
    bought: 'Basmati Rice, Sugar, Cooking Oil',
    purchases: [
      { item: 'Basmati Rice', quantity: '25 kg', cost: 2500 },
      { item: 'Sugar', quantity: '12 kg', cost: 600 },
      { item: 'Cooking Oil', quantity: '8 L', cost: 1020 }
    ],
    totalSpent: 4120
  }
];

const demoOrders = [
  {
    id: 'ORD-1024',
    customer: 'Mounindra Pullepu',
    item: 'Green Capsicum, Fresh Tomatoes',
    quantity: '8 kg total',
    cost: 344,
    status: 'Successfully delivered',
    timelineLabel: 'Delivered',
    timeline: '29 May 2026, 6:35 PM'
  },
  {
    id: 'ORD-1025',
    customer: 'Ravi Kumar',
    item: 'Fresh Tomatoes',
    quantity: '20 kg',
    cost: 2000,
    status: 'Successfully delivered',
    timelineLabel: 'Delivered',
    timeline: '29 May 2026, 4:10 PM'
  },
  {
    id: 'ORD-1026',
    customer: 'Priya Sharma',
    item: 'Amul Milk, Eggs',
    quantity: '12 L + 5 trays',
    cost: 1345,
    status: 'Successfully delivered',
    timelineLabel: 'Delivered',
    timeline: '28 May 2026, 8:20 PM'
  },
  {
    id: 'ORD-1027',
    customer: 'Mohammed Imran',
    item: 'Basmati Rice, Cooking Oil',
    quantity: '25 kg + 8 L',
    cost: 3520,
    status: 'Yet to be delivered',
    timelineLabel: 'Expected',
    timeline: '30 May 2026, 11:00 AM'
  },
  {
    id: 'ORD-1028',
    customer: 'Sai',
    item: 'Fresh Bananas, Red Onions',
    quantity: '6 kg + 5 kg',
    cost: 690,
    status: 'Yet to be delivered',
    timelineLabel: 'Expected',
    timeline: '30 May 2026, 2:30 PM'
  }
];

const demoPayments = [
  {
    billNo: 'BILL-7821',
    orderId: 'ORD-1024',
    customer: 'Mounindra Pullepu',
    method: 'UPI',
    transactionId: 'UPI-SIRI-829104',
    subtotal: 344,
    deliveryFee: 0,
    paid: 344,
    status: 'Paid'
  },
  {
    billNo: 'BILL-7822',
    orderId: 'ORD-1025',
    customer: 'Ravi Kumar',
    method: 'Card',
    transactionId: 'CARD-SIRI-492018',
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
  const [adminSession, setAdminSession] = useState(() => getAdminSession());
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

  const [offers, setOffers] = useState(() => {
    const V = 'v3';
    if (localStorage.getItem('siri-offers-seed') !== V) {
      const seeded = [
        ...baseDailyOffers.map(o => ({ ...o, group: 'daily', active: true })),
        ...baseFestivalOffers.map(o => ({ ...o, group: 'festival', active: true }))
      ];
      writeStorage(ADMIN_OFFERS_KEY, seeded);
      localStorage.setItem('siri-offers-seed', V);
      return seeded;
    }
    try { return JSON.parse(localStorage.getItem(ADMIN_OFFERS_KEY) || '[]'); } catch { return []; }
  });

  const [coupons, setCoupons] = useState(() => {
    const V = 'v3';
    if (localStorage.getItem('siri-coupons-seed') !== V) {
      const seeded = [
        { id: 'c1', code: 'SIRI20',   discount: '20% off up to Rs100',        limit: 'Orders above Rs399',        active: true },
        { id: 'c2', code: 'WELCOME50', discount: 'Rs50 off first order',        limit: 'First order only',         active: true },
        { id: 'c3', code: 'FESTIVE30', discount: '30% off up to Rs120',         limit: 'Festival orders',          active: true },
        { id: 'c4', code: 'EID25',     discount: '25% off up to Rs90',          limit: 'Any order',                active: true },
        { id: 'c5', code: 'FREEDEL',   discount: 'Free delivery fee',           limit: 'Orders above Rs199',       active: true },
        { id: 'c6', code: 'SIRI10',    discount: 'Extra 10% off up to Rs150',   limit: 'Orders above Rs999',       active: true },
        { id: 'c7', code: 'BULK200',   discount: 'Flat Rs200 off',              limit: 'Wholesale above Rs2999',   active: true },
        { id: 'c8', code: 'WSFREE',    discount: 'Free delivery on wholesale',  limit: 'All wholesale orders',     active: true },
        { id: 'c9', code: 'WSBIG15',   discount: 'Extra 15% off',               limit: 'Wholesale above Rs4999',   active: true },
      ];
      writeStorage(ADMIN_COUPONS_KEY, seeded);
      localStorage.setItem('siri-coupons-seed', V);
      return seeded;
    }
    return readStorage(ADMIN_COUPONS_KEY, []);
  });
  const [productDraft, setProductDraft] = useState(blankProduct);
  const [offerDraft, setOfferDraft] = useState(blankOffer);
  const [couponDraft, setCouponDraft] = useState(blankCoupon);
  const [adminAccounts, setAdminAccounts] = useState(() => getAdminAccounts());
  const [adminDraft, setAdminDraft] = useState(blankAdmin);
  const [contentSearch, setContentSearch] = useState('');
  const [adminCategories, setAdminCategories] = useState(() => getAdminCategories());
  const [newCat, setNewCat] = useState({ name: '', image: '', color: '#F7F4EE' });
  const [deliveryZones, setDeliveryZones] = useState(() =>
    readStorage(ADMIN_DELIVERY_ZONES_KEY, defaultDeliveryZones)
  );
  const [newZone, setNewZone] = useState({ area: '', pincode: '', time: '30 mins', distance: '' });
  const persistDeliveryZones = (next) => {
    setDeliveryZones(next);
    writeStorage(ADMIN_DELIVERY_ZONES_KEY, next);
    // Also write to a public key so the app can read it
    localStorage.setItem('siri-delivery-zones', JSON.stringify(next));
  };
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

  const persistOffers = (nextOffers) => {
    setOffers(nextOffers);
    writeStorage(ADMIN_OFFERS_KEY, nextOffers);
  };

  const persistCoupons = (nextCoupons) => {
    setCoupons(nextCoupons);
    writeStorage(ADMIN_COUPONS_KEY, nextCoupons);
  };

  // ── Switch mode and reset draft to appropriate blank ──
  const switchMode = (mode) => {
    setAdminMode(mode);
    setProductDraft(mode === 'wholesale' ? blankWholesaleProduct : blankProduct);
  };

  const customers = useMemo(() => {
    const realCustomers = getAccounts().map(account => {
      const orders = getStoredList(getUserStorageKey(account, 'orders'));
      const addresses = getStoredList(getUserStorageKey(account, 'addresses'));
      const boughtItems = orders.flatMap(order => order.items || []);
      const itemNames = [...new Set(boughtItems.map(item => item.name).filter(Boolean))];
      const purchases = boughtItems.map(item => {
        const quantity = Number(item.quantity || 1);
        const weight = item.weight && item.unit ? `${item.weight}${item.unit}` : 'item';
        return {
          item: item.name,
          quantity: `${quantity} x ${weight}`,
          cost: Number(item.price || 0) * quantity
        };
      });
      const interest = itemNames[0] || 'No purchase interest yet';
      return {
        ...account,
        address: addresses[0] ? `${addresses[0].address}, ${addresses[0].pincode}` : 'No address saved',
        orders: orders.length,
        interest,
        bought: itemNames.join(', ') || 'No orders yet',
        purchases,
        totalSpent: orders.reduce((sum, order) => sum + Number(order.total || 0), 0)
      };
    });
    const realEmails = new Set(realCustomers.map(customer => customer.email.toLowerCase()));
    return [
      ...realCustomers,
      ...sampleCustomers.filter(customer => !realEmails.has(customer.email.toLowerCase()))
    ];
  }, []);

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
    { label: 'Customers', value: customers.length, icon: FiUsers },
    { label: 'Orders', value: demoOrders.length, icon: FiTruck },
  ];

  const exportItems = () => {
    const isWS = activeTab === 'wholesale-products' || activeTab === 'wholesale-content';
    const source = isWS ? wholesaleProducts : retailProducts;
    downloadCsv(`siri-traders-${isWS ? 'wholesale' : 'retail'}-items.csv`, [
      ['ID', 'Name', 'Brand', 'Category', 'Price', 'MRP', 'Discount', 'Stock', 'Description'],
      ...source.map(p => [p.id, p.name, p.brand, p.category, p.price, p.mrp, p.discount, p.stockNote, p.description])
    ]);
  };

  const exportCustomers = () => downloadCsv('siri-traders-customers.csv', [
    ['Name', 'Email', 'Phone', 'Address', 'Orders', 'Interest', 'Bought Items', 'Quantities', 'Costs', 'Total Spent'],
    ...customers.map(customer => [
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.orders,
      customer.interest,
      customer.bought,
      (customer.purchases || []).map(item => `${item.item}: ${item.quantity}`).join(' | '),
      (customer.purchases || []).map(item => `${item.item}: ${item.cost}`).join(' | '),
      customer.totalSpent
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

  const saveProduct = (event) => {
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
      id: productDraft.id || Date.now(),
      price: Number(productDraft.price) || (builtVariants[0]?.price || 0),
      mrp: Number(productDraft.mrp) || Number(productDraft.price) || 0,
      discount: Number(productDraft.discount) || 0,
      image: productDraft.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
      inStock: productDraft.stockNote !== 'Out of stock',
      isBestseller: Boolean(productDraft.isBestseller),
      variants: builtVariants.length > 0 ? builtVariants : undefined
    };

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
      const nextProduct = {
        ...baseNext,
        wholesalePrice: Number(productDraft.wholesalePrice) || baseNext.price,
        bulkPackLabel: productDraft.bulkPackLabel || '',
        bulkPackPrice: Number(productDraft.bulkPackPrice) || 0,
        wholesaleCaseLabel: productDraft.wholesaleCaseLabel || '',
        wholesaleCasePrice: Number(productDraft.wholesaleCasePrice) || 0,
        variants: variants.length > 0 ? variants : undefined
      };
      const exists = wholesaleProducts.some(p => String(p.id) === String(nextProduct.id));
      const next = exists
        ? wholesaleProducts.map(p => String(p.id) === String(nextProduct.id) ? nextProduct : p)
        : [nextProduct, ...wholesaleProducts];
      persistWholesaleProducts(next);
      setProductDraft(blankWholesaleProduct);
    } else {
      const exists = retailProducts.some(p => String(p.id) === String(baseNext.id));
      const next = exists
        ? retailProducts.map(p => String(p.id) === String(baseNext.id) ? baseNext : p)
        : [baseNext, ...retailProducts];
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

  // updateProductStock: applies to the correct array based on whether product has wholesalePrice
  const updateProductStock = (productId, stockNote, isWholesale) => {
    if (isWholesale) {
      persistWholesaleProducts(wholesaleProducts.map(p =>
        p.id === productId ? { ...p, stockNote, inStock: stockNote !== 'Out of stock' } : p
      ));
    } else {
      persistRetailProducts(retailProducts.map(p =>
        p.id === productId ? { ...p, stockNote, inStock: stockNote !== 'Out of stock' } : p
      ));
    }
  };

  // removeProduct: removes from the correct mode's array
  const removeProduct = (productId) => {
    if (activeTab === 'wholesale-products') {
      persistWholesaleProducts(wholesaleProducts.filter(p => p.id !== productId));
    } else {
      persistRetailProducts(retailProducts.filter(p => p.id !== productId));
    }
  };

  const saveOffer = (event) => {
    event.preventDefault();
    const festiveKeywords = /diwali|eid|holi|christmas|navratri|rakhi|onam|sankranti|ramzan|ugadi|ganesh|dussehra|festival|wedding|party/i;
    const group = festiveKeywords.test(offerDraft.title + ' ' + offerDraft.badge) ? 'festival' : 'daily';
    const nextOffer = {
      ...offerDraft,
      id: offerDraft.id || `offer-${Date.now()}`,
      group,
      price: Number(offerDraft.price) || 0,
      mrp: Number(offerDraft.mrp) || 0,
      active: true,
      image: offerDraft.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&q=80'
    };
    persistOffers([nextOffer, ...offers.filter(offer => offer.id !== nextOffer.id)]);
    setOfferDraft(blankOffer);
  };

  const saveCoupon = (event) => {
    event.preventDefault();
    const nextCoupon = { ...couponDraft, id: couponDraft.id || `coupon-${Date.now()}`, code: couponDraft.code.trim().toUpperCase() };
    persistCoupons([nextCoupon, ...coupons.filter(coupon => coupon.id !== nextCoupon.id)]);
    setCouponDraft(blankCoupon);
  };

  const saveAdmin = (event) => {
    event.preventDefault();
    const email = adminDraft.email.trim().toLowerCase();
    if (!adminDraft.name.trim() || !email || !adminDraft.password.trim()) return;
    const nextAdmin = {
      id: `admin-${Date.now()}`,
      name: adminDraft.name.trim(),
      email,
      password: adminDraft.password,
      role: adminDraft.role,
      createdAt: new Date().toLocaleDateString('en-IN')
    };
    const nextAccounts = [nextAdmin, ...adminAccounts.filter(account => account.email.toLowerCase() !== email)];
    setAdminAccounts(nextAccounts);
    saveAdminAccounts(nextAccounts);
    savePendingAdminAccount(nextAdmin);
    setAdminDraft(blankAdmin);
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

  const handleAdminLogout = () => {
    logoutAdmin();
    setAdminSession(null);
    navigate('/admin-login');
  };

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
      <div className="admin">
        <div className="admin__shell">
          <header className="admin__hero">
            <div>
              <img src="/logo-mark.webp" alt="Siri Traders" className="admin__logo" />
              <span className="admin__eyebrow">Siri Traders Control Center</span>
              <h1>Admin Dashboard</h1>
              <p>Manage products, inventory messages, offers, coupons, customer insights, product content, and admin users.</p>
              <span className="admin__session">Signed in as {adminSession.name} / {adminSession.role}</span>
            </div>
            <div className="admin__hero-actions">
              <button className="admin__ghost" onClick={handleAdminLogout}><FiLogOut /> Logout</button>
            </div>
          </header>

          <section className="admin__stats">
            {stats.map(stat => (
              <div key={stat.label} className="admin__stat-card">
                <stat.icon />
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </section>

          <nav className="admin__tabs" aria-label="Admin sections">
            {[
              ['dashboard',          'Overview',          FiBarChart2],
              ['retail-products',    'Retail Items',      FiPackage],
              ['wholesale-products', 'Wholesale Items',   FiPackage],
              ['offers',             'Offers & coupons',  FiGift],
              ['customers',          'Customers',         FiUsers],
              ['orders',             'Orders',            FiShoppingBag],
              ['payments',           'Bills & payments',  FiCreditCard],
              ['retail-content',     'Retail Content',    FiEdit2],
              ['wholesale-content',  'Wholesale Content', FiEdit2],
              ['delivery-zones',     'Delivery Zones',    FiTruck],
              ['admins',             'Admins',            FiLock]
            ].map(([id, label, Icon]) => (              <button
                key={id}
                className={activeTab === id ? 'admin__tab admin__tab--active' : 'admin__tab'}
                onClick={() => setActiveTab(id)}
              >
                <Icon /> {label}
              </button>
            ))}
          </nav>

          {/* Store links banner */}
          {(activeTab === 'retail-products' || activeTab === 'retail-content') && (
            <div className="admin__mode-bar">
              <span className="admin__mode-label">🛍️ Retail</span>
              <span className="admin__mode-desc">Products visible to retail customers at the home page in Retail mode</span>
              <a href="/home" target="_blank" rel="noopener noreferrer" className="admin__store-link">
                View Retail Store →
              </a>
            </div>
          )}
          {(activeTab === 'wholesale-products' || activeTab === 'wholesale-content') && (
            <div className="admin__mode-bar admin__mode-bar--wholesale">
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
                    {[...categories, ...adminCategories].map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
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

                <div className="admin-form__actions">
                  <button type="submit" className="admin__primary"><FiSave /> Save item</button>
                  {productDraft.id && (
                    <button type="button" className="admin__ghost" onClick={() => { setProductDraft(activeTab === 'wholesale-products' ? blankWholesaleProduct : blankProduct); setCheckedVariants([]); setVariantPrices({}); setCustomVariants([{ label: '', price: '' }]); }}>
                      <FiX /> Clear
                    </button>
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
                  onClick={() => {
                    if (!newCat.name.trim()) return;
                    const id = newCat.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                    const existing = [...categories, ...adminCategories].find(c => c.id === id);
                    if (existing) { alert('Category already exists'); return; }
                    const next = [...adminCategories, {
                      id,
                      name: newCat.name.trim(),
                      image: newCat.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
                      color: '#F1F8E9',
                      itemCount: 0,
                      isAdmin: true
                    }];
                    setAdminCategories(next);
                    saveAdminCategories(next);
                    setNewCat({ name: '', image: '', color: '#F1F8E9' });
                  }}
                >
                  <FiPlus /> Add Category
                </button>

                {adminCategories.length > 0 && (
                  <div style={{marginTop:16}}>
                    <strong style={{fontSize:12,color:'#687466',display:'block',marginBottom:8}}>Admin-added categories</strong>
                    {adminCategories.map(cat => (
                      <div key={cat.id} className="admin-row admin-row--plain" style={{marginTop:6,padding:'8px 10px',borderRadius:10,border:'1px solid rgba(45,80,22,0.1)',background:'#FAFFF6'}}>
                        {cat.image && <img src={cat.image} alt={cat.name} style={{width:38,height:38,borderRadius:8,objectFit:'cover',flexShrink:0}} />}
                        <span style={{flex:1}}>
                          {cat.name}
                          <small style={{marginLeft:8,color:'#687466',fontSize:11}}>{cat.id}</small>
                        </span>
                        <button
                          className="admin-danger"
                          style={{display:'flex',alignItems:'center',gap:4,fontSize:12,padding:'4px 10px',borderRadius:7,height:'auto'}}
                          onClick={() => {
                            if (!window.confirm(`Delete "${cat.name}" and all its products?`)) return;
                            // Remove category
                            const nextCats = adminCategories.filter(c => c.id !== cat.id);
                            setAdminCategories(nextCats);
                            saveAdminCategories(nextCats);
                            // Remove all retail products in this category
                            const nextRetail = retailProducts.filter(p => p.category !== cat.id);
                            persistRetailProducts(nextRetail);
                            // Remove all wholesale products in this category
                            const nextWS = wholesaleProducts.filter(p => p.category !== cat.id);
                            persistWholesaleProducts(nextWS);
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
                <input value={couponDraft.code} onChange={(e) => setCouponDraft(prev => ({ ...prev, code: e.target.value }))} placeholder="Coupon code" required />
                <input value={couponDraft.discount} onChange={(e) => setCouponDraft(prev => ({ ...prev, discount: e.target.value }))} placeholder="Discount details e.g. 20% off up to ₹100" />
                <input value={couponDraft.limit} onChange={(e) => setCouponDraft(prev => ({ ...prev, limit: e.target.value }))} placeholder="Usage condition e.g. Orders above ₹399" />
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
                        onClick={() => persistOffers(offers.map(item => item.id === offer.id ? { ...item, active: !item.active } : item))}
                      >
                        {offer.active ? 'Live' : 'Paused'}
                      </button>
                      <button className="admin-danger" style={{flexShrink:0,width:32,height:32,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={() => persistOffers(offers.filter(item => item.id !== offer.id))}>
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
                    <span>{coupon.code} — {coupon.discount}</span>
                    <button onClick={() => persistCoupons(coupons.map(item => item.id === coupon.id ? { ...item, active: !item.active } : item))}>{coupon.active ? 'Active' : 'Off'}</button>
                    <button className="admin-danger" onClick={() => persistCoupons(coupons.filter(item => item.id !== coupon.id))}><FiTrash2 /></button>
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
              {customers.length === 0 ? (
                <p className="admin-muted">No customers yet. New user signups will appear here automatically.</p>
              ) : customers.map(customer => (
                <div key={customer.email} className="admin-customer admin-customer--readonly">
                  <div><strong>{customer.name}</strong><span>{customer.phone} / {customer.email}</span></div>
                  <div><strong>Address</strong><span>{customer.address}</span></div>
                  <div><strong>Interest</strong><span>{customer.interest}</span></div>
                  <div><strong>Bought</strong><span>{customer.bought}</span></div>
                  <div><strong>Quantity</strong><span>{(customer.purchases || []).map(item => `${item.item}: ${item.quantity}`).join(', ') || 'No quantity yet'}</span></div>
                  <div><strong>Cost</strong><span>{(customer.purchases || []).map(item => `${item.item}: ${formatPrice(item.cost)}`).join(', ') || formatPrice(0)}</span></div>
                  <div><strong>Orders</strong><span>{customer.orders}</span></div>
                  <div><strong>Total spent</strong><span>{formatPrice(customer.totalSpent)}</span></div>
                </div>
              ))}
            </section>
          )}

          {activeTab === 'orders' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Customer orders</h2>
              </div>
              <div className="admin-order-list">
                {demoOrders.map(order => (
                  <div key={order.id} className="admin-order-card">
                    <FiTruck />
                    <div>
                      <strong>{order.customer}</strong>
                      <span>{order.id}</span>
                    </div>
                    <div><strong>Item</strong><span>{order.item}</span></div>
                    <div><strong>Quantity</strong><span>{order.quantity}</span></div>
                    <div><strong>Cost</strong><span>{formatPrice(order.cost)}</span></div>
                    <div><strong>Status</strong><span className={`admin-status-pill ${order.status === 'Yet to be delivered' ? 'admin-status-pill--pending' : ''}`}>{order.status}</span></div>
                    <div><strong>{order.timelineLabel}</strong><span>{order.timeline}</span></div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'payments' && (
            <section className="admin-card admin-card--wide">
              <div className="admin-card__toolbar">
                <h2>Transaction bills & payment details</h2>
              </div>
              <div className="admin-payment-list">
                {demoPayments.map(payment => (
                  <div key={payment.billNo} className="admin-payment-card">
                    <FiCreditCard />
                    <div>
                      <strong>{payment.billNo}</strong>
                      <span>{payment.customer} / {payment.orderId}</span>
                    </div>
                    <div><strong>Payment</strong><span>{payment.method}</span></div>
                    <div><strong>Transaction</strong><span>{payment.transactionId}</span></div>
                    <div><strong>Bill</strong><span>Subtotal {formatPrice(payment.subtotal)} + Delivery {formatPrice(payment.deliveryFee)}</span></div>
                    <div><strong>Paid</strong><span>{formatPrice(payment.paid)} / {payment.status}</span></div>
                  </div>
                ))}
              </div>
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
                <div className="admin-form__grid">
                  <input className="admin-input-box" placeholder="Area name e.g. Kukatpally" value={newZone.area} onChange={e => setNewZone(p => ({...p, area: e.target.value}))} />
                  <input className="admin-input-box" placeholder="Pincode e.g. 500072" value={newZone.pincode} onChange={e => setNewZone(p => ({...p, pincode: e.target.value}))} />
                  <select className="admin-input-box" value={newZone.time} onChange={e => setNewZone(p => ({...p, time: e.target.value}))}>
                    {['10 mins','15 mins','20 mins','25 mins','30 mins','35 mins','40 mins','45 mins','50 mins','55 mins','60 mins','75 mins','90 mins','2 hours','3 hours','Same day'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input className="admin-input-box" placeholder="Distance e.g. ~16 km (optional)" value={newZone.distance} onChange={e => setNewZone(p => ({...p, distance: e.target.value}))} />
                </div>
                <button
                  type="button"
                  className="admin__primary"
                  style={{marginTop:10}}
                  onClick={() => {
                    if (!newZone.area.trim() || !newZone.pincode.trim()) return;
                    const zone = { id: `z${Date.now()}`, ...newZone, area: newZone.area.trim(), pincode: newZone.pincode.trim() };
                    persistDeliveryZones([...deliveryZones, zone]);
                    setNewZone({ area: '', pincode: '', time: '30 mins', distance: '' });
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
                      {['Area','Pincode','Delivery Time','Distance','Action'].map(h => (
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
                            onChange={e => persistDeliveryZones(deliveryZones.map(z => z.id === zone.id ? {...z, time: e.target.value} : z))}
                            style={{padding:'4px 8px',borderRadius:7,border:'1px solid rgba(45,80,22,0.2)',background:'#F1F8E9',color:'#2D5016',fontWeight:700,fontSize:12,cursor:'pointer'}}
                          >
                            {['10 mins','15 mins','20 mins','25 mins','30 mins','35 mins','40 mins','45 mins','50 mins','55 mins','60 mins','75 mins','90 mins','2 hours','3 hours','Same day'].map(t => <option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td style={{padding:'10px 12px',color:'#687466',fontSize:12}}>{zone.distance}</td>
                        <td style={{padding:'10px 12px'}}>
                          <button
                            className="admin-danger"
                            style={{width:30,height:30,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center'}}
                            onClick={() => persistDeliveryZones(deliveryZones.filter(z => z.id !== zone.id))}
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
                💡 These times are shown on the product cards and delivery page based on the customer's pincode. Changes apply instantly.
              </p>
            </section>
          )}

          {activeTab === 'admins' && (
            <section className="admin-grid">
              <form className="admin-form" onSubmit={saveAdmin}>
                <h2>Add admin user</h2>
                <input value={adminDraft.name} onChange={(e) => setAdminDraft(prev => ({ ...prev, name: e.target.value }))} placeholder="Full name" required />
                <input value={adminDraft.email} onChange={(e) => setAdminDraft(prev => ({ ...prev, email: e.target.value }))} placeholder="Email" type="email" required />
                <input value={adminDraft.password} onChange={(e) => setAdminDraft(prev => ({ ...prev, password: e.target.value }))} placeholder="Password" type="password" required />
                <select value={adminDraft.role} onChange={(e) => setAdminDraft(prev => ({ ...prev, role: e.target.value }))}>
                  <option>Manager</option>
                  <option>Editor</option>
                  <option>Super Admin</option>
                </select>
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

        </div>
      </div>
    </div>
  );
};

export default Admin;

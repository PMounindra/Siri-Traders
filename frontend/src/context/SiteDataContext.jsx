import { createContext, useContext, useState, useEffect } from 'react';
import { categories as staticCategories } from '../data/categories';
import { fallbackDailyOffers, fallbackFestivalOffers } from '../data/offers';
import { retailCoupons as fallbackRetailCoupons, wholesaleCoupons as fallbackWholesaleCoupons } from '../data/coupons';

const SiteDataContext = createContext();

export const useSiteData = () => {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error('useSiteData must be used within a SiteDataProvider');
  }
  return context;
};

const normalizeOffer = (o) => ({ ...o, group: o.groupType || o.group || 'daily' });

// All known fallback coupons keyed by code for fast lookup
const allFallbackCoupons = [
  ...fallbackRetailCoupons.map(c => ({ ...c, customerType: 'retail' })),
  ...fallbackWholesaleCoupons.map(c => ({ ...c, customerType: 'wholesale' })),
];
const fallbackByCode = new Map(allFallbackCoupons.map(c => [c.code, c]));

/**
 * Merge a DB coupon row with its static fallback so that rows seeded without
 * title/description still display correctly on the home screen.
 */
const normalizeCoupon = (dbCoupon) => {
  const fb = fallbackByCode.get(dbCoupon.code) || {};
  return {
    ...fb,          // start with fallback (has title, description, iconKey, type)
    ...dbCoupon,    // override with real DB values (active, value, minOrder, etc.)
    // if DB row has no title/description, keep fallback values
    title: dbCoupon.title || fb.title || dbCoupon.code,
    description: dbCoupon.description || fb.description || '',
    type: dbCoupon.type || fb.type || 'flat',
  };
};

export const SiteDataProvider = ({ children }) => {
  const [categories, setCategories] = useState(staticCategories);
  const [offers, setOffers] = useState([...fallbackDailyOffers, ...fallbackFestivalOffers]);
  const [coupons, setCoupons] = useState([
    ...fallbackRetailCoupons.map(c => ({ ...c, customerType: 'retail' })),
    ...fallbackWholesaleCoupons.map(c => ({ ...c, customerType: 'wholesale' })),
  ]);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [deliverySettings, setDeliverySettings] = useState({ deliveryFee: 25, freeDeliveryThreshold: 500, handlingCharge: 5 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => (r.ok ? r.json() : Promise.reject(new Error('categories fetch failed')))),
      fetch('/api/offers').then(r => (r.ok ? r.json() : Promise.reject(new Error('offers fetch failed')))),
      fetch('/api/coupons').then(r => (r.ok ? r.json() : Promise.reject(new Error('coupons fetch failed')))),
      fetch('/api/delivery_zones').then(r => (r.ok ? r.json() : Promise.reject(new Error('delivery zones fetch failed')))),
      fetch('/api/settings').then(r => (r.ok ? r.json() : Promise.reject(new Error('settings fetch failed')))),
    ])
      .then(([catRows, offerRows, couponRows, zoneRows, settingsRow]) => {
        if (catRows?.length) setCategories(catRows);
        if (offerRows?.length) setOffers(offerRows.map(normalizeOffer));
        if (couponRows?.length) setCoupons(couponRows.map(normalizeCoupon));
        setDeliveryZones(zoneRows || []);
        if (settingsRow) {
          setDeliverySettings({
            deliveryFee: settingsRow.deliveryFee,
            freeDeliveryThreshold: settingsRow.freeDeliveryThreshold,
            handlingCharge: settingsRow.handlingCharge,
          });
        }
      })
      .catch(err => {
        console.warn('Could not load live site data from database. Falling back to static defaults.', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const dailyOffers = offers.filter(o => o.active !== false && o.group === 'daily');
  const festivalOffers = offers.filter(o => o.active !== false && o.group === 'festival');
  const retailCoupons = coupons.filter(c => c.active !== false && (c.customerType || 'retail') === 'retail');
  const wholesaleCoupons = coupons.filter(c => c.active !== false && c.customerType === 'wholesale');

  const value = {
    categories,
    dailyOffers,
    festivalOffers,
    retailCoupons,
    wholesaleCoupons,
    deliveryZones,
    deliverySettings,
    loading,
  };

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
};

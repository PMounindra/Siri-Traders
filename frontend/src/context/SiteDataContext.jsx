import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { categories as staticCategories } from '../data/categories';
import { fallbackDailyOffers, fallbackFestivalOffers } from '../data/offers';
import { retailCoupons as fallbackRetailCoupons, wholesaleCoupons as fallbackWholesaleCoupons } from '../data/coupons';
import { subscribeSync, SYNC_EVENTS } from '../utils/syncChannel';

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

  const fetchSiteData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [catRows, offerRows, couponRows, zoneRows, settingsRow] = await Promise.all([
        fetch('/api/categories').then(r => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/offers').then(r => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/coupons').then(r => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/delivery_zones').then(r => (r.ok ? r.json() : [])).catch(() => []),
        fetch('/api/settings').then(r => (r.ok ? r.json() : null)).catch(() => null),
      ]);

      if (catRows && catRows.length > 0) setCategories(catRows);
      if (offerRows && offerRows.length > 0) setOffers(offerRows.map(normalizeOffer));
      if (couponRows && couponRows.length > 0) setCoupons(couponRows.map(normalizeCoupon));
      if (zoneRows && zoneRows.length > 0) setDeliveryZones(zoneRows);
      if (settingsRow) {
        setDeliverySettings({
          deliveryFee: settingsRow.deliveryFee ?? 25,
          freeDeliveryThreshold: settingsRow.freeDeliveryThreshold ?? 500,
          handlingCharge: settingsRow.handlingCharge ?? 5,
        });
      }
    } catch (err) {
      console.warn('Could not load live site data from database. Falling back to static defaults.', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchSiteData(true);
  }, [fetchSiteData]);

  // Real-time synchronization: listen for admin changes across all tabs
  useEffect(() => {
    const unsubscribe = subscribeSync(
      [SYNC_EVENTS.SITE_DATA_CHANGED, SYNC_EVENTS.REFRESH_ALL],
      () => {
        fetchSiteData(false);
      }
    );

    // Auto-refresh when tab regains focus
    const onFocus = () => {
      fetchSiteData(false);
    };
    window.addEventListener('focus', onFocus);

    // Periodic sync in background — long interval on purpose: categories and
    // offers carry base64-encoded images too, and refetching them every 25s
    // per open tab is what blew through the Neon data-transfer quota. Focus
    // refetch + cross-tab sync above cover real updates; this is a safety net.
    const interval = setInterval(() => {
      fetchSiteData(false);
    }, 5 * 60 * 1000);

    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [fetchSiteData]);

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
    refreshSiteData: () => fetchSiteData(false),
  };

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
};

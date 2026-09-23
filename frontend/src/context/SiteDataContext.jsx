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
  const [categories, setCategories] = useState([]);
  const [offers, setOffers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [deliverySettings, setDeliverySettings] = useState({ deliveryFee: 25, freeDeliveryThreshold: 500, handlingCharge: 5 });
  const [homeSections, setHomeSections] = useState({
    todaysDeals: true,
    bestsellers: true,
    dailyOffers: true,
    festiveOffers: true,
    shopByCategory: true,
    categories: {}
  });
  const [cmsPages, setCmsPages] = useState([]);
  const [loading, setLoading] = useState(true);

  // ok:false means the request itself failed (network/5xx) — keep whatever's
  // on screen (static fallback or last good fetch). ok:true with an empty
  // array is a legitimate "nothing here" and must replace the fallback.
  const fetchJson = async (url) => {
    try {
      const r = await fetch(url);
      if (!r.ok) return { ok: false, data: null };
      return { ok: true, data: await r.json() };
    } catch {
      return { ok: false, data: null };
    }
  };

  const fetchSiteData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [catRes, offerRes, couponRes, zoneRes, settingsRes, pageRes] = await Promise.all([
        fetchJson('/api/categories'),
        fetchJson('/api/offers'),
        fetchJson('/api/coupons'),
        fetchJson('/api/delivery_zones'),
        fetchJson('/api/settings'),
        fetchJson('/api/settings?action=page'),
      ]);

      if (catRes.ok && Array.isArray(catRes.data)) setCategories(catRes.data);
      if (offerRes.ok && Array.isArray(offerRes.data)) setOffers(offerRes.data.map(normalizeOffer));
      if (couponRes.ok && Array.isArray(couponRes.data)) setCoupons(couponRes.data.map(normalizeCoupon));
      if (zoneRes.ok) setDeliveryZones(zoneRes.data);
      if (pageRes.ok) setCmsPages(pageRes.data);
      if (settingsRes.ok && settingsRes.data) {
        setDeliverySettings({
          deliveryFee: settingsRes.data.deliveryFee ?? 25,
          freeDeliveryThreshold: settingsRes.data.freeDeliveryThreshold ?? 500,
          handlingCharge: settingsRes.data.handlingCharge ?? 5,
        });
        if (settingsRes.data.homeSections) {
          setHomeSections(settingsRes.data.homeSections);
        }
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
  const retailCoupons = coupons.filter(c => c.active !== false && (c.customerType || 'retail') !== 'wholesale');
  const wholesaleCoupons = coupons.filter(c => c.active !== false && (c.customerType === 'wholesale' || c.customerType === 'all'));

  const getCmsPage = (slug) => cmsPages.find(p => p.slug === slug && p.isPublished !== false) || null;

  const value = {
    categories,
    dailyOffers,
    festivalOffers,
    retailCoupons,
    wholesaleCoupons,
    deliveryZones,
    deliverySettings,
    homeSections,
    setHomeSections,
    cmsPages,
    getCmsPage,
    loading,
    refreshSiteData: () => fetchSiteData(false),
  };

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>;
};

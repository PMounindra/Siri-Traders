// Delivery zone lookup utility
// Reads zones set by admin from localStorage
// TODO (backend): replace localStorage read with GET /api/delivery-zones

const DEFAULT_TIME = '30 mins';
const ADMIN_KEY = 'siri-delivery-zones';

export const getDeliveryZones = () => {
  try {
    const saved = localStorage.getItem(ADMIN_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

/**
 * Given a pincode or area name from the customer's saved address,
 * returns the admin-configured delivery time for that area.
 * Falls back to DEFAULT_TIME if no match found.
 */
export const getDeliveryTimeForAddress = (addressObj) => {
  if (!addressObj) return DEFAULT_TIME;
  const zones = getDeliveryZones();
  if (!zones.length) return DEFAULT_TIME;

  const pincode = String(addressObj.pincode || addressObj.city || '').trim();
  const area = String(addressObj.address || '').toLowerCase();

  // 1. Exact pincode match
  const byPin = zones.find(z => z.pincode === pincode);
  if (byPin) return byPin.time;

  // 2. Partial area name match
  const byArea = zones.find(z =>
    area.includes(z.area.toLowerCase()) ||
    z.area.toLowerCase().split('/').some(part => area.includes(part.trim().toLowerCase()))
  );
  if (byArea) return byArea.time;

  // 3. Fallback to "Outside Hyderabad" zone if defined
  const fallback = zones.find(z => z.area.toLowerCase().includes('outside'));
  return fallback ? fallback.time : DEFAULT_TIME;
};

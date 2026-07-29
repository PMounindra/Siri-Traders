// Delivery zone lookup utility.
// Zones are set by admin and live in the `delivery_zones` DB table,
// fetched once via SiteDataContext and passed in here.

const DEFAULT_TIME = '30 mins';

/**
 * Given a pincode or area name from the customer's saved address,
 * returns the admin-configured delivery time for that area.
 * Falls back to DEFAULT_TIME if no match found.
 */
export const getDeliveryTimeForAddress = (addressObj, zones = []) => {
  if (!addressObj || !zones.length) return DEFAULT_TIME;

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

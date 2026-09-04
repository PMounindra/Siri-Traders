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
  const area = String(addressObj.area || addressObj.address || '').toLowerCase();

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

// Strips common Indian administrative-area qualifiers that Nominatim (or an
// admin's own zone naming) may or may not include, so "Isnapur" and
// "Isnapur Municipality" are recognized as the same place.
const normalizeAreaName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/\b(mandal|village|municipality|municipal corporation|grama panchayat|gram panchayat|panchayat|colony|ward)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Detects the browser's GPS position, reverse-geocodes it via OpenStreetMap's
 * free Nominatim API (no key needed), and matches the result against the
 * given serviceable delivery zones — first by exact pincode, then by a
 * normalized locality-name match against several candidate address fields
 * (broader than just "suburb", since Nominatim's field choice varies a lot
 * for smaller Indian towns/villages).
 *
 * Returns { zone: { name, pincode } | null, error: string | null }. Never
 * throws — every failure mode (no geolocation support, permission denied,
 * geocoding failure, no matching zone) comes back as a friendly `error`.
 */
export const detectCurrentDeliveryZone = async (zones = []) => {
  if (!navigator.geolocation) {
    return { zone: null, error: "Your browser doesn't support location detection. Please select your area manually." };
  }

  const position = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });

  if (!position) {
    return { zone: null, error: "Couldn't access your location. Please allow location access or select your area manually." };
  }

  try {
    const { latitude, longitude } = position.coords;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    const addr = data?.address || {};
    const postcode = addr.postcode || '';
    const localityCandidates = [
      addr.suburb, addr.neighbourhood, addr.quarter, addr.hamlet,
      addr.village, addr.town, addr.city_district, addr.municipality,
      addr.city, addr.county,
    ].filter(Boolean).map(normalizeAreaName);

    let zone = postcode ? zones.find((z) => z.pincode === postcode) : null;

    if (!zone) {
      zone = zones.find((z) => {
        const zoneName = normalizeAreaName(z.area);
        return localityCandidates.some((loc) => loc && (loc.includes(zoneName) || zoneName.includes(loc)));
      });
    }

    if (zone) {
      return { zone: { name: zone.area, pincode: zone.pincode }, error: null };
    }
    return { zone: null, error: "We don't deliver to your current location yet. Please select a serviceable area manually." };
  } catch {
    return { zone: null, error: "Couldn't detect your area right now. Please select it manually." };
  }
};

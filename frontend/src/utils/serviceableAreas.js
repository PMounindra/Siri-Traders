// Areas where Siri Traders delivers
// Shop: H.No 10-152, Nagarjuna Colony Road No 12, Chitkul, Isnapur Municipality, 502307

export const SERVICEABLE_AREAS = [
  { name: 'Isnapur',    pincode: '502307' },
  { name: 'Chitkul',   pincode: '502307' },
  { name: 'Muttangi',  pincode: '502307' },
  { name: 'Rudraram',  pincode: '502307' },
  { name: 'Indrakaran',pincode: '502307' },
  { name: 'Lakdaram',  pincode: '502307' },
  { name: 'Bachuguda', pincode: '502307' },
  { name: 'Indresham', pincode: '502334' },
  { name: 'Pocharam',  pincode: '502307' },
];

/**
 * Check if a given address/area string is within the serviceable zones.
 * Returns true if deliverable, false otherwise.
 */
export const isServiceableAddress = (addressText = '', pincode = '') => {
  const lower = addressText.toLowerCase();
  const pin = String(pincode).trim();

  // Check by area name
  if (SERVICEABLE_AREAS.some(a => lower.includes(a.name.toLowerCase()))) return true;

  // Check by pincode
  if (pin && SERVICEABLE_AREAS.some(a => a.pincode === pin)) return true;

  return false;
};

/**
 * useAdminApi — lightweight hook for all admin CRUD calls.
 *
 * The admin dashboard authenticates via a real httpOnly session cookie
 * (set by POST /api/admin/login) — the browser sends it automatically on
 * same-origin requests, so no secret ever needs to live in client JS.
 */

const jsonHeaders = { 'Content-Type': 'application/json' };
const withCreds = { credentials: 'include' };

async function asJson(res, fallbackError) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || fallbackError);
  return json;
}

// ── Auth ─────────────────────────────────────────────────────────────────

export async function apiAdminLogin(email, password) {
  const res = await fetch('/api/admin/auth?action=login', {
    method: 'POST',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify({ email, password }),
  });
  return asJson(res, 'Login failed');
}

export async function apiAdminLogout() {
  await fetch('/api/admin/auth?action=logout', { method: 'POST', ...withCreds });
}

export async function apiAdminMe() {
  const res = await fetch('/api/admin/auth?action=me', withCreds);
  if (res.status === 401) return null;
  if (!res.ok) return null;
  return res.json();
}

export async function apiFetchAdminUsers() {
  const res = await fetch('/api/admin/auth?action=admin-users', withCreds);
  if (!res.ok) throw new Error('Failed to load admins');
  return res.json();
}

export async function apiCreateAdminUser(data) {
  const res = await fetch('/api/admin/auth?action=admin-users', {
    method: 'POST',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to create admin');
}

// ── Products ─────────────────────────────────────────────────────────────

export async function apiFetchProducts() {
  const res = await fetch('/api/products?limit=500');
  if (!res.ok) throw new Error('Failed to load products');
  return res.json();
}

export async function apiCreateProduct(data) {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to create product');
}

export async function apiUpdateProduct(id, data) {
  const res = await fetch(`/api/products?id=${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to update product');
}

export async function apiDeleteProduct(id) {
  const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE', ...withCreds });
  return asJson(res, 'Failed to delete product');
}

// ── Orders / Users (admin) ────────────────────────────────────────────────

export async function apiFetchAllOrders() {
  const res = await fetch('/api/admin/orders', withCreds);
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json();
}

export async function apiUpdateOrderStatus(id, status) {
  const res = await fetch(`/api/admin/orders?id=${id}`, {
    method: 'PATCH',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify({ status }),
  });
  return asJson(res, 'Failed to update order');
}

export async function apiFetchAllUsers() {
  const res = await fetch('/api/admin/users', withCreds);
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

// ── Offers ───────────────────────────────────────────────────────────────

export async function apiFetchOffers() {
  const res = await fetch('/api/offers');
  if (!res.ok) throw new Error('Failed to load offers');
  return res.json();
}

export async function apiSaveOffer(data) {
  const res = await fetch('/api/offers', {
    method: 'POST',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to save offer');
}

export async function apiUpdateOffer(id, data) {
  const res = await fetch(`/api/offers?id=${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to update offer');
}

export async function apiDeleteOffer(id) {
  const res = await fetch(`/api/offers?id=${id}`, { method: 'DELETE', ...withCreds });
  return asJson(res, 'Failed to delete offer');
}

// ── Coupons ──────────────────────────────────────────────────────────────

export async function apiFetchCoupons() {
  const res = await fetch('/api/coupons');
  if (!res.ok) throw new Error('Failed to load coupons');
  return res.json();
}

export async function apiSaveCoupon(data) {
  const res = await fetch('/api/coupons', {
    method: 'POST',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to save coupon');
}

export async function apiUpdateCoupon(id, data) {
  const res = await fetch(`/api/coupons?id=${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to update coupon');
}

export async function apiDeleteCoupon(id) {
  const res = await fetch(`/api/coupons?id=${id}`, { method: 'DELETE', ...withCreds });
  return asJson(res, 'Failed to delete coupon');
}

// ── Delivery zones ───────────────────────────────────────────────────────

export async function apiFetchDeliveryZones() {
  const res = await fetch('/api/delivery_zones');
  if (!res.ok) throw new Error('Failed to load delivery zones');
  return res.json();
}

export async function apiSaveDeliveryZone(data) {
  const res = await fetch('/api/delivery_zones', {
    method: 'POST',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to save delivery zone');
}

export async function apiUpdateDeliveryZone(id, data) {
  const res = await fetch(`/api/delivery_zones?id=${id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to update delivery zone');
}

export async function apiDeleteDeliveryZone(id) {
  const res = await fetch(`/api/delivery_zones?id=${id}`, { method: 'DELETE', ...withCreds });
  return asJson(res, 'Failed to delete delivery zone');
}

// ── Categories ───────────────────────────────────────────────────────────

export async function apiFetchCategories() {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Failed to load categories');
  return res.json();
}

export async function apiCreateCategory(data) {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: jsonHeaders,
    ...withCreds,
    body: JSON.stringify(data),
  });
  return asJson(res, 'Failed to create category');
}

export async function apiDeleteCategory(id) {
  const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE', ...withCreds });
  return asJson(res, 'Failed to delete category');
}

// ── Hook ─────────────────────────────────────────────────────────────────
// Admin.jsx calls adminApi.xxx(), so expose named methods as a plain object.
export function useAdminApi() {
  return {
    me: apiAdminMe,
    logout: apiAdminLogout,
    fetchAdminUsers: apiFetchAdminUsers,
    createAdminUser: apiCreateAdminUser,

    fetchProducts: apiFetchProducts,
    createProduct: apiCreateProduct,
    updateProduct: apiUpdateProduct,
    deleteProduct: apiDeleteProduct,

    fetchAllOrders: apiFetchAllOrders,
    updateOrderStatus: apiUpdateOrderStatus,
    fetchAllUsers: apiFetchAllUsers,

    fetchOffers: apiFetchOffers,
    saveOffer: apiSaveOffer,
    updateOffer: apiUpdateOffer,
    deleteOffer: apiDeleteOffer,

    fetchCoupons: apiFetchCoupons,
    saveCoupon: apiSaveCoupon,
    updateCoupon: apiUpdateCoupon,
    deleteCoupon: apiDeleteCoupon,

    fetchDeliveryZones: apiFetchDeliveryZones,
    saveDeliveryZone: apiSaveDeliveryZone,
    updateDeliveryZone: apiUpdateDeliveryZone,
    deleteDeliveryZone: apiDeleteDeliveryZone,

    fetchCategories: apiFetchCategories,
    createCategory: apiCreateCategory,
    deleteCategory: apiDeleteCategory,
  };
}

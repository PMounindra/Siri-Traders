/**
 * useAdminApi — lightweight hook for all admin CRUD calls.
 *
 * The admin dashboard uses a custom login (not Clerk), so we use
 * a shared ADMIN_SECRET env var to authenticate API requests.
 * The secret is the same on the server (ADMIN_SECRET) and the
 * frontend (VITE_ADMIN_SECRET), injected via .env.
 */

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET || '';

function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': ADMIN_SECRET,
  };
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
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to create product');
  return json;
}

export async function apiUpdateProduct(id, data) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'PUT',
    headers: adminHeaders(),
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update product');
  return json;
}

export async function apiDeleteProduct(id) {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to delete product');
  return json;
}

// ── Orders (admin) ────────────────────────────────────────────────────────

export async function apiFetchAllOrders() {
  const res = await fetch('/api/admin/orders', { headers: adminHeaders() });
  if (!res.ok) throw new Error('Failed to load orders');
  return res.json();
}

export async function apiUpdateOrderStatus(id, status) {
  const res = await fetch(`/api/admin/orders/${id}`, {
    method: 'PATCH',
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Failed to update order');
  return json;
}

// ── Hook (backwards compat) ───────────────────────────────────────────────
// Admin.jsx calls adminApi.xxx(), so expose named methods as a plain object.
export function useAdminApi() {
  return {
    fetchProducts: apiFetchProducts,
    createProduct: apiCreateProduct,
    updateProduct: apiUpdateProduct,
    deleteProduct: apiDeleteProduct,
    fetchAllOrders: apiFetchAllOrders,
    updateOrderStatus: apiUpdateOrderStatus,
  };
}

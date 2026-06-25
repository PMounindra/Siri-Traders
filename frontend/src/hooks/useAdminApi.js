/**
 * useAdminApi — lightweight hook for all admin CRUD calls.
 * Reads the Clerk token from the global ClerkJS instance.
 * All functions throw on error so callers can catch + alert.
 */

import { useClerk } from '@clerk/clerk-react';
import { useCallback } from 'react';

export function useAdminApi() {
  const { session } = useClerk();

  const getToken = useCallback(async () => {
    if (!session) throw new Error('No Clerk session');
    return session.getToken();
  }, [session]);

  const authHeaders = useCallback(async () => {
    const token = await getToken();
    return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  }, [getToken]);

  // ── Products ─────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    const res = await fetch('/api/products?limit=200');
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  }, []);

  const createProduct = useCallback(async (data) => {
    const headers = await authHeaders();
    const res = await fetch('/api/products', {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to create product');
    return json;
  }, [authHeaders]);

  const updateProduct = useCallback(async (id, data) => {
    const headers = await authHeaders();
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update product');
    return json;
  }, [authHeaders]);

  const deleteProduct = useCallback(async (id) => {
    const headers = await authHeaders();
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to delete product');
    return json;
  }, [authHeaders]);

  // ── Orders (admin) ───────────────────────────────────────────────

  const fetchAllOrders = useCallback(async () => {
    const headers = await authHeaders();
    const res = await fetch('/api/admin/orders', { headers });
    if (!res.ok) throw new Error('Failed to load orders');
    return res.json();
  }, [authHeaders]);

  const updateOrderStatus = useCallback(async (id, status) => {
    const headers = await authHeaders();
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update order');
    return json;
  }, [authHeaders]);

  return {
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    fetchAllOrders,
    updateOrderStatus,
  };
}

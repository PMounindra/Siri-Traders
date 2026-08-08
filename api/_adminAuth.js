/**
 * _adminAuth.js — shared admin authentication helper.
 *
 * Accepts any of:
 *  1. A valid admin session cookie (set by POST /api/admin/login), OR
 *  2. A valid Clerk session with role='admin' in publicMetadata, OR
 *  3. The x-admin-secret header matching process.env.ADMIN_SECRET (legacy/scripts)
 *
 * Returns true if authenticated as admin, false otherwise.
 */

import { getSessionFromRequest } from './_adminSession.js';
import { clerk, getAuthenticatedUserId } from './_clerkAuth.js';

export async function isAdminRequest(req) {
  // ── Method 1: real admin session cookie ────────────────────────────────
  if (getSessionFromRequest(req)) {
    return true;
  }

  // ── Method 2: shared admin secret header (legacy/scripts) ──────────────
  const secret = process.env.ADMIN_SECRET;
  if (secret && req.headers['x-admin-secret'] === secret) {
    return true;
  }

  // ── Method 3: Clerk session with admin role ────────────────────────────
  try {
    const userId = await getAuthenticatedUserId(req);
    if (!userId) return false;
    const user = await clerk.users.getUser(userId);
    return user.publicMetadata?.role === 'admin';
  } catch {
    return false;
  }
}

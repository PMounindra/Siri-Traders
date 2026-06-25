/**
 * _adminAuth.js — shared admin authentication helper.
 *
 * Accepts either:
 *  1. A valid Clerk session with role='admin' in publicMetadata, OR
 *  2. The x-admin-secret header matching process.env.ADMIN_SECRET
 *
 * Returns true if authenticated as admin, false otherwise.
 */

import { createClerkClient } from '@clerk/backend';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function isAdminRequest(req) {
  // ── Method 1: shared admin secret header ──────────────────────────────
  const secret = process.env.ADMIN_SECRET;
  if (secret && req.headers['x-admin-secret'] === secret) {
    return true;
  }

  // ── Method 2: Clerk session with admin role ───────────────────────────
  try {
    const authRequest = await clerk.authenticateRequest(req);
    const { userId } = authRequest;
    if (!userId) return false;
    const user = await clerk.users.getUser(userId);
    return user.publicMetadata?.role === 'admin';
  } catch {
    return false;
  }
}

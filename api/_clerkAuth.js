/**
 * _clerkAuth.js — verify a Clerk session token on Vercel's Node.js runtime.
 *
 * Uses Clerk's verifyToken() with the correct jwtKey option so it can
 * verify the JWT signature without needing to call out to Clerk's JWKS endpoint
 * (which requires the publishable key). We pass both secretKey and the
 * issuer so the SDK knows where to fetch the JWKS keys from.
 */

import { createClerkClient, verifyToken } from '@clerk/backend';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
// Clerk publishable key - may be set under either name
const CLERK_PUBLISHABLE_KEY =
  process.env.CLERK_PUBLISHABLE_KEY ||
  process.env.VITE_CLERK_PUBLISHABLE_KEY ||
  'pk_test_bmV4dC1sb25naG9ybi00Ny5jbGVyay5hY2NvdW50cy5kZXYk';

export const clerk = createClerkClient({
  secretKey: CLERK_SECRET_KEY,
  publishableKey: CLERK_PUBLISHABLE_KEY,
});

export async function getAuthenticatedUserId(req) {
  if (!CLERK_SECRET_KEY) {
    console.error('getAuthenticatedUserId: CLERK_SECRET_KEY is not set');
    return null;
  }

  // Extract the Bearer token from the Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    console.error('getAuthenticatedUserId: no Bearer token on request');
    return null;
  }

  try {
    // Use verifyToken with the publishable key as the issuer so Clerk SDK
    // can fetch JWKS and verify the signature
    const payload = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
      publishableKey: CLERK_PUBLISHABLE_KEY,
    });

    if (!payload || !payload.sub) {
      console.error('getAuthenticatedUserId: verifyToken returned no payload');
      return null;
    }

    return payload.sub;
  } catch (err) {
    console.error('getAuthenticatedUserId: verifyToken threw', err?.message);
    return null;
  }
}

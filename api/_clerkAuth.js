/**
 * _clerkAuth.js — verify a Clerk session token on Vercel's Node.js runtime.
 *
 * clerk.authenticateRequest(req) expects a Web-standard Request object
 * (it calls req.headers.get(...) internally). Vercel's Node functions hand
 * handlers a Node-style req instead (req.headers is a plain object with no
 * .get method), so authenticateRequest always threw and every caller fell
 * into its catch block and returned 401 — no order ever actually got
 * authenticated. Extracting the Bearer token ourselves and verifying it
 * directly with verifyToken() sidesteps the Request-shape mismatch entirely.
 */

import { createClerkClient, verifyToken } from '@clerk/backend';

export const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function getAuthenticatedUserId(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) {
    console.error('getAuthenticatedUserId: no Bearer token on request');
    return null;
  }
  if (!process.env.CLERK_SECRET_KEY) {
    console.error('getAuthenticatedUserId: CLERK_SECRET_KEY is not set');
    return null;
  }

  try {
    const { data, errors } = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    if (errors) {
      console.error('getAuthenticatedUserId: verifyToken errors', JSON.stringify(errors));
      return null;
    }
    if (!data) {
      console.error('getAuthenticatedUserId: verifyToken returned no data');
      return null;
    }
    return data.sub || null;
  } catch (err) {
    console.error('getAuthenticatedUserId: verifyToken threw', err?.message, err?.stack);
    return null;
  }
}

/**
 * _clerkAuth.js — verify a Clerk session token on Vercel's Node.js runtime.
 *
 * Uses the Clerk backend SDK's authenticateRequest() properly by constructing
 * a Web-standard Request from the Node.js incoming request. This is the
 * official, supported way to verify Clerk tokens in serverless functions.
 */

import { createClerkClient } from '@clerk/backend';

export const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

export async function getAuthenticatedUserId(req) {
  if (!process.env.CLERK_SECRET_KEY) {
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
    // authenticateRequest needs a Web-standard Request object.
    // We construct a minimal one from the Node.js req.
    const url = `https://${req.headers.host || 'siritrader.com'}${req.url || '/'}`;
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers.set(key, value);
      } else if (Array.isArray(value)) {
        headers.set(key, value.join(', '));
      }
    }

    const webRequest = new Request(url, { method: req.method || 'GET', headers });

    const state = await clerk.authenticateRequest(webRequest, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!state.isSignedIn) {
      console.error('getAuthenticatedUserId: not signed in, reason:', state.reason || 'unknown');
      return null;
    }

    const payload = state.toAuth();
    return payload?.userId || null;
  } catch (err) {
    console.error('getAuthenticatedUserId: threw', err?.message);
    return null;
  }
}

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { setCorsHeaders } from './_cors.js';
import { getAuthenticatedUserId } from './_clerkAuth.js';

// Setup Upstash Redis rate limiting: 5 requests per 30 seconds for checkout
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '30 s'),
});

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Auth check
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Rate limiting check
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { success } = await ratelimit.limit(`checkout_${userId}`);
      if (!success) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
    }
  } catch (err) {
    console.error("Rate limiting connection warning:", err);
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { total, items } = body;

    if (!total || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing checkout details' });
    }

    // Simulate initiating a checkout session
    const sessionId = `chk_session_${Math.random().toString(36).substring(2, 15)}`;

    return res.status(200).json({
      success: true,
      sessionId,
      total,
      redirectUrl: `/checkout?session=${sessionId}`
    });
  } catch (error) {
    console.error("Error in /api/checkout:", error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

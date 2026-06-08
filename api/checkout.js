import { createClerkClient } from '@clerk/backend';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1. Auth check
  let authRequest;
  try {
    authRequest = await clerk.authenticateRequest(req);
  } catch (err) {
    console.error("Clerk auth connection error:", err);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId } = authRequest;
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

    if (!total || !items || !items.length) {
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

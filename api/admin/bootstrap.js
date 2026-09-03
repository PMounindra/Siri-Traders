// One-time migration runner (admin-secret gated). Recreated as needed —
// see git history for prior uses. This dev environment can't reach Postgres
// directly, so one-off DB changes get run through a deployed endpoint instead.
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db, adminUsers } from '../../db/index.js';
import { setCorsHeaders } from '../_cors.js';

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { currentEmail, newUsername, newPassword } = body || {};
    if (!currentEmail || !newUsername || !newPassword) {
      return res.status(400).json({ error: 'currentEmail, newUsername, newPassword are required' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await db.update(adminUsers)
      .set({ email: newUsername, passwordHash })
      .where(eq(adminUsers.email, currentEmail))
      .returning();
    return res.status(200).json({ ok: true, updated: updated.map(({ passwordHash: _omit, ...rest }) => rest) });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return res.status(500).json({ error: error.message });
  }
}

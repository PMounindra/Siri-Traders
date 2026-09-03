// One-time setup endpoint used to stand up a fresh database (schema + seed
// content) — used for the Neon -> Supabase migration. Admin-secret gated.
// Safe to leave in place: every step is idempotent (IF NOT EXISTS / onConflictDoNothing).
import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { seedDatabase } from '../../db/seed.js';
import { INITIAL_SCHEMA_SQL } from '../../db/schema_sql.js';
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

  const step = req.query.step;

  try {
    if (step === 'schema') {
      await db.execute(sql.raw(INITIAL_SCHEMA_SQL));
      return res.status(200).json({ ok: true, step: 'schema' });
    }

    if (step === 'seed') {
      await seedDatabase();
      return res.status(200).json({ ok: true, step: 'seed' });
    }

    return res.status(400).json({ error: 'Unknown step. Use ?step=schema or ?step=seed' });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return res.status(500).json({ error: error.message });
  }
}

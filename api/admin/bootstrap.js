// One-time migration runner (admin-secret gated). Recreated as needed —
// see git history for prior uses. Applies drizzle/000N_*.sql migrations that
// haven't been run yet against the live DB, since this dev environment can't
// reach Postgres directly (see [[neon-to-supabase-migration]] memory).
import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { setCorsHeaders } from '../_cors.js';

const MIGRATION_SQL = `ALTER TABLE "order_items" ALTER COLUMN "product_id" DROP NOT NULL;`;

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
    await db.execute(sql.raw(MIGRATION_SQL));
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return res.status(500).json({ error: error.message });
  }
}

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db, adminUsers } from '../../db/index.js';
import { setCorsHeaders } from '../_cors.js';
import { isAdminRequest } from '../_adminAuth.js';
import { signAdminSession, setSessionCookie, clearSessionCookie, getSessionFromRequest } from '../_adminSession.js';

const createAdminSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().min(1).optional()
});

async function handleLogin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const rows = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  const admin = rows[0];
  if (!admin) {
    return res.status(401).json({ error: 'Invalid admin email or password' });
  }

  const passwordMatches = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid admin email or password' });
  }

  const token = signAdminSession({ sub: admin.id, email: admin.email, name: admin.name, role: admin.role });
  setSessionCookie(req, res, token);

  return res.status(200).json({ name: admin.name, email: admin.email, role: admin.role });
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  clearSessionCookie(req, res);
  return res.status(200).json({ success: true });
}

async function handleMe(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const session = getSessionFromRequest(req);
  if (!session) return res.status(401).json({ error: 'Not signed in' });
  return res.status(200).json({ name: session.name, email: session.email, role: session.role });
}

async function handleAdminUsers(req, res) {
  const adminOk = await isAdminRequest(req);
  if (!adminOk) return res.status(403).json({ error: 'Forbidden: admin access required' });

  if (req.method === 'GET') {
    const rows = await db.select().from(adminUsers);
    const safe = rows.map(({ passwordHash, ...rest }) => rest);
    return res.status(200).json(safe);
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const validation = createAdminSchema.safeParse(body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.error.errors });
    }

    const { name, email, password, role } = validation.data;
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);
    const id = `admin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const inserted = await db.insert(adminUsers).values({
      id,
      name,
      email: normalizedEmail,
      passwordHash,
      role: role || 'Manager'
    }).returning();

    const { passwordHash: _omit, ...safe } = inserted[0];
    return res.status(201).json(safe);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    if (action === 'login') return await handleLogin(req, res);
    if (action === 'logout') return await handleLogout(req, res);
    if (action === 'me') return await handleMe(req, res);
    if (action === 'admin-users') return await handleAdminUsers(req, res);
    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'An admin with that email already exists' });
    }
    console.error(`Error in /api/admin/auth (action=${action}):`, error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
}

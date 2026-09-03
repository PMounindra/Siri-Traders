import { put } from '@vercel/blob';
import { setCorsHeaders } from './_cors.js';
import { isAdminRequest } from './_adminAuth.js';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminOk = await isAdminRequest(req);
  if (!adminOk) {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }

  const filename = String(req.query.filename || '').trim();
  if (!filename) {
    return res.status(400).json({ error: 'filename query param is required' });
  }

  const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || '');
  if (!buffer.length) {
    return res.status(400).json({ error: 'Empty file' });
  }
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: 'Image is too large (max 8MB).' });
  }

  try {
    const blob = await put(filename, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: req.headers['content-type'] || 'application/octet-stream',
    });
    return res.status(200).json({ url: blob.url });
  } catch (error) {
    console.error('Error in /api/upload:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
  }
}

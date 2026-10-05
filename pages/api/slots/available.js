import { verifyAdminToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  return res.status(200).json({ valid: true, user: payload });
}

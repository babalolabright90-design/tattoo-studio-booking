import { getDb } from '../../../lib/db';
import { signAdminToken } from '../../../lib/auth';
const bcrypt = require('bcryptjs');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const db = await getDb();
  const admin = await db.get('SELECT * FROM admin_users WHERE email = ?', [email]);

  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }

  const token = signAdminToken({ id: admin.id, email: admin.email, name: admin.name });
  return res.status(200).json({ token, admin: { email: admin.email, name: admin.name } });
}

import { getDb } from '../../../lib/db';
import { verifyAdminToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const decoded = verifyAdminToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { date } = req.query;
  const db = await getDb();
  const bookings = await db.all(
    `SELECT * FROM bookings WHERE booking_date = ? ORDER BY booking_time ASC`,
    [date || new Date().toISOString().slice(0, 10)]
  );

  return res.status(200).json({ bookings });
}

import { getDb } from '../../../lib/db';
import { verifyAdminToken } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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

  const { id, status } = req.body || {};
  if (!id || !status) {
    return res.status(400).json({ error: 'Booking ID and status are required.' });
  }

  const allowed = ['pending', 'confirmed', 'completed', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Status is invalid.' });
  }

  const db = await getDb();
  const result = await db.run(
    'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [status, id]
  );

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  return res.status(200).json({ message: 'Booking updated successfully.' });
}

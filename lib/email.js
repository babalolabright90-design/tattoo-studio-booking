const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tattoo-studio-secret-key';

function signAdminToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

function verifyAdminToken(token) {
  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = { signAdminToken, verifyAdminToken };

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const CHAT_PWD = process.env.CHAT_PWD;

export function login(req, res) {
  const { username, password, rememberMe = false } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }
  if (!/^[A-Za-z]+$/.test(username)) {
    return res.status(400).json({ error: 'Username must contain only letters' });
  }
  if (username.length > 20) {
    return res.status(400).json({ error: 'Username must be 20 characters or less' });
  }
  // simple password check for demo purposes
  if (password !== CHAT_PWD) {
    return res.status(401).json({ error: 'Wrong username or password'});
  }

  const token = jwt.sign(
    { sub: username },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256'
    }
  );

  if (rememberMe) {
    // Store JWT in httpOnly cookie
    const maxAge = parseExpirationTime(JWT_EXPIRES_IN);
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge
    });
  }
  res.json(token);
}

/**
 * Convert JWT expiration string to milliseconds
 * @param {string} expiresIn - JWT expiration string (e.g., '15m', '1h', '7d')
 * @returns {number} - Milliseconds
 */
function parseExpirationTime(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60 * 1000; // default 15 minutes

  const [, value, unit] = match;
  const num = parseInt(value);

  const units = {
    s: 1000,           // seconds
    m: 60 * 1000,      // minutes
    h: 60 * 60 * 1000, // hours
    d: 24 * 60 * 60 * 1000 // days
  };

  return num * (units[unit] || units.m);
}
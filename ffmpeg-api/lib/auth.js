/**
 * API Key Authentication Middleware
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error('API_KEY not configured in environment');
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  if (!authHeader) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid Authorization format. Use: Bearer <token>' });
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  if (token !== apiKey) {
    console.warn(`Invalid API key attempt from ${req.ip}`);
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

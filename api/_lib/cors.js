function normalizeOrigin(origin) {
  if (!origin) return null;
  try {
    return new URL(origin).origin;
  } catch (error) {
    return origin.replace(/\/$/, '').toLowerCase();
  }
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ?.split(/[\s,]+/)
  .map(normalizeOrigin)
  .filter(Boolean);

export function applyCors(req, res) {
  const origin = req.headers.origin;
  const normalizedOrigin = normalizeOrigin(origin);

  if (!allowedOrigins || allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*')) {
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }

  return true;
}

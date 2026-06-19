const requestCounts = new Map();

const WINDOW_MS = 60 * 1000;

const LIMITS = {
  '/api/enquiry': 10,
  '/api/callback': 10,
  '/api/emi': 10,
  '/api/calculator': 30,
  default: 30
};

const getLimit = (path) => {
  for (const [prefix, limit] of Object.entries(LIMITS)) {
    if (path.startsWith(prefix)) {
      return limit;
    }
  }
  return LIMITS.default;
};

const cleanup = () => {
  const now = Date.now();
  for (const [key, data] of requestCounts) {
    if (now - data.windowStart > WINDOW_MS) {
      requestCounts.delete(key);
    }
  }
};

if (process.env.NODE_ENV !== 'test') {
  setInterval(cleanup, WINDOW_MS);
}

export const publicRateLimiter = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const ip = req.ip;
  const path = req.path;
  const limit = getLimit(path);
  const key = `${ip}:${path}`;
  const now = Date.now();

  let record = requestCounts.get(key);

  if (!record || now - record.windowStart > WINDOW_MS) {
    record = {
      count: 0,
      windowStart: now
    };
  }

  record.count++;

  if (record.count > limit) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - record.windowStart)) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      success: false,
      message: `Too many requests. Please try again in ${retryAfter} seconds.`
    });
  }

  requestCounts.set(key, record);

  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - record.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil((record.windowStart + WINDOW_MS) / 1000));

  next();
};

export const resetPublicRateLimiter = () => {
  requestCounts.clear();
};

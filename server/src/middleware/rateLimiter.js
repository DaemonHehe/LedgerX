import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 100, // Limit each IP to 10000 requests in dev, or 100 in production
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 5000 : 15, // Limit each IP to 5000 requests in dev, or 15 in production
  message: { error: 'Too many requests for resource-heavy operations. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

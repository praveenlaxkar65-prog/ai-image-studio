const rateLimit = require('express-rate-limit');
const { getCachedSetting } = require('../config/configCache');

const WINDOW_MS =
  Number(process.env.RATE_LIMIT_WINDOW_MS) ||
  15 * 60 * 1000; // default fallback, admin override DB se

const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: async () => {
    const value = await getCachedSetting('rate_limit_general');
    return Number(value) || 100; // default fallback
  },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: WINDOW_MS,
  limit: async () => {
    const value = await getCachedSetting('rate_limit_auth');
    return Number(value) || 10; // brute-force safe fallback
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter
};

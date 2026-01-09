const rateLimit = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for auth routes (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  message: { message: 'Too many login attempts, please try again in 15 minutes' },
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset limiter
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { message: 'Too many password reset attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

// Stats logging limiter - prevent spam stat entries
const statsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 stat logs per minute max
  message: { message: 'Too many stat entries, please slow down' },
  standardHeaders: true,
  legacyHeaders: false
});

// Creation limiter - for creating new resources (exercises, workouts, teams)
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 creations per hour
  message: { message: 'Too many items created, please try again later' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { apiLimiter, authLimiter, passwordResetLimiter, statsLimiter, createLimiter };

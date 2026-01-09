const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  registerCoach,
  registerTrainer,
  registerAthlete,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  validateAccessCode
} = require('../controllers/authController');

// Public routes
router.post('/register/coach', authLimiter, registerCoach);
router.post('/register/trainer', authLimiter, registerTrainer);
router.post('/register/athlete', authLimiter, registerAthlete);
router.post('/login', authLimiter, login);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);
router.post('/validate-access-code', validateAccessCode);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;

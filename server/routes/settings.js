const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSettings,
  updateProfile,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  requestEmailChange,
  verifyEmailChange,
  cancelEmailChange,
  getPendingEmailChange
} = require('../controllers/settingsController');

// All routes require authentication
router.use(protect);

// Get user settings
router.get('/', getSettings);

// Update profile (name)
router.put('/profile', updateProfile);

// Email change
router.get('/email/pending', getPendingEmailChange);
router.post('/email/request-change', requestEmailChange);
router.post('/email/verify', verifyEmailChange);
router.delete('/email/cancel', cancelEmailChange);

// Payment methods (coaches only)
router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.delete('/payment-methods/:methodId', removePaymentMethod);
router.put('/payment-methods/:methodId/default', setDefaultPaymentMethod);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getSettings,
  updateProfile,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod
} = require('../controllers/settingsController');

// All routes require authentication
router.use(protect);

// Get user settings
router.get('/', getSettings);

// Update profile (name)
router.put('/profile', updateProfile);

// Payment methods (coaches only)
router.get('/payment-methods', getPaymentMethods);
router.post('/payment-methods', addPaymentMethod);
router.delete('/payment-methods/:methodId', removePaymentMethod);
router.put('/payment-methods/:methodId/default', setDefaultPaymentMethod);

module.exports = router;

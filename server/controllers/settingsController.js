const Coach = require('../models/Coach');
const Athlete = require('../models/Athlete');
const Trainer = require('../models/Trainer');
const { validateName } = require('../utils/profanityFilter');

/**
 * @desc    Get user settings
 * @route   GET /api/settings
 * @access  Private
 */
const getSettings = async (req, res) => {
  try {
    const { role } = req.user;
    let profile = null;

    if (role === 'coach') {
      profile = await Coach.findOne({ userId: req.user._id });
    } else if (role === 'athlete') {
      profile = await Athlete.findOne({ userId: req.user._id });
    } else if (role === 'trainer') {
      profile = await Trainer.findOne({ userId: req.user._id });
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      success: true,
      settings: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: req.user.email,
        role: role,
        schoolName: profile.schoolName,
        // For coaches, include payment info
        ...(role === 'coach' && {
          paymentStatus: profile.paymentStatus,
          paidTeams: profile.paidTeams,
          hasPaymentMethod: !!profile.stripeCustomerId
        })
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update profile (first/last name)
 * @route   PUT /api/settings/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const { role } = req.user;

    // Validate first name
    if (firstName !== undefined) {
      const firstNameValidation = validateName(firstName);
      if (!firstNameValidation.valid) {
        return res.status(400).json({ message: firstNameValidation.message });
      }
    }

    // Validate last name
    if (lastName !== undefined) {
      const lastNameValidation = validateName(lastName);
      if (!lastNameValidation.valid) {
        return res.status(400).json({ message: lastNameValidation.message });
      }
    }

    let profile = null;
    const updateData = {};

    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    if (role === 'coach') {
      profile = await Coach.findOneAndUpdate(
        { userId: req.user._id },
        updateData,
        { new: true }
      );
    } else if (role === 'athlete') {
      profile = await Athlete.findOneAndUpdate(
        { userId: req.user._id },
        updateData,
        { new: true }
      );
    } else if (role === 'trainer') {
      profile = await Trainer.findOneAndUpdate(
        { userId: req.user._id },
        updateData,
        { new: true }
      );
    }

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        firstName: profile.firstName,
        lastName: profile.lastName
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get payment methods (coaches only)
 * @route   GET /api/settings/payment-methods
 * @access  Private (Coach only)
 */
const getPaymentMethods = async (req, res) => {
  try {
    if (req.user.role !== 'coach') {
      return res.status(403).json({ message: 'Only coaches can access payment methods' });
    }

    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Placeholder response - would integrate with Stripe in production
    res.json({
      success: true,
      paymentMethods: [],
      hasStripeCustomer: !!coach.stripeCustomerId,
      message: 'Stripe integration coming soon'
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Add payment method (coaches only)
 * @route   POST /api/settings/payment-methods
 * @access  Private (Coach only)
 */
const addPaymentMethod = async (req, res) => {
  try {
    if (req.user.role !== 'coach') {
      return res.status(403).json({ message: 'Only coaches can add payment methods' });
    }

    // Placeholder - would integrate with Stripe in production
    res.json({
      success: true,
      message: 'Stripe integration coming soon. Payment method would be added here.'
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Remove payment method (coaches only)
 * @route   DELETE /api/settings/payment-methods/:methodId
 * @access  Private (Coach only)
 */
const removePaymentMethod = async (req, res) => {
  try {
    if (req.user.role !== 'coach') {
      return res.status(403).json({ message: 'Only coaches can remove payment methods' });
    }

    // Placeholder - would integrate with Stripe in production
    res.json({
      success: true,
      message: 'Stripe integration coming soon. Payment method would be removed here.'
    });
  } catch (error) {
    console.error('Remove payment method error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Set default payment method (coaches only)
 * @route   PUT /api/settings/payment-methods/:methodId/default
 * @access  Private (Coach only)
 */
const setDefaultPaymentMethod = async (req, res) => {
  try {
    if (req.user.role !== 'coach') {
      return res.status(403).json({ message: 'Only coaches can set default payment method' });
    }

    // Placeholder - would integrate with Stripe in production
    res.json({
      success: true,
      message: 'Stripe integration coming soon. Default payment method would be set here.'
    });
  } catch (error) {
    console.error('Set default payment method error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getSettings,
  updateProfile,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod
};

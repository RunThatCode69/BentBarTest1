const Coach = require('../models/Coach');
const Athlete = require('../models/Athlete');
const Trainer = require('../models/Trainer');
const User = require('../models/User');
const { validateName } = require('../utils/profanityFilter');
const { validateEmail } = require('../utils/validators');
const { generateVerificationCode, sendEmailChangeCode, sendEmailChangeConfirmation } = require('../services/emailService');

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

/**
 * @desc    Request email change - sends verification code to current email
 * @route   POST /api/settings/email/request-change
 * @access  Private
 */
const requestEmailChange = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ message: 'New email is required' });
    }

    // Validate email format
    if (!validateEmail(newEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check if new email is same as current
    if (newEmail.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({ message: 'New email must be different from current email' });
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email: newEmail.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is already registered to another account' });
    }

    // Generate 8-digit code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Save code and pending email to user
    await User.findByIdAndUpdate(req.user._id, {
      emailChangeCode: code,
      emailChangeCodeExpires: expiresAt,
      pendingEmail: newEmail.toLowerCase()
    });

    // Send verification code to current email
    await sendEmailChangeCode(req.user.email, code, newEmail);

    res.json({
      success: true,
      message: 'Verification code sent to your current email address'
    });
  } catch (error) {
    console.error('Request email change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Verify email change code and update email
 * @route   POST /api/settings/email/verify
 * @access  Private
 */
const verifyEmailChange = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Verification code is required' });
    }

    // Get user with email change fields
    const user = await User.findById(req.user._id);

    if (!user.emailChangeCode || !user.pendingEmail) {
      return res.status(400).json({ message: 'No pending email change request' });
    }

    // Check if code has expired
    if (new Date() > new Date(user.emailChangeCodeExpires)) {
      // Clear expired data
      await User.findByIdAndUpdate(req.user._id, {
        emailChangeCode: null,
        emailChangeCodeExpires: null,
        pendingEmail: null
      });
      return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
    }

    // Verify code
    if (user.emailChangeCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Double-check email isn't taken (race condition protection)
    const existingUser = await User.findOne({ email: user.pendingEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'This email is no longer available' });
    }

    const oldEmail = user.email;
    const newEmail = user.pendingEmail;

    // Update email and clear verification data
    await User.findByIdAndUpdate(req.user._id, {
      email: newEmail,
      emailChangeCode: null,
      emailChangeCodeExpires: null,
      pendingEmail: null
    });

    // Get user's first name for confirmation email
    let firstName = 'User';
    const { role } = req.user;
    if (role === 'coach') {
      const profile = await Coach.findOne({ userId: req.user._id });
      if (profile) firstName = profile.firstName;
    } else if (role === 'athlete') {
      const profile = await Athlete.findOne({ userId: req.user._id });
      if (profile) firstName = profile.firstName;
    } else if (role === 'trainer') {
      const profile = await Trainer.findOne({ userId: req.user._id });
      if (profile) firstName = profile.firstName;
    }

    // Send confirmation to new email (don't await - it's not critical)
    sendEmailChangeConfirmation(newEmail, firstName).catch(err => {
      console.error('Failed to send confirmation email:', err);
    });

    res.json({
      success: true,
      message: 'Email updated successfully',
      newEmail: newEmail
    });
  } catch (error) {
    console.error('Verify email change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Cancel pending email change
 * @route   DELETE /api/settings/email/cancel
 * @access  Private
 */
const cancelEmailChange = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      emailChangeCode: null,
      emailChangeCodeExpires: null,
      pendingEmail: null
    });

    res.json({
      success: true,
      message: 'Email change request cancelled'
    });
  } catch (error) {
    console.error('Cancel email change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Check if there's a pending email change
 * @route   GET /api/settings/email/pending
 * @access  Private
 */
const getPendingEmailChange = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.pendingEmail || !user.emailChangeCodeExpires) {
      return res.json({
        success: true,
        hasPending: false
      });
    }

    // Check if expired
    if (new Date() > new Date(user.emailChangeCodeExpires)) {
      // Clear expired data
      await User.findByIdAndUpdate(req.user._id, {
        emailChangeCode: null,
        emailChangeCodeExpires: null,
        pendingEmail: null
      });
      return res.json({
        success: true,
        hasPending: false
      });
    }

    res.json({
      success: true,
      hasPending: true,
      pendingEmail: user.pendingEmail,
      expiresAt: user.emailChangeCodeExpires
    });
  } catch (error) {
    console.error('Get pending email change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
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
};

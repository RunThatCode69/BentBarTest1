const User = require('../models/User');
const Coach = require('../models/Coach');
const Trainer = require('../models/Trainer');
const Athlete = require('../models/Athlete');
const Team = require('../models/Team');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/tokenUtils');
const { validatePassword, validateEmail, validateRequiredFields } = require('../utils/validators');
const { generateAccessCode } = require('../utils/generateAccessCode');
const paymentService = require('../services/paymentService');
const { generateResetToken, sendPasswordResetEmail, sendPasswordResetConfirmation } = require('../services/emailService');
const crypto = require('crypto');

/**
 * Set HTTP-only cookie with token
 */
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

/**
 * @desc    Register coach
 * @route   POST /api/auth/register/coach
 * @access  Public
 */
const registerCoach = async (req, res) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, schoolName, organizationType, sport } = req.body;

    // Validate required fields
    const requiredFields = ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'schoolName', 'organizationType', 'sport'];
    const { isValid, missingFields } = validateRequiredFields(req.body, requiredFields);
    if (!isValid) {
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.errors.join(', ') });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'coach'
    });

    // Create coach profile
    const coach = await Coach.create({
      userId: user._id,
      firstName,
      lastName,
      schoolName,
      organizationType
    });

    // Create initial team with access code
    const accessCode = await generateAccessCode();
    const team = await Team.create({
      teamName: `${schoolName} ${sport.charAt(0).toUpperCase() + sport.slice(1)}`,
      sport: sport.toLowerCase(),
      schoolName,
      coaches: [{ coachId: coach._id, role: 'owner', addedAt: new Date() }],
      accessCode
    });

    // Update coach with team
    coach.teams.push({ teamId: team._id, sport: sport.toLowerCase() });
    await coach.save();

    // Create placeholder Stripe customer
    const stripeCustomer = await paymentService.createCustomer(email, `${firstName} ${lastName}`);
    coach.stripeCustomerId = stripeCustomer.customerId;
    await coach.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName,
        lastName
      },
      team: {
        id: team._id,
        accessCode: team.accessCode
      }
    });

  } catch (error) {
    console.error('Coach registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Register trainer
 * @route   POST /api/auth/register/trainer
 * @access  Public
 */
const registerTrainer = async (req, res) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, gymName, programName } = req.body;

    // Validate required fields
    const requiredFields = ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'programName'];
    const { isValid, missingFields } = validateRequiredFields(req.body, requiredFields);
    if (!isValid) {
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.errors.join(', ') });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'trainer'
    });

    // Create trainer profile
    const trainer = await Trainer.create({
      userId: user._id,
      firstName,
      lastName,
      gymName: gymName || null,
      programName
    });

    // Create placeholder Stripe customer
    const stripeCustomer = await paymentService.createCustomer(email, `${firstName} ${lastName}`);
    trainer.stripeCustomerId = stripeCustomer.customerId;
    await trainer.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName,
        lastName
      }
    });

  } catch (error) {
    console.error('Trainer registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Register athlete
 * @route   POST /api/auth/register/athlete
 * @access  Public
 */
const registerAthlete = async (req, res) => {
  try {
    const { email, password, confirmPassword, firstName, lastName, schoolName, accessCode } = req.body;

    // Validate required fields
    const requiredFields = ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'schoolName', 'accessCode'];
    const { isValid, missingFields } = validateRequiredFields(req.body, requiredFields);
    if (!isValid) {
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.errors.join(', ') });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Validate access code and find team
    const team = await Team.findOne({ accessCode: accessCode.toUpperCase() });
    if (!team) {
      return res.status(400).json({ message: 'Invalid access code. Please check with your coach.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'athlete'
    });

    // Create athlete profile
    const athlete = await Athlete.create({
      userId: user._id,
      firstName,
      lastName,
      schoolName,
      teamId: team._id,
      sport: team.sport
    });

    // Add athlete to team
    team.athletes.push(athlete._id);
    await team.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie
    setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName,
        lastName
      },
      team: {
        id: team._id,
        teamName: team.teamName,
        sport: team.sport
      }
    });

  } catch (error) {
    console.error('Athlete registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account has been deactivated' });
    }

    // Compare password
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Set cookie
    setTokenCookie(res, token);

    // Get profile based on role
    let profile = null;
    if (user.role === 'coach') {
      profile = await Coach.findOne({ userId: user._id });
    } else if (user.role === 'athlete') {
      profile = await Athlete.findOne({ userId: user._id });
    } else if (user.role === 'trainer') {
      profile = await Trainer.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: profile?.firstName,
        lastName: profile?.lastName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.json({ success: true, message: 'Logged out successfully' });
};

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get profile based on role
    let profile = null;
    if (user.role === 'coach') {
      profile = await Coach.findOne({ userId: user._id }).populate('teams.teamId');
    } else if (user.role === 'athlete') {
      profile = await Athlete.findOne({ userId: user._id }).populate('teamId');
    } else if (user.role === 'trainer') {
      profile = await Trainer.findOne({ userId: user._id });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      profile
    });

  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Forgot password
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide an email' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a password reset email has been sent' });
    }

    // Generate reset token
    const resetToken = generateResetToken();

    // Hash the token for storage (we'll compare hashes later)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save to user with 1 hour expiration
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Get user's first name from their profile
    let firstName = 'User';
    if (user.role === 'coach') {
      const profile = await Coach.findOne({ userId: user._id });
      if (profile) firstName = profile.firstName;
    } else if (user.role === 'athlete') {
      const profile = await Athlete.findOne({ userId: user._id });
      if (profile) firstName = profile.firstName;
    } else if (user.role === 'trainer') {
      const profile = await Trainer.findOne({ userId: user._id });
      if (profile) firstName = profile.firstName;
    }

    // Send the email with the unhashed token (user clicks link with this)
    await sendPasswordResetEmail(user.email, firstName, resetToken);

    res.json({ success: true, message: 'If an account exists, a password reset email has been sent' });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate required fields
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.errors.join(', ') });
    }

    // Check passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Hash the token from URL to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token. Please request a new password reset.' });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Get user's first name for confirmation email
    let firstName = 'User';
    if (user.role === 'coach') {
      const profile = await Coach.findOne({ userId: user._id });
      if (profile) firstName = profile.firstName;
    } else if (user.role === 'athlete') {
      const profile = await Athlete.findOne({ userId: user._id });
      if (profile) firstName = profile.firstName;
    } else if (user.role === 'trainer') {
      const profile = await Trainer.findOne({ userId: user._id });
      if (profile) firstName = profile.firstName;
    }

    // Send confirmation email (don't await - not critical)
    sendPasswordResetConfirmation(user.email, firstName).catch(err => {
      console.error('Failed to send password reset confirmation:', err);
    });

    res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Validate access code
 * @route   POST /api/auth/validate-access-code
 * @access  Public
 */
const validateAccessCode = async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({ message: 'Access code is required' });
    }

    const team = await Team.findOne({ accessCode: accessCode.toUpperCase() });

    if (!team) {
      return res.status(404).json({ valid: false, message: 'Invalid access code' });
    }

    res.json({
      valid: true,
      team: {
        teamName: team.teamName,
        sport: team.sport,
        schoolName: team.schoolName
      }
    });

  } catch (error) {
    console.error('Validate access code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerCoach,
  registerTrainer,
  registerAthlete,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  validateAccessCode
};

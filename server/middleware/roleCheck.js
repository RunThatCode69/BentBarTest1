/**
 * Authorize specific roles
 * @param  {...string} roles - Allowed roles
 * @returns {function} - Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Check if user is a coach
 */
const isCoach = (req, res, next) => {
  if (!req.user || req.user.role !== 'coach') {
    return res.status(403).json({ message: 'Access denied. Coaches only.' });
  }
  next();
};

/**
 * Check if user is an athlete
 */
const isAthlete = (req, res, next) => {
  if (!req.user || req.user.role !== 'athlete') {
    return res.status(403).json({ message: 'Access denied. Athletes only.' });
  }
  next();
};

/**
 * Check if user is a trainer
 */
const isTrainer = (req, res, next) => {
  if (!req.user || req.user.role !== 'trainer') {
    return res.status(403).json({ message: 'Access denied. Trainers only.' });
  }
  next();
};

/**
 * Check if user is a coach or trainer
 */
const isCoachOrTrainer = (req, res, next) => {
  if (!req.user || !['coach', 'trainer'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied. Coaches and trainers only.' });
  }
  next();
};

module.exports = {
  authorize,
  isCoach,
  isAthlete,
  isTrainer,
  isCoachOrTrainer
};

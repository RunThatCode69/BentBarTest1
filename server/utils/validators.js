/**
 * Validate password against security requirements
 * @param {string} password - The password to validate
 * @returns {object} - { isValid: boolean, errors: string[] }
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < minLength) {
    errors.push('Password must be at least 8 characters');
  }
  if (!hasUppercase) {
    errors.push('Password must contain an uppercase letter');
  }
  if (!hasLowercase) {
    errors.push('Password must contain a lowercase letter');
  }
  if (!hasNumber) {
    errors.push('Password must contain a number');
  }
  if (!hasSpecial) {
    errors.push('Password must contain a special character (!@#$%^&*(),.?":{}|<>)');
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email is valid
 */
const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate required fields in an object
 * @param {object} data - The data object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @returns {object} - { isValid: boolean, missingFields: string[] }
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

/**
 * Sanitize string input
 * @param {string} str - The string to sanitize
 * @returns {string} - The sanitized string
 */
const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

module.exports = {
  validatePassword,
  validateEmail,
  validateRequiredFields,
  sanitizeString
};

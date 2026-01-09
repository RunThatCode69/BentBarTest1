const Team = require('../models/Team');

/**
 * Generate a unique alphanumeric access code
 * @param {number} length - Length of the code (default: 6)
 * @returns {Promise<string>} - A unique uppercase alphanumeric code
 * @throws {Error} If unable to generate unique code after max attempts
 */
const generateAccessCode = async (length = 6) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  const maxAttempts = 100; // Prevent infinite loops

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Generate code using array for better performance
      const codeChars = [];
      for (let i = 0; i < length; i++) {
        codeChars.push(characters.charAt(Math.floor(Math.random() * characters.length)));
      }
      const code = codeChars.join('');

      // Check if code already exists in database (with timeout)
      const existingTeam = await Team.findOne({ accessCode: code }).maxTimeMS(5000);
      if (!existingTeam) {
        return code;
      }
    } catch (error) {
      console.error('Error checking access code uniqueness:', error.message);
      // If database error, throw immediately instead of retrying
      throw new Error('Failed to generate access code: database error');
    }
  }

  throw new Error('Failed to generate unique access code after maximum attempts');
};

/**
 * Generate a simple code (for testing, without DB check)
 * @param {number} length - Length of the code (default: 6)
 * @returns {string} - An uppercase alphanumeric code
 */
const generateSimpleCode = (length = 6) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

module.exports = { generateAccessCode, generateSimpleCode };

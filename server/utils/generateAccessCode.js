const Team = require('../models/Team');

/**
 * Generate a unique alphanumeric access code
 * @param {number} length - Length of the code (default: 6)
 * @returns {Promise<string>} - A unique uppercase alphanumeric code
 */
const generateAccessCode = async (length = 6) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars: I, O, 0, 1
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < length; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists in database
    const existingTeam = await Team.findOne({ accessCode: code });
    if (!existingTeam) {
      isUnique = true;
    }
  }

  return code;
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

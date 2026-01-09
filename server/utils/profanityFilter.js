// List of inappropriate words to filter
// This is a basic list - in production you'd use a more comprehensive library
const inappropriateWords = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'dick', 'cock', 'pussy',
  'bastard', 'slut', 'whore', 'fag', 'nigger', 'nigga', 'cunt', 'piss',
  'asshole', 'douche', 'retard', 'idiot', 'stupid', 'dumb', 'moron',
  'motherfucker', 'fucker', 'bullshit', 'dumbass', 'jackass', 'dickhead',
  'shithead', 'butthole', 'anus', 'penis', 'vagina', 'boob', 'tit', 'titty',
  'balls', 'testicle', 'dildo', 'porn', 'sex', 'sexy', 'nude', 'naked',
  'hoe', 'thot', 'skank', 'tramp', 'hooker', 'pimp', 'stripper',
  'kill', 'murder', 'rape', 'suicide', 'cocaine', 'heroin', 'meth',
  'weed', 'marijuana', 'drug', 'crack', 'ecstasy', 'lsd'
];

/**
 * Check if a string contains inappropriate words
 * @param {string} text - The text to check
 * @returns {boolean} - True if inappropriate words found
 */
const containsProfanity = (text) => {
  if (!text || typeof text !== 'string') return false;

  const lowerText = text.toLowerCase().replace(/[^a-z]/g, '');

  for (const word of inappropriateWords) {
    if (lowerText.includes(word)) {
      return true;
    }
  }

  // Also check for l33t speak variations
  const l33tText = text.toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's')
    .replace(/[^a-z]/g, '');

  for (const word of inappropriateWords) {
    if (l33tText.includes(word)) {
      return true;
    }
  }

  return false;
};

/**
 * Validate a name field
 * @param {string} name - The name to validate
 * @returns {object} - { valid: boolean, message: string }
 */
const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, message: 'Name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { valid: false, message: 'Name cannot exceed 50 characters' };
  }

  // Check for only valid characters (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) {
    return { valid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  if (containsProfanity(trimmed)) {
    return { valid: false, message: "Nice try, what's your actual name?" };
  }

  return { valid: true, message: 'Valid' };
};

module.exports = {
  containsProfanity,
  validateName,
  inappropriateWords
};

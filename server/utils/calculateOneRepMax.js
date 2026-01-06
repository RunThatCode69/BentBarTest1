/**
 * Calculate estimated one rep max using Brzycki formula
 * @param {number} weight - Weight lifted
 * @param {number} reps - Number of reps performed
 * @returns {number} - Estimated one rep max
 */
const calculateOneRepMax = (weight, reps) => {
  if (reps === 1) return weight;
  if (reps <= 0 || weight <= 0) return 0;

  // Brzycki formula: 1RM = weight × (36 / (37 - reps))
  // Most accurate for reps between 1-10
  const oneRepMax = weight * (36 / (37 - reps));

  return Math.round(oneRepMax);
};

/**
 * Calculate weight based on percentage of one rep max
 * @param {number} oneRepMax - The athlete's one rep max
 * @param {number} percentage - The percentage to calculate (e.g., 75 for 75%)
 * @returns {number} - The calculated weight
 */
const calculateWeightFromPercentage = (oneRepMax, percentage) => {
  if (!oneRepMax || !percentage) return null;
  return Math.round(oneRepMax * (percentage / 100));
};

/**
 * Display weight based on whether athlete has a 1RM
 * @param {number|null} oneRepMax - The athlete's one rep max (or null)
 * @param {number} percentage - The percentage prescribed
 * @returns {object} - { displayText: string, calculatedWeight: number|null }
 */
const displayWeight = (oneRepMax, percentage) => {
  if (oneRepMax && percentage) {
    const calculatedWeight = calculateWeightFromPercentage(oneRepMax, percentage);
    return {
      displayText: `${calculatedWeight} lbs (${percentage}%)`,
      calculatedWeight
    };
  }
  return {
    displayText: `${percentage}%`,
    calculatedWeight: null
  };
};

/**
 * Round weight to nearest 5 (for barbell exercises)
 * @param {number} weight - The weight to round
 * @returns {number} - Weight rounded to nearest 5
 */
const roundToNearest5 = (weight) => {
  return Math.round(weight / 5) * 5;
};

/**
 * Round weight to nearest 2.5 (for more precise loading)
 * @param {number} weight - The weight to round
 * @returns {number} - Weight rounded to nearest 2.5
 */
const roundToNearest2Point5 = (weight) => {
  return Math.round(weight / 2.5) * 2.5;
};

module.exports = {
  calculateOneRepMax,
  calculateWeightFromPercentage,
  displayWeight,
  roundToNearest5,
  roundToNearest2Point5
};

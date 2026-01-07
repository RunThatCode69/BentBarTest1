// Default exercises available to all coaches
// Custom exercises created by coaches are stored in the database and only visible to them

export const DEFAULT_EXERCISES = [
  // Upper Body
  { _id: 'default-bench-press', name: 'Bench Press', category: 'upper_body', isDefault: true },
  { _id: 'default-incline-bench', name: 'Incline Bench Press', category: 'upper_body', isDefault: true },
  { _id: 'default-dumbbell-press', name: 'Dumbbell Press', category: 'upper_body', isDefault: true },
  { _id: 'default-overhead-press', name: 'Overhead Press', category: 'upper_body', isDefault: true },
  { _id: 'default-push-press', name: 'Push Press', category: 'upper_body', isDefault: true },
  { _id: 'default-barbell-row', name: 'Barbell Row', category: 'upper_body', isDefault: true },
  { _id: 'default-pull-ups', name: 'Pull-ups', category: 'upper_body', isDefault: true },
  { _id: 'default-lat-pulldown', name: 'Lat Pulldown', category: 'upper_body', isDefault: true },
  { _id: 'default-dumbbell-curl', name: 'Dumbbell Curl', category: 'upper_body', isDefault: true },
  { _id: 'default-tricep-pushdown', name: 'Tricep Pushdown', category: 'upper_body', isDefault: true },
  { _id: 'default-dips', name: 'Dips', category: 'upper_body', isDefault: true },
  { _id: 'default-face-pulls', name: 'Face Pulls', category: 'upper_body', isDefault: true },

  // Lower Body
  { _id: 'default-back-squat', name: 'Back Squat', category: 'lower_body', isDefault: true },
  { _id: 'default-front-squat', name: 'Front Squat', category: 'lower_body', isDefault: true },
  { _id: 'default-deadlift', name: 'Deadlift', category: 'lower_body', isDefault: true },
  { _id: 'default-romanian-deadlift', name: 'Romanian Deadlift', category: 'lower_body', isDefault: true },
  { _id: 'default-sumo-deadlift', name: 'Sumo Deadlift', category: 'lower_body', isDefault: true },
  { _id: 'default-leg-press', name: 'Leg Press', category: 'lower_body', isDefault: true },
  { _id: 'default-walking-lunges', name: 'Walking Lunges', category: 'lower_body', isDefault: true },
  { _id: 'default-bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'lower_body', isDefault: true },
  { _id: 'default-hip-thrust', name: 'Hip Thrust', category: 'lower_body', isDefault: true },
  { _id: 'default-leg-curl', name: 'Leg Curl', category: 'lower_body', isDefault: true },
  { _id: 'default-leg-extension', name: 'Leg Extension', category: 'lower_body', isDefault: true },
  { _id: 'default-calf-raises', name: 'Calf Raises', category: 'lower_body', isDefault: true },

  // Olympic Lifts
  { _id: 'default-power-clean', name: 'Power Clean', category: 'olympic', isDefault: true },
  { _id: 'default-hang-clean', name: 'Hang Clean', category: 'olympic', isDefault: true },
  { _id: 'default-clean-and-jerk', name: 'Clean and Jerk', category: 'olympic', isDefault: true },
  { _id: 'default-snatch', name: 'Snatch', category: 'olympic', isDefault: true },
  { _id: 'default-power-snatch', name: 'Power Snatch', category: 'olympic', isDefault: true },
  { _id: 'default-hang-snatch', name: 'Hang Snatch', category: 'olympic', isDefault: true },

  // Core
  { _id: 'default-plank', name: 'Plank', category: 'core', isDefault: true },
  { _id: 'default-russian-twist', name: 'Russian Twist', category: 'core', isDefault: true },
  { _id: 'default-hanging-leg-raise', name: 'Hanging Leg Raise', category: 'core', isDefault: true },
  { _id: 'default-ab-wheel-rollout', name: 'Ab Wheel Rollout', category: 'core', isDefault: true },
  { _id: 'default-cable-woodchop', name: 'Cable Woodchop', category: 'core', isDefault: true },
  { _id: 'default-dead-bug', name: 'Dead Bug', category: 'core', isDefault: true },

  // Cardio/Conditioning
  { _id: 'default-box-jumps', name: 'Box Jumps', category: 'cardio', isDefault: true },
  { _id: 'default-burpees', name: 'Burpees', category: 'cardio', isDefault: true },
  { _id: 'default-battle-ropes', name: 'Battle Ropes', category: 'cardio', isDefault: true },
  { _id: 'default-sled-push', name: 'Sled Push', category: 'cardio', isDefault: true },
  { _id: 'default-farmer-carry', name: 'Farmer Carry', category: 'cardio', isDefault: true },
  { _id: 'default-rowing-machine', name: 'Rowing Machine', category: 'cardio', isDefault: true },

  // Accessory
  { _id: 'default-lateral-raise', name: 'Lateral Raise', category: 'accessory', isDefault: true },
  { _id: 'default-rear-delt-fly', name: 'Rear Delt Fly', category: 'accessory', isDefault: true },
  { _id: 'default-shrugs', name: 'Shrugs', category: 'accessory', isDefault: true },
  { _id: 'default-good-mornings', name: 'Good Mornings', category: 'accessory', isDefault: true },
  { _id: 'default-glute-ham-raise', name: 'Glute Ham Raise', category: 'accessory', isDefault: true },
  { _id: 'default-reverse-hyper', name: 'Reverse Hyper', category: 'accessory', isDefault: true }
];

// Helper to merge default exercises with custom exercises from API
export const mergeExercises = (customExercises = []) => {
  // Custom exercises come first, then defaults
  // Filter out any custom exercises that might duplicate default names
  const defaultNames = new Set(DEFAULT_EXERCISES.map(e => e.name.toLowerCase()));
  const uniqueCustom = customExercises.filter(
    ex => !defaultNames.has(ex.name.toLowerCase())
  );

  return [...uniqueCustom, ...DEFAULT_EXERCISES];
};

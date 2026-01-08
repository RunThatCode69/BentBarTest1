// Default exercises available to all coaches
// Custom exercises created by coaches are stored in the database and only visible to them
// These use valid MongoDB ObjectId format (24 hex characters)

export const DEFAULT_EXERCISES = [
  // Upper Body
  { _id: '000000000000000000000001', name: 'Bench Press', category: 'upper_body', isDefault: true },
  { _id: '000000000000000000000002', name: 'Incline Bench Press', category: 'upper_body', isDefault: true },
  { _id: '000000000000000000000003', name: 'Dumbbell Press', category: 'upper_body', isDefault: true },
  { _id: '000000000000000000000004', name: 'Overhead Press', category: 'upper_body', isDefault: true },
  { _id: '000000000000000000000005', name: 'Push Press', category: 'upper_body', isDefault: true },
  { _id: '000000000000000000000006', name: 'Barbell Row', category: 'upper_body', isDefault: true },
  { _id: '000000000000000000000007', name: 'Pull-ups', category: 'upper_body', isDefault: true },
  { _id: '000000000000000000000008', name: 'Lat Pulldown', category: 'upper_body', isDefault: true },
  { _id: '000000000000000000000009', name: 'Dumbbell Curl', category: 'upper_body', isDefault: true },
  { _id: '00000000000000000000000a', name: 'Tricep Pushdown', category: 'upper_body', isDefault: true },
  { _id: '00000000000000000000000b', name: 'Dips', category: 'upper_body', isDefault: true },
  { _id: '00000000000000000000000c', name: 'Face Pulls', category: 'upper_body', isDefault: true },

  // Lower Body
  { _id: '00000000000000000000000d', name: 'Back Squat', category: 'lower_body', isDefault: true },
  { _id: '00000000000000000000000e', name: 'Front Squat', category: 'lower_body', isDefault: true },
  { _id: '00000000000000000000000f', name: 'Deadlift', category: 'lower_body', isDefault: true },
  { _id: '000000000000000000000010', name: 'Romanian Deadlift', category: 'lower_body', isDefault: true },
  { _id: '000000000000000000000011', name: 'Sumo Deadlift', category: 'lower_body', isDefault: true },
  { _id: '000000000000000000000012', name: 'Leg Press', category: 'lower_body', isDefault: true },
  { _id: '000000000000000000000013', name: 'Walking Lunges', category: 'lower_body', isDefault: true },
  { _id: '000000000000000000000014', name: 'Bulgarian Split Squat', category: 'lower_body', isDefault: true },
  { _id: '000000000000000000000015', name: 'Hip Thrust', category: 'lower_body', isDefault: true },
  { _id: '000000000000000000000016', name: 'Leg Curl', category: 'lower_body', isDefault: true },
  { _id: '000000000000000000000017', name: 'Leg Extension', category: 'lower_body', isDefault: true },
  { _id: '000000000000000000000018', name: 'Calf Raises', category: 'lower_body', isDefault: true },

  // Olympic Lifts
  { _id: '000000000000000000000019', name: 'Power Clean', category: 'olympic', isDefault: true },
  { _id: '00000000000000000000001a', name: 'Hang Clean', category: 'olympic', isDefault: true },
  { _id: '00000000000000000000001b', name: 'Clean and Jerk', category: 'olympic', isDefault: true },
  { _id: '00000000000000000000001c', name: 'Snatch', category: 'olympic', isDefault: true },
  { _id: '00000000000000000000001d', name: 'Power Snatch', category: 'olympic', isDefault: true },
  { _id: '00000000000000000000001e', name: 'Hang Snatch', category: 'olympic', isDefault: true },

  // Core
  { _id: '00000000000000000000001f', name: 'Plank', category: 'core', isDefault: true },
  { _id: '000000000000000000000020', name: 'Russian Twist', category: 'core', isDefault: true },
  { _id: '000000000000000000000021', name: 'Hanging Leg Raise', category: 'core', isDefault: true },
  { _id: '000000000000000000000022', name: 'Ab Wheel Rollout', category: 'core', isDefault: true },
  { _id: '000000000000000000000023', name: 'Cable Woodchop', category: 'core', isDefault: true },
  { _id: '000000000000000000000024', name: 'Dead Bug', category: 'core', isDefault: true },

  // Cardio/Conditioning
  { _id: '000000000000000000000025', name: 'Box Jumps', category: 'cardio', isDefault: true },
  { _id: '000000000000000000000026', name: 'Burpees', category: 'cardio', isDefault: true },
  { _id: '000000000000000000000027', name: 'Battle Ropes', category: 'cardio', isDefault: true },
  { _id: '000000000000000000000028', name: 'Sled Push', category: 'cardio', isDefault: true },
  { _id: '000000000000000000000029', name: 'Farmer Carry', category: 'cardio', isDefault: true },
  { _id: '00000000000000000000002a', name: 'Rowing Machine', category: 'cardio', isDefault: true },

  // Accessory
  { _id: '00000000000000000000002b', name: 'Lateral Raise', category: 'accessory', isDefault: true },
  { _id: '00000000000000000000002c', name: 'Rear Delt Fly', category: 'accessory', isDefault: true },
  { _id: '00000000000000000000002d', name: 'Shrugs', category: 'accessory', isDefault: true },
  { _id: '00000000000000000000002e', name: 'Good Mornings', category: 'accessory', isDefault: true },
  { _id: '00000000000000000000002f', name: 'Glute Ham Raise', category: 'accessory', isDefault: true },
  { _id: '000000000000000000000030', name: 'Reverse Hyper', category: 'accessory', isDefault: true }
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

const mongoose = require('mongoose');

// Track if event listeners have been registered (prevents accumulation on hot reload)
let listenersRegistered = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;

// Default exercises to seed automatically
const defaultExercises = [
  // Upper Body
  { name: 'Bench Press', category: 'upper_body', description: 'Barbell bench press for chest development', applicableSports: ['all'], isGlobal: true },
  { name: 'Incline Bench Press', category: 'upper_body', description: 'Incline barbell press for upper chest', applicableSports: ['all'], isGlobal: true },
  { name: 'Dumbbell Press', category: 'upper_body', description: 'Dumbbell chest press', applicableSports: ['all'], isGlobal: true },
  { name: 'Overhead Press', category: 'upper_body', description: 'Standing barbell overhead press', applicableSports: ['all'], isGlobal: true },
  { name: 'Push Press', category: 'upper_body', description: 'Explosive overhead press with leg drive', applicableSports: ['all'], isGlobal: true },
  { name: 'Barbell Row', category: 'upper_body', description: 'Bent over barbell row', applicableSports: ['all'], isGlobal: true },
  { name: 'Pull-ups', category: 'upper_body', description: 'Bodyweight pull-ups', applicableSports: ['all'], isGlobal: true },
  { name: 'Lat Pulldown', category: 'upper_body', description: 'Cable lat pulldown', applicableSports: ['all'], isGlobal: true },
  { name: 'Dumbbell Curl', category: 'upper_body', description: 'Bicep curls with dumbbells', applicableSports: ['all'], isGlobal: true },
  { name: 'Tricep Pushdown', category: 'upper_body', description: 'Cable tricep pushdowns', applicableSports: ['all'], isGlobal: true },
  { name: 'Dips', category: 'upper_body', description: 'Parallel bar dips', applicableSports: ['all'], isGlobal: true },
  { name: 'Face Pulls', category: 'upper_body', description: 'Cable face pulls for rear delts', applicableSports: ['all'], isGlobal: true },
  // Lower Body
  { name: 'Back Squat', category: 'lower_body', description: 'Barbell back squat', applicableSports: ['all'], isGlobal: true },
  { name: 'Front Squat', category: 'lower_body', description: 'Barbell front squat', applicableSports: ['all'], isGlobal: true },
  { name: 'Deadlift', category: 'lower_body', description: 'Conventional barbell deadlift', applicableSports: ['all'], isGlobal: true },
  { name: 'Romanian Deadlift', category: 'lower_body', description: 'Romanian deadlift for hamstrings', applicableSports: ['all'], isGlobal: true },
  { name: 'Sumo Deadlift', category: 'lower_body', description: 'Wide stance sumo deadlift', applicableSports: ['all'], isGlobal: true },
  { name: 'Leg Press', category: 'lower_body', description: 'Machine leg press', applicableSports: ['all'], isGlobal: true },
  { name: 'Walking Lunges', category: 'lower_body', description: 'Walking lunges with or without weight', applicableSports: ['all'], isGlobal: true },
  { name: 'Bulgarian Split Squat', category: 'lower_body', description: 'Single leg squat with rear foot elevated', applicableSports: ['all'], isGlobal: true },
  { name: 'Hip Thrust', category: 'lower_body', description: 'Barbell hip thrust for glutes', applicableSports: ['all'], isGlobal: true },
  { name: 'Leg Curl', category: 'lower_body', description: 'Machine leg curl', applicableSports: ['all'], isGlobal: true },
  { name: 'Leg Extension', category: 'lower_body', description: 'Machine leg extension', applicableSports: ['all'], isGlobal: true },
  { name: 'Calf Raises', category: 'lower_body', description: 'Standing or seated calf raises', applicableSports: ['all'], isGlobal: true },
  // Olympic Lifts
  { name: 'Power Clean', category: 'olympic', description: 'Olympic power clean', applicableSports: ['football', 'basketball', 'track'], isGlobal: true },
  { name: 'Hang Clean', category: 'olympic', description: 'Clean from hang position', applicableSports: ['football', 'basketball', 'track'], isGlobal: true },
  { name: 'Clean and Jerk', category: 'olympic', description: 'Full clean and jerk', applicableSports: ['all'], isGlobal: true },
  { name: 'Snatch', category: 'olympic', description: 'Olympic snatch', applicableSports: ['all'], isGlobal: true },
  { name: 'Power Snatch', category: 'olympic', description: 'Power snatch variation', applicableSports: ['all'], isGlobal: true },
  { name: 'Hang Snatch', category: 'olympic', description: 'Snatch from hang position', applicableSports: ['all'], isGlobal: true },
  // Core
  { name: 'Plank', category: 'core', description: 'Standard plank hold', applicableSports: ['all'], isGlobal: true },
  { name: 'Russian Twist', category: 'core', description: 'Seated Russian twist', applicableSports: ['all'], isGlobal: true },
  { name: 'Hanging Leg Raise', category: 'core', description: 'Hanging leg raises', applicableSports: ['all'], isGlobal: true },
  { name: 'Ab Wheel Rollout', category: 'core', description: 'Ab wheel rollout', applicableSports: ['all'], isGlobal: true },
  { name: 'Cable Woodchop', category: 'core', description: 'Cable woodchop for obliques', applicableSports: ['all'], isGlobal: true },
  { name: 'Dead Bug', category: 'core', description: 'Dead bug core exercise', applicableSports: ['all'], isGlobal: true },
  // Cardio
  { name: 'Box Jumps', category: 'cardio', description: 'Plyometric box jumps', applicableSports: ['all'], isGlobal: true },
  { name: 'Burpees', category: 'cardio', description: 'Full burpees', applicableSports: ['all'], isGlobal: true },
  { name: 'Battle Ropes', category: 'cardio', description: 'Battle rope exercises', applicableSports: ['all'], isGlobal: true },
  { name: 'Sled Push', category: 'cardio', description: 'Weighted sled push', applicableSports: ['football', 'wrestling'], isGlobal: true },
  { name: 'Farmer Carry', category: 'cardio', description: 'Loaded carry exercise', applicableSports: ['all'], isGlobal: true },
  { name: 'Rowing Machine', category: 'cardio', description: 'Rowing machine cardio', applicableSports: ['all'], isGlobal: true },
  // Accessory
  { name: 'Lateral Raise', category: 'accessory', description: 'Dumbbell lateral raises', applicableSports: ['all'], isGlobal: true },
  { name: 'Rear Delt Fly', category: 'accessory', description: 'Rear deltoid fly', applicableSports: ['all'], isGlobal: true },
  { name: 'Shrugs', category: 'accessory', description: 'Barbell or dumbbell shrugs', applicableSports: ['all'], isGlobal: true },
  { name: 'Good Mornings', category: 'accessory', description: 'Barbell good mornings', applicableSports: ['all'], isGlobal: true },
  { name: 'Glute Ham Raise', category: 'accessory', description: 'GHD glute ham raise', applicableSports: ['all'], isGlobal: true },
  { name: 'Reverse Hyper', category: 'accessory', description: 'Reverse hyperextension', applicableSports: ['all'], isGlobal: true }
];

const seedExercises = async () => {
  try {
    const Exercise = require('../models/Exercise');
    const count = await Exercise.countDocuments({ isGlobal: true });

    if (count === 0) {
      console.log('Seeding default exercises...');
      await Exercise.insertMany(defaultExercises);
      console.log(`Seeded ${defaultExercises.length} default exercises`);
    }
  } catch (error) {
    console.error('Error seeding exercises:', error.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,  // 10 second timeout for initial connection
      socketTimeoutMS: 45000,           // 45 second socket timeout
      maxPoolSize: 50,                  // Connection pool size
      retryWrites: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed exercises if none exist
    await seedExercises();

    // Only register event listeners once (prevents accumulation on hot reload)
    if (!listenersRegistered) {
      listenersRegistered = true;

      // Handle connection errors
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      // Handle disconnection with automatic reconnection
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          const delay = Math.min(5000 * reconnectAttempts, 30000); // Max 30 seconds
          console.log(`Attempting to reconnect in ${delay/1000}s... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

          setTimeout(async () => {
            try {
              await mongoose.connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000,
                socketTimeoutMS: 45000,
                maxPoolSize: 50,
                retryWrites: true,
              });
            } catch (err) {
              console.error('Reconnection attempt failed:', err.message);
            }
          }, delay);
        } else {
          console.error('Max reconnection attempts reached. Manual intervention required.');
        }
      });

      // Reset reconnect counter on successful connection
      mongoose.connection.on('connected', () => {
        if (reconnectAttempts > 0) {
          console.log('MongoDB reconnected successfully');
        }
        reconnectAttempts = 0;
      });

      // Graceful shutdown - only register once
      process.once('SIGINT', async () => {
        try {
          await mongoose.connection.close();
          console.log('MongoDB connection closed through app termination');
        } catch (err) {
          console.error('Error closing MongoDB connection:', err);
        }
        process.exit(0);
      });
    }

  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

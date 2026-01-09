const mongoose = require('mongoose');

// Individual exercise log entry
const exerciseLogSchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    default: null
  },
  exerciseName: {
    type: String,
    required: true
  },
  // Array of sets with their logged data
  sets: [{
    setNumber: {
      type: Number,
      required: true
    },
    prescribedReps: String,
    prescribedWeight: Number,
    prescribedPercentage: Number,
    // What the athlete actually did
    completedReps: {
      type: Number,
      default: null
    },
    completedWeight: {
      type: Number,
      default: null
    },
    notes: String
  }],
  // Quick summary fields
  totalSetsCompleted: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    maxlength: 500
  }
}, { _id: true });

const workoutLogSchema = new mongoose.Schema({
  athleteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // Reference to the workout program if applicable
  workoutProgramId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutProgram',
    default: null
  },
  // Logged exercises
  exercises: [exerciseLogSchema],
  // Overall workout completion status
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compound index for efficient lookups - one log per athlete per day
workoutLogSchema.index({ athleteId: 1, date: 1 }, { unique: true });
workoutLogSchema.index({ athleteId: 1, createdAt: -1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);

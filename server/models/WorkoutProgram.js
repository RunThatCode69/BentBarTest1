const mongoose = require('mongoose');

// Schema for individual set configuration (e.g., 3x5 @70%)
const setConfigSchema = new mongoose.Schema({
  sets: {
    type: Number,
    required: true,
    min: 1
  },
  reps: {
    type: String,
    required: true
  },
  percentage: {
    type: Number,
    min: 0,
    max: 120,
    default: null
  },
  weight: {
    type: Number,
    min: 0,
    default: null
  }
}, { _id: false });

const exerciseEntrySchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: false
  },
  exerciseName: {
    type: String,
    required: true
  },
  // Complex set programming - array of set configurations
  setConfigs: {
    type: [setConfigSchema],
    default: []
  },
  // Backwards compatibility / simple display fields
  sets: {
    type: Number,
    required: true,
    min: 1,
    max: 100 // Allow higher for total sets across configs
  },
  reps: {
    type: String, // Can be "5" or "5-8" range
    required: true
  },
  percentage: {
    type: Number, // Of 1RM, e.g., 75
    min: 0,
    max: 120,
    default: null
  },
  weight: {
    type: Number, // Optional fixed weight
    min: 0,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  youtubeUrl: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: true });

const workoutDaySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  dayOfWeek: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  exercises: [exerciseEntrySchema]
}, { _id: true });

const workoutProgramSchema = new mongoose.Schema({
  programName: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true,
    maxlength: [100, 'Program name cannot exceed 100 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    required: true
  },
  createdByModel: {
    type: String,
    enum: ['Coach', 'Trainer'],
    required: true
  },
  assignedTeams: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  workouts: [workoutDaySchema],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  isDraft: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
workoutProgramSchema.index({ createdBy: 1 });
workoutProgramSchema.index({ assignedTeams: 1 });
workoutProgramSchema.index({ 'workouts.date': 1 });

// Virtual to get workout by date
workoutProgramSchema.methods.getWorkoutByDate = function(date) {
  const targetDate = new Date(date).toDateString();
  return this.workouts.find(w => new Date(w.date).toDateString() === targetDate);
};

module.exports = mongoose.model('WorkoutProgram', workoutProgramSchema);

const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  visibleName: {
    type: String,
    required: true
  },
  reps: {
    type: Number,
    required: true,
    min: 0
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise'
  }
}, { _id: true });

const maxSchema = new mongoose.Schema({
  exerciseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exercise',
    required: true
  },
  exerciseName: {
    type: String,
    required: true
  },
  oneRepMax: {
    type: Number,
    required: true,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const athleteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [100, 'School name cannot exceed 100 characters']
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  sport: {
    type: String,
    required: [true, 'Sport is required']
  },
  stats: [statSchema],
  maxes: [maxSchema],
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for faster lookups
athleteSchema.index({ userId: 1 });
athleteSchema.index({ teamId: 1 });
athleteSchema.index({ schoolName: 1 });

// Virtual for full name
athleteSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON output
athleteSchema.set('toJSON', { virtuals: true });
athleteSchema.set('toObject', { virtuals: true });

// Method to get one rep max for a specific exercise
athleteSchema.methods.getOneRepMax = function(exerciseId) {
  const max = this.maxes.find(m => m.exerciseId.toString() === exerciseId.toString());
  return max ? max.oneRepMax : null;
};

// Method to update or add a max
athleteSchema.methods.updateMax = function(exerciseId, exerciseName, oneRepMax) {
  const existingMaxIndex = this.maxes.findIndex(m => m.exerciseId.toString() === exerciseId.toString());

  if (existingMaxIndex >= 0) {
    this.maxes[existingMaxIndex].oneRepMax = oneRepMax;
    this.maxes[existingMaxIndex].lastUpdated = new Date();
  } else {
    this.maxes.push({
      exerciseId,
      exerciseName,
      oneRepMax,
      lastUpdated: new Date()
    });
  }
};

module.exports = mongoose.model('Athlete', athleteSchema);

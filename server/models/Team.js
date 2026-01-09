const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [100, 'Team name cannot exceed 100 characters']
  },
  sport: {
    type: String,
    enum: [
      'football',
      'basketball',
      'soccer',
      'baseball',
      'softball',
      'volleyball',
      'track',
      'swimming',
      'wrestling',
      'tennis',
      'golf',
      'lacrosse',
      'hockey',
      'other'
    ],
    required: [true, 'Sport is required']
  },
  schoolName: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
    maxlength: [100, 'School name cannot exceed 100 characters']
  },
  coaches: [{
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coach',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'assistant'],
      default: 'assistant'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  accessCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  athletes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete'
  }],
  workoutPrograms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutProgram'
  }]
}, {
  timestamps: true
});

// Indexes for faster lookups
teamSchema.index({ accessCode: 1 }, { unique: true });
teamSchema.index({ 'coaches.coachId': 1 });
teamSchema.index({ schoolName: 1, sport: 1 });

// Virtual to get owner coach
teamSchema.virtual('ownerId').get(function() {
  const owner = this.coaches.find(c => c.role === 'owner');
  return owner ? owner.coachId : null;
});

// Method to check if a coach has access to this team
teamSchema.methods.hasCoach = function(coachId) {
  return this.coaches.some(c => c.coachId.toString() === coachId.toString());
};

// Method to check if coach is owner
teamSchema.methods.isOwner = function(coachId) {
  const owner = this.coaches.find(c => c.role === 'owner');
  return owner && owner.coachId.toString() === coachId.toString();
};

// Limit coaches to 5
teamSchema.pre('save', function(next) {
  if (this.coaches && this.coaches.length > 5) {
    const err = new Error('A team can have a maximum of 5 coaches');
    err.statusCode = 400;
    return next(err);
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);

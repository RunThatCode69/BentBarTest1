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
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coach',
    required: true
  },
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
teamSchema.index({ coachId: 1 });
teamSchema.index({ schoolName: 1, sport: 1 });

module.exports = mongoose.model('Team', teamSchema);

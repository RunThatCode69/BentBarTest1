const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
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
  organizationType: {
    type: String,
    enum: ['university', 'college', 'high_school'],
    required: [true, 'Organization type is required']
  },
  teams: [{
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    sport: String
  }],
  paymentStatus: {
    type: String,
    enum: ['pending', 'active', 'cancelled'],
    default: 'pending'
  },
  paidTeams: {
    type: Number,
    default: 0  // Number of teams they've paid for ($200 each)
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  subscriptionId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster lookups
coachSchema.index({ userId: 1 });
coachSchema.index({ schoolName: 1 });

// Virtual for full name
coachSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON output
coachSchema.set('toJSON', { virtuals: true });
coachSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Coach', coachSchema);

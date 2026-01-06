const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
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
  gymName: {
    type: String,
    trim: true,
    maxlength: [100, 'Gym name cannot exceed 100 characters']
  },
  programName: {
    type: String,
    required: [true, 'Program name is required'],
    trim: true,
    maxlength: [100, 'Program name cannot exceed 100 characters']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'active', 'cancelled'],
    default: 'pending'
  },
  stripeCustomerId: {
    type: String,
    default: null
  },
  subscriptionId: {
    type: String,
    default: null
  },
  athletes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete'
  }]
}, {
  timestamps: true
});

// Index for faster lookups
trainerSchema.index({ userId: 1 });

// Virtual for full name
trainerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON output
trainerSchema.set('toJSON', { virtuals: true });
trainerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trainer', trainerSchema);

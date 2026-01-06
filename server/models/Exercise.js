const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
    maxlength: [100, 'Exercise name cannot exceed 100 characters']
  },
  category: {
    type: String,
    enum: ['upper_body', 'lower_body', 'core', 'cardio', 'olympic', 'accessory'],
    required: [true, 'Category is required']
  },
  youtubeUrl: {
    type: String,
    trim: true,
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel',
    default: null
  },
  createdByModel: {
    type: String,
    enum: ['Coach', 'Trainer', null],
    default: null
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  applicableSports: [{
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
      'other',
      'all'
    ]
  }]
}, {
  timestamps: true
});

// Indexes for faster lookups
exerciseSchema.index({ name: 1 });
exerciseSchema.index({ category: 1 });
exerciseSchema.index({ isGlobal: 1 });
exerciseSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);

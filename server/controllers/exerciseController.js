const Exercise = require('../models/Exercise');
const Coach = require('../models/Coach');
const Trainer = require('../models/Trainer');

/**
 * @desc    Get all exercises
 * @route   GET /api/exercises
 * @access  Private
 */
const getExercises = async (req, res) => {
  try {
    const { category, search, sport } = req.query;

    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Search by name - with ReDoS protection
    if (search) {
      // Limit search length to prevent abuse
      if (search.length > 100) {
        return res.status(400).json({ message: 'Search term too long (max 100 characters)' });
      }
      // Escape special regex characters to prevent ReDoS attacks
      const sanitizedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: sanitizedSearch, $options: 'i' };
    }

    // Include global exercises and user-created exercises
    let creatorId = null;
    let creatorModel = null;

    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      creatorId = coach?._id;
      creatorModel = 'Coach';
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      creatorId = trainer?._id;
      creatorModel = 'Trainer';
    }

    // Build the $and query for proper filtering
    const andConditions = [];

    // Global exercises OR created by this user
    andConditions.push({
      $or: [
        { isGlobal: true },
        { createdBy: creatorId, createdByModel: creatorModel }
      ]
    });

    // Filter by applicable sports (if specified)
    if (sport) {
      andConditions.push({
        $or: [
          { applicableSports: sport },
          { applicableSports: 'all' }
        ]
      });
    }

    query.$and = andConditions;

    const exercises = await Exercise.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: exercises.length,
      exercises
    });

  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create new exercise
 * @route   POST /api/exercises
 * @access  Private (Coach/Trainer only)
 */
const createExercise = async (req, res) => {
  try {
    const { name, category, youtubeUrl, description, applicableSports } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    // Validate YouTube URL if provided
    if (youtubeUrl) {
      const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+$/;
      if (!youtubePattern.test(youtubeUrl)) {
        return res.status(400).json({ message: 'Invalid YouTube URL format' });
      }
    }

    let creatorId = null;
    let creatorModel = null;

    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      creatorId = coach?._id;
      creatorModel = 'Coach';
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      creatorId = trainer?._id;
      creatorModel = 'Trainer';
    }

    const exercise = await Exercise.create({
      name,
      category,
      youtubeUrl: youtubeUrl || null,
      description: description || '',
      createdBy: creatorId,
      createdByModel: creatorModel,
      isGlobal: false,
      applicableSports: applicableSports || ['all']
    });

    res.status(201).json({
      success: true,
      exercise
    });

  } catch (error) {
    console.error('Create exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get specific exercise
 * @route   GET /api/exercises/:id
 * @access  Private
 */
const getExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    res.json({
      success: true,
      exercise
    });

  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update exercise
 * @route   PUT /api/exercises/:id
 * @access  Private (Coach/Trainer only)
 */
const updateExercise = async (req, res) => {
  try {
    const { name, category, youtubeUrl, description, applicableSports } = req.body;

    let exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Only allow editing non-global exercises by their creator
    if (exercise.isGlobal) {
      return res.status(403).json({ message: 'Cannot edit global exercises' });
    }

    let creatorId = null;
    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      creatorId = coach?._id;
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      creatorId = trainer?._id;
    }

    if (exercise.createdBy?.toString() !== creatorId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this exercise' });
    }

    // Validate YouTube URL if provided
    if (youtubeUrl) {
      const youtubePattern = /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]+$/;
      if (!youtubePattern.test(youtubeUrl)) {
        return res.status(400).json({ message: 'Invalid YouTube URL format' });
      }
    }

    // Update fields
    if (name) exercise.name = name;
    if (category) exercise.category = category;
    if (youtubeUrl !== undefined) exercise.youtubeUrl = youtubeUrl;
    if (description !== undefined) exercise.description = description;
    if (applicableSports) exercise.applicableSports = applicableSports;

    await exercise.save();

    res.json({
      success: true,
      exercise
    });

  } catch (error) {
    console.error('Update exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete exercise
 * @route   DELETE /api/exercises/:id
 * @access  Private (Coach/Trainer only)
 */
const deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);

    if (!exercise) {
      return res.status(404).json({ message: 'Exercise not found' });
    }

    // Only allow deleting non-global exercises by their creator
    if (exercise.isGlobal) {
      return res.status(403).json({ message: 'Cannot delete global exercises' });
    }

    let creatorId = null;
    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      creatorId = coach?._id;
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      creatorId = trainer?._id;
    }

    if (exercise.createdBy?.toString() !== creatorId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this exercise' });
    }

    await exercise.deleteOne();

    res.json({
      success: true,
      message: 'Exercise deleted'
    });

  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get exercises by category
 * @route   GET /api/exercises/category/:category
 * @access  Private
 */
const getExercisesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const exercises = await Exercise.find({
      category,
      $or: [{ isGlobal: true }]
    }).sort({ name: 1 });

    res.json({
      success: true,
      exercises
    });

  } catch (error) {
    console.error('Get exercises by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getExercises,
  createExercise,
  getExercise,
  updateExercise,
  deleteExercise,
  getExercisesByCategory
};

const Trainer = require('../models/Trainer');
const Athlete = require('../models/Athlete');
const WorkoutProgram = require('../models/WorkoutProgram');

/**
 * @desc    Get trainer dashboard data
 * @route   GET /api/trainer/dashboard
 * @access  Private (Trainer only)
 */
const getDashboard = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ userId: req.user._id })
      .populate({
        path: 'athletes',
        select: 'firstName lastName sport stats maxes'
      });

    if (!trainer) {
      return res.status(404).json({ message: 'Trainer profile not found' });
    }

    // Get upcoming workouts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingWorkouts = await WorkoutProgram.find({
      createdBy: trainer._id,
      createdByModel: 'Trainer',
      isPublished: true,
      'workouts.date': { $gte: today, $lte: nextWeek }
    }).sort({ 'workouts.date': 1 });

    // Collect athlete stats
    const athleteStats = [];
    trainer.athletes.forEach(athlete => {
      if (athlete.maxes && athlete.maxes.length > 0) {
        athlete.maxes.forEach(max => {
          athleteStats.push({
            athleteId: athlete._id,
            athleteName: `${athlete.firstName} ${athlete.lastName}`,
            sport: athlete.sport,
            exerciseName: max.exerciseName,
            oneRepMax: max.oneRepMax,
            lastUpdated: max.lastUpdated
          });
        });
      }
    });

    res.json({
      success: true,
      trainer: {
        id: trainer._id,
        firstName: trainer.firstName,
        lastName: trainer.lastName,
        programName: trainer.programName,
        gymName: trainer.gymName
      },
      athleteCount: trainer.athletes.length,
      athleteStats: athleteStats.slice(0, 20),
      upcomingWorkouts: upcomingWorkouts.slice(0, 3)
    });

  } catch (error) {
    console.error('Get trainer dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get trainer's athletes
 * @route   GET /api/trainer/athletes
 * @access  Private (Trainer only)
 */
const getAthletes = async (req, res) => {
  try {
    const trainer = await Trainer.findOne({ userId: req.user._id });

    if (!trainer) {
      return res.status(404).json({ message: 'Trainer profile not found' });
    }

    const athletes = await Athlete.find({ trainerId: trainer._id })
      .select('firstName lastName sport stats maxes createdAt');

    res.json({
      success: true,
      athletes
    });

  } catch (error) {
    console.error('Get trainer athletes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Add athlete to trainer
 * @route   POST /api/trainer/athletes
 * @access  Private (Trainer only)
 */
const addAthlete = async (req, res) => {
  try {
    const { athleteId } = req.body;

    if (!athleteId) {
      return res.status(400).json({ message: 'Athlete ID is required' });
    }

    const trainer = await Trainer.findOne({ userId: req.user._id });

    if (!trainer) {
      return res.status(404).json({ message: 'Trainer profile not found' });
    }

    const athlete = await Athlete.findById(athleteId);

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    // Check if athlete is already assigned
    if (trainer.athletes.includes(athleteId)) {
      return res.status(400).json({ message: 'Athlete already assigned to you' });
    }

    trainer.athletes.push(athleteId);
    await trainer.save();

    athlete.trainerId = trainer._id;
    await athlete.save();

    res.json({
      success: true,
      message: 'Athlete added successfully'
    });

  } catch (error) {
    console.error('Add athlete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Remove athlete from trainer
 * @route   DELETE /api/trainer/athletes/:athleteId
 * @access  Private (Trainer only)
 */
const removeAthlete = async (req, res) => {
  try {
    const { athleteId } = req.params;

    const trainer = await Trainer.findOne({ userId: req.user._id });

    if (!trainer) {
      return res.status(404).json({ message: 'Trainer profile not found' });
    }

    trainer.athletes = trainer.athletes.filter(id => id.toString() !== athleteId);
    await trainer.save();

    const athlete = await Athlete.findById(athleteId);
    if (athlete) {
      athlete.trainerId = null;
      await athlete.save();
    }

    res.json({
      success: true,
      message: 'Athlete removed successfully'
    });

  } catch (error) {
    console.error('Remove athlete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getAthletes,
  addAthlete,
  removeAthlete
};

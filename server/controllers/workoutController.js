const WorkoutProgram = require('../models/WorkoutProgram');
const Coach = require('../models/Coach');
const Trainer = require('../models/Trainer');
const Team = require('../models/Team');
const Exercise = require('../models/Exercise');

/**
 * @desc    Get all workouts (coach sees all, athlete sees assigned)
 * @route   GET /api/workouts
 * @access  Private
 */
const getWorkouts = async (req, res) => {
  try {
    const { startDate, endDate, teamId, status } = req.query;

    let query = {};
    let creatorId = null;
    let creatorModel = null;

    // Determine user type and set up query
    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      if (!coach) {
        return res.status(404).json({ message: 'Coach profile not found' });
      }
      creatorId = coach._id;
      creatorModel = 'Coach';
      query.createdBy = coach._id;
      query.createdByModel = 'Coach';
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      if (!trainer) {
        return res.status(404).json({ message: 'Trainer profile not found' });
      }
      creatorId = trainer._id;
      creatorModel = 'Trainer';
      query.createdBy = trainer._id;
      query.createdByModel = 'Trainer';
    }

    // Filter by team
    if (teamId) {
      query.assignedTeams = teamId;
    }

    // Filter by status
    if (status === 'published') {
      query.isPublished = true;
      query.isDraft = false;
    } else if (status === 'draft') {
      query.isDraft = true;
    }

    // Filter by date range
    if (startDate && endDate) {
      query.$or = [
        { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
        { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(endDate) } }
      ];
    }

    const workouts = await WorkoutProgram.find(query)
      .populate('assignedTeams', 'teamName sport')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: workouts.length,
      workouts
    });

  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create new workout program
 * @route   POST /api/workouts
 * @access  Private (Coach/Trainer only)
 */
const createWorkout = async (req, res) => {
  try {
    const { programName, startDate, endDate, workouts, assignedTeams, isPublished } = req.body;

    if (!programName || !startDate || !endDate) {
      return res.status(400).json({ message: 'Program name, start date, and end date are required' });
    }

    let creatorId = null;
    let creatorModel = null;

    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      if (!coach) {
        return res.status(404).json({ message: 'Coach profile not found' });
      }
      creatorId = coach._id;
      creatorModel = 'Coach';
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      if (!trainer) {
        return res.status(404).json({ message: 'Trainer profile not found' });
      }
      creatorId = trainer._id;
      creatorModel = 'Trainer';
    }

    const workoutProgram = await WorkoutProgram.create({
      programName,
      createdBy: creatorId,
      createdByModel: creatorModel,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      workouts: workouts || [],
      assignedTeams: assignedTeams || [],
      isPublished: isPublished || false,
      isDraft: !isPublished
    });

    res.status(201).json({
      success: true,
      workout: workoutProgram
    });

  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get specific workout
 * @route   GET /api/workouts/:id
 * @access  Private
 */
const getWorkout = async (req, res) => {
  try {
    const workout = await WorkoutProgram.findById(req.params.id)
      .populate('assignedTeams', 'teamName sport athletes')
      .populate('workouts.exercises.exerciseId', 'name category youtubeUrl description');

    if (!workout) {
      return res.status(404).json({ message: 'Workout program not found' });
    }

    // Verify ownership
    let hasAccess = false;
    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      hasAccess = workout.createdBy.toString() === coach?._id.toString();
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      hasAccess = workout.createdBy.toString() === trainer?._id.toString();
    } else if (req.user.role === 'athlete') {
      // Athletes can view assigned workouts
      const Athlete = require('../models/Athlete');
      const athlete = await Athlete.findOne({ userId: req.user._id });
      hasAccess = workout.assignedTeams.some(
        team => team._id.toString() === athlete?.teamId.toString()
      );
    }

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to view this workout' });
    }

    res.json({
      success: true,
      workout
    });

  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update workout program
 * @route   PUT /api/workouts/:id
 * @access  Private (Coach/Trainer only)
 */
const updateWorkout = async (req, res) => {
  try {
    const { programName, startDate, endDate, workouts, assignedTeams, isPublished } = req.body;

    let workout = await WorkoutProgram.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout program not found' });
    }

    // Verify ownership
    let creatorId = null;
    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      creatorId = coach?._id;
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      creatorId = trainer?._id;
    }

    if (workout.createdBy.toString() !== creatorId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this workout' });
    }

    // Update fields
    if (programName) workout.programName = programName;
    if (startDate) workout.startDate = new Date(startDate);
    if (endDate) workout.endDate = new Date(endDate);
    if (workouts) workout.workouts = workouts;
    if (assignedTeams) workout.assignedTeams = assignedTeams;
    if (isPublished !== undefined) {
      workout.isPublished = isPublished;
      workout.isDraft = !isPublished;
    }

    await workout.save();

    res.json({
      success: true,
      workout
    });

  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Delete workout program
 * @route   DELETE /api/workouts/:id
 * @access  Private (Coach/Trainer only)
 */
const deleteWorkout = async (req, res) => {
  try {
    const workout = await WorkoutProgram.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout program not found' });
    }

    // Verify ownership
    let creatorId = null;
    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      creatorId = coach?._id;
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      creatorId = trainer?._id;
    }

    if (workout.createdBy.toString() !== creatorId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this workout' });
    }

    await workout.deleteOne();

    res.json({
      success: true,
      message: 'Workout program deleted'
    });

  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Add workout day to program
 * @route   POST /api/workouts/:id/days
 * @access  Private (Coach/Trainer only)
 */
const addWorkoutDay = async (req, res) => {
  try {
    const { date, dayOfWeek, title, exercises } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const workout = await WorkoutProgram.findById(req.params.id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout program not found' });
    }

    // Verify ownership
    let creatorId = null;
    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      creatorId = coach?._id;
    } else if (req.user.role === 'trainer') {
      const trainer = await Trainer.findOne({ userId: req.user._id });
      creatorId = trainer?._id;
    }

    if (workout.createdBy.toString() !== creatorId?.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this workout' });
    }

    // Add workout day
    workout.workouts.push({
      date: new Date(date),
      dayOfWeek: dayOfWeek || getDayOfWeek(new Date(date)),
      title: title || '',
      exercises: exercises || []
    });

    await workout.save();

    res.json({
      success: true,
      workout
    });

  } catch (error) {
    console.error('Add workout day error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Assign workout to team
 * @route   POST /api/workouts/:id/assign/:teamId
 * @access  Private (Coach only)
 */
const assignToTeam = async (req, res) => {
  try {
    const { id, teamId } = req.params;

    const workout = await WorkoutProgram.findById(id);

    if (!workout) {
      return res.status(404).json({ message: 'Workout program not found' });
    }

    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach || workout.createdBy.toString() !== coach._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Verify team belongs to coach
    const team = await Team.findOne({ _id: teamId, coachId: coach._id });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if already assigned
    if (!workout.assignedTeams.includes(teamId)) {
      workout.assignedTeams.push(teamId);
      await workout.save();
    }

    // Add workout to team's workoutPrograms
    if (!team.workoutPrograms.includes(id)) {
      team.workoutPrograms.push(id);
      await team.save();
    }

    res.json({
      success: true,
      message: 'Workout assigned to team',
      workout
    });

  } catch (error) {
    console.error('Assign to team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Helper function to get day of week
 */
function getDayOfWeek(date) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
}

module.exports = {
  getWorkouts,
  createWorkout,
  getWorkout,
  updateWorkout,
  deleteWorkout,
  addWorkoutDay,
  assignToTeam
};

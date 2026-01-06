const Athlete = require('../models/Athlete');
const Team = require('../models/Team');
const WorkoutProgram = require('../models/WorkoutProgram');
const Exercise = require('../models/Exercise');
const { calculateOneRepMax, displayWeight } = require('../utils/calculateOneRepMax');

/**
 * @desc    Get athlete dashboard data
 * @route   GET /api/athlete/dashboard
 * @access  Private (Athlete only)
 */
const getDashboard = async (req, res) => {
  try {
    const athlete = await Athlete.findOne({ userId: req.user._id })
      .populate('teamId', 'teamName sport workoutPrograms');

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    // Get today's workout
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const workoutPrograms = await WorkoutProgram.find({
      assignedTeams: athlete.teamId._id,
      isPublished: true,
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // Find today's workout
    let todayWorkout = null;
    for (const program of workoutPrograms) {
      const workout = program.workouts.find(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === today.getTime();
      });
      if (workout) {
        todayWorkout = {
          programName: program.programName,
          programId: program._id,
          ...workout.toObject()
        };
        break;
      }
    }

    // Process exercises with calculated weights
    if (todayWorkout && todayWorkout.exercises) {
      todayWorkout.exercises = todayWorkout.exercises.map(exercise => {
        const athleteMax = athlete.maxes.find(
          m => m.exerciseId?.toString() === exercise.exerciseId?.toString()
        );

        const weightDisplay = displayWeight(
          athleteMax?.oneRepMax,
          exercise.percentage
        );

        return {
          ...exercise,
          calculatedWeight: weightDisplay.calculatedWeight,
          displayText: weightDisplay.displayText,
          hasOneRepMax: !!athleteMax
        };
      });
    }

    // Get athlete's recent stats for rolling display
    const recentStats = athlete.maxes.map(max => ({
      exerciseName: max.exerciseName,
      oneRepMax: max.oneRepMax,
      lastUpdated: max.lastUpdated
    }));

    res.json({
      success: true,
      athlete: {
        id: athlete._id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        sport: athlete.sport
      },
      team: {
        id: athlete.teamId._id,
        teamName: athlete.teamId.teamName,
        sport: athlete.teamId.sport
      },
      todayWorkout,
      recentStats: recentStats.slice(0, 10)
    });

  } catch (error) {
    console.error('Get athlete dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get athlete stats
 * @route   GET /api/athlete/stats
 * @access  Private (Athlete only)
 */
const getStats = async (req, res) => {
  try {
    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    res.json({
      success: true,
      maxes: athlete.maxes,
      stats: athlete.stats.slice(-50), // Last 50 entries
      athlete: {
        id: athlete._id,
        firstName: athlete.firstName,
        lastName: athlete.lastName
      }
    });

  } catch (error) {
    console.error('Get athlete stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Log new stat/lift
 * @route   POST /api/athlete/stats
 * @access  Private (Athlete only)
 */
const logStat = async (req, res) => {
  try {
    const { exerciseId, exerciseName, weight, reps, date } = req.body;

    if (!exerciseName || !weight || !reps) {
      return res.status(400).json({ message: 'Exercise name, weight, and reps are required' });
    }

    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    // Add stat entry
    const statEntry = {
      visibleName: exerciseName,
      reps: parseInt(reps),
      weight: parseFloat(weight),
      date: date ? new Date(date) : new Date(),
      exerciseId: exerciseId || null
    };

    athlete.stats.push(statEntry);

    // Calculate potential new 1RM
    const estimated1RM = calculateOneRepMax(parseFloat(weight), parseInt(reps));

    // Check if this is a new PR
    const existingMax = athlete.maxes.find(
      m => m.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );

    let updatedMax = false;
    if (!existingMax) {
      // Add new max
      athlete.maxes.push({
        exerciseId: exerciseId || null,
        exerciseName,
        oneRepMax: estimated1RM,
        lastUpdated: new Date()
      });
      updatedMax = true;
    } else if (estimated1RM > existingMax.oneRepMax) {
      // Update existing max if new PR
      existingMax.oneRepMax = estimated1RM;
      existingMax.lastUpdated = new Date();
      updatedMax = true;
    }

    await athlete.save();

    res.status(201).json({
      success: true,
      stat: statEntry,
      estimated1RM,
      isPR: updatedMax,
      message: updatedMax ? 'New personal record!' : 'Stat logged successfully'
    });

  } catch (error) {
    console.error('Log stat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update one rep max
 * @route   PUT /api/athlete/stats/max
 * @access  Private (Athlete only)
 */
const updateMax = async (req, res) => {
  try {
    const { exerciseId, exerciseName, oneRepMax } = req.body;

    if (!exerciseName || !oneRepMax) {
      return res.status(400).json({ message: 'Exercise name and one rep max are required' });
    }

    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    // Find and update or add max
    const existingMaxIndex = athlete.maxes.findIndex(
      m => m.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );

    if (existingMaxIndex >= 0) {
      athlete.maxes[existingMaxIndex].oneRepMax = parseFloat(oneRepMax);
      athlete.maxes[existingMaxIndex].lastUpdated = new Date();
    } else {
      athlete.maxes.push({
        exerciseId: exerciseId || null,
        exerciseName,
        oneRepMax: parseFloat(oneRepMax),
        lastUpdated: new Date()
      });
    }

    await athlete.save();

    res.json({
      success: true,
      maxes: athlete.maxes,
      message: 'Max updated successfully'
    });

  } catch (error) {
    console.error('Update max error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get athlete workouts
 * @route   GET /api/athlete/workouts
 * @access  Private (Athlete only)
 */
const getWorkouts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1, 0));

    const workoutPrograms = await WorkoutProgram.find({
      assignedTeams: athlete.teamId,
      isPublished: true,
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    // Collect all workouts in date range
    const workouts = [];
    workoutPrograms.forEach(program => {
      program.workouts.forEach(workout => {
        const workoutDate = new Date(workout.date);
        if (workoutDate >= start && workoutDate <= end) {
          // Process exercises with calculated weights
          const processedExercises = workout.exercises.map(exercise => {
            const athleteMax = athlete.maxes.find(
              m => m.exerciseId?.toString() === exercise.exerciseId?.toString()
            );

            const weightDisplay = displayWeight(
              athleteMax?.oneRepMax,
              exercise.percentage
            );

            return {
              ...exercise.toObject(),
              calculatedWeight: weightDisplay.calculatedWeight,
              displayText: weightDisplay.displayText,
              hasOneRepMax: !!athleteMax
            };
          });

          workouts.push({
            programName: program.programName,
            programId: program._id,
            date: workout.date,
            dayOfWeek: workout.dayOfWeek,
            title: workout.title,
            exercises: processedExercises
          });
        }
      });
    });

    // Sort by date
    workouts.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      workouts
    });

  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get specific day workout
 * @route   GET /api/athlete/workouts/:date
 * @access  Private (Athlete only)
 */
const getWorkoutByDate = async (req, res) => {
  try {
    const { date } = req.params;

    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const workoutPrograms = await WorkoutProgram.find({
      assignedTeams: athlete.teamId,
      isPublished: true,
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    });

    let workout = null;
    for (const program of workoutPrograms) {
      const foundWorkout = program.workouts.find(w => {
        const workoutDate = new Date(w.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === targetDate.getTime();
      });

      if (foundWorkout) {
        // Process exercises with calculated weights
        const processedExercises = foundWorkout.exercises.map(exercise => {
          const athleteMax = athlete.maxes.find(
            m => m.exerciseId?.toString() === exercise.exerciseId?.toString()
          );

          const weightDisplay = displayWeight(
            athleteMax?.oneRepMax,
            exercise.percentage
          );

          return {
            ...exercise.toObject(),
            calculatedWeight: weightDisplay.calculatedWeight,
            displayText: weightDisplay.displayText,
            hasOneRepMax: !!athleteMax
          };
        });

        workout = {
          programName: program.programName,
          programId: program._id,
          date: foundWorkout.date,
          dayOfWeek: foundWorkout.dayOfWeek,
          title: foundWorkout.title,
          exercises: processedExercises
        };
        break;
      }
    }

    res.json({
      success: true,
      workout,
      date: targetDate
    });

  } catch (error) {
    console.error('Get workout by date error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getStats,
  logStat,
  updateMax,
  getWorkouts,
  getWorkoutByDate
};

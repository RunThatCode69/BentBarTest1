const Athlete = require('../models/Athlete');
const Team = require('../models/Team');
const WorkoutProgram = require('../models/WorkoutProgram');
const Exercise = require('../models/Exercise');
const WorkoutLog = require('../models/WorkoutLog');
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
        // Convert to plain object if it's a Mongoose document
        const exerciseObj = exercise.toObject ? exercise.toObject() : exercise;

        const athleteMax = athlete.maxes.find(
          m => m.exerciseId?.toString() === exerciseObj.exerciseId?.toString()
        );

        const weightDisplay = displayWeight(
          athleteMax?.oneRepMax,
          exerciseObj.percentage
        );

        return {
          ...exerciseObj,
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

    // Calculate stats from WorkoutLog data
    const workoutLogs = await WorkoutLog.find({ athleteId: athlete._id })
      .sort({ date: -1 });

    // Helper function to check if a workout log has any completed sets
    const hasCompletedSets = (log) => {
      if (!log.exercises || !Array.isArray(log.exercises)) return false;
      return log.exercises.some(exercise => {
        if (!exercise.sets || !Array.isArray(exercise.sets)) return false;
        return exercise.sets.some(set => {
          const hasWeight = typeof set.completedWeight === 'number' && set.completedWeight > 0;
          const hasReps = typeof set.completedReps === 'number' && set.completedReps > 0;
          return hasWeight || hasReps;
        });
      });
    };

    // Count completed workouts (either isCompleted flag or has actual logged sets)
    const workoutsCompleted = workoutLogs.filter(log => log.isCompleted || hasCompletedSets(log)).length;

    // Calculate total sets and volume from all workout logs
    let totalSets = 0;
    let totalVolume = 0;

    workoutLogs.forEach(log => {
      if (log.exercises && Array.isArray(log.exercises)) {
        log.exercises.forEach(exercise => {
          if (exercise.sets && Array.isArray(exercise.sets)) {
            exercise.sets.forEach(set => {
              // Check if set has actual completed data (not null, not undefined, and is a number)
              const hasWeight = typeof set.completedWeight === 'number' && set.completedWeight > 0;
              const hasReps = typeof set.completedReps === 'number' && set.completedReps > 0;

              if (hasWeight || hasReps) {
                totalSets++;
                const weight = set.completedWeight || 0;
                const reps = set.completedReps || 0;
                totalVolume += weight * reps;
              }
            });
          }
        });
      }
    });

    // Calculate current streak (consecutive days with completed workouts)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get unique dates of workouts that have completed sets, sorted descending
    const completedDates = workoutLogs
      .filter(log => log.isCompleted || hasCompletedSets(log))
      .map(log => {
        const d = new Date(log.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
      .filter((date, index, self) => self.indexOf(date) === index) // unique
      .sort((a, b) => b - a); // descending

    if (completedDates.length > 0) {
      // Check if most recent workout was today or yesterday
      const mostRecent = completedDates[0];
      const diffFromToday = Math.floor((today.getTime() - mostRecent) / (1000 * 60 * 60 * 24));

      if (diffFromToday <= 1) {
        currentStreak = 1;
        let expectedDate = mostRecent - (1000 * 60 * 60 * 24);

        for (let i = 1; i < completedDates.length; i++) {
          if (completedDates[i] === expectedDate) {
            currentStreak++;
            expectedDate -= (1000 * 60 * 60 * 24);
          } else {
            break;
          }
        }
      }
    }

    // Build recent activity from workout logs
    const recentActivity = [];
    const recentLogs = workoutLogs.slice(0, 10); // Last 10 workout logs

    recentLogs.forEach(log => {
      if (hasCompletedSets(log)) {
        // Count exercises and sets in this workout
        let exerciseCount = 0;
        let setCount = 0;

        log.exercises.forEach(exercise => {
          if (exercise.sets && Array.isArray(exercise.sets)) {
            const completedSetsInExercise = exercise.sets.filter(set => {
              const hasWeight = typeof set.completedWeight === 'number' && set.completedWeight > 0;
              const hasReps = typeof set.completedReps === 'number' && set.completedReps > 0;
              return hasWeight || hasReps;
            }).length;

            if (completedSetsInExercise > 0) {
              exerciseCount++;
              setCount += completedSetsInExercise;
            }
          }
        });

        recentActivity.push({
          type: 'workout',
          title: 'Completed Workout',
          details: `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}, ${setCount} set${setCount !== 1 ? 's' : ''}`,
          date: log.date
        });
      }
    });

    res.json({
      success: true,
      maxes: athlete.maxes,
      trackedMaxes: athlete.trackedMaxes || [],
      stats: athlete.stats.slice(-50), // Last 50 entries
      workoutsCompleted,
      totalSets,
      totalVolume: Math.round(totalVolume),
      currentStreak,
      recentActivity,
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
 * @desc    Add a max to tracked display
 * @route   POST /api/athlete/stats/tracked
 * @access  Private (Athlete only)
 */
const trackMax = async (req, res) => {
  try {
    const { exerciseName } = req.body;

    if (!exerciseName) {
      return res.status(400).json({ message: 'Exercise name is required' });
    }

    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    // Check if already tracking 20 maxes
    if (athlete.trackedMaxes && athlete.trackedMaxes.length >= 20) {
      return res.status(400).json({ message: 'Maximum of 20 tracked maxes allowed' });
    }

    // Check if already tracked
    if (athlete.trackedMaxes && athlete.trackedMaxes.includes(exerciseName)) {
      return res.status(400).json({ message: 'This max is already being tracked' });
    }

    // Check if the athlete has a max for this exercise
    const hasMax = athlete.maxes.find(
      m => m.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );
    if (!hasMax) {
      return res.status(400).json({ message: 'You must have a recorded max to track it' });
    }

    // Add to tracked
    if (!athlete.trackedMaxes) {
      athlete.trackedMaxes = [];
    }
    athlete.trackedMaxes.push(exerciseName);
    await athlete.save();

    res.json({
      success: true,
      trackedMaxes: athlete.trackedMaxes,
      message: 'Max is now being tracked'
    });

  } catch (error) {
    console.error('Track max error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Remove a max from tracked display
 * @route   DELETE /api/athlete/stats/tracked/:exerciseName
 * @access  Private (Athlete only)
 */
const untrackMax = async (req, res) => {
  try {
    const { exerciseName } = req.params;

    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    // Remove from tracked
    athlete.trackedMaxes = (athlete.trackedMaxes || []).filter(
      name => name.toLowerCase() !== exerciseName.toLowerCase()
    );
    await athlete.save();

    res.json({
      success: true,
      trackedMaxes: athlete.trackedMaxes,
      message: 'Max removed from tracking'
    });

  } catch (error) {
    console.error('Untrack max error:', error);
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

/**
 * @desc    Get available exercises for athlete (defaults + coach's custom exercises)
 * @route   GET /api/athlete/exercises
 * @access  Private (Athlete only)
 */
const getExercises = async (req, res) => {
  try {
    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    // Get custom exercises created by the team's coach
    const team = await Team.findById(athlete.teamId);
    let customExercises = [];

    if (team && team.coachId) {
      customExercises = await Exercise.find({ coachId: team.coachId })
        .select('_id name category youtubeUrl')
        .lean();
    }

    res.json({
      success: true,
      customExercises
    });

  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Save workout log (athlete's recorded weights for a workout)
 * @route   POST /api/athlete/workout-log
 * @access  Private (Athlete only)
 */
const saveWorkoutLog = async (req, res) => {
  try {
    const { date, workoutProgramId, exercises, notes } = req.body;

    if (!date || !exercises) {
      return res.status(400).json({ message: 'Date and exercises are required' });
    }

    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    // Normalize date to midnight for consistent storage
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);

    // Use date range to find existing log (handles timezone issues)
    const startOfDay = new Date(logDate);
    const endOfDay = new Date(logDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing log or create new one
    let workoutLog = await WorkoutLog.findOne({
      athleteId: athlete._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (workoutLog) {
      // Update existing log
      workoutLog.exercises = exercises;
      workoutLog.workoutProgramId = workoutProgramId || null;
      workoutLog.notes = notes || '';
      workoutLog.isCompleted = exercises.some(e =>
        e.sets && e.sets.some(s => s.completedWeight !== null || s.completedReps !== null)
      );
      if (workoutLog.isCompleted && !workoutLog.completedAt) {
        workoutLog.completedAt = new Date();
      }
    } else {
      // Create new log
      workoutLog = new WorkoutLog({
        athleteId: athlete._id,
        date: logDate,
        workoutProgramId: workoutProgramId || null,
        exercises,
        notes: notes || '',
        isCompleted: exercises.some(e =>
          e.sets && e.sets.some(s => s.completedWeight !== null || s.completedReps !== null)
        )
      });
      if (workoutLog.isCompleted) {
        workoutLog.completedAt = new Date();
      }
    }

    await workoutLog.save();

    // Also update athlete's maxes if any PRs were hit
    for (const exercise of exercises) {
      if (exercise.sets) {
        for (const set of exercise.sets) {
          if (set.completedWeight && set.completedReps) {
            const estimated1RM = calculateOneRepMax(set.completedWeight, set.completedReps);

            const existingMax = athlete.maxes.find(
              m => m.exerciseName.toLowerCase() === exercise.exerciseName.toLowerCase()
            );

            if (!existingMax) {
              athlete.maxes.push({
                exerciseId: exercise.exerciseId || null,
                exerciseName: exercise.exerciseName,
                oneRepMax: estimated1RM,
                lastUpdated: new Date()
              });
            } else if (estimated1RM > existingMax.oneRepMax) {
              existingMax.oneRepMax = estimated1RM;
              existingMax.lastUpdated = new Date();
            }
          }
        }
      }
    }

    await athlete.save();

    res.json({
      success: true,
      workoutLog,
      message: 'Workout log saved successfully'
    });

  } catch (error) {
    console.error('Save workout log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get workout log for a specific date
 * @route   GET /api/athlete/workout-log/:date
 * @access  Private (Athlete only)
 */
const getWorkoutLog = async (req, res) => {
  try {
    const { date } = req.params;

    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    // Use date range to handle timezone issues
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const workoutLog = await WorkoutLog.findOne({
      athleteId: athlete._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({
      success: true,
      workoutLog: workoutLog || null
    });

  } catch (error) {
    console.error('Get workout log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all workout logs in date range
 * @route   GET /api/athlete/workout-logs
 * @access  Private (Athlete only)
 */
const getWorkoutLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const athlete = await Athlete.findOne({ userId: req.user._id });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete profile not found' });
    }

    const query = { athleteId: athlete._id };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const workoutLogs = await WorkoutLog.find(query)
      .sort({ date: -1 })
      .limit(100);

    res.json({
      success: true,
      workoutLogs
    });

  } catch (error) {
    console.error('Get workout logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getStats,
  logStat,
  updateMax,
  trackMax,
  untrackMax,
  getWorkouts,
  getWorkoutByDate,
  getExercises,
  saveWorkoutLog,
  getWorkoutLog,
  getWorkoutLogs
};

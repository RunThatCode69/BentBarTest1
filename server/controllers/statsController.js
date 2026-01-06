const Athlete = require('../models/Athlete');
const Team = require('../models/Team');
const Coach = require('../models/Coach');
const Exercise = require('../models/Exercise');
const { calculateOneRepMax } = require('../utils/calculateOneRepMax');

/**
 * @desc    Get stats for a team
 * @route   GET /api/stats/team/:teamId
 * @access  Private (Coach only)
 */
const getTeamStats = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { exerciseId, sortBy, order } = req.query;

    // Verify coach owns this team
    const coach = await Coach.findOne({ userId: req.user._id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    const team = await Team.findOne({ _id: teamId, coachId: coach._id });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all athletes on the team
    const athletes = await Athlete.find({ teamId })
      .select('firstName lastName sport stats maxes');

    // Compile stats
    const stats = [];
    athletes.forEach(athlete => {
      athlete.maxes.forEach(max => {
        if (!exerciseId || max.exerciseId?.toString() === exerciseId) {
          stats.push({
            athleteId: athlete._id,
            athleteName: `${athlete.firstName} ${athlete.lastName}`,
            exerciseId: max.exerciseId,
            exerciseName: max.exerciseName,
            oneRepMax: max.oneRepMax,
            lastUpdated: max.lastUpdated
          });
        }
      });
    });

    // Sort stats
    if (sortBy === 'weight') {
      stats.sort((a, b) => order === 'asc' ? a.oneRepMax - b.oneRepMax : b.oneRepMax - a.oneRepMax);
    } else if (sortBy === 'date') {
      stats.sort((a, b) => order === 'asc' ? new Date(a.lastUpdated) - new Date(b.lastUpdated) : new Date(b.lastUpdated) - new Date(a.lastUpdated));
    } else if (sortBy === 'name') {
      stats.sort((a, b) => order === 'asc' ? a.athleteName.localeCompare(b.athleteName) : b.athleteName.localeCompare(a.athleteName));
    }

    res.json({
      success: true,
      team: {
        id: team._id,
        teamName: team.teamName,
        sport: team.sport
      },
      athleteCount: athletes.length,
      stats
    });

  } catch (error) {
    console.error('Get team stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get stats for a specific athlete
 * @route   GET /api/stats/athlete/:athleteId
 * @access  Private
 */
const getAthleteStats = async (req, res) => {
  try {
    const { athleteId } = req.params;

    const athlete = await Athlete.findById(athleteId)
      .select('firstName lastName sport stats maxes teamId');

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found' });
    }

    // Verify access - coach must own athlete's team, or athlete is themselves
    if (req.user.role === 'coach') {
      const coach = await Coach.findOne({ userId: req.user._id });
      const team = await Team.findOne({ _id: athlete.teamId, coachId: coach?._id });
      if (!team) {
        return res.status(403).json({ message: 'Not authorized to view this athlete' });
      }
    } else if (req.user.role === 'athlete') {
      const currentAthlete = await Athlete.findOne({ userId: req.user._id });
      if (currentAthlete?._id.toString() !== athleteId) {
        return res.status(403).json({ message: 'Not authorized to view this athlete' });
      }
    }

    res.json({
      success: true,
      athlete: {
        id: athlete._id,
        firstName: athlete.firstName,
        lastName: athlete.lastName,
        sport: athlete.sport
      },
      maxes: athlete.maxes,
      recentStats: athlete.stats.slice(-20)
    });

  } catch (error) {
    console.error('Get athlete stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get exercise stats for a team (leaderboard)
 * @route   GET /api/stats/exercises/:teamId
 * @access  Private (Coach only)
 */
const getExerciseLeaderboard = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { exerciseId, exerciseName } = req.query;

    // Verify coach owns this team
    const coach = await Coach.findOne({ userId: req.user._id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    const team = await Team.findOne({ _id: teamId, coachId: coach._id });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all athletes on the team
    const athletes = await Athlete.find({ teamId })
      .select('firstName lastName maxes');

    // Get leaderboard for specific exercise
    const leaderboard = [];
    athletes.forEach(athlete => {
      const max = athlete.maxes.find(m => {
        if (exerciseId) return m.exerciseId?.toString() === exerciseId;
        if (exerciseName) return m.exerciseName.toLowerCase() === exerciseName.toLowerCase();
        return false;
      });

      if (max) {
        leaderboard.push({
          athleteId: athlete._id,
          athleteName: `${athlete.firstName} ${athlete.lastName}`,
          oneRepMax: max.oneRepMax,
          lastUpdated: max.lastUpdated
        });
      }
    });

    // Sort by one rep max descending
    leaderboard.sort((a, b) => b.oneRepMax - a.oneRepMax);

    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    res.json({
      success: true,
      team: {
        id: team._id,
        teamName: team.teamName
      },
      exerciseName: exerciseName || 'Unknown Exercise',
      leaderboard
    });

  } catch (error) {
    console.error('Get exercise leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Log a new stat entry
 * @route   POST /api/stats/log
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
    const existingMaxIndex = athlete.maxes.findIndex(
      m => m.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );

    let isPR = false;
    if (existingMaxIndex === -1) {
      // Add new max
      athlete.maxes.push({
        exerciseId: exerciseId || null,
        exerciseName,
        oneRepMax: estimated1RM,
        lastUpdated: new Date()
      });
      isPR = true;
    } else if (estimated1RM > athlete.maxes[existingMaxIndex].oneRepMax) {
      // Update existing max
      athlete.maxes[existingMaxIndex].oneRepMax = estimated1RM;
      athlete.maxes[existingMaxIndex].lastUpdated = new Date();
      isPR = true;
    }

    await athlete.save();

    res.status(201).json({
      success: true,
      stat: statEntry,
      estimated1RM,
      isPR,
      message: isPR ? 'New personal record!' : 'Stat logged successfully'
    });

  } catch (error) {
    console.error('Log stat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get available exercises for stats filtering
 * @route   GET /api/stats/available-exercises/:teamId
 * @access  Private (Coach only)
 */
const getAvailableExercises = async (req, res) => {
  try {
    const { teamId } = req.params;

    // Verify coach owns this team
    const coach = await Coach.findOne({ userId: req.user._id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    const team = await Team.findOne({ _id: teamId, coachId: coach._id });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all unique exercises from athlete maxes
    const athletes = await Athlete.find({ teamId }).select('maxes');

    const exerciseMap = new Map();
    athletes.forEach(athlete => {
      athlete.maxes.forEach(max => {
        if (!exerciseMap.has(max.exerciseName)) {
          exerciseMap.set(max.exerciseName, {
            exerciseId: max.exerciseId,
            exerciseName: max.exerciseName,
            athleteCount: 1
          });
        } else {
          const existing = exerciseMap.get(max.exerciseName);
          existing.athleteCount++;
        }
      });
    });

    const exercises = Array.from(exerciseMap.values())
      .sort((a, b) => b.athleteCount - a.athleteCount);

    res.json({
      success: true,
      exercises
    });

  } catch (error) {
    console.error('Get available exercises error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTeamStats,
  getAthleteStats,
  getExerciseLeaderboard,
  logStat,
  getAvailableExercises
};

const Coach = require('../models/Coach');
const Team = require('../models/Team');
const Athlete = require('../models/Athlete');
const WorkoutProgram = require('../models/WorkoutProgram');
const WorkoutLog = require('../models/WorkoutLog');
const { generateAccessCode } = require('../utils/generateAccessCode');

/**
 * @desc    Get coach dashboard data
 * @route   GET /api/coach/dashboard
 * @access  Private (Coach only)
 */
const getDashboard = async (req, res) => {
  try {
    // Add timeout to all queries (5 seconds)
    const QUERY_TIMEOUT = 5000;

    const coach = await Coach.findOne({ userId: req.user._id })
      .populate({
        path: 'teams.teamId',
        populate: {
          path: 'athletes',
          select: 'firstName lastName sport stats maxes'
        }
      })
      .maxTimeMS(QUERY_TIMEOUT);

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Get all teams with athletes
    const teams = await Team.find({ coachId: coach._id })
      .populate({
        path: 'athletes',
        select: 'firstName lastName sport stats maxes'
      })
      .maxTimeMS(QUERY_TIMEOUT);

    // Get upcoming workouts (next 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const teamIds = teams.map(t => t._id);
    const upcomingWorkouts = await WorkoutProgram.find({
      assignedTeams: { $in: teamIds },
      isPublished: true,
      'workouts.date': { $gte: today, $lte: nextWeek }
    }).sort({ 'workouts.date': 1 }).maxTimeMS(QUERY_TIMEOUT);

    // Get all workout programs for this coach (for Team Workouts panel)
    const allWorkoutPrograms = await WorkoutProgram.find({
      createdBy: coach._id,
      createdByModel: 'Coach'
    }).select('programName _id assignedTeams createdAt').sort({ programName: 1 }).maxTimeMS(QUERY_TIMEOUT);

    // Collect athlete stats for the rolling display
    const athleteStats = [];
    teams.forEach(team => {
      team.athletes.forEach(athlete => {
        if (athlete.maxes && athlete.maxes.length > 0) {
          athlete.maxes.forEach(max => {
            athleteStats.push({
              athleteId: athlete._id,
              athleteName: `${athlete.firstName} ${athlete.lastName}`,
              teamName: team.teamName,
              sport: team.sport,
              exerciseName: max.exerciseName,
              oneRepMax: max.oneRepMax,
              lastUpdated: max.lastUpdated
            });
          });
        }
      });
    });

    // Shuffle stats for random display
    athleteStats.sort(() => Math.random() - 0.5);

    // Get all athletes with their user data for Athlete Center
    // FIXED: Use batch queries instead of N+1 queries
    const User = require('../models/User');

    // Get all athletes for all teams in ONE query
    const athletes = await Athlete.find({ teamId: { $in: teamIds } })
      .select('firstName lastName userId teamId')
      .lean()
      .maxTimeMS(QUERY_TIMEOUT);

    // Get all users in ONE query
    const userIds = athletes.map(a => a.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select('_id lastLogin')
      .lean()
      .maxTimeMS(QUERY_TIMEOUT);

    // Create lookup maps for O(1) access
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    const teamMap = new Map(teams.map(t => [t._id.toString(), t.teamName]));

    // Combine data (no database calls in loop)
    const allAthletes = athletes.map(athlete => ({
      _id: athlete._id,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      teamId: athlete.teamId,
      teamName: teamMap.get(athlete.teamId?.toString()) || 'Unknown Team',
      lastLogin: userMap.get(athlete.userId?.toString())?.lastLogin || null
    }));

    // Find assigned program for each team
    const getAssignedProgram = (teamId) => {
      const program = allWorkoutPrograms.find(p =>
        p.assignedTeams.some(t => t.toString() === teamId.toString())
      );
      return program ? { id: program._id, name: program.programName } : null;
    };

    res.json({
      success: true,
      coach: {
        id: coach._id,
        firstName: coach.firstName,
        lastName: coach.lastName,
        schoolName: coach.schoolName
      },
      teams: teams.map(team => ({
        id: team._id,
        teamName: team.teamName,
        sport: team.sport,
        athleteCount: team.athletes.length,
        accessCode: team.accessCode,
        assignedProgram: getAssignedProgram(team._id)
      })),
      athleteStats: athleteStats.slice(0, 20), // Limit to 20 for display
      upcomingWorkouts: upcomingWorkouts.slice(0, 3), // Next 3 days
      workoutPrograms: allWorkoutPrograms.map(program => ({
        id: program._id,
        programName: program.programName,
        assignedTeams: program.assignedTeams,
        createdAt: program.createdAt
      })),
      athletes: allAthletes // For Athlete Center panel
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all teams for coach
 * @route   GET /api/coach/teams
 * @access  Private (Coach only)
 */
const getTeams = async (req, res) => {
  try {
    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    const teams = await Team.find({ coachId: coach._id })
      .populate('athletes', 'firstName lastName sport');

    res.json({
      success: true,
      teams
    });

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Create a new team
 * @route   POST /api/coach/teams
 * @access  Private (Coach only)
 */
const createTeam = async (req, res) => {
  try {
    const { teamName, sport } = req.body;

    if (!teamName || !sport) {
      return res.status(400).json({ message: 'Team name and sport are required' });
    }

    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Check if coach has paid for enough teams
    // Admin/test accounts get elevated limits (not infinite to avoid system issues)
    const adminEmails = ['bpoulter2019@gmail.com'];
    const isAdmin = adminEmails.includes(req.user.email);
    const ADMIN_TEAM_LIMIT = 100;

    const currentTeamCount = coach.teams?.length || 0;
    const paidTeamSlots = isAdmin ? ADMIN_TEAM_LIMIT : (coach.paidTeams || 0);

    if (currentTeamCount >= paidTeamSlots) {
      return res.status(403).json({
        message: 'Team limit reached. Please purchase additional team slots to add more teams.',
        code: 'TEAM_LIMIT_REACHED',
        currentTeams: currentTeamCount,
        paidTeams: paidTeamSlots
      });
    }

    const accessCode = await generateAccessCode();

    const team = await Team.create({
      teamName,
      sport: sport.toLowerCase(),
      schoolName: coach.schoolName,
      coachId: coach._id,
      accessCode
    });

    // Add team to coach's teams array
    coach.teams.push({ teamId: team._id, sport: sport.toLowerCase() });
    await coach.save();

    res.status(201).json({
      success: true,
      team: {
        id: team._id,
        teamName: team.teamName,
        sport: team.sport,
        accessCode: team.accessCode
      }
    });

  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get specific team
 * @route   GET /api/coach/teams/:teamId
 * @access  Private (Coach only)
 */
const getTeam = async (req, res) => {
  try {
    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    const team = await Team.findOne({
      _id: req.params.teamId,
      coachId: coach._id
    }).populate('athletes', 'firstName lastName sport stats maxes');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({
      success: true,
      team
    });

  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update team
 * @route   PUT /api/coach/teams/:teamId
 * @access  Private (Coach only)
 */
const updateTeam = async (req, res) => {
  try {
    const { teamName, sport } = req.body;

    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    const team = await Team.findOne({
      _id: req.params.teamId,
      coachId: coach._id
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (teamName) team.teamName = teamName;
    if (sport) team.sport = sport.toLowerCase();

    await team.save();

    res.json({
      success: true,
      team
    });

  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get team athletes
 * @route   GET /api/coach/teams/:teamId/athletes
 * @access  Private (Coach only)
 */
const getTeamAthletes = async (req, res) => {
  try {
    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    const team = await Team.findOne({
      _id: req.params.teamId,
      coachId: coach._id
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const athletes = await Athlete.find({ teamId: team._id })
      .select('firstName lastName sport stats maxes createdAt');

    res.json({
      success: true,
      athletes
    });

  } catch (error) {
    console.error('Get team athletes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get team access code
 * @route   GET /api/coach/teams/:teamId/access-code
 * @access  Private (Coach only)
 */
const getAccessCode = async (req, res) => {
  try {
    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    const team = await Team.findOne({
      _id: req.params.teamId,
      coachId: coach._id
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({
      success: true,
      accessCode: team.accessCode
    });

  } catch (error) {
    console.error('Get access code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Regenerate team access code
 * @route   POST /api/coach/teams/:teamId/regenerate-code
 * @access  Private (Coach only)
 */
const regenerateAccessCode = async (req, res) => {
  try {
    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    const team = await Team.findOne({
      _id: req.params.teamId,
      coachId: coach._id
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const newAccessCode = await generateAccessCode();
    team.accessCode = newAccessCode;
    await team.save();

    res.json({
      success: true,
      accessCode: team.accessCode,
      message: 'Access code regenerated. Previous code is now invalid.'
    });

  } catch (error) {
    console.error('Regenerate access code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all athlete stats for coach
 * @route   GET /api/coach/stats
 * @access  Private (Coach only)
 */
const getAllStats = async (req, res) => {
  try {
    const { teamId, athleteId, exerciseId } = req.query;

    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Build query
    let query = {};

    if (teamId) {
      // Verify team belongs to coach
      const team = await Team.findOne({ _id: teamId, coachId: coach._id });
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      query.teamId = teamId;
    } else {
      // Get all teams for coach
      const teams = await Team.find({ coachId: coach._id });
      query.teamId = { $in: teams.map(t => t._id) };
    }

    if (athleteId) {
      query._id = athleteId;
    }

    const athletes = await Athlete.find(query)
      .select('firstName lastName sport stats maxes teamId')
      .populate('teamId', 'teamName sport');

    // Format the response
    const stats = [];
    athletes.forEach(athlete => {
      // Add maxes
      athlete.maxes.forEach(max => {
        if (!exerciseId || max.exerciseId.toString() === exerciseId) {
          stats.push({
            athleteId: athlete._id,
            athleteName: `${athlete.firstName} ${athlete.lastName}`,
            teamName: athlete.teamId?.teamName,
            sport: athlete.sport,
            exerciseId: max.exerciseId,
            exerciseName: max.exerciseName,
            value: max.oneRepMax,
            type: '1RM',
            date: max.lastUpdated
          });
        }
      });

      // Add recent stats
      athlete.stats.slice(-10).forEach(stat => {
        if (!exerciseId || stat.exerciseId?.toString() === exerciseId) {
          stats.push({
            athleteId: athlete._id,
            athleteName: `${athlete.firstName} ${athlete.lastName}`,
            teamName: athlete.teamId?.teamName,
            sport: athlete.sport,
            exerciseId: stat.exerciseId,
            exerciseName: stat.visibleName,
            value: stat.weight,
            reps: stat.reps,
            type: 'stat',
            date: stat.date
          });
        }
      });
    });

    // Sort by date descending
    stats.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Get all stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Database diagnostic - shows what data exists for this coach
 * @route   GET /api/coach/debug
 * @access  Private (Coach only)
 */
const getDebugInfo = async (req, res) => {
  try {
    const mongoose = require('mongoose');

    // Get coach profile
    const coach = await Coach.findOne({ userId: req.user._id });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Get all workout programs - try different query approaches
    const allWorkoutsInDb = await WorkoutProgram.find({}).select('programName createdBy createdByModel');
    const workoutsByCreatedBy = await WorkoutProgram.find({ createdBy: coach._id });
    const workoutsByCreatedByWithModel = await WorkoutProgram.find({
      createdBy: coach._id,
      createdByModel: 'Coach'
    });

    res.json({
      success: true,
      debug: {
        dbConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        dbName: mongoose.connection.name,
        userId: req.user._id,
        coachId: coach._id,
        coachIdString: coach._id.toString(),
        totalWorkoutsInDb: allWorkoutsInDb.length,
        allWorkouts: allWorkoutsInDb.map(w => ({
          id: w._id,
          name: w.programName,
          createdBy: w.createdBy,
          createdByString: w.createdBy?.toString(),
          createdByModel: w.createdByModel,
          matchesCoachId: w.createdBy?.toString() === coach._id.toString()
        })),
        workoutsByCreatedBy: workoutsByCreatedBy.length,
        workoutsByCreatedByWithModel: workoutsByCreatedByWithModel.length
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Assign or remove program from team
 * @route   PUT /api/coach/teams/:teamId/program
 * @access  Private (Coach only)
 */
const assignProgramToTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { programId } = req.body;

    const coach = await Coach.findOne({ userId: req.user._id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Verify team belongs to this coach
    const team = await Team.findOne({ _id: teamId, coachId: coach._id });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // First, remove this team from all programs it's assigned to
    await WorkoutProgram.updateMany(
      { createdBy: coach._id, createdByModel: 'Coach', assignedTeams: teamId },
      { $pull: { assignedTeams: teamId } }
    );

    // If a new program is specified, assign the team to it
    if (programId) {
      const program = await WorkoutProgram.findOne({
        _id: programId,
        createdBy: coach._id,
        createdByModel: 'Coach'
      });

      if (!program) {
        return res.status(404).json({ message: 'Program not found' });
      }

      // Add team to this program
      if (!program.assignedTeams.includes(teamId)) {
        program.assignedTeams.push(teamId);
        await program.save();
      }

      res.json({
        success: true,
        message: 'Program assigned successfully',
        assignedProgram: { id: program._id, name: program.programName }
      });
    } else {
      res.json({
        success: true,
        message: 'Program removed successfully',
        assignedProgram: null
      });
    }

  } catch (error) {
    console.error('Assign program error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get workout logs for an athlete (coach viewing)
 * @route   GET /api/coach/athletes/:athleteId/workout-logs
 * @access  Private (Coach only)
 */
const getAthleteWorkoutLogs = async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { startDate, endDate } = req.query;

    const coach = await Coach.findOne({ userId: req.user._id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Verify this athlete belongs to one of the coach's teams
    const teams = await Team.find({ coachId: coach._id });
    const teamIds = teams.map(t => t._id);

    const athlete = await Athlete.findOne({
      _id: athleteId,
      teamId: { $in: teamIds }
    });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found or not in your teams' });
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
      athlete: {
        id: athlete._id,
        firstName: athlete.firstName,
        lastName: athlete.lastName
      },
      workoutLogs
    });

  } catch (error) {
    console.error('Get athlete workout logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Get all workout logs for a team
 * @route   GET /api/coach/teams/:teamId/workout-logs
 * @access  Private (Coach only)
 */
const getTeamWorkoutLogs = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { startDate, endDate } = req.query;

    const coach = await Coach.findOne({ userId: req.user._id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Verify this team belongs to the coach
    const team = await Team.findOne({
      _id: teamId,
      coachId: coach._id
    });

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get all athletes on this team
    const athletes = await Athlete.find({ teamId: team._id })
      .select('_id firstName lastName');

    const athleteIds = athletes.map(a => a._id);

    const query = { athleteId: { $in: athleteIds } };

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
      .limit(200);

    // Create a map for athlete names
    const athleteMap = new Map(athletes.map(a => [a._id.toString(), `${a.firstName} ${a.lastName}`]));

    // Enhance logs with athlete names
    const enhancedLogs = workoutLogs.map(log => ({
      ...log.toObject(),
      athleteName: athleteMap.get(log.athleteId.toString()) || 'Unknown'
    }));

    res.json({
      success: true,
      team: {
        id: team._id,
        teamName: team.teamName
      },
      athletes: athletes.map(a => ({ id: a._id, name: `${a.firstName} ${a.lastName}` })),
      workoutLogs: enhancedLogs
    });

  } catch (error) {
    console.error('Get team workout logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Update an athlete's max (1RM)
 * @route   PUT /api/coach/athletes/:athleteId/max
 * @access  Private (Coach only)
 */
const updateAthleteMax = async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { exerciseName, exerciseId, oneRepMax } = req.body;

    if (!exerciseName || oneRepMax === undefined) {
      return res.status(400).json({ message: 'Exercise name and 1RM value are required' });
    }

    const coach = await Coach.findOne({ userId: req.user._id });
    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Verify this athlete belongs to one of the coach's teams
    const teams = await Team.find({ coachId: coach._id });
    const teamIds = teams.map(t => t._id);

    const athlete = await Athlete.findOne({
      _id: athleteId,
      teamId: { $in: teamIds }
    });

    if (!athlete) {
      return res.status(404).json({ message: 'Athlete not found or not in your teams' });
    }

    // Find existing max or create new one
    const existingMaxIndex = athlete.maxes.findIndex(
      m => m.exerciseName.toLowerCase() === exerciseName.toLowerCase()
    );

    if (existingMaxIndex !== -1) {
      // Update existing max
      athlete.maxes[existingMaxIndex].oneRepMax = oneRepMax;
      athlete.maxes[existingMaxIndex].lastUpdated = new Date();
    } else {
      // Add new max
      athlete.maxes.push({
        exerciseId: exerciseId || null,
        exerciseName,
        oneRepMax,
        lastUpdated: new Date()
      });
    }

    await athlete.save();

    res.json({
      success: true,
      message: 'Athlete max updated successfully',
      max: {
        exerciseName,
        oneRepMax,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Update athlete max error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboard,
  getTeams,
  createTeam,
  getTeam,
  updateTeam,
  assignProgramToTeam,
  getTeamAthletes,
  getAccessCode,
  regenerateAccessCode,
  getAllStats,
  getDebugInfo,
  getAthleteWorkoutLogs,
  getTeamWorkoutLogs,
  updateAthleteMax
};

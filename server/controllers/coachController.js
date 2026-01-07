const Coach = require('../models/Coach');
const Team = require('../models/Team');
const Athlete = require('../models/Athlete');
const WorkoutProgram = require('../models/WorkoutProgram');
const { generateAccessCode } = require('../utils/generateAccessCode');

/**
 * @desc    Get coach dashboard data
 * @route   GET /api/coach/dashboard
 * @access  Private (Coach only)
 */
const getDashboard = async (req, res) => {
  try {
    const coach = await Coach.findOne({ userId: req.user._id })
      .populate({
        path: 'teams.teamId',
        populate: {
          path: 'athletes',
          select: 'firstName lastName sport stats maxes'
        }
      });

    if (!coach) {
      return res.status(404).json({ message: 'Coach profile not found' });
    }

    // Get all teams with athletes
    const teams = await Team.find({ coachId: coach._id })
      .populate({
        path: 'athletes',
        select: 'firstName lastName sport stats maxes'
      });

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
    }).sort({ 'workouts.date': 1 });

    // Get all workout programs for this coach (for Team Workouts panel)
    const allWorkoutPrograms = await WorkoutProgram.find({
      coachId: coach._id
    }).select('programName _id assignedTeams createdAt').sort({ programName: 1 });

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
        accessCode: team.accessCode
      })),
      athleteStats: athleteStats.slice(0, 20), // Limit to 20 for display
      upcomingWorkouts: upcomingWorkouts.slice(0, 3), // Next 3 days
      workoutPrograms: allWorkoutPrograms.map(program => ({
        id: program._id,
        programName: program.programName,
        assignedTeams: program.assignedTeams,
        createdAt: program.createdAt
      }))
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

module.exports = {
  getDashboard,
  getTeams,
  createTeam,
  getTeam,
  updateTeam,
  getTeamAthletes,
  getAccessCode,
  regenerateAccessCode,
  getAllStats
};

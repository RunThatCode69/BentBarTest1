const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isCoach } = require('../middleware/roleCheck');
const {
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
  updateAthleteMax,
  addCoachToTeam,
  removeCoachFromTeam,
  getTeamCoaches,
  leaveTeam,
  removeAthleteFromTeam
} = require('../controllers/coachController');

// All routes require coach authentication
router.use(protect);
router.use(isCoach);

// Dashboard
router.get('/dashboard', getDashboard);

// Debug endpoint
router.get('/debug', getDebugInfo);

// Stats
router.get('/stats', getAllStats);

// Teams
router.get('/teams', getTeams);
router.post('/teams', createTeam);
router.get('/teams/:teamId', getTeam);
router.put('/teams/:teamId', updateTeam);
router.put('/teams/:teamId/program', assignProgramToTeam);
router.get('/teams/:teamId/athletes', getTeamAthletes);
router.delete('/teams/:teamId/athletes/:athleteId', removeAthleteFromTeam);
router.get('/teams/:teamId/access-code', getAccessCode);
router.post('/teams/:teamId/regenerate-code', regenerateAccessCode);
router.get('/teams/:teamId/workout-logs', getTeamWorkoutLogs);

// Team coaches management
router.get('/teams/:teamId/coaches', getTeamCoaches);
router.post('/teams/:teamId/coaches', addCoachToTeam);
router.delete('/teams/:teamId/coaches/:coachIdToRemove', removeCoachFromTeam);
router.post('/teams/:teamId/leave', leaveTeam);

// Athlete workout logs (for coach to view)
router.get('/athletes/:athleteId/workout-logs', getAthleteWorkoutLogs);

// Update athlete max (1RM)
router.put('/athletes/:athleteId/max', updateAthleteMax);

module.exports = router;

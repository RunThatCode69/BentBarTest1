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
  getTeamAthletes,
  getAccessCode,
  regenerateAccessCode,
  getAllStats,
  getDebugInfo
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
router.get('/teams/:teamId/athletes', getTeamAthletes);
router.get('/teams/:teamId/access-code', getAccessCode);
router.post('/teams/:teamId/regenerate-code', regenerateAccessCode);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isCoach, isAthlete } = require('../middleware/roleCheck');
const {
  getTeamStats,
  getAthleteStats,
  getExerciseLeaderboard,
  logStat,
  getAvailableExercises
} = require('../controllers/statsController');

// All routes require authentication
router.use(protect);

// Coach routes
router.get('/team/:teamId', isCoach, getTeamStats);
router.get('/exercises/:teamId', isCoach, getExerciseLeaderboard);
router.get('/available-exercises/:teamId', isCoach, getAvailableExercises);

// Athlete routes
router.post('/log', isAthlete, logStat);

// Shared routes (with authorization in controller)
router.get('/athlete/:athleteId', getAthleteStats);

module.exports = router;

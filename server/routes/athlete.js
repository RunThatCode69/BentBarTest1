const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAthlete } = require('../middleware/roleCheck');
const {
  getDashboard,
  getStats,
  logStat,
  updateMax,
  getWorkouts,
  getWorkoutByDate
} = require('../controllers/athleteController');

// All routes require athlete authentication
router.use(protect);
router.use(isAthlete);

// Dashboard
router.get('/dashboard', getDashboard);

// Stats
router.get('/stats', getStats);
router.post('/stats', logStat);
router.put('/stats/max', updateMax);

// Workouts
router.get('/workouts', getWorkouts);
router.get('/workouts/:date', getWorkoutByDate);

module.exports = router;

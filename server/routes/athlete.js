const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAthlete } = require('../middleware/roleCheck');
const {
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
router.post('/stats/tracked', trackMax);
router.delete('/stats/tracked/:exerciseName', untrackMax);

// Workouts
router.get('/workouts', getWorkouts);
router.get('/workouts/:date', getWorkoutByDate);

// Exercises
router.get('/exercises', getExercises);

// Workout logs (athlete's recorded weights)
router.get('/workout-logs', getWorkoutLogs);
router.get('/workout-log/:date', getWorkoutLog);
router.post('/workout-log', saveWorkoutLog);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isCoachOrTrainer } = require('../middleware/roleCheck');
const {
  getWorkouts,
  createWorkout,
  getWorkout,
  updateWorkout,
  deleteWorkout,
  addWorkoutDay,
  assignToTeam
} = require('../controllers/workoutController');

// All routes require authentication
router.use(protect);

// Get workouts (all users can view their relevant workouts)
router.get('/', getWorkouts);
router.get('/:id', getWorkout);

// Create/Update/Delete (Coach/Trainer only)
router.post('/', isCoachOrTrainer, createWorkout);
router.put('/:id', isCoachOrTrainer, updateWorkout);
router.delete('/:id', isCoachOrTrainer, deleteWorkout);

// Add workout day
router.post('/:id/days', isCoachOrTrainer, addWorkoutDay);

// Assign to team (Coach only)
router.post('/:id/assign/:teamId', isCoachOrTrainer, assignToTeam);

module.exports = router;

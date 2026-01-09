const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isCoachOrTrainer } = require('../middleware/roleCheck');
const { createLimiter } = require('../middleware/rateLimiter');
const {
  getExercises,
  createExercise,
  getExercise,
  updateExercise,
  deleteExercise,
  getExercisesByCategory
} = require('../controllers/exerciseController');

// All routes require authentication
router.use(protect);

// Get exercises (all users)
router.get('/', getExercises);
router.get('/category/:category', getExercisesByCategory);
router.get('/:id', getExercise);

// Create/Update/Delete (Coach/Trainer only) - with rate limiting
router.post('/', createLimiter, isCoachOrTrainer, createExercise);
router.put('/:id', isCoachOrTrainer, updateExercise);
router.delete('/:id', isCoachOrTrainer, deleteExercise);

module.exports = router;

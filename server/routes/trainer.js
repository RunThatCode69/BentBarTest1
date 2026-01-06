const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isTrainer } = require('../middleware/roleCheck');
const {
  getDashboard,
  getAthletes,
  addAthlete,
  removeAthlete
} = require('../controllers/trainerController');

// All routes require trainer authentication
router.use(protect);
router.use(isTrainer);

// Dashboard
router.get('/dashboard', getDashboard);

// Athletes
router.get('/athletes', getAthletes);
router.post('/athletes', addAthlete);
router.delete('/athletes/:athleteId', removeAthlete);

module.exports = router;

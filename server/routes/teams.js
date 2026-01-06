const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const Team = require('../models/Team');

/**
 * @desc    Get teams by school name (for athlete signup)
 * @route   GET /api/teams/by-school/:schoolName
 * @access  Public
 */
router.get('/by-school/:schoolName', async (req, res) => {
  try {
    const { schoolName } = req.params;

    const teams = await Team.find({
      schoolName: { $regex: schoolName, $options: 'i' }
    }).select('teamName sport schoolName');

    res.json({
      success: true,
      teams
    });

  } catch (error) {
    console.error('Get teams by school error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @desc    Get unique school names
 * @route   GET /api/teams/schools
 * @access  Public
 */
router.get('/schools', async (req, res) => {
  try {
    const schools = await Team.distinct('schoolName');

    res.json({
      success: true,
      schools: schools.sort()
    });

  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @desc    Validate team access code
 * @route   POST /api/teams/validate-code
 * @access  Public
 */
router.post('/validate-code', async (req, res) => {
  try {
    const { accessCode } = req.body;

    if (!accessCode) {
      return res.status(400).json({ message: 'Access code is required' });
    }

    const team = await Team.findOne({
      accessCode: accessCode.toUpperCase()
    }).select('teamName sport schoolName');

    if (!team) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid access code'
      });
    }

    res.json({
      valid: true,
      team: {
        teamName: team.teamName,
        sport: team.sport,
        schoolName: team.schoolName
      }
    });

  } catch (error) {
    console.error('Validate code error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

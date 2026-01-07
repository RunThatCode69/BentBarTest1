const express = require('express');
const router = express.Router();
const Exercise = require('../models/Exercise');

// Default exercises library
const defaultExercises = [
  // Upper Body
  { name: 'Bench Press', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', description: 'Barbell bench press for chest development', applicableSports: ['all'] },
  { name: 'Incline Bench Press', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=SrqOu55lrYU', description: 'Incline barbell press for upper chest', applicableSports: ['all'] },
  { name: 'Dumbbell Press', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=VmB1G1K7v94', description: 'Dumbbell chest press', applicableSports: ['all'] },
  { name: 'Overhead Press', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI', description: 'Standing barbell overhead press', applicableSports: ['all'] },
  { name: 'Push Press', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=X6-DMh-t4nQ', description: 'Explosive overhead press with leg drive', applicableSports: ['all'] },
  { name: 'Barbell Row', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ', description: 'Bent over barbell row', applicableSports: ['all'] },
  { name: 'Pull-ups', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', description: 'Bodyweight pull-ups', applicableSports: ['all'] },
  { name: 'Lat Pulldown', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=CAwf7n6Luuc', description: 'Cable lat pulldown', applicableSports: ['all'] },
  { name: 'Dumbbell Curl', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo', description: 'Bicep curls with dumbbells', applicableSports: ['all'] },
  { name: 'Tricep Pushdown', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=2-LAMcpzODU', description: 'Cable tricep pushdowns', applicableSports: ['all'] },
  { name: 'Dips', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=2z8JmcrW-As', description: 'Parallel bar dips', applicableSports: ['all'] },
  { name: 'Face Pulls', category: 'upper_body', youtubeUrl: 'https://www.youtube.com/watch?v=rep-qVOkqgk', description: 'Cable face pulls for rear delts', applicableSports: ['all'] },

  // Lower Body
  { name: 'Back Squat', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=bEv6CCg2BC8', description: 'Barbell back squat', applicableSports: ['all'] },
  { name: 'Front Squat', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=m4ytaCJZpl0', description: 'Barbell front squat', applicableSports: ['all'] },
  { name: 'Deadlift', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q', description: 'Conventional barbell deadlift', applicableSports: ['all'] },
  { name: 'Romanian Deadlift', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=JCXUYuzwNrM', description: 'Romanian deadlift for hamstrings', applicableSports: ['all'] },
  { name: 'Sumo Deadlift', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=widGIP-dADg', description: 'Wide stance sumo deadlift', applicableSports: ['all'] },
  { name: 'Leg Press', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ', description: 'Machine leg press', applicableSports: ['all'] },
  { name: 'Walking Lunges', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=L8fvypPrzzs', description: 'Walking lunges with or without weight', applicableSports: ['all'] },
  { name: 'Bulgarian Split Squat', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=2C-uNgKwPLE', description: 'Single leg squat with rear foot elevated', applicableSports: ['all'] },
  { name: 'Hip Thrust', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=xDmFkJxPzeM', description: 'Barbell hip thrust for glutes', applicableSports: ['all'] },
  { name: 'Leg Curl', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=1Tq3QdYUuHs', description: 'Machine leg curl', applicableSports: ['all'] },
  { name: 'Leg Extension', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=YyvSfVjQeL0', description: 'Machine leg extension', applicableSports: ['all'] },
  { name: 'Calf Raises', category: 'lower_body', youtubeUrl: 'https://www.youtube.com/watch?v=-M4-G8p8fmc', description: 'Standing or seated calf raises', applicableSports: ['all'] },

  // Olympic Lifts
  { name: 'Power Clean', category: 'olympic', youtubeUrl: 'https://www.youtube.com/watch?v=GVt8rTLfVZc', description: 'Olympic power clean', applicableSports: ['football', 'basketball', 'track'] },
  { name: 'Hang Clean', category: 'olympic', youtubeUrl: 'https://www.youtube.com/watch?v=0UQi3R4y3C8', description: 'Clean from hang position', applicableSports: ['football', 'basketball', 'track'] },
  { name: 'Clean and Jerk', category: 'olympic', youtubeUrl: 'https://www.youtube.com/watch?v=PjY1rH4_MOA', description: 'Full clean and jerk', applicableSports: ['all'] },
  { name: 'Snatch', category: 'olympic', youtubeUrl: 'https://www.youtube.com/watch?v=9xQp2sldyts', description: 'Olympic snatch', applicableSports: ['all'] },
  { name: 'Power Snatch', category: 'olympic', youtubeUrl: 'https://www.youtube.com/watch?v=tuOhRhKkSCg', description: 'Power snatch variation', applicableSports: ['all'] },
  { name: 'Hang Snatch', category: 'olympic', youtubeUrl: 'https://www.youtube.com/watch?v=TlTX0ZIlPIw', description: 'Snatch from hang position', applicableSports: ['all'] },

  // Core
  { name: 'Plank', category: 'core', youtubeUrl: 'https://www.youtube.com/watch?v=ASdvN_XEl_c', description: 'Standard plank hold', applicableSports: ['all'] },
  { name: 'Russian Twist', category: 'core', youtubeUrl: 'https://www.youtube.com/watch?v=wkD8rjkodUI', description: 'Seated Russian twist', applicableSports: ['all'] },
  { name: 'Hanging Leg Raise', category: 'core', youtubeUrl: 'https://www.youtube.com/watch?v=Pr1ieGZ5atk', description: 'Hanging leg raises', applicableSports: ['all'] },
  { name: 'Ab Wheel Rollout', category: 'core', youtubeUrl: 'https://www.youtube.com/watch?v=rqiTPdK1c_I', description: 'Ab wheel rollout', applicableSports: ['all'] },
  { name: 'Cable Woodchop', category: 'core', youtubeUrl: 'https://www.youtube.com/watch?v=pAplQXk3dkU', description: 'Cable woodchop for obliques', applicableSports: ['all'] },
  { name: 'Dead Bug', category: 'core', youtubeUrl: 'https://www.youtube.com/watch?v=I5xbsA71v1A', description: 'Dead bug core exercise', applicableSports: ['all'] },

  // Cardio
  { name: 'Box Jumps', category: 'cardio', youtubeUrl: 'https://www.youtube.com/watch?v=52r_Ul5k03g', description: 'Plyometric box jumps', applicableSports: ['all'] },
  { name: 'Burpees', category: 'cardio', youtubeUrl: 'https://www.youtube.com/watch?v=dZgVxmf6jkA', description: 'Full burpees', applicableSports: ['all'] },
  { name: 'Battle Ropes', category: 'cardio', youtubeUrl: 'https://www.youtube.com/watch?v=mJWHcKSNMGw', description: 'Battle rope exercises', applicableSports: ['all'] },
  { name: 'Sled Push', category: 'cardio', youtubeUrl: 'https://www.youtube.com/watch?v=aAE0fGx9FdE', description: 'Weighted sled push', applicableSports: ['football', 'wrestling'] },
  { name: 'Farmer Carry', category: 'cardio', youtubeUrl: 'https://www.youtube.com/watch?v=Fkzk_RqlYig', description: 'Loaded carry exercise', applicableSports: ['all'] },
  { name: 'Rowing Machine', category: 'cardio', youtubeUrl: 'https://www.youtube.com/watch?v=zQ82RYIFLN8', description: 'Rowing machine cardio', applicableSports: ['all'] },

  // Accessory
  { name: 'Lateral Raise', category: 'accessory', youtubeUrl: 'https://www.youtube.com/watch?v=3VcKaXpzqRo', description: 'Dumbbell lateral raises', applicableSports: ['all'] },
  { name: 'Rear Delt Fly', category: 'accessory', youtubeUrl: 'https://www.youtube.com/watch?v=lPt0GqwaqEw', description: 'Rear deltoid fly', applicableSports: ['all'] },
  { name: 'Shrugs', category: 'accessory', youtubeUrl: 'https://www.youtube.com/watch?v=cJRVVxmytaM', description: 'Barbell or dumbbell shrugs', applicableSports: ['all'] },
  { name: 'Good Mornings', category: 'accessory', youtubeUrl: 'https://www.youtube.com/watch?v=YA-h3n9L4YU', description: 'Barbell good mornings', applicableSports: ['all'] },
  { name: 'Glute Ham Raise', category: 'accessory', youtubeUrl: 'https://www.youtube.com/watch?v=N97pUUWgtjw', description: 'GHD glute ham raise', applicableSports: ['all'] },
  { name: 'Reverse Hyper', category: 'accessory', youtubeUrl: 'https://www.youtube.com/watch?v=3d6J9aJGBwg', description: 'Reverse hyperextension', applicableSports: ['all'] }
];

/**
 * @desc    Seed default exercises to database
 * @route   POST /api/admin/seed-exercises
 * @access  Public (one-time use, protected by secret key)
 */
router.post('/seed-exercises', async (req, res) => {
  try {
    const { secretKey } = req.body;

    // Simple protection - require a secret key
    if (secretKey !== process.env.ADMIN_SECRET_KEY && secretKey !== 'barbend-seed-2024') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if exercises already exist
    const existingCount = await Exercise.countDocuments({ isGlobal: true });

    if (existingCount >= defaultExercises.length) {
      return res.json({
        success: true,
        message: 'Default exercises already seeded',
        count: existingCount
      });
    }

    // Insert exercises that don't already exist
    let insertedCount = 0;
    for (const exercise of defaultExercises) {
      const exists = await Exercise.findOne({ name: exercise.name, isGlobal: true });
      if (!exists) {
        await Exercise.create({ ...exercise, isGlobal: true });
        insertedCount++;
      }
    }

    res.json({
      success: true,
      message: `Seeded ${insertedCount} new exercises`,
      totalCount: await Exercise.countDocuments({ isGlobal: true })
    });

  } catch (error) {
    console.error('Seed exercises error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @desc    Get exercise count (for verification)
 * @route   GET /api/admin/exercise-count
 * @access  Public
 */
router.get('/exercise-count', async (req, res) => {
  try {
    const globalCount = await Exercise.countDocuments({ isGlobal: true });
    const customCount = await Exercise.countDocuments({ isGlobal: false });

    res.json({
      success: true,
      globalExercises: globalCount,
      customExercises: customCount,
      total: globalCount + customCount
    });

  } catch (error) {
    console.error('Exercise count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

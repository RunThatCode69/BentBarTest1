const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('../models/User');
const Coach = require('../models/Coach');
const Athlete = require('../models/Athlete');
const Team = require('../models/Team');
const Exercise = require('../models/Exercise');
const WorkoutProgram = require('../models/WorkoutProgram');
const { hashPassword } = require('../utils/passwordUtils');

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

const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Coach.deleteMany({});
    await Athlete.deleteMany({});
    await Team.deleteMany({});
    await Exercise.deleteMany({});
    await WorkoutProgram.deleteMany({});

    // Seed exercises
    console.log('Seeding exercises...');
    const exercises = await Exercise.insertMany(
      defaultExercises.map(ex => ({ ...ex, isGlobal: true }))
    );
    console.log(`Created ${exercises.length} exercises`);

    // Create sample coach user
    console.log('Creating sample coach...');
    const coachPassword = await hashPassword('Coach123!');
    const coachUser = await User.create({
      email: 'coach@example.com',
      password: coachPassword,
      role: 'coach'
    });

    const coach = await Coach.create({
      userId: coachUser._id,
      firstName: 'John',
      lastName: 'Smith',
      schoolName: 'State University',
      organizationType: 'university'
    });

    // Create sample team
    console.log('Creating sample team...');
    const team = await Team.create({
      teamName: 'State University Football',
      sport: 'football',
      schoolName: 'State University',
      coachId: coach._id,
      accessCode: 'TEAM123'
    });

    // Update coach with team
    coach.teams.push({ teamId: team._id, sport: 'football' });
    await coach.save();

    // Create sample athletes
    console.log('Creating sample athletes...');
    const athleteData = [
      { firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com' },
      { firstName: 'Chris', lastName: 'Williams', email: 'chris@example.com' },
      { firstName: 'David', lastName: 'Brown', email: 'david@example.com' }
    ];

    const athletePassword = await hashPassword('Athlete123!');
    const athleteIds = [];

    for (const data of athleteData) {
      const athleteUser = await User.create({
        email: data.email,
        password: athletePassword,
        role: 'athlete'
      });

      // Find exercise IDs for maxes
      const benchPress = exercises.find(e => e.name === 'Bench Press');
      const squat = exercises.find(e => e.name === 'Back Squat');
      const deadlift = exercises.find(e => e.name === 'Deadlift');

      const athlete = await Athlete.create({
        userId: athleteUser._id,
        firstName: data.firstName,
        lastName: data.lastName,
        schoolName: 'State University',
        teamId: team._id,
        sport: 'football',
        maxes: [
          { exerciseId: benchPress._id, exerciseName: 'Bench Press', oneRepMax: Math.floor(Math.random() * 100) + 185, lastUpdated: new Date() },
          { exerciseId: squat._id, exerciseName: 'Back Squat', oneRepMax: Math.floor(Math.random() * 150) + 275, lastUpdated: new Date() },
          { exerciseId: deadlift._id, exerciseName: 'Deadlift', oneRepMax: Math.floor(Math.random() * 150) + 315, lastUpdated: new Date() }
        ]
      });

      athleteIds.push(athlete._id);
    }

    // Update team with athletes
    team.athletes = athleteIds;
    await team.save();

    // Create sample workout program
    console.log('Creating sample workout program...');
    const benchPress = exercises.find(e => e.name === 'Bench Press');
    const squat = exercises.find(e => e.name === 'Back Squat');
    const rdl = exercises.find(e => e.name === 'Romanian Deadlift');
    const pullups = exercises.find(e => e.name === 'Pull-ups');
    const lunges = exercises.find(e => e.name === 'Walking Lunges');

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 28); // 4 weeks

    const workouts = [];

    // Generate 4 weeks of workouts (Mon, Wed, Fri)
    for (let week = 0; week < 4; week++) {
      // Monday - Lower Body
      const monday = new Date(startDate);
      monday.setDate(monday.getDate() + (week * 7) + 1);
      workouts.push({
        date: monday,
        dayOfWeek: 'monday',
        title: 'Lower Body Strength',
        exercises: [
          { exerciseId: squat._id, exerciseName: 'Back Squat', sets: 5, reps: '5', percentage: 75, order: 1, youtubeUrl: squat.youtubeUrl },
          { exerciseId: rdl._id, exerciseName: 'Romanian Deadlift', sets: 3, reps: '10', percentage: 60, order: 2, youtubeUrl: rdl.youtubeUrl },
          { exerciseId: lunges._id, exerciseName: 'Walking Lunges', sets: 3, reps: '12', percentage: null, notes: 'Bodyweight or light dumbbells', order: 3, youtubeUrl: lunges.youtubeUrl }
        ]
      });

      // Wednesday - Upper Body
      const wednesday = new Date(startDate);
      wednesday.setDate(wednesday.getDate() + (week * 7) + 3);
      workouts.push({
        date: wednesday,
        dayOfWeek: 'wednesday',
        title: 'Upper Body Strength',
        exercises: [
          { exerciseId: benchPress._id, exerciseName: 'Bench Press', sets: 5, reps: '5', percentage: 75, order: 1, youtubeUrl: benchPress.youtubeUrl },
          { exerciseId: pullups._id, exerciseName: 'Pull-ups', sets: 4, reps: '8-10', percentage: null, notes: 'Add weight if needed', order: 2, youtubeUrl: pullups.youtubeUrl }
        ]
      });

      // Friday - Full Body
      const friday = new Date(startDate);
      friday.setDate(friday.getDate() + (week * 7) + 5);
      workouts.push({
        date: friday,
        dayOfWeek: 'friday',
        title: 'Full Body Power',
        exercises: [
          { exerciseId: squat._id, exerciseName: 'Back Squat', sets: 3, reps: '3', percentage: 85, order: 1, youtubeUrl: squat.youtubeUrl },
          { exerciseId: benchPress._id, exerciseName: 'Bench Press', sets: 3, reps: '3', percentage: 85, order: 2, youtubeUrl: benchPress.youtubeUrl }
        ]
      });
    }

    const workoutProgram = await WorkoutProgram.create({
      programName: 'Fall Strength Program',
      createdBy: coach._id,
      createdByModel: 'Coach',
      assignedTeams: [team._id],
      workouts,
      startDate,
      endDate,
      isPublished: true,
      isDraft: false
    });

    // Add workout program to team
    team.workoutPrograms.push(workoutProgram._id);
    await team.save();

    console.log('\n========================================');
    console.log('Database seeded successfully!');
    console.log('========================================');
    console.log('\nTest Accounts:');
    console.log('----------------------------------------');
    console.log('Coach:');
    console.log('  Email: coach@example.com');
    console.log('  Password: Coach123!');
    console.log('----------------------------------------');
    console.log('Athletes (all same password):');
    console.log('  Email: mike@example.com');
    console.log('  Email: chris@example.com');
    console.log('  Email: david@example.com');
    console.log('  Password: Athlete123!');
    console.log('----------------------------------------');
    console.log('Team Access Code: TEAM123');
    console.log('========================================\n');

    process.exit(0);

  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

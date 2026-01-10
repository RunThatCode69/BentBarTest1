const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Coach = require('../models/Coach');
const Team = require('../models/Team');
const Athlete = require('../models/Athlete');
const WorkoutLog = require('../models/WorkoutLog');

// Create express app for testing
const app = express();
app.use(express.json());

// Import routes
const authRoutes = require('../routes/auth');
const athleteRoutes = require('../routes/athlete');
app.use('/api/auth', authRoutes);
app.use('/api/athlete', athleteRoutes);

describe('Athlete Controller', () => {
  let athleteToken;
  let athleteId;
  let teamId;

  beforeEach(async () => {
    // Create coach and team first
    const coachRes = await request(app)
      .post('/api/auth/register/coach')
      .send({
        email: 'coach@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Test',
        lastName: 'Coach',
        schoolName: 'Test University',
        organizationType: 'college',
        sport: 'football'
      });

    const accessCode = coachRes.body.team.accessCode;
    teamId = coachRes.body.team.id;

    // Register athlete
    const athleteRes = await request(app)
      .post('/api/auth/register/athlete')
      .send({
        email: 'athlete@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Test',
        lastName: 'Athlete',
        schoolName: 'Test University',
        accessCode: accessCode
      });

    athleteToken = athleteRes.body.token;

    const athlete = await Athlete.findOne({ userId: athleteRes.body.user.id });
    athleteId = athlete._id;
  });

  describe('GET /api/athlete/dashboard', () => {
    it('should return dashboard for authenticated athlete', async () => {
      const res = await request(app)
        .get('/api/athlete/dashboard')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.athlete).toBeDefined();
      expect(res.body.team).toBeDefined();
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/athlete/dashboard');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/athlete/stats', () => {
    it('should return stats for athlete', async () => {
      const res = await request(app)
        .get('/api/athlete/stats')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.workoutsCompleted).toBeDefined();
      expect(res.body.totalSets).toBeDefined();
      expect(res.body.totalVolume).toBeDefined();
      expect(res.body.exercisesLogged).toBeDefined();
      expect(res.body.currentStreak).toBeDefined();
    });

    it('should return zero stats for new athlete', async () => {
      const res = await request(app)
        .get('/api/athlete/stats')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.body.workoutsCompleted).toBe(0);
      expect(res.body.totalSets).toBe(0);
      expect(res.body.totalVolume).toBe(0);
    });
  });

  describe('PUT /api/athlete/stats/max', () => {
    it('should update one rep max', async () => {
      const res = await request(app)
        .put('/api/athlete/stats/max')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          exerciseName: 'Bench Press',
          oneRepMax: 225
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject missing exercise name', async () => {
      const res = await request(app)
        .put('/api/athlete/stats/max')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          oneRepMax: 225
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/athlete/workout-log', () => {
    it('should save workout log', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/athlete/workout-log')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          date: today,
          exercises: [
            {
              exerciseName: 'Squat',
              sets: [
                { setNumber: 1, completedWeight: 315, completedReps: 5 },
                { setNumber: 2, completedWeight: 315, completedReps: 5 }
              ]
            }
          ]
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.workoutLog).toBeDefined();
    });

    it('should update existing workout log for same date', async () => {
      const today = new Date().toISOString().split('T')[0];

      // First log
      await request(app)
        .post('/api/athlete/workout-log')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          date: today,
          exercises: [{ exerciseName: 'Squat', sets: [{ setNumber: 1, completedWeight: 315, completedReps: 5 }] }]
        });

      // Second log (same date - should update)
      const res = await request(app)
        .post('/api/athlete/workout-log')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          date: today,
          exercises: [{ exerciseName: 'Bench Press', sets: [{ setNumber: 1, completedWeight: 225, completedReps: 8 }] }]
        });

      expect(res.status).toBe(200);

      // Verify workout was updated/created
      const logs = await WorkoutLog.find({ athleteId });
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/athlete/workout-log/:date', () => {
    it('should return workout log for date', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Create a log first
      await request(app)
        .post('/api/athlete/workout-log')
        .set('Authorization', `Bearer ${athleteToken}`)
        .send({
          date: today,
          exercises: [{ exerciseName: 'Deadlift', sets: [{ setNumber: 1, completedWeight: 405, completedReps: 3 }] }]
        });

      const res = await request(app)
        .get(`/api/athlete/workout-log/${today}`)
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.workoutLog).toBeDefined();
    });

    it('should return null for date with no log', async () => {
      const res = await request(app)
        .get('/api/athlete/workout-log/2020-01-01')
        .set('Authorization', `Bearer ${athleteToken}`);

      expect(res.status).toBe(200);
      expect(res.body.workoutLog).toBeNull();
    });
  });
});

describe('Athlete Stats Calculation', () => {
  let athleteToken;
  let athleteId;

  beforeEach(async () => {
    // Create coach and team
    const coachRes = await request(app)
      .post('/api/auth/register/coach')
      .send({
        email: 'statscoach@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Stats',
        lastName: 'Coach',
        schoolName: 'Test University',
        organizationType: 'college',
        sport: 'football'
      });

    const accessCode = coachRes.body.team.accessCode;

    // Register athlete
    const athleteRes = await request(app)
      .post('/api/auth/register/athlete')
      .send({
        email: 'statsathlete@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Stats',
        lastName: 'Athlete',
        schoolName: 'Test University',
        accessCode: accessCode
      });

    athleteToken = athleteRes.body.token;

    const athlete = await Athlete.findOne({ userId: athleteRes.body.user.id });
    athleteId = athlete._id;
  });

  it('should calculate stats correctly from workout logs', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create workout log for today
    await request(app)
      .post('/api/athlete/workout-log')
      .set('Authorization', `Bearer ${athleteToken}`)
      .send({
        date: today.toISOString().split('T')[0],
        exercises: [
          {
            exerciseName: 'Squat',
            sets: [
              { setNumber: 1, completedWeight: 300, completedReps: 5 },
              { setNumber: 2, completedWeight: 300, completedReps: 5 }
            ]
          }
        ]
      });

    // Create workout log for yesterday
    await request(app)
      .post('/api/athlete/workout-log')
      .set('Authorization', `Bearer ${athleteToken}`)
      .send({
        date: yesterday.toISOString().split('T')[0],
        exercises: [
          {
            exerciseName: 'Bench',
            sets: [
              { setNumber: 1, completedWeight: 200, completedReps: 8 }
            ]
          }
        ]
      });

    const res = await request(app)
      .get('/api/athlete/stats')
      .set('Authorization', `Bearer ${athleteToken}`);

    expect(res.body.workoutsCompleted).toBe(2);
    expect(res.body.totalSets).toBe(3); // 2 squat sets + 1 bench set
    expect(res.body.exercisesLogged).toBe(2); // Squat and Bench
    // Volume = (300*5 + 300*5) + (200*8) = 3000 + 1600 = 4600
    expect(res.body.totalVolume).toBe(4600);
    expect(res.body.currentStreak).toBe(2); // Today and yesterday
  });

  it('should use prescribed values when completed values missing', async () => {
    const today = new Date().toISOString().split('T')[0];

    await request(app)
      .post('/api/athlete/workout-log')
      .set('Authorization', `Bearer ${athleteToken}`)
      .send({
        date: today,
        exercises: [
          {
            exerciseName: 'Squat',
            sets: [
              { setNumber: 1, prescribedWeight: 300, prescribedReps: '5' }
            ]
          }
        ]
      });

    const res = await request(app)
      .get('/api/athlete/stats')
      .set('Authorization', `Bearer ${athleteToken}`);

    expect(res.body.totalSets).toBe(1);
    expect(res.body.totalVolume).toBe(1500); // 300 * 5
  });
});

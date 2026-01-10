const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Coach = require('../models/Coach');
const Team = require('../models/Team');
const Athlete = require('../models/Athlete');
const WorkoutProgram = require('../models/WorkoutProgram');

// Create express app for testing
const app = express();
app.use(express.json());

// Import routes
const authRoutes = require('../routes/auth');
const coachRoutes = require('../routes/coach');
app.use('/api/auth', authRoutes);
app.use('/api/coach', coachRoutes);

describe('Coach Controller', () => {
  let authToken;
  let coachId;
  let teamId;

  beforeEach(async () => {
    // Register a coach and get token
    const res = await request(app)
      .post('/api/auth/register/coach')
      .send({
        email: 'testcoach@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Test',
        lastName: 'Coach',
        schoolName: 'Test University',
        organizationType: 'college',
        sport: 'football'
      });

    authToken = res.body.token;
    teamId = res.body.team.id;

    // Get coach ID
    const coach = await Coach.findOne({ userId: res.body.user.id });
    coachId = coach._id;
  });

  describe('GET /api/coach/dashboard', () => {
    it('should return dashboard data for authenticated coach', async () => {
      const res = await request(app)
        .get('/api/coach/dashboard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.coach).toBeDefined();
      expect(res.body.teams).toBeDefined();
      expect(Array.isArray(res.body.teams)).toBe(true);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app)
        .get('/api/coach/dashboard');

      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/coach/dashboard')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/coach/teams', () => {
    it('should return teams for coach', async () => {
      const res = await request(app)
        .get('/api/coach/teams')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.teams)).toBe(true);
      expect(res.body.teams.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/coach/teams', () => {
    it('should create a new team', async () => {
      // First give the coach a paid team slot
      await Coach.findByIdAndUpdate(coachId, { paidTeams: 5 });

      const res = await request(app)
        .post('/api/coach/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          teamName: 'New Test Team',
          sport: 'basketball'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.team.teamName).toBe('New Test Team');
      expect(res.body.team.accessCode).toBeDefined();
    });

    it('should reject team creation without paid slots', async () => {
      // Coach has 1 team but 0 paid slots (default)
      const res = await request(app)
        .post('/api/coach/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          teamName: 'Another Team',
          sport: 'soccer'
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('TEAM_LIMIT_REACHED');
    });

    it('should reject missing team name', async () => {
      const res = await request(app)
        .post('/api/coach/teams')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sport: 'basketball'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/coach/teams/:teamId', () => {
    it('should return specific team', async () => {
      const res = await request(app)
        .get(`/api/coach/teams/${teamId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.team._id.toString()).toBe(teamId.toString());
    });

    it('should reject access to non-existent team', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/coach/teams/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/coach/teams/:teamId/athletes', () => {
    it('should return empty array for team with no athletes', async () => {
      const res = await request(app)
        .get(`/api/coach/teams/${teamId}/athletes`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.athletes)).toBe(true);
    });
  });

  describe('POST /api/coach/teams/:teamId/regenerate-code', () => {
    it('should regenerate access code', async () => {
      // Get original code
      const team = await Team.findById(teamId);
      const originalCode = team.accessCode;

      const res = await request(app)
        .post(`/api/coach/teams/${teamId}/regenerate-code`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessCode).toBeDefined();
      expect(res.body.accessCode).not.toBe(originalCode);
    });
  });
});

describe('Coach Team Management', () => {
  let ownerToken;
  let ownerId;
  let teamId;

  beforeEach(async () => {
    // Register owner coach
    const ownerRes = await request(app)
      .post('/api/auth/register/coach')
      .send({
        email: 'owner@example.com',
        password: 'TestPass123!',
        confirmPassword: 'TestPass123!',
        firstName: 'Owner',
        lastName: 'Coach',
        schoolName: 'Test University',
        organizationType: 'college',
        sport: 'football'
      });

    ownerToken = ownerRes.body.token;
    teamId = ownerRes.body.team.id;

    const owner = await Coach.findOne({ userId: ownerRes.body.user.id });
    ownerId = owner._id;
  });

  describe('Team coaches array format', () => {
    it('should create team with coaches array (not coachId)', async () => {
      const team = await Team.findById(teamId);

      // Team should have coaches array, not coachId
      expect(team.coaches).toBeDefined();
      expect(Array.isArray(team.coaches)).toBe(true);
      expect(team.coaches.length).toBeGreaterThan(0);
      expect(team.coaches[0].role).toBe('owner');
    });

    it('should have hasCoach method working', async () => {
      const team = await Team.findById(teamId);
      expect(team.hasCoach(ownerId)).toBe(true);
    });

    it('should have isOwner method working', async () => {
      const team = await Team.findById(teamId);
      expect(team.isOwner(ownerId)).toBe(true);
    });
  });
});

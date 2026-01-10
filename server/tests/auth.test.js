const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Coach = require('../models/Coach');
const Athlete = require('../models/Athlete');
const Team = require('../models/Team');

// Create express app for testing
const app = express();
app.use(express.json());

// Import routes
const authRoutes = require('../routes/auth');
app.use('/api/auth', authRoutes);

describe('Auth Controller', () => {
  describe('POST /api/auth/register/coach', () => {
    const validCoachData = {
      email: 'testcoach@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: 'Test',
      lastName: 'Coach',
      schoolName: 'Test University',
      organizationType: 'college',
      sport: 'football'
    };

    it('should register a new coach successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register/coach')
        .send(validCoachData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(validCoachData.email.toLowerCase());
      expect(res.body.user.role).toBe('coach');
      expect(res.body.team.accessCode).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      // Register first coach
      await request(app)
        .post('/api/auth/register/coach')
        .send(validCoachData);

      // Try to register with same email
      const res = await request(app)
        .post('/api/auth/register/coach')
        .send(validCoachData);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already registered');
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register/coach')
        .send({
          ...validCoachData,
          password: 'weak',
          confirmPassword: 'weak'
        });

      expect(res.status).toBe(400);
    });

    it('should reject mismatched passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register/coach')
        .send({
          ...validCoachData,
          confirmPassword: 'DifferentPass123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('do not match');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register/coach')
        .send({
          ...validCoachData,
          email: 'not-an-email'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('email');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register/coach')
        .send({
          email: 'test@example.com',
          password: 'TestPass123!'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Missing');
    });
  });

  describe('POST /api/auth/register/athlete', () => {
    let teamAccessCode;

    beforeEach(async () => {
      // Create a coach and team first
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
      teamAccessCode = coachRes.body.team.accessCode;
    });

    const validAthleteData = {
      email: 'athlete@example.com',
      password: 'TestPass123!',
      confirmPassword: 'TestPass123!',
      firstName: 'Test',
      lastName: 'Athlete',
      schoolName: 'Test University'
    };

    it('should register athlete with valid access code', async () => {
      const res = await request(app)
        .post('/api/auth/register/athlete')
        .send({
          ...validAthleteData,
          accessCode: teamAccessCode
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('athlete');
      expect(res.body.team).toBeDefined();
    });

    it('should reject invalid access code', async () => {
      const res = await request(app)
        .post('/api/auth/register/athlete')
        .send({
          ...validAthleteData,
          accessCode: 'INVALID'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid access code');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a coach first
      await request(app)
        .post('/api/auth/register/coach')
        .send({
          email: 'login@example.com',
          password: 'TestPass123!',
          confirmPassword: 'TestPass123!',
          firstName: 'Test',
          lastName: 'Coach',
          schoolName: 'Test University',
          organizationType: 'college',
          sport: 'football'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'TestPass123!'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'TestPass123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should reject missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/validate-access-code', () => {
    let teamAccessCode;

    beforeEach(async () => {
      const coachRes = await request(app)
        .post('/api/auth/register/coach')
        .send({
          email: 'coach2@example.com',
          password: 'TestPass123!',
          confirmPassword: 'TestPass123!',
          firstName: 'Test',
          lastName: 'Coach',
          schoolName: 'Test University',
          organizationType: 'college',
          sport: 'basketball'
        });
      teamAccessCode = coachRes.body.team.accessCode;
    });

    it('should validate correct access code', async () => {
      const res = await request(app)
        .post('/api/auth/validate-access-code')
        .send({ accessCode: teamAccessCode });

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
      expect(res.body.team.teamName).toBeDefined();
    });

    it('should reject invalid access code', async () => {
      const res = await request(app)
        .post('/api/auth/validate-access-code')
        .send({ accessCode: 'BADCODE' });

      expect(res.status).toBe(404);
      expect(res.body.valid).toBe(false);
    });
  });
});

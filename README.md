# Bar Bend Pro - Workout Management Application

A full-stack workout management application for coaches, athletes, and trainers. Built with React, Node.js, Express, and MongoDB.

## Features

- **Coach Dashboard**: Manage teams, create workout programs, track athlete progress
- **Athlete Dashboard**: View assigned workouts, log exercises, track personal records
- **Workout Calendar**: Visual calendar with daily workout assignments
- **Exercise Library**: Pre-built exercise database with YouTube demo links
- **Team Management**: Create teams, generate access codes, manage athletes
- **One Rep Max Tracking**: Athletes can track their maxes, workouts calculate weight from percentages
- **Role-based Access**: Separate interfaces for coaches, athletes, and trainers

## Tech Stack

- **Frontend**: React 18, React Router v6, Custom CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with HTTP-only cookies
- **Security**: bcrypt, helmet, express-mongo-sanitize, rate limiting

## Getting Started

### Prerequisites

- Node.js 16+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd "Bar Bend Second Pro"
```

2. Install dependencies:
```bash
npm run install:all
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

4. Seed the database (optional):
```bash
npm run seed
```

5. Start the development servers:
```bash
npm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Test Accounts

After running the seed script:

**Coach Account:**
- Email: coach@example.com
- Password: Coach123!

**Athlete Accounts:**
- Email: mike@example.com, chris@example.com, david@example.com
- Password: Athlete123!

**Team Access Code:** TEAM123

## Project Structure

```
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── athlete/    # Athlete dashboard components
│       │   ├── auth/       # Authentication forms
│       │   ├── coach/      # Coach dashboard components
│       │   ├── common/     # Reusable UI components
│       │   └── payment/    # Payment form components
│       ├── context/        # React context providers
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       ├── services/       # API service
│       └── styles/         # Global CSS styles
│
├── server/                 # Express backend
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── seed/               # Database seed script
│   ├── services/           # Business logic services
│   └── utils/              # Utility functions
│
├── .env.example            # Environment variables template
└── package.json            # Root package.json with scripts
```

## Available Scripts

In the project root:

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend
- `npm run install:all` - Install dependencies for root, client, and server
- `npm run seed` - Seed the database with sample data

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Coach
- `GET /api/coach/dashboard` - Get coach dashboard data
- `GET /api/coach/teams` - Get coach's teams
- `POST /api/coach/teams` - Create a new team

### Athlete
- `GET /api/athlete/dashboard` - Get athlete dashboard data
- `GET /api/athlete/stats` - Get athlete statistics
- `GET /api/athlete/workouts` - Get assigned workouts
- `POST /api/athlete/log-exercise` - Log completed exercise

### Workouts
- `GET /api/workouts` - Get workout programs
- `POST /api/workouts` - Create workout program
- `PUT /api/workouts/:id` - Update workout program
- `DELETE /api/workouts/:id` - Delete workout program

### Exercises
- `GET /api/exercises` - Get exercise library
- `POST /api/exercises` - Create custom exercise

### Teams
- `POST /api/teams/join` - Join team with access code

## Design System

The app uses a custom CSS design system with:

- **Primary Color**: #FF6B35 (Orange)
- **Background**: #FFFFFF (White)
- **Text**: #111827 (Gray-900)
- **Typography**: System font stack
- **Spacing**: 4px base unit
- **Border Radius**: 4px, 8px, 12px variants

## Security Features

- Password hashing with bcrypt (12 salt rounds)
- JWT tokens in HTTP-only cookies
- Rate limiting on authentication routes
- MongoDB query sanitization
- Helmet security headers
- Input validation and sanitization

## License

MIT

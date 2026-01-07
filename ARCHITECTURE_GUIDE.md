# Bar Bend Pro - Architecture Quick Reference

## FRONTEND KEY FILES

### Entry & Auth Flow
| File | Purpose |
|------|---------|
| `client/src/App.jsx` | Main router, route protection |
| `client/src/context/AuthContext.jsx` | Auth state, login/logout functions |
| `client/src/pages/Welcome.jsx` | Landing page |
| `client/src/components/auth/LoginForm.jsx` | Login form → `POST /api/auth/login` |
| `client/src/components/auth/CoachSignup.jsx` | Coach registration → `POST /api/auth/register/coach` |
| `client/src/components/auth/AthleteSignup.jsx` | Athlete registration → `POST /api/auth/register/athlete` |

### Coach Views
| File | Purpose |
|------|---------|
| `client/src/components/coach/CoachDashboard.jsx` | Main dashboard → `GET /api/coach/dashboard` |
| `client/src/components/coach/CoachWorkouts.jsx` | View all workouts → `GET /api/workouts` |
| `client/src/components/coach/CreateWorkout.jsx` | Create workout → `POST /api/workouts` |
| `client/src/components/coach/WorkoutEditor.jsx` | Exercise selection modal |
| `client/src/components/common/Calendar.jsx` | Calendar display for workouts |

### Athlete Views
| File | Purpose |
|------|---------|
| `client/src/components/athlete/AthleteDashboard.jsx` | Dashboard → `GET /api/athlete/dashboard` |
| `client/src/components/athlete/AthleteWorkouts.jsx` | View workouts → `GET /api/athlete/workouts` |

### Shared
| File | Purpose |
|------|---------|
| `client/src/services/api.js` | Axios instance with auth headers |
| `client/src/constants/defaultExercises.js` | Hardcoded exercise list (48 exercises) |

---

## BACKEND KEY FILES

### Server Entry
| File | Purpose |
|------|---------|
| `server/server.js` | Express app, route mounting, CORS |
| `server/config/db.js` | MongoDB connection, auto-seeds exercises |

### Auth Pipeline
| File | Purpose |
|------|---------|
| `server/routes/auth.js` | Auth endpoints |
| `server/controllers/authController.js` | Login/register logic, JWT generation |
| `server/middleware/auth.js` | `protect` middleware - validates JWT |
| `server/middleware/roleCheck.js` | `isCoachOrTrainer`, `isAthlete` guards |

### Workout Pipeline
| File | Purpose |
|------|---------|
| `server/routes/workouts.js` | Workout CRUD endpoints |
| `server/controllers/workoutController.js` | Create/read/update workouts |

### Data Models
| File | Key Fields |
|------|------------|
| `server/models/User.js` | email, password, role |
| `server/models/Coach.js` | userId, firstName, lastName, teams[] |
| `server/models/Athlete.js` | userId, teamId, stats[], maxes[] |
| `server/models/Team.js` | teamName, coachId, accessCode, athletes[] |
| `server/models/WorkoutProgram.js` | programName, workouts[], assignedTeams[] |
| `server/models/Exercise.js` | name, category, isGlobal, createdBy |

---

## CRITICAL DATA FLOWS

### 1. LOGIN FLOW
```
LoginForm.jsx → POST /api/auth/login → authController.login()
    ↓
Validates credentials → Generates JWT → Returns {token, user}
    ↓
AuthContext stores token in localStorage → Redirects by role
```

### 2. COACH CREATES WORKOUT
```
CreateWorkout.jsx → Click date → WorkoutEditor.jsx opens
    ↓
Select exercise from DEFAULT_EXERCISES → Add sets/reps
    ↓
Save → POST /api/workouts → workoutController.createWorkout()
    ↓
Creates WorkoutProgram in MongoDB with workouts[] array
    ↓
If assignedTeams set → Athletes on those teams see it
```

### 3. ATHLETE VIEWS WORKOUT
```
AthleteDashboard.jsx → GET /api/athlete/dashboard
    ↓
athleteController.getDashboard() → Finds athlete's team
    ↓
Fetches WorkoutPrograms where assignedTeams includes teamId
    ↓
Returns today's workout with exercises[]
    ↓
Calendar.jsx displays exercises on each date
```

### 4. TEAM & ATHLETE CONNECTION
```
Coach creates team → Team gets accessCode (e.g., "ABC123")
    ↓
Athlete signs up with accessCode → AthleteSignup.jsx
    ↓
POST /api/auth/register/athlete validates code
    ↓
Creates Athlete with teamId reference
    ↓
Athlete now sees team's assigned WorkoutPrograms
```

### 5. EXERCISE CREATION (Custom)
```
WorkoutEditor.jsx → "+ Create New Exercise" button
    ↓
POST /api/exercises → exerciseController.createExercise()
    ↓
Saves with createdBy = coach._id, isGlobal = false
    ↓
Only that coach sees it (merged with DEFAULT_EXERCISES)
```

---

## API ENDPOINTS SUMMARY

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register/coach` | Coach signup |
| POST | `/api/auth/register/athlete` | Athlete signup |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/coach/dashboard` | Coach dashboard data |
| GET | `/api/coach/teams` | List coach's teams |
| POST | `/api/coach/teams` | Create team |
| GET | `/api/athlete/dashboard` | Athlete dashboard data |
| GET | `/api/athlete/workouts` | Athlete's workouts |
| GET | `/api/workouts` | List workouts |
| POST | `/api/workouts` | Create workout program |
| PUT | `/api/workouts/:id` | Update workout |
| GET | `/api/exercises` | List exercises |
| POST | `/api/exercises` | Create custom exercise |

---

## ENVIRONMENT VARIABLES

### Client (.env)
```
REACT_APP_API_URL=https://your-backend.railway.app/api
```

### Server (.env)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=5000
```

---

## DATABASE RELATIONSHIPS

```
User (1) ←→ (1) Coach/Athlete/Trainer
Coach (1) ←→ (many) Team
Team (1) ←→ (many) Athlete
Team (many) ←→ (many) WorkoutProgram
Coach/Trainer (1) ←→ (many) WorkoutProgram (creator)
Coach/Trainer (1) ←→ (many) Exercise (custom exercises)
```

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import Welcome from './pages/Welcome';
import About from './pages/About';
import Contact from './pages/Contact';
import SignupSelect from './pages/SignupSelect';
import TeamProgramInfo from './pages/TeamProgramInfo';
import NotFound from './pages/NotFound';

// Auth Components
import CoachSignup from './components/auth/CoachSignup';
import AthleteSignup from './components/auth/AthleteSignup';
import TrainerSignup from './components/auth/TrainerSignup';

// Dashboard Components
import CoachDashboard from './components/coach/CoachDashboard';
import CoachStats from './components/coach/CoachStats';
import CoachWorkouts from './components/coach/CoachWorkouts';
import CreateWorkout from './components/coach/CreateWorkout';
import EditWorkout from './components/coach/EditWorkout';

import AthleteDashboard from './components/athlete/AthleteDashboard';
import AthleteStats from './components/athlete/AthleteStats';
import AthleteWorkouts from './components/athlete/AthleteWorkouts';

// Layout
import Navbar from './components/common/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'coach') return <Navigate to="/coach/dashboard" replace />;
    if (user.role === 'athlete') return <Navigate to="/athlete/dashboard" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// Public Route - redirects authenticated users to their dashboard
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (user) {
    if (user.role === 'coach') return <Navigate to="/coach/dashboard" replace />;
    if (user.role === 'athlete') return <Navigate to="/athlete/dashboard" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();

  return (
    <ErrorBoundary>
      <div className="app">
        {user && <Navbar />}
        <main className={user ? 'main-content with-navbar' : 'main-content'}>
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicRoute><Welcome /></PublicRoute>} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/signup" element={<PublicRoute><SignupSelect /></PublicRoute>} />
          <Route path="/signup/team" element={<PublicRoute><TeamProgramInfo /></PublicRoute>} />
          <Route path="/signup/coach" element={<PublicRoute><CoachSignup /></PublicRoute>} />
          <Route path="/signup/athlete" element={<PublicRoute><AthleteSignup /></PublicRoute>} />
          <Route path="/signup/trainer" element={<PublicRoute><TrainerSignup /></PublicRoute>} />

          {/* Coach Routes */}
          <Route
            path="/coach/dashboard"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/stats"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/workouts"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CoachWorkouts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/workouts/create"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <CreateWorkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach/workouts/:id"
            element={
              <ProtectedRoute allowedRoles={['coach']}>
                <EditWorkout />
              </ProtectedRoute>
            }
          />

          {/* Athlete Routes */}
          <Route
            path="/athlete/dashboard"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/athlete/stats"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/athlete/workouts"
            element={
              <ProtectedRoute allowedRoles={['athlete']}>
                <AthleteWorkouts />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;

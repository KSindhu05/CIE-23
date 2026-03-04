import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DialogProvider } from './components/GlobalDialogProvider';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoute';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import HODDashboard from './pages/HODDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DialogProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route path="/" element={<Navigate to="/login" replace />} />

              <Route
                path="/dashboard/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard/faculty"
                element={
                  <ProtectedRoute allowedRoles={['faculty']}>
                    <FacultyDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard/hod"
                element={
                  <ProtectedRoute allowedRoles={['hod']}>
                    <HODDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/dashboard/principal"
                element={
                  <ProtectedRoute allowedRoles={['principal']}>
                    <PrincipalDashboard />
                  </ProtectedRoute>
                }
              />

            </Routes>
          </Router>
        </DialogProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ThemeToggle from './components/ThemeToggle';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/Login/LoginPage';
import EmployeeDashboard from './pages/Employee/EmployeeDashboard';
import CreateTicket from './pages/Employee/CreateTicket';
import EngineerWorkspace from './pages/Engineer/EngineerWorkspace';

import AdminDashboard from './pages/Admin/AdminDashboard';
import DeptHeadDashboard from './pages/Admin/DeptHeadDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Route Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>جاري التحميل...</div>;
  if (!currentUser) return <Navigate to="/" />;

  // Role validation
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // If not allowed, fallback based on role (standard behavior)
    if (userRole === 'admin') return <Navigate to="/admin" />;
    if (userRole === 'dept_head') return <Navigate to="/dept-head" />;
    if (userRole === 'engineer') return <Navigate to="/engineer" />;
    return <Navigate to="/employee" />;
  }

  return children;
};

// Public Route Guard (redirects logged in users away from login page)
const PublicRoute = ({ children }) => {
  const { currentUser, userRole, loading } = useAuth();
  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>جاري التحميل...</div>;
  if (currentUser) {
    if (userRole === 'admin') return <Navigate to="/admin" />;
    if (userRole === 'dept_head') return <Navigate to="/dept-head" />;
    if (userRole === 'engineer') return <Navigate to="/engineer" />;
    return <Navigate to="/employee" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <ThemeToggle />
          <ToastContainer position="top-right" autoClose={3000} rtl={true} pauseOnFocusLoss theme="colored" />
          <Routes>
          {/* Public Login Route */}
          <Route path="/" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />

          {/* Employee Routes */}
          <Route path="/employee/*" element={
            <ProtectedRoute allowedRoles={['user', 'admin', 'engineer']}>
              <Routes>
                <Route path="/" element={<EmployeeDashboard />} />
                <Route path="/create" element={<CreateTicket />} />
              </Routes>
            </ProtectedRoute>
          } />
          {/* Backward compatibility for /user */}
          <Route path="/user" element={<Navigate to="/employee" />} />

          {/* Engineer Routes */}
          <Route path="/engineer/*" element={
            <ProtectedRoute allowedRoles={['engineer']}>
              <EngineerWorkspace />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Dept Head Routes */}
          <Route path="/dept-head/*" element={
            <ProtectedRoute allowedRoles={['dept_head']}>
              <DeptHeadDashboard />
            </ProtectedRoute>
          } />

          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

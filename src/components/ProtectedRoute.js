import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>; // Or a spinner
    }

    // Check context first, then fallback to localStorage to handle potential race condition during login
    const effectiveUser = user || (() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
    })();

    if (!effectiveUser) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(effectiveUser.role)) {
        // Redirect to legitimate dashboard if logged in but unauthorized for this page
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;

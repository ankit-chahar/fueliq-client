import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../auth/LoginPage';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    // Show loading spinner while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="h-16 w-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-gas-pump text-white text-2xl"></i>
                    </div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Loading FueliQ...</h2>
                    <p className="text-gray-500 mt-2">Checking authentication status</p>
                </div>
            </div>
        );
    }

    // If not authenticated, show login page
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // If authenticated, render the protected content
    return children;
};

export default ProtectedRoute;

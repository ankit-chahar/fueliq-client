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
                    <div className="flex justify-center mb-4">
                        <img 
                            src="/images/fueliq.png" 
                            alt="FueliQ Logo" 
                            className="h-32 w-auto"
                        />
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

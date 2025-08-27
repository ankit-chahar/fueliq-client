import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './index.css';

// Import utilities and constants
import { API_URL } from './constants';

// Import auth context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import components
import {
    SuccessBanner,
    ConfirmationModal,
    Header,
    Navigation,
    ShiftEntryView,
    HistoricalDataView,
    DashboardView,
    SettingsView,
    ChangePasswordView,
    AdminSettingsView,
    ProtectedRoute
} from './components';

import { AccessDenied } from './components/common/RoleGate';

// --- Main App Component ---
function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

// Main App Content Component (wrapped by AuthProvider)
function AppContent() {
    const { canAccessView, getDefaultView, user } = useAuth();
    const [view, setView] = useState('dashboard');
    const [successMessage, setSuccessMessage] = useState('');

    // Set initial view based on user role when user is loaded
    useEffect(() => {
        if (user) {
            const defaultView = getDefaultView();
            setView(defaultView);
        }
    }, [user, getDefaultView]);

    const showSuccessBanner = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
        // Scroll to top to make banner visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Enhanced setView with permission checking
    const handleSetView = (newView) => {
        if (canAccessView(newView)) {
            setView(newView);
        } else {
            // Redirect to default view if trying to access unauthorized view
            const defaultView = getDefaultView();
            setView(defaultView);
        }
    };

    useEffect(() => {
        // Prevent wheel events on number inputs from changing values
        const handleWheel = (e) => {
            if (e.target.type === 'number') {
                e.preventDefault();
            }
        };
        
        document.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            document.removeEventListener('wheel', handleWheel);
        };
    }, []);

    const renderView = () => {
        // Check if user can access the current view
        if (!canAccessView(view)) {
            return <AccessDenied message="You don't have permission to access this page. You've been redirected to your default view." />;
        }

        switch (view) {
            case 'shift-entry':
                return <ShiftEntryView showSuccessBanner={showSuccessBanner} />;
            case 'settings':
                return <SettingsView showSuccessBanner={showSuccessBanner} />;
            case 'admin-settings':
                return <AdminSettingsView showSuccessBanner={showSuccessBanner} />;
            case 'history':
                return <HistoricalDataView showSuccessBanner={showSuccessBanner} />;
            case 'change-password':
                return <ChangePasswordView showSuccessBanner={showSuccessBanner} />;
            case 'dashboard':
                return <DashboardView />;
            default:
                // If view not found, redirect to default view
                const defaultView = getDefaultView();
                if (view !== defaultView) {
                    setView(defaultView);
                }
                return <div className="p-6 card">Loading...</div>;
        }
    };

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto p-2 md:p-4">
                {successMessage && <SuccessBanner message={successMessage} />}
                <Header 
                    pumpName="FueliQ Petrol Pump" 
                    onNavigate={handleSetView}
                />
                <Navigation currentView={view} setView={handleSetView} />
                <main>{renderView()}</main>
                <ConfirmationModal />
            </div>
        </ProtectedRoute>
    );
}

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './index.css';

// Import utilities and constants
import { API_URL } from './constants';

// Import auth context
import { AuthProvider } from './contexts/AuthContext';

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
    const [view, setView] = useState('dashboard');
    const [successMessage, setSuccessMessage] = useState('');

    const showSuccessBanner = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
        // Scroll to top to make banner visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                return <div className="p-6 card">View not found</div>;
        }
    };

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto p-2 md:p-4">
                {successMessage && <SuccessBanner message={successMessage} />}
                <Header 
                    pumpName="FueliQ Petrol Pump" 
                    onNavigate={setView}
                />
                <Navigation currentView={view} setView={setView} />
                <main>{renderView()}</main>
                <ConfirmationModal />
            </div>
        </ProtectedRoute>
    );
}

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './index.css';

// Import utilities and constants
import { API_URL } from './constants';
import { formatMoney } from './utils';

// Import components
import {
    SuccessBanner,
    ConfirmationModal,
    Header,
    Navigation,
    ShiftEntryView,
    HistoricalDataView,
    FuelManagementView,
    DashboardView,
    SettingsView
} from './components';

// --- Main App Component ---
function App() {
    const [view, setView] = useState('dashboard');
    const [settings, setSettings] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Fetch settings and master data from new API endpoints
            const [settingsResponse, masterDataResponse, pumpInfoResponse] = await Promise.all([
                axios.get(`${API_URL}/api/settings`),
                axios.get(`${API_URL}/api/master-data`),
                axios.get(`${API_URL}/api/pump-info`)
            ]);
            
            const settingsData = settingsResponse.data;
            const masterData = masterDataResponse.data;
            const pumpInfo = pumpInfoResponse.data;
            
            // Provide default empty structures for missing settings
            const defaultEmptySettings = {
                general: { pumpName: pumpInfo?.pump_name || 'Petrol Pump Manager' },
                fuels: [],
                expenseCategories: [],
                creditTypes: [],
                cashModes: [],
                pumpInfo: null
            };
            
            // Clean and validate the settings data
            const cleanSettings = {};
            
            // Handle general settings - prioritize pump info
            if (pumpInfo) {
                cleanSettings.general = {
                    pumpName: pumpInfo.pump_name,
                    ownerName: pumpInfo.owner_name,
                    address: pumpInfo.address,
                    city: pumpInfo.city,
                    state: pumpInfo.state,
                    pincode: pumpInfo.pincode,
                    phone: pumpInfo.phone,
                    email: pumpInfo.email,
                    licenseNumber: pumpInfo.license_number,
                    gstNumber: pumpInfo.gst_number,
                    establishedDate: pumpInfo.established_date,
                    website: pumpInfo.website,
                    operatingHours: pumpInfo.operating_hours
                };
                cleanSettings.pumpInfo = pumpInfo;
            } else if (settingsData.general && typeof settingsData.general === 'object') {
                cleanSettings.general = settingsData.general;
            } else if (settingsData.app_config && typeof settingsData.app_config === 'object') {
                cleanSettings.general = settingsData.app_config;
            } else {
                cleanSettings.general = defaultEmptySettings.general;
            }
            
            // Use master data from new APIs
            cleanSettings.fuels = Array.isArray(masterData.fuels) ? masterData.fuels : defaultEmptySettings.fuels;
            cleanSettings.expenseCategories = Array.isArray(masterData.expenseCategories) ? masterData.expenseCategories : defaultEmptySettings.expenseCategories;
            cleanSettings.creditTypes = Array.isArray(masterData.creditTypes) ? masterData.creditTypes : defaultEmptySettings.creditTypes;
            cleanSettings.cashModes = Array.isArray(masterData.cashModes) ? masterData.cashModes : defaultEmptySettings.cashModes;
            
            // Fallback to settings data if master data not available
            if (cleanSettings.fuels.length === 0 && Array.isArray(settingsData.fuels)) {
                cleanSettings.fuels = settingsData.fuels;
            }
            if (cleanSettings.expenseCategories.length === 0 && Array.isArray(settingsData.expenseCategories)) {
                cleanSettings.expenseCategories = settingsData.expenseCategories;
            }
            if (cleanSettings.creditTypes.length === 0 && Array.isArray(settingsData.creditTypes)) {
                cleanSettings.creditTypes = settingsData.creditTypes;
            }
            if (cleanSettings.cashModes.length === 0 && Array.isArray(settingsData.cashModes)) {
                cleanSettings.cashModes = settingsData.cashModes;
            }
            
            setSettings(cleanSettings);
            setError(null);
        } catch (err) {
            console.error('Error fetching settings:', err);
            
            if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
                setError('Cannot connect to the server. Please ensure the backend is running.');
                setSettings(null);
            } else if (err.response?.status === 500) {
                setError('Server error. Please check the database connection.');
                setSettings(null);
            } else {
                // For other errors, still provide empty settings so user can start configuring
                setSettings({
                    general: { pumpName: 'Petrol Pump Manager' },
                    fuels: [],
                    expenseCategories: [],
                    creditTypes: [],
                    cashModes: [],
                    pumpInfo: null
                });
                setError(null);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
        
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
    }, [fetchSettings]);

    const showSuccessBanner = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
        // Scroll to top to make banner visible
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearAllSettings = async () => {
        try {
            await axios.delete(`${API_URL}/api/settings`);
            showSuccessBanner('All settings cleared successfully! You can now start fresh.');
            await fetchSettings();
        } catch (error) {
            console.error('Error clearing settings:', error);
            setError('Failed to clear settings. Please check the server connection.');
        }
    };

    const handleSaveSettings = async (newSettings, sectionName = null) => {
        try {
            // Handle different types of settings updates
            if (sectionName === 'general' && newSettings.general) {
                // Save pump info using new API
                await axios.post(`${API_URL}/api/pump-info`, {
                    pump_name: newSettings.general.pumpName,
                    owner_name: newSettings.general.ownerName,
                    address: newSettings.general.address,
                    city: newSettings.general.city,
                    state: newSettings.general.state,
                    pincode: newSettings.general.pincode,
                    phone: newSettings.general.phone,
                    email: newSettings.general.email,
                    license_number: newSettings.general.licenseNumber,
                    gst_number: newSettings.general.gstNumber,
                    established_date: newSettings.general.establishedDate,
                    website: newSettings.general.website,
                    operating_hours: newSettings.general.operatingHours
                });
            } else if (sectionName === 'fuels' && newSettings.fuels) {
                // Handle fuel updates - this might need individual API calls for each fuel
                // For now, save to settings as backup
                await axios.post(`${API_URL}/api/settings`, { fuels: newSettings.fuels });
            } else if (sectionName === 'expenseCategories' && newSettings.expenseCategories) {
                // Save expense categories using new API
                for (const category of newSettings.expenseCategories) {
                    if (category.name && !category.id) {
                        try {
                            await axios.post(`${API_URL}/api/expense-categories`, { name: category.name });
                        } catch (err) {
                            if (err.response?.status !== 409) { // Ignore duplicate entries
                                throw err;
                            }
                        }
                    }
                }
                // Also save to settings as backup
                await axios.post(`${API_URL}/api/settings`, { expenseCategories: newSettings.expenseCategories });
            } else if (sectionName === 'creditTypes' && newSettings.creditTypes) {
                // Save credit types using new API
                for (const creditType of newSettings.creditTypes) {
                    if (creditType.name && !creditType.id) {
                        try {
                            await axios.post(`${API_URL}/api/credit-types`, { name: creditType.name });
                        } catch (err) {
                            if (err.response?.status !== 409) { // Ignore duplicate entries
                                throw err;
                            }
                        }
                    }
                }
                // Also save to settings as backup
                await axios.post(`${API_URL}/api/settings`, { creditTypes: newSettings.creditTypes });
            } else if (sectionName === 'cashModes' && newSettings.cashModes) {
                // Save cash modes using new API
                for (const cashMode of newSettings.cashModes) {
                    if (cashMode.name && !cashMode.id) {
                        try {
                            await axios.post(`${API_URL}/api/cash-modes`, { name: cashMode.name });
                        } catch (err) {
                            if (err.response?.status !== 409) { // Ignore duplicate entries
                                throw err;
                            }
                        }
                    }
                }
                // Also save to settings as backup
                await axios.post(`${API_URL}/api/settings`, { cashModes: newSettings.cashModes });
            } else {
                // Fallback to old API for other settings
                await axios.post(`${API_URL}/api/settings`, newSettings);
            }
            
            await fetchSettings();
            
            // Show section-specific success message
            let successMsg = 'Settings updated successfully!';
            if (sectionName === 'general') {
                successMsg = 'Pump information updated successfully!';
            } else if (sectionName === 'fuels') {
                successMsg = 'Fuel settings updated successfully!';
            } else if (sectionName === 'expenseCategories') {
                successMsg = 'Expense categories updated successfully!';
            } else if (sectionName === 'creditTypes') {
                successMsg = 'Credit types updated successfully!';
            } else if (sectionName === 'cashModes') {
                successMsg = 'Cash modes updated successfully!';
            }
            
            showSuccessBanner(successMsg);
        } catch (error) {
            console.error('Error saving settings:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to save settings';
            setError(`Error saving settings: ${errorMsg}`);
        }
    };

    const renderView = () => {
        if (!settings) return null;
        switch (view) {
            case 'shift-entry':
                return <ShiftEntryView settings={settings} showSuccessBanner={showSuccessBanner} />;
            case 'settings':
                return <SettingsView initialSettings={settings} onSave={handleSaveSettings} showSuccessBanner={showSuccessBanner} />;
            case 'fuel-management':
                return <FuelManagementView showSuccessBanner={showSuccessBanner} />;
            case 'history':
                return <HistoricalDataView />;
            case 'dashboard':
                return <DashboardView />;
            default:
                return <div className="p-6 card">View not found</div>;
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto p-2 md:p-4">
                <div className="p-6 card text-center">
                    <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
                    <h2 className="text-lg font-semibold text-gray-700">Loading Application Settings...</h2>
                    <p className="text-gray-500 mt-2">Please wait while we fetch the configuration from the server.</p>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="max-w-7xl mx-auto p-2 md:p-4">
                <div className="p-6 card text-center">
                    <div className="p-4 mb-4 bg-red-100 text-red-700 rounded card">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {error}
                    </div>
                    <button 
                        onClick={fetchSettings}
                        className="btn btn-primary mr-2"
                    >
                        <i className="fas fa-refresh mr-2"></i>
                        Retry Connection
                    </button>
                    <button 
                        onClick={clearAllSettings}
                        className="btn btn-secondary"
                    >
                        <i className="fas fa-trash mr-2"></i>
                        Clear All Settings
                    </button>
                    <div className="mt-4 text-sm text-gray-600">
                        <p>Make sure the backend server is running and the database is accessible.</p>
                        <p>You can run <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code> in the server directory to start the backend.</p>
                        <p className="mt-2 text-xs text-gray-500">If you're seeing JSON parsing errors, use "Clear All Settings" to reset the database.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-2 md:p-4">
            {error && (
                <div className="p-4 mb-4 bg-yellow-100 text-yellow-700 rounded card">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                </div>
            )}
            {successMessage && <SuccessBanner message={successMessage} />}
            <Header pumpName={settings.general?.pumpName || 'Petrol Pump Manager'} />
            <Navigation currentView={view} setView={setView} />
            <main>{renderView()}</main>
            <ConfirmationModal />
        </div>
    );
}

export default App;

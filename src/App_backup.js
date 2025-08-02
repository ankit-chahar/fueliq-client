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

const SuccessBanner = ({ message }) => {
    const [show, setShow] = useState(false);
    
    useEffect(() => {
        if (message) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (!show || !message) return null;

    return (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white py-4 px-6 rounded-lg shadow-lg flex items-center justify-center transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
            <i className="fas fa-check-circle mr-3 text-xl"></i>
            <span className="text-lg font-medium">{message}</span>
        </div>
    );
};

const ConfirmationModal = () => (
    <div id="confirmation-modal" className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full hidden items-center justify-center z-50">
        <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100" id="modal-icon-bg">
                    <i className="fas fa-info-circle text-blue-600" id="modal-icon"></i>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2" id="modal-title">Confirm Action</h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500" id="modal-text">Are you sure?</p>
                    <ul id="modal-changelog" className="text-sm text-left text-gray-600 mt-4 list-disc list-inside space-y-1"></ul>
                </div>
                <div className="items-center px-4 py-3 gap-2 flex justify-center">
                    <button id="modal-cancel-btn" className="btn btn-secondary">Cancel</button>
                    <button id="modal-confirm-btn" className="btn btn-primary">Confirm</button>
                </div>
            </div>
        </div>
    </div>
);


const Header = ({ pumpName }) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
    };

    const closeUserMenu = () => {
        setIsUserMenuOpen(false);
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('#user-menu-container')) {
                closeUserMenu();
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    return (
        <header className="bg-white border-b border-gray-200 w-full mb-4">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left Section: Logo & Navigation */}
                    <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0 flex items-center space-x-3">
                            <img 
                                src="https://i.ibb.co/L9qS211/Fueli-Q.jpg" 
                                alt="FueliQ Logo" 
                                className="h-9 w-9 object-contain"
                            />
                            <span className="text-xl font-poppins font-semibold text-gray-800">
                                FueliQ
                            </span>
                        </div>
                        {/* Search Bar */}
                        <div className="hidden md:block">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="block w-full bg-gray-100 border border-gray-200 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Section: Pump Name & User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Pump Name Display */}
                        <div className="hidden sm:flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-100">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm font-medium text-gray-700">Station:</span>
                                <span className="text-sm font-semibold text-blue-800 font-poppins">
                                    {pumpName || 'Chahar Filling Station'}
                                </span>
                            </div>
                        </div>

                        {/* Mobile Pump Name - Simplified */}
                        <div className="sm:hidden flex items-center bg-blue-50 px-3 py-1.5 rounded-md border border-blue-100">
                            <div className="flex items-center space-x-1.5">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-semibold text-blue-800 font-poppins truncate max-w-32">
                                    {pumpName || 'Chahar Filling Station'}
                                </span>
                            </div>
                        </div>
                        
                        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-ring-blue">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>

                        <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-ring-blue relative">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                        </button>

                        {/* Profile dropdown */}
                        <div className="relative" id="user-menu-container">
                            <div>
                                <button 
                                    type="button" 
                                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
                                    onClick={toggleUserMenu}
                                    aria-expanded={isUserMenuOpen}
                                    aria-haspopup="true"
                                >
                                    <span className="sr-only">Open user menu</span>
                                    <img 
                                        className="h-9 w-9 rounded-full object-cover" 
                                        src="https://placehold.co/100x100/E2E8F0/4A5568?text=A" 
                                        alt="User avatar"
                                    />
                                </button>
                            </div>
                            {/* Dropdown menu */}
                            <div 
                                className={`origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none ${isUserMenuOpen ? '' : 'hidden'}`}
                                role="menu" 
                                aria-orientation="vertical" 
                                tabIndex="-1"
                            >
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="text-sm font-semibold text-gray-800">Admin User</p>
                                    <p className="text-sm text-gray-500 truncate">admin.user@fueliq.com</p>
                                </div>
                                <div className="py-1" role="none">
                                    <button className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">
                                        <span>{pumpName || 'Chahar Filling Station'}</span>
                                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">
                                        Switch Station
                                    </button>
                                    <button className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">
                                        Settings
                                    </button>
                                </div>
                                <div className="py-1 border-t border-gray-200" role="none">
                                    <button className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

const Navigation = ({ currentView, setView }) => {
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
        { id: 'shift-entry', label: 'Shift Entry', icon: 'fa-clipboard-list' },
        { id: 'fuel-management', label: 'Fuel Management', icon: 'fa-gas-pump' },
        { id: 'history', label: 'Historical Data', icon: 'fa-history' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog' },
    ];
    
    return (
        <div className="mb-4 overflow-x-auto pb-2">
            <div className="flex space-x-2">
                {tabs.map(tab => (
                    <button 
                        key={tab.id} 
                        onClick={() => setView(tab.id)} 
                        className={`tab ${currentView === tab.id ? 'tab-active' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <i className={`fas ${tab.icon} mr-2`}></i>{tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

// --- View Components ---

const ShiftEntryView = ({ settings, showSuccessBanner }) => {
    const [shiftData, setShiftData] = useState({
        shiftDate: new Date().toISOString().split('T')[0],
        shiftType: 'morning',
        fuelEntries: [],
        creditSales: [],
        expenses: [],
        cashCollections: []
    });
    const [isLoading, setIsLoading] = useState(false);
    const [existingShiftId, setExistingShiftId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});

    const fuelTypes = settings.fuels || [];

    // Date validation helper
    const isValidShiftDate = (date) => {
        const today = new Date().toISOString().split('T')[0];
        return date <= today;
    };

    const handleShiftDateChange = (e) => {
        const selectedDate = e.target.value;
        if (isValidShiftDate(selectedDate)) {
            setShiftData(prev => ({ ...prev, shiftDate: selectedDate }));
            // Clear future date error if it exists
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.futureDate;
                return newErrors;
            });
        } else {
            // Set validation error for future date
            setValidationErrors(prev => ({
                ...prev,
                futureDate: true
            }));
        }
    };

    // Validation utility functions
    const isValidNonNegativeNumber = (value) => {
        if (value === '' || value === null || value === undefined) return true; // Allow empty
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
    };

    const isClosingGreaterThanOpening = (opening, closing) => {
        if (opening === '' || closing === '' || opening === null || closing === null) return true;
        const openingNum = parseFloat(opening);
        const closingNum = parseFloat(closing);
        if (isNaN(openingNum) || isNaN(closingNum)) return true;
        return closingNum >= openingNum;
    };

    const getInputClassName = (baseClass, isValid) => {
        return `${baseClass} ${isValid ? '' : 'border-red-500 bg-red-50'}`;
    };

    // Check if shift exists for current date and type
    const checkExistingShift = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/shifts/check/${shiftData.shiftDate}/${shiftData.shiftType}`);
            if (response.data.exists) {
                setExistingShiftId(response.data.shiftId);
            } else {
                setExistingShiftId(null);
            }
        } catch (error) {
            console.error('Error checking existing shift:', error);
            setExistingShiftId(null);
        }
    };

    // Initialize fuel entries based on settings
    useEffect(() => {
        if (fuelTypes.length > 0 && shiftData.fuelEntries.length === 0) {
            const initialFuelEntries = fuelTypes.map(fuel => ({
                id: generateId(),
                fuelType: fuel.id,
                fuelName: fuel.name,
                openingReadings: Array(fuel.nozzles).fill(''),
                closingReadings: Array(fuel.nozzles).fill(''),
                testingLitres: '0',
                unitPrice: fuel.current_price || fuel.price || 0,
                digitalPayments: {
                    paytm: '0',
                    phonepe: '0',
                    other: '0'
                }
            }));

            setShiftData(prev => ({
                ...prev,
                fuelEntries: initialFuelEntries
            }));
        }
    }, [fuelTypes, shiftData.fuelEntries.length]);

    // Update fuel prices when fuel types change (even if entries already exist)
    useEffect(() => {
        if (fuelTypes.length > 0 && shiftData.fuelEntries.length > 0) {
            setShiftData(prev => ({
                ...prev,
                fuelEntries: prev.fuelEntries.map(entry => {
                    const updatedFuel = fuelTypes.find(f => f.id === entry.fuelType);
                    const fuelPrice = updatedFuel?.current_price || updatedFuel?.price || 0;
                    if (updatedFuel && fuelPrice !== entry.unitPrice) {
                        return { ...entry, unitPrice: fuelPrice };
                    }
                    return entry;
                })
            }));
        }
    }, [fuelTypes]);

    // Function to manually refresh fuel prices from database
    const refreshFuelPrices = async () => {
        try {
            setIsLoading(true);
            // Fetch current fuel prices from new API
            const response = await axios.get(`${API_URL}/api/fuel-prices/current`);
            const currentPrices = response.data;
            
            if (currentPrices.length > 0 && shiftData.fuelEntries.length > 0) {
                setShiftData(prev => ({
                    ...prev,
                    fuelEntries: prev.fuelEntries.map(entry => {
                        const updatedFuel = currentPrices.find(f => f.id === entry.fuelType);
                        if (updatedFuel) {
                            return { ...entry, unitPrice: updatedFuel.current_price };
                        }
                        return entry;
                    })
                }));
                showSuccessBanner('Fuel prices refreshed from database!');
            } else {
                // Fallback to settings-based prices
                if (fuelTypes.length > 0 && shiftData.fuelEntries.length > 0) {
                    setShiftData(prev => ({
                        ...prev,
                        fuelEntries: prev.fuelEntries.map(entry => {
                            const updatedFuel = fuelTypes.find(f => f.id === entry.fuelType);
                            if (updatedFuel) {
                                return { ...entry, unitPrice: updatedFuel.current_price || updatedFuel.price || 0 };
                            }
                            return entry;
                        })
                    }));
                    showSuccessBanner('Fuel prices refreshed from settings!');
                }
            }
        } catch (error) {
            console.error('Error refreshing fuel prices:', error);
            // Fallback to settings-based prices
            if (fuelTypes.length > 0 && shiftData.fuelEntries.length > 0) {
                setShiftData(prev => ({
                    ...prev,
                    fuelEntries: prev.fuelEntries.map(entry => {
                        const updatedFuel = fuelTypes.find(f => f.id === entry.fuelType);
                        if (updatedFuel) {
                            return { ...entry, unitPrice: updatedFuel.current_price || updatedFuel.price || 0 };
                        }
                        return entry;
                    })
                }));
                showSuccessBanner('Fuel prices refreshed from settings (API unavailable)!');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Check for existing shift when date or type changes
    useEffect(() => {
        checkExistingShift();
    }, [shiftData.shiftDate, shiftData.shiftType]);

    const updateFuelEntry = (id, field, value, index = null) => {
        setShiftData(prev => ({
            ...prev,
            fuelEntries: prev.fuelEntries.map(entry => {
                if (entry.id === id) {
                    if (field === 'openingReadings' || field === 'closingReadings') {
                        const newReadings = [...entry[field]];
                        newReadings[index] = value;
                        return { ...entry, [field]: newReadings };
                    } else if (field.startsWith('digitalPayments.')) {
                        const paymentType = field.split('.')[1];
                        return {
                            ...entry,
                            digitalPayments: {
                                ...entry.digitalPayments,
                                [paymentType]: value
                            }
                        };
                    } else {
                        return { ...entry, [field]: value };
                    }
                }
                return entry;
            })
        }));
    };

    const addDynamicEntry = (type) => {
        const newEntry = {
            id: generateId(),
            partyName: '',
            category: '',
            amount: '',
            remarks: ''
        };

        if (type === 'credit') {
            newEntry.category = settings.creditTypes?.[0]?.name || '';
        } else if (type === 'expense') {
            newEntry.category = settings.expenseCategories?.[0]?.name || '';
        } else if (type === 'cash') {
            newEntry.category = settings.cashModes?.[0]?.name || '';
        }

        // Map the type to the correct property name
        const propertyName = type === 'cash' ? 'cashCollections' : 
                           type === 'credit' ? 'creditSales' : 
                           type === 'expense' ? 'expenses' : type;

        setShiftData(prev => ({
            ...prev,
            [propertyName]: [...(prev[propertyName] || []), newEntry]
        }));
    };

    const removeDynamicEntry = (type, id) => {
        // Map the type to the correct property name
        const propertyName = type === 'cash' ? 'cashCollections' : 
                           type === 'credit' ? 'creditSales' : 
                           type === 'expense' ? 'expenses' : type;

        setShiftData(prev => ({
            ...prev,
            [propertyName]: prev[propertyName].filter(entry => entry.id !== id)
        }));
    };

    const updateDynamicEntry = (type, id, field, value) => {
        // Map the type to the correct property name
        const propertyName = type === 'cash' ? 'cashCollections' : 
                           type === 'credit' ? 'creditSales' : 
                           type === 'expense' ? 'expenses' : type;

        setShiftData(prev => ({
            ...prev,
            [propertyName]: prev[propertyName].map(entry => 
                entry.id === id ? { ...entry, [field]: value } : entry
            )
        }));
    };

    const calculateTotals = () => {
        let totalFuelSale = 0;
        let totalDigitalPayments = 0;
        let totalCreditSales = 0;
        let creditReceipts = 0;
        let totalExpenses = 0;

        // Calculate fuel sales and digital payments
        shiftData.fuelEntries.forEach(entry => {
            let totalLitres = 0;
            entry.openingReadings.forEach((opening, index) => {
                const closing = parseFloat(entry.closingReadings[index]) || 0;
                const openingVal = parseFloat(opening) || 0;
                if (closing > openingVal) {
                    totalLitres += closing - openingVal;
                }
            });
            const testingLitres = parseFloat(entry.testingLitres) || 0;
            const saleLitres = totalLitres - testingLitres;
            const saleAmount = saleLitres * parseFloat(entry.unitPrice);
            totalFuelSale += saleAmount;

            // Digital payments
            totalDigitalPayments += parseFloat(entry.digitalPayments.paytm) || 0;
            totalDigitalPayments += parseFloat(entry.digitalPayments.phonepe) || 0;
            totalDigitalPayments += parseFloat(entry.digitalPayments.other) || 0;
        });

        // Calculate cash from fuel (fuel sales minus digital payments)
        const cashFromFuel = totalFuelSale - totalDigitalPayments;

        // Calculate credit sales
        shiftData.creditSales?.forEach(sale => {
            totalCreditSales += parseFloat(sale.amount) || 0;
        });

        // Calculate credit receipts (only cash mode collections)
        let totalDigitalFromCollections = 0;
        shiftData.cashCollections?.forEach(collection => {
            const amount = parseFloat(collection.amount) || 0;
            // Only include collections where the category/mode is "cash"
            if (collection.category && collection.category.toLowerCase() === 'cash') {
                creditReceipts += amount;
            } else {
                // All non-cash collections are considered digital payments
                totalDigitalFromCollections += amount;
            }
        });

        // Total digital payments includes both fuel digital payments and digital collections
        const totalDigitalPaymentsIncludingCollections = totalDigitalPayments + totalDigitalFromCollections;

        // Calculate expenses
        shiftData.expenses?.forEach(expense => {
            totalExpenses += parseFloat(expense.amount) || 0;
        });

        // New formula: cash from fuels - all credits - all expenses + cash collection (only cash type)
        const totalCashInHand = cashFromFuel - totalCreditSales - totalExpenses + creditReceipts;

        return {
            totalFuelSale,
            totalDigitalPayments: totalDigitalPaymentsIncludingCollections,
            cashFromFuel,
            totalCreditSales,
            creditReceipts,
            totalExpenses,
            totalCashInHand
        };
    };

    const validateShiftData = () => {
        const errors = [];
        const newValidationErrors = {};

        // Validate shift date - cannot be in future
        if (!isValidShiftDate(shiftData.shiftDate)) {
            errors.push('Cannot create shift for future dates');
            newValidationErrors.futureDate = true;
        }

        // Check if fuel entries have valid readings
        shiftData.fuelEntries.forEach((entry, index) => {
            let hasReadings = false;
            entry.openingReadings.forEach((opening, nozzleIndex) => {
                const closing = entry.closingReadings[nozzleIndex];
                if (opening !== '' || closing !== '') {
                    hasReadings = true;
                }

                // Validate non-negative numbers
                if (opening !== '' && !isValidNonNegativeNumber(opening)) {
                    errors.push(`${entry.fuelName} Nozzle ${nozzleIndex + 1}: Opening reading must be non-negative`);
                    newValidationErrors[`fuel_${entry.id}_opening_${nozzleIndex}`] = true;
                }
                if (closing !== '' && !isValidNonNegativeNumber(closing)) {
                    errors.push(`${entry.fuelName} Nozzle ${nozzleIndex + 1}: Closing reading must be non-negative`);
                    newValidationErrors[`fuel_${entry.id}_closing_${nozzleIndex}`] = true;
                }

                // Validate closing >= opening
                if (opening !== '' && closing !== '' && !isClosingGreaterThanOpening(opening, closing)) {
                    errors.push(`${entry.fuelName} Nozzle ${nozzleIndex + 1}: Closing reading must be greater than or equal to opening reading`);
                    newValidationErrors[`fuel_${entry.id}_closing_${nozzleIndex}`] = true;
                }
            });

            if (!hasReadings) {
                errors.push(`${entry.fuelName}: Please enter at least one opening and closing reading`);
            }

            // Validate testing litres
            if (entry.testingLitres !== '' && !isValidNonNegativeNumber(entry.testingLitres)) {
                errors.push(`${entry.fuelName}: Testing litres must be non-negative`);
                newValidationErrors[`fuel_${entry.id}_testing`] = true;
            }

            // Validate digital payments
            if (entry.digitalPayments.paytm !== '' && !isValidNonNegativeNumber(entry.digitalPayments.paytm)) {
                errors.push(`${entry.fuelName}: Paytm amount must be non-negative`);
                newValidationErrors[`fuel_${entry.id}_paytm`] = true;
            }
            if (entry.digitalPayments.phonepe !== '' && !isValidNonNegativeNumber(entry.digitalPayments.phonepe)) {
                errors.push(`${entry.fuelName}: PhonePe amount must be non-negative`);
                newValidationErrors[`fuel_${entry.id}_phonepe`] = true;
            }
            if (entry.digitalPayments.other !== '' && !isValidNonNegativeNumber(entry.digitalPayments.other)) {
                errors.push(`${entry.fuelName}: Other digital amount must be non-negative`);
                newValidationErrors[`fuel_${entry.id}_other`] = true;
            }
        });

        // Validate credit sales amounts
        shiftData.creditSales?.forEach((sale, index) => {
            if (sale.amount !== '' && !isValidNonNegativeNumber(sale.amount)) {
                errors.push(`Credit Sale ${index + 1}: Amount must be non-negative`);
                newValidationErrors[`credit_${sale.id}_amount`] = true;
            }
        });

        // Validate expense amounts
        shiftData.expenses?.forEach((expense, index) => {
            if (expense.amount !== '' && !isValidNonNegativeNumber(expense.amount)) {
                errors.push(`Expense ${index + 1}: Amount must be non-negative`);
                newValidationErrors[`expense_${expense.id}_amount`] = true;
            }
        });

        // Validate cash collection amounts
        shiftData.cashCollections?.forEach((collection, index) => {
            if (collection.amount !== '' && !isValidNonNegativeNumber(collection.amount)) {
                errors.push(`Cash Collection ${index + 1}: Amount must be non-negative`);
                newValidationErrors[`cash_${collection.id}_amount`] = true;
            }
        });

        setValidationErrors(newValidationErrors);
        return errors;
    };

    const submitShift = async () => {
        if (isSubmitting) return;

        // Validate data
        const validationErrors = validateShiftData();
        if (validationErrors.length > 0) {
            alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
            return;
        }

        if (existingShiftId) {
            const confirmOverwrite = window.confirm(
                `A shift already exists for ${shiftData.shiftDate} (${shiftData.shiftType}). ` +
                'This will overwrite the existing data. Are you sure you want to continue?'
            );
            if (!confirmOverwrite) return;
        }

        setIsSubmitting(true);

        try {
            const totals = calculateTotals();

            // Transform fuel entries for backend
            const transformedFuelEntries = [];
            const transformedDigitalPayments = [];

            shiftData.fuelEntries.forEach(entry => {
                entry.openingReadings.forEach((opening, nozzleIndex) => {
                    const closing = entry.closingReadings[nozzleIndex];
                    if (opening !== '' || closing !== '') {
                        transformedFuelEntries.push({
                            fuelType: entry.fuelType,
                            nozzleNumber: nozzleIndex + 1,
                            openingReading: parseFloat(opening) || 0,
                            closingReading: parseFloat(closing) || 0,
                            testingLitres: parseFloat(entry.testingLitres) || 0,
                            unitPrice: parseFloat(entry.unitPrice) || 0
                        });
                    }
                });

                // Add digital payments if any
                const paytmAmount = parseFloat(entry.digitalPayments.paytm) || 0;
                const phonepeAmount = parseFloat(entry.digitalPayments.phonepe) || 0;
                const otherAmount = parseFloat(entry.digitalPayments.other) || 0;

                if (paytmAmount > 0 || phonepeAmount > 0 || otherAmount > 0) {
                    transformedDigitalPayments.push({
                        fuelType: entry.fuelType,
                        paytmAmount,
                        phonepeAmount,
                        otherDigitalAmount: otherAmount
                    });
                }
            });

            // Transform other entries
            const transformedCreditSales = shiftData.creditSales
                .filter(sale => sale.partyName && sale.amount)
                .map(sale => ({
                    partyName: sale.partyName,
                    fuelType: sale.category,
                    amount: parseFloat(sale.amount) || 0,
                    remarks: sale.remarks || ''
                }));

            const transformedExpenses = shiftData.expenses
                .filter(expense => expense.partyName && expense.amount)
                .map(expense => ({
                    payee: expense.partyName,
                    category: expense.category,
                    amount: parseFloat(expense.amount) || 0,
                    remarks: expense.remarks || ''
                }));

            const transformedCashCollections = shiftData.cashCollections
                .filter(collection => collection.partyName && collection.amount)
                .map(collection => ({
                    source: collection.partyName,
                    mode: collection.category,
                    amount: parseFloat(collection.amount) || 0,
                    remarks: collection.remarks || ''
                }));

            const payload = {
                shiftDate: shiftData.shiftDate,
                shiftType: shiftData.shiftType,
                fuelEntries: transformedFuelEntries,
                digitalPayments: transformedDigitalPayments,
                creditSales: transformedCreditSales,
                expenses: transformedExpenses,
                cashCollections: transformedCashCollections,
                totals
            };

            console.log('Submitting shift data:', payload);

            const response = await axios.post(`${API_URL}/api/shifts`, payload);
            
            showSuccessBanner(
                `Shift data saved successfully! Shift ID: ${response.data.shiftId}. ` +
                `Total Cash in Hand: ${formatMoney(totals.totalCashInHand)}`
            );

            // Reset form for new shift
            setShiftData({
                shiftDate: new Date().toISOString().split('T')[0],
                shiftType: 'morning',
                fuelEntries: [],
                creditSales: [],
                expenses: [],
                cashCollections: []
            });

            setExistingShiftId(response.data.shiftId);

        } catch (error) {
            console.error('Error submitting shift:', error);
            
            let errorMessage = 'Failed to save shift data. ';
            if (error.response?.status === 409) {
                errorMessage += 'A shift for this date and type already exists.';
            } else if (error.response?.status === 500) {
                errorMessage += 'Server error occurred. Please check the database connection.';
            } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
                errorMessage += 'Cannot connect to the server. Please ensure the backend is running.';
            } else {
                errorMessage += error.response?.data?.message || error.message || 'Please try again.';
            }
            
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = calculateTotals();

    return (
        <div>
            {/* Shift Header */}
            <div className="card p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="shift-date" className="block text-sm font-medium text-gray-700">Shift Date</label>
                        <input 
                            type="date" 
                            id="shift-date"
                            className={getInputClassName('input-field mt-1 max-w-xs bg-white', !validationErrors.futureDate)}
                            value={shiftData.shiftDate}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={handleShiftDateChange}
                        />
                        {validationErrors.futureDate && (
                            <p className="text-red-500 text-sm mt-1">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                Cannot create shift for future dates
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="shift-select" className="block text-sm font-medium text-gray-700">Shift Type</label>
                        <select 
                            id="shift-select" 
                            className="input-field mt-1 max-w-xs bg-white"
                            value={shiftData.shiftType}
                            onChange={(e) => setShiftData(prev => ({ ...prev, shiftType: e.target.value }))}
                        >
                            <option value="morning">Morning (6AM - 6PM)</option>
                            <option value="night">Night (6PM - 6AM)</option>
                        </select>
                    </div>
                </div>
                {existingShiftId && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded-md">
                        <div className="flex">
                            <i className="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
                            <div>
                                <p className="text-sm font-medium text-yellow-800">Shift Already Exists</p>
                                <p className="text-sm text-yellow-700 mt-1">
                                    A shift for {shiftData.shiftDate} ({shiftData.shiftType}) already exists (ID: {existingShiftId}). 
                                    Submitting will overwrite the existing data.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Fuel Sales Card */}
                    <div className="card p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-700">Fuel Sales (MS & HSD)</h2>
                            {fuelTypes.length > 0 && shiftData.fuelEntries.length > 0 && (
                                <button 
                                    onClick={refreshFuelPrices}
                                    className="btn btn-secondary text-sm px-3 py-1"
                                    title="Refresh fuel prices from database"
                                >
                                    <i className="fas fa-sync-alt mr-1"></i>
                                    Refresh Prices
                                </button>
                            )}
                        </div>
                        {fuelTypes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fas fa-gas-pump text-4xl mb-4 text-gray-300"></i>
                                <p className="text-lg font-medium">No Fuel Types Configured</p>
                                <p className="text-sm mt-2">Please go to Settings → Fuel & Nozzle Management to add fuel types before creating a shift entry.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {shiftData.fuelEntries.map(entry => {
                                const fuel = fuelTypes.find(f => f.id === entry.fuelType);
                                let totalLitres = 0;
                                entry.openingReadings.forEach((opening, index) => {
                                    const closing = parseFloat(entry.closingReadings[index]) || 0;
                                    const openingVal = parseFloat(opening) || 0;
                                    if (closing > openingVal) {
                                        totalLitres += closing - openingVal;
                                    }
                                });
                                const testingLitres = parseFloat(entry.testingLitres) || 0;
                                const saleLitres = totalLitres - testingLitres;
                                const saleAmount = saleLitres * parseFloat(entry.unitPrice);

                                return (
                                    <div key={entry.id} className="p-4 border border-gray-200 rounded-lg">
                                        <h3 className="text-base font-semibold text-indigo-700 mb-3">{entry.fuelName}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                {entry.openingReadings.map((opening, index) => {
                                                    const openingValid = isValidNonNegativeNumber(opening);
                                                    const closingValid = isValidNonNegativeNumber(entry.closingReadings[index]) && 
                                                                         isClosingGreaterThanOpening(opening, entry.closingReadings[index]);
                                                    return (
                                                        <div key={index} className="grid grid-cols-2 gap-x-3 gap-y-1">
                                                            <label className="text-sm text-gray-600 col-span-2">Nozzle {index + 1}</label>
                                                            <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                className={getInputClassName('input-field', openingValid && !validationErrors[`fuel_${entry.id}_opening_${index}`])}
                                                                placeholder="Opening"
                                                                value={opening}
                                                                onChange={(e) => updateFuelEntry(entry.id, 'openingReadings', e.target.value, index)}
                                                            />
                                                            <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                className={getInputClassName('input-field', closingValid && !validationErrors[`fuel_${entry.id}_closing_${index}`])}
                                                                placeholder="Closing"
                                                                value={entry.closingReadings[index]}
                                                                onChange={(e) => updateFuelEntry(entry.id, 'closingReadings', e.target.value, index)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-sm text-gray-600">Testing (Litres)</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        value={entry.testingLitres} 
                                                        className={getInputClassName('input-field', 
                                                            isValidNonNegativeNumber(entry.testingLitres) && !validationErrors[`fuel_${entry.id}_testing`])}
                                                        onChange={(e) => updateFuelEntry(entry.id, 'testingLitres', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm text-gray-600">Unit Price (₹) - From Database</label>
                                                    <div className="input-field bg-gray-50 cursor-not-allowed flex items-center">
                                                        <span className="text-gray-700 font-medium">₹{(parseFloat(entry.unitPrice) || 0).toFixed(2)}</span>
                                                        <i className="fas fa-lock text-gray-400 ml-2 text-xs"></i>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">Price is automatically loaded from settings and cannot be modified here.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <hr className="my-4" />
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                            <div className="p-2 bg-gray-50 rounded">
                                                <label className="block font-medium text-gray-500">Sale (Ltr)</label>
                                                <p className="text-base font-bold text-gray-800 mt-1">{formatLitre(saleLitres)}</p>
                                            </div>
                                            <div className="p-2 bg-indigo-50 rounded">
                                                <label className="block font-medium text-indigo-500">Total Sale (₹)</label>
                                                <p className="text-base font-bold text-indigo-800 mt-1">{formatMoney(saleAmount)}</p>
                                            </div>
                                            <div className="p-2 bg-green-50 rounded">
                                                <label className="block font-medium text-green-500">Cash (₹)</label>
                                                <p className="text-base font-bold text-green-800 mt-1">
                                                    {formatMoney(saleAmount - (parseFloat(entry.digitalPayments.paytm) || 0) - (parseFloat(entry.digitalPayments.phonepe) || 0) - (parseFloat(entry.digitalPayments.other) || 0))}
                                                </p>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-semibold text-gray-600 mt-4 mb-2">Digital Payments</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                            <div>
                                                <label className="text-sm text-gray-600">Paytm (₹)</label>
                                                <input 
                                                    type="number" 
                                                    value={entry.digitalPayments.paytm} 
                                                    className={getInputClassName('input-field', 
                                                        isValidNonNegativeNumber(entry.digitalPayments.paytm) && !validationErrors[`fuel_${entry.id}_paytm`])}
                                                    onChange={(e) => updateFuelEntry(entry.id, 'digitalPayments.paytm', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">PhonePe (₹)</label>
                                                <input 
                                                    type="number" 
                                                    value={entry.digitalPayments.phonepe} 
                                                    className={getInputClassName('input-field', 
                                                        isValidNonNegativeNumber(entry.digitalPayments.phonepe) && !validationErrors[`fuel_${entry.id}_phonepe`])}
                                                    onChange={(e) => updateFuelEntry(entry.id, 'digitalPayments.phonepe', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">DTPlus/Other (₹)</label>
                                                <input 
                                                    type="number" 
                                                    value={entry.digitalPayments.other} 
                                                    className={getInputClassName('input-field', 
                                                        isValidNonNegativeNumber(entry.digitalPayments.other) && !validationErrors[`fuel_${entry.id}_other`])}
                                                    onChange={(e) => updateFuelEntry(entry.id, 'digitalPayments.other', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        )}
                    </div>

                    {/* Credit Sales Card */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Credit Sales</h2>
                        <div className="space-y-3">
                            {shiftData.creditSales.map(sale => (
                                <div key={sale.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                                    <div className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-12 md:col-span-4">
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                placeholder="Party Name"
                                                value={sale.partyName}
                                                onChange={(e) => updateDynamicEntry('credit', sale.id, 'partyName', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <select 
                                                className="input-field bg-white"
                                                value={sale.category}
                                                onChange={(e) => updateDynamicEntry('credit', sale.id, 'category', e.target.value)}
                                            >
                                                {(settings.creditTypes || []).length === 0 && (
                                                    <option value="">No credit types configured</option>
                                                )}
                                                {(settings.creditTypes || []).map(type => (
                                                    <option key={type.id || type.name || type} value={type.name || type}>{type.name || type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-8 md:col-span-3">
                                            <input 
                                                type="number" 
                                                className={getInputClassName('input-field', 
                                                    isValidNonNegativeNumber(sale.amount) && !validationErrors[`credit_${sale.id}_amount`])}
                                                placeholder="₹ Amount"
                                                value={sale.amount}
                                                onChange={(e) => updateDynamicEntry('credit', sale.id, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <button 
                                                className="btn btn-danger w-full"
                                                onClick={() => removeDynamicEntry('credit', sale.id)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-12">
                                        <input 
                                            type="text" 
                                            className="input-field w-full" 
                                            placeholder="Remarks (optional)"
                                            value={sale.remarks || ''}
                                            onChange={(e) => updateDynamicEntry('credit', sale.id, 'remarks', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => addDynamicEntry('credit')} 
                            className="btn btn-secondary w-full mt-3"
                        >
                            <i className="fas fa-plus mr-2"></i>Add Credit Sale
                        </button>
                    </div>

                    {/* Credit Collections Card */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Credit Collection (Cash) (+)</h2>
                        <div className="space-y-3">
                            {shiftData.cashCollections.map(collection => (
                                <div key={collection.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                                    <div className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-12 md:col-span-4">
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                placeholder="Received From"
                                                value={collection.partyName}
                                                onChange={(e) => updateDynamicEntry('cash', collection.id, 'partyName', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <select 
                                                className="input-field bg-white"
                                                value={collection.category}
                                                onChange={(e) => updateDynamicEntry('cash', collection.id, 'category', e.target.value)}
                                            >
                                                {(settings.cashModes || []).length === 0 && (
                                                    <option value="">No cash modes configured</option>
                                                )}
                                                {(settings.cashModes || []).map(mode => (
                                                    <option key={mode.id || mode.name || mode} value={mode.name || mode}>{mode.name || mode}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-8 md:col-span-3">
                                            <input 
                                                type="number" 
                                                className={getInputClassName('input-field', 
                                                    isValidNonNegativeNumber(collection.amount) && !validationErrors[`cash_${collection.id}_amount`])}
                                                placeholder="₹ Amount"
                                                value={collection.amount}
                                                onChange={(e) => updateDynamicEntry('cash', collection.id, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <button 
                                                className="btn btn-danger w-full"
                                                onClick={() => removeDynamicEntry('cash', collection.id)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-12">
                                        <input 
                                            type="text" 
                                            className="input-field w-full" 
                                            placeholder="Remarks (optional)"
                                            value={collection.remarks || ''}
                                            onChange={(e) => updateDynamicEntry('cash', collection.id, 'remarks', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => addDynamicEntry('cash')} 
                            className="btn btn-secondary w-full mt-3"
                        >
                            <i className="fas fa-plus mr-2"></i>Add Credit Collection
                        </button>
                    </div>

                    {/* Expenses Card */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Expenses (Cash) (-)</h2>
                        <div className="space-y-3">
                            {shiftData.expenses.map(expense => (
                                <div key={expense.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                                    <div className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-12 md:col-span-4">
                                            <input 
                                                type="text" 
                                                className="input-field" 
                                                placeholder="Payee"
                                                value={expense.partyName}
                                                onChange={(e) => updateDynamicEntry('expense', expense.id, 'partyName', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <select 
                                                className="input-field bg-white"
                                                value={expense.category}
                                                onChange={(e) => updateDynamicEntry('expense', expense.id, 'category', e.target.value)}
                                            >
                                                {(settings.expenseCategories || []).length === 0 && (
                                                    <option value="">No expense categories configured</option>
                                                )}
                                                {(settings.expenseCategories || []).map(category => (
                                                    <option key={category.id || category.name || category} value={category.name || category}>{category.name || category}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-8 md:col-span-3">
                                            <input 
                                                type="number" 
                                                className={getInputClassName('input-field', 
                                                    isValidNonNegativeNumber(expense.amount) && !validationErrors[`expense_${expense.id}_amount`])}
                                                placeholder="₹ Amount"
                                                value={expense.amount}
                                                onChange={(e) => updateDynamicEntry('expense', expense.id, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <button 
                                                className="btn btn-danger w-full"
                                                onClick={() => removeDynamicEntry('expense', expense.id)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-12">
                                        <input 
                                            type="text" 
                                            className="input-field w-full" 
                                            placeholder="Remarks (optional)"
                                            value={expense.remarks || ''}
                                            onChange={(e) => updateDynamicEntry('expense', expense.id, 'remarks', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => addDynamicEntry('expense')} 
                            className="btn btn-secondary w-full mt-3"
                        >
                            <i className="fas fa-plus mr-2"></i>Add Expense
                        </button>
                    </div>
                </div>

                {/* Right Summary Column */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 space-y-6">
                        <div className="card p-4">
                            <h2 className="text-lg font-bold mb-4 text-gray-700">Shift Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between font-semibold">
                                    <span>(+) Cash from Fuel Sales:</span> 
                                    <span className="text-green-600">{formatMoney(totals.cashFromFuel)}</span>
                                </div>
                                <div className="text-xs text-gray-500 mb-1">
                                    (Fuel Sales - Digital Payments)
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>(-) Total Credit Sales:</span> 
                                    <span className="text-red-600">{formatMoney(totals.totalCreditSales)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>(+) Credit Collection (Cash):</span> 
                                    <span className="text-green-600">{formatMoney(totals.creditReceipts)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>(-) Expenses (Cash):</span> 
                                    <span className="text-red-600">{formatMoney(totals.totalExpenses)}</span>
                                </div>
                                <hr className="my-2 border-t-2 border-gray-300" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold">Total Cash in Hand:</span>
                                    <span className="font-bold text-blue-600">{formatMoney(totals.totalCashInHand)}</span>
                                </div>
                                <hr className="my-2" />
                                <div className="text-xs text-gray-500 space-y-1 pt-2">
                                    <div className="flex justify-between">
                                        <span>Total Fuel Sale Value:</span> 
                                        <span>{formatMoney(totals.totalFuelSale)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Credit Sales:</span> 
                                        <span>{formatMoney(totals.totalCreditSales)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Digital Payments:</span> 
                                        <span>{formatMoney(totals.totalDigitalPayments)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button 
                            className={`btn w-full text-base py-3 ${isSubmitting ? 'btn-secondary cursor-not-allowed' : 'btn-primary'}`}
                            onClick={submitShift}
                            disabled={isSubmitting || fuelTypes.length === 0}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Saving Shift Data...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-flag-checkered mr-2"></i>
                                    {existingShiftId ? 'Update Shift & Generate Report' : 'End Shift & Generate Report'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Fuel Management View Component ---

const FuelManagementView = ({ showSuccessBanner }) => {
    const [fuels, setFuels] = useState([]);
    const [priceHistory, setPriceHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedFuel, setSelectedFuel] = useState(null);
    const [newPrice, setNewPrice] = useState('');
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState('');

    // Fetch fuels and current prices
    const fetchFuels = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_URL}/api/fuel-prices/current`);
            setFuels(response.data);
        } catch (err) {
            console.error('Error fetching fuels:', err);
            setError('Failed to load fuel data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch price history for selected fuel
    const fetchPriceHistory = useCallback(async (fuelId) => {
        if (!fuelId) return;
        try {
            const response = await axios.get(`${API_URL}/api/fuels/${fuelId}/price-history`);
            setPriceHistory(response.data);
        } catch (err) {
            console.error('Error fetching price history:', err);
            setPriceHistory([]);
        }
    }, []);

    useEffect(() => {
        fetchFuels();
    }, [fetchFuels]);

    useEffect(() => {
        if (selectedFuel) {
            fetchPriceHistory(selectedFuel.id);
            setNewPrice(selectedFuel.current_price.toString());
        }
    }, [selectedFuel, fetchPriceHistory]);

    const handlePriceUpdate = async (e) => {
        e.preventDefault();
        if (!selectedFuel || !newPrice) return;

        try {
            setIsLoading(true);
            await axios.put(`${API_URL}/api/fuels/${selectedFuel.id}/price`, {
                price: parseFloat(newPrice),
                effective_date: effectiveDate,
                remarks: remarks || `Price updated to ₹${newPrice}`
            });

            await fetchFuels();
            await fetchPriceHistory(selectedFuel.id);
            setRemarks('');
            showSuccessBanner(`${selectedFuel.name} price updated successfully!`);
        } catch (err) {
            console.error('Error updating price:', err);
            setError(err.response?.data?.message || 'Failed to update price');
        } finally {
            setIsLoading(false);
        }
    };

    const formatMoney = (amount) => `₹${parseFloat(amount).toFixed(2)}`;
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');

    if (isLoading && fuels.length === 0) {
        return (
            <div className="p-6 card text-center">
                <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
                <p>Loading fuel data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="card">
                <div className="card-header">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">
                        <i className="fas fa-gas-pump mr-2 text-blue-500"></i>
                        Fuel Management
                    </h2>
                    <p className="text-gray-600">Manage fuel types and update prices</p>
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Current Fuel Prices */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Current Fuel Prices</h3>
                        <div className="space-y-3">
                            {fuels.map(fuel => (
                                <div 
                                    key={fuel.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                        selectedFuel?.id === fuel.id 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => setSelectedFuel(fuel)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-medium">{fuel.name}</h4>
                                            <p className="text-sm text-gray-500">
                                                {fuel.nozzles} nozzle(s)
                                            </p>
                                            {fuel.last_price_change && (
                                                <p className="text-xs text-gray-400">
                                                    Last updated: {formatDate(fuel.last_price_change)}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-green-600">
                                                {formatMoney(fuel.current_price)}
                                            </div>
                                            <p className="text-xs text-gray-500">per litre</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price Update Form */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">
                            {selectedFuel ? `Update ${selectedFuel.name} Price` : 'Select a fuel to update price'}
                        </h3>
                        
                        {selectedFuel ? (
                            <form onSubmit={handlePriceUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Price (₹ per litre)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Effective Date
                                    </label>
                                    <input
                                        type="date"
                                        value={effectiveDate}
                                        onChange={(e) => setEffectiveDate(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Remarks (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Reason for price change..."
                                        className="input-field"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !newPrice}
                                    className="btn-primary w-full"
                                >
                                    {isLoading ? (
                                        <>
                                            <i className="fas fa-spinner fa-spin mr-2"></i>
                                            Updating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-save mr-2"></i>
                                            Update Price
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                <i className="fas fa-mouse-pointer text-3xl mb-2"></i>
                                <p>Select a fuel type from the left to update its price</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Price History */}
                {selectedFuel && priceHistory.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">
                            Price History for {selectedFuel.name}
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full table-auto">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-4 py-2 text-left">Date</th>
                                        <th className="px-4 py-2 text-left">Price</th>
                                        <th className="px-4 py-2 text-left">Remarks</th>
                                        <th className="px-4 py-2 text-left">Updated On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priceHistory.map((entry, index) => (
                                        <tr key={entry.id} className={index === 0 ? 'bg-green-50' : ''}>
                                            <td className="px-4 py-2">{formatDate(entry.effective_date)}</td>
                                            <td className="px-4 py-2 font-medium">
                                                {formatMoney(entry.price)}
                                                {index === 0 && (
                                                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                        Current
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-600">
                                                {entry.remarks || '-'}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500">
                                                {formatDate(entry.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const HistoricalDataView = () => (
    <div className="card p-6">
        <h2 className="text-xl font-bold mb-4">Historical Data</h2>
        <p>The historical data view with filters and a table will be implemented here.</p>
    </div>
);

const DashboardView = () => {
    const [activeDashboardTab, setActiveDashboardTab] = useState('overview');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const renderDashboardView = () => {
        switch (activeDashboardTab) {
            case 'overview':
                return <DashboardOverviewView 
                    selectedDate={selectedDate} 
                    formatMoney={formatMoney} 
                    formatDate={formatDate} 
                    onNavigateToTab={setActiveDashboardTab}
                />;
            case 'daily-report':
                return <DashboardDailyReportView selectedDate={selectedDate} formatMoney={formatMoney} />;
            case 'creditors':
                return <DashboardCreditorsView formatMoney={formatMoney} />;
            default:
                return <DashboardOverviewView selectedDate={selectedDate} formatMoney={formatMoney} formatDate={formatDate} />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Dashboard Header with Date Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                <div className="mt-4 md:mt-0 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Showing data for:</span>
                    <input 
                        type="date" 
                        className="bg-white border border-gray-300 rounded-md p-2 text-sm" 
                        value={selectedDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Dashboard Sub-Navigation */}
            <div className="mb-6 overflow-x-auto pb-2">
                <div className="flex space-x-2 min-w-max">
                    <button 
                        onClick={() => setActiveDashboardTab('overview')} 
                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            activeDashboardTab === 'overview' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                        }`}
                    >
                        <i className="fas fa-chart-line"></i>
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveDashboardTab('daily-report')} 
                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            activeDashboardTab === 'daily-report' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                        }`}
                    >
                        <i className="fas fa-file-alt"></i>
                        Daily Report
                    </button>
                    <button 
                        onClick={() => setActiveDashboardTab('creditors')} 
                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            activeDashboardTab === 'creditors' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                        }`}
                    >
                        <i className="fas fa-users"></i>
                        Creditors
                    </button>
                </div>
            </div>

            {/* Dashboard Content */}
            {renderDashboardView()}
        </div>
    );
};

// Dashboard Overview Sub-Component
const DashboardOverviewView = ({ selectedDate, formatMoney, formatDate, onNavigateToTab }) => {
    const [activeChartTab, setActiveChartTab] = useState('amount');
    const [creditorsExpanded, setCreditorsExpanded] = useState(false);
    const [dashboardData, setDashboardData] = useState({
        summary: null,
        creditors: null,
        salesTrend: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch dashboard overview data from API
    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const [summaryRes, creditorsRes, trendRes] = await Promise.all([
                axios.get(`${API_URL}/api/dashboard/summary/${selectedDate}`),
                axios.get(`${API_URL}/api/dashboard/creditors`),
                axios.get(`${API_URL}/api/dashboard/sales-trend?days=7`)
            ]);

            setDashboardData({
                summary: summaryRes.data,
                creditors: creditorsRes.data,
                salesTrend: trendRes.data
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    useEffect(() => {
        // Initialize Chart.js when component mounts and data is available
        if (dashboardData.salesTrend && window.Chart) {
            initializeChart();
        } else if (dashboardData.salesTrend) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                initializeChart();
            };
            document.head.appendChild(script);

            return () => {
                // Cleanup
                const existingScript = document.querySelector('script[src="https://cdn.jsdelivr.net/npm/chart.js"]');
                if (existingScript) {
                    document.head.removeChild(existingScript);
                }
            };
        }
    }, [dashboardData.salesTrend, activeChartTab]);

    const initializeChart = () => {
        const ctx = document.getElementById('salesTrendChart');
        if (!ctx || !window.Chart || !dashboardData.salesTrend) return;

        // Destroy existing chart if it exists
        if (window.salesChart) {
            window.salesChart.destroy();
        }

        const trendData = dashboardData.salesTrend.trendData;
        const labels = trendData.map(item => formatDate(item.date));

        const amountData = {
            labels: labels,
            datasets: [
                { 
                    label: 'Total Sales (₹)', 
                    data: trendData.map(item => item.totalSales), 
                    borderColor: '#4f46e5', 
                    backgroundColor: 'rgba(79, 70, 229, 0.1)', 
                    fill: true, 
                    tension: 0.4, 
                    borderWidth: 3 
                },
                { 
                    label: 'MS Sales (₹)', 
                    data: trendData.map(item => item.msSales), 
                    borderColor: '#3b82f6', 
                    fill: false, 
                    tension: 0.4, 
                    borderWidth: 2, 
                    borderDash: [5, 5] 
                },
                { 
                    label: 'HSD Sales (₹)', 
                    data: trendData.map(item => item.hsdSales), 
                    borderColor: '#16a34a', 
                    fill: false, 
                    tension: 0.4, 
                    borderWidth: 2, 
                    borderDash: [5, 5] 
                }
            ]
        };
        
        const litreData = {
            labels: labels,
            datasets: [
                { 
                    label: 'Total Litres', 
                    data: trendData.map(item => item.totalLitres), 
                    borderColor: '#16a34a', 
                    backgroundColor: 'rgba(22, 163, 74, 0.1)', 
                    fill: true, 
                    tension: 0.4, 
                    borderWidth: 3 
                },
                { 
                    label: 'MS Litres', 
                    data: trendData.map(item => item.msLitres), 
                    borderColor: '#3b82f6', 
                    fill: false, 
                    tension: 0.4, 
                    borderWidth: 2, 
                    borderDash: [5, 5] 
                },
                { 
                    label: 'HSD Litres', 
                    data: trendData.map(item => item.hsdLitres), 
                    borderColor: '#4f46e5', 
                    fill: false, 
                    tension: 0.4, 
                    borderWidth: 2, 
                    borderDash: [5, 5] 
                }
            ]
        };

        const amountOptions = {
            scales: { 
                y: { 
                    ticks: { 
                        callback: (value) => '₹' + (value / 1000) + 'k' 
                    } 
                } 
            },
            plugins: { 
                legend: { 
                    position: 'bottom' 
                } 
            }
        };

        const litreOptions = {
            scales: { 
                y: { 
                    ticks: { 
                        callback: (value) => value + ' L' 
                    } 
                } 
            },
            plugins: { 
                legend: { 
                    position: 'bottom' 
                } 
            }
        };

        window.salesChart = new window.Chart(ctx, {
            type: 'line',
            data: activeChartTab === 'amount' ? amountData : litreData,
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                ...(activeChartTab === 'amount' ? amountOptions : litreOptions)
            }
        });
    };

    if (isLoading) {
        return (
            <div className="p-6 card text-center">
                <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
                <h2 className="text-lg font-semibold text-gray-700">Loading Overview...</h2>
                <p className="text-gray-500 mt-2">Please wait while we fetch the latest data.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 card text-center">
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded card">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                </div>
                <button 
                    onClick={fetchDashboardData}
                    className="btn btn-primary"
                >
                    <i className="fas fa-refresh mr-2"></i>
                    Retry
                </button>
            </div>
        );
    }

    const { summary, creditors } = dashboardData;

    return (
        <div>
            {/* Main Dashboard Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sales Trend Chart (Left) */}
                <div className="lg:col-span-2 card p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-700">Sales Trend (Last 7 Days)</h2>
                        <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                            <button 
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                    activeChartTab === 'amount' 
                                        ? 'bg-indigo-50 text-indigo-600' 
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                                onClick={() => setActiveChartTab('amount')}
                            >
                                Amount Trend (₹)
                            </button>
                            <button 
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                    activeChartTab === 'litre' 
                                        ? 'bg-indigo-50 text-indigo-600' 
                                        : 'text-gray-600 hover:text-gray-800'
                                }`}
                                onClick={() => setActiveChartTab('litre')}
                            >
                                Volume Trend (Ltr)
                            </button>
                        </div>
                    </div>
                    <div className="h-96">
                        <canvas id="salesTrendChart"></canvas>
                    </div>
                </div>

                {/* Right Column - Detailed Reports & Summaries */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Detailed Reports Card */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Detailed Reports</h2>
                        <div className="space-y-3">
                            <button 
                                className="btn btn-primary w-full text-left"
                                onClick={() => onNavigateToTab('daily-report')}
                            >
                                <i className="fas fa-calendar-day mr-2"></i>
                                View Day Details
                            </button>
                            <button 
                                className="btn btn-secondary w-full text-left"
                                onClick={() => onNavigateToTab('creditors')}
                            >
                                <i className="fas fa-users mr-2"></i>
                                Manage Creditors
                            </button>
                        </div>
                    </div>

                    {/* Today's Sales Summary */}
                    <div className="card p-6">
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Today's Sales</h2>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-600">{formatMoney(summary?.totalSales || 0)}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {(summary?.totalLitres || 0).toLocaleString()} L sold
                                {summary?.shiftsCount && ` • ${summary.shiftsCount} shift(s)`}
                            </p>
                        </div>
                    </div>

                    {/* Active Creditors Summary */}
                    <div className="card p-6">
                        <div 
                            className="flex justify-between items-center cursor-pointer"
                            onClick={() => setCreditorsExpanded(!creditorsExpanded)}
                        >
                            <div>
                                <h2 className="text-xl font-bold text-gray-700">Active Creditors</h2>
                                <p className="text-2xl font-bold text-red-600 mt-1">{formatMoney(creditors?.totalAmount || 0)}</p>
                                {creditors?.creditorsCount && (
                                    <p className="text-xs text-gray-400">{creditors.creditorsCount} creditor(s)</p>
                                )}
                            </div>
                            <button className="text-gray-500">
                                <i className={`fas fa-chevron-down text-xl transition-transform ${creditorsExpanded ? 'rotate-180' : ''}`}></i>
                            </button>
                        </div>
                        <div 
                            className={`mt-4 pt-4 border-t overflow-hidden transition-all duration-300 ${
                                creditorsExpanded ? 'max-h-96' : 'max-h-0'
                            }`}
                        >
                            <div className="space-y-3">
                                {creditors?.creditors?.length > 0 ? (
                                    creditors.creditors.slice(0, 5).map((creditor, index) => (
                                        <div key={index} className="flex justify-between items-center">
                                            <div>
                                                <span className="font-medium text-gray-800 block">{creditor.name}</span>
                                                {creditor.lastTransactionDate && (
                                                    <span className="text-xs text-gray-500">
                                                        Last: {new Date(creditor.lastTransactionDate).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="font-semibold text-gray-600">{formatMoney(creditor.amount)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No active creditors</p>
                                )}
                                {creditors?.creditors?.length > 5 && (
                                    <p className="text-xs text-gray-500 text-center pt-2">
                                        And {creditors.creditors.length - 5} more...
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Dashboard Daily Report Sub-Component
const DashboardDailyReportView = ({ selectedDate, formatMoney }) => {
    const [dashboardData, setDashboardData] = useState({
        summary: null,
        fuelBreakdown: null,
        paymentBreakdown: null,
        expenseBreakdown: null,
        creditSales: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch detailed daily report data from API
    const fetchDailyReportData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const [summaryRes, fuelRes, paymentRes, expenseRes, creditRes] = await Promise.all([
                axios.get(`${API_URL}/api/dashboard/summary/${selectedDate}`),
                axios.get(`${API_URL}/api/dashboard/fuel-breakdown/${selectedDate}`),
                axios.get(`${API_URL}/api/dashboard/payment-breakdown/${selectedDate}`),
                axios.get(`${API_URL}/api/dashboard/expense-breakdown/${selectedDate}`),
                axios.get(`${API_URL}/api/dashboard/credit-sales/${selectedDate}`)
            ]);

            setDashboardData({
                summary: summaryRes.data,
                fuelBreakdown: fuelRes.data,
                paymentBreakdown: paymentRes.data,
                expenseBreakdown: expenseRes.data,
                creditSales: creditRes.data
            });
        } catch (err) {
            console.error('Error fetching daily report data:', err);
            setError('Failed to load daily report data. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => {
        fetchDailyReportData();
    }, [fetchDailyReportData]);

    if (isLoading) {
        return (
            <div className="p-6 card text-center">
                <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
                <h2 className="text-lg font-semibold text-gray-700">Loading Daily Report...</h2>
                <p className="text-gray-500 mt-2">Please wait while we fetch the detailed data.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 card text-center">
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded card">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                </div>
                <button 
                    onClick={fetchDailyReportData}
                    className="btn btn-primary"
                >
                    <i className="fas fa-refresh mr-2"></i>
                    Retry
                </button>
            </div>
        );
    }

    const { summary, fuelBreakdown, paymentBreakdown, expenseBreakdown, creditSales } = dashboardData;

    return (
        <div>
            {/* Full KPI Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Sales */}
                <div className="card flex items-center p-6">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mr-4">
                        <i className="fas fa-rupee-sign text-2xl text-blue-600"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Sales</p>
                        <p className="text-3xl font-bold text-gray-800">{formatMoney(summary?.totalSales || 0)}</p>
                        {summary?.shiftsCount && (
                            <p className="text-xs text-gray-400">{summary.shiftsCount} shift(s)</p>
                        )}
                    </div>
                </div>
                
                {/* Litres Sold */}
                <div className="card flex items-center p-6">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mr-4">
                        <i className="fas fa-gas-pump text-2xl text-green-600"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Litres Sold</p>
                        <p className="text-3xl font-bold text-gray-800">{(summary?.totalLitres || 0).toLocaleString()} L</p>
                    </div>
                </div>
                
                {/* Total Credit */}
                <div className="card flex items-center p-6">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 mr-4">
                        <i className="fas fa-credit-card text-2xl text-yellow-600"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Credit</p>
                        <p className="text-3xl font-bold text-gray-800">{formatMoney(summary?.totalCredit || 0)}</p>
                    </div>
                </div>
                
                {/* Cash in Hand */}
                <div className="card flex items-center p-6">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mr-4">
                        <i className="fas fa-wallet text-2xl text-indigo-600"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Cash in Hand</p>
                        <p className="text-3xl font-bold text-gray-800">{formatMoney(summary?.cashInHand || 0)}</p>
                    </div>
                </div>
            </div>

            {/* Detailed Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sales by Fuel */}
                <div className="card p-6">
                    <div className="flex items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-700 mr-4">Sales by Fuel</h2>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-blue-600 mr-1.5"></span>₹
                            </span>
                            <span className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-green-600 mr-1.5"></span>Ltr
                            </span>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {fuelBreakdown?.fuelBreakdown?.length > 0 ? (
                            fuelBreakdown.fuelBreakdown.map((fuel, index) => (
                                <div key={index}>
                                    <p className="text-sm font-medium text-gray-800 mb-2">
                                        {fuel.fuelType.toUpperCase()} 
                                        {fuel.avgPrice > 0 && (
                                            <span className="text-xs text-gray-500 ml-2">@ ₹{fuel.avgPrice}/L</span>
                                        )}
                                    </p>
                                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                                        <span>Amount</span>
                                        <span>{formatMoney(fuel.amount)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${fuel.amountPercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-1 mt-2">
                                        <span>Volume</span>
                                        <span>{fuel.volume} L</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-green-600 h-2 rounded-full" 
                                            style={{ width: `${fuel.volumePercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No fuel sales data for selected date</p>
                        )}
                    </div>
                </div>

                {/* Payment Mode Summary */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Payment Mode Summary</h2>
                    {paymentBreakdown ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center">
                                    <i className="fas fa-money-bill-wave text-green-600 mr-3"></i>
                                    <span className="font-medium">Cash Payments</span>
                                </div>
                                <span className="font-bold text-green-600">{formatMoney(paymentBreakdown.cashPayments)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center">
                                    <i className="fas fa-credit-card text-blue-600 mr-3"></i>
                                    <span className="font-medium">Digital Payments</span>
                                </div>
                                <span className="font-bold text-blue-600">{formatMoney(paymentBreakdown.digitalPayments)}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1 mt-4 pt-3 border-t">
                                <div className="flex justify-between">
                                    <span>Cash from Fuel Sales:</span>
                                    <span>{formatMoney(paymentBreakdown.breakdown?.cashFromFuel || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cash Collections:</span>
                                    <span>{formatMoney(paymentBreakdown.breakdown?.cashFromCollections || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Digital from Fuel:</span>
                                    <span>{formatMoney(paymentBreakdown.breakdown?.digitalFromFuel || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Digital Collections:</span>
                                    <span>{formatMoney(paymentBreakdown.breakdown?.digitalFromCollections || 0)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No payment data for selected date</p>
                    )}
                </div>

                {/* Expense Breakdown */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Expense Breakdown</h2>
                    {expenseBreakdown?.expenseBreakdown?.length > 0 ? (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-2xl font-bold text-red-600">{formatMoney(expenseBreakdown.totalExpenses)}</p>
                                <p className="text-sm text-gray-500">Total Expenses</p>
                            </div>
                            <div className="space-y-3">
                                {expenseBreakdown.expenseBreakdown.map((expense, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span className="font-medium text-gray-800">{expense.category}</span>
                                            <p className="text-xs text-gray-500">{expense.transactionCount} transaction(s)</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-gray-700">{formatMoney(expense.amount)}</span>
                                            <p className="text-xs text-gray-500">{expense.percentage}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No expenses for selected date</p>
                    )}
                </div>

                {/* Today's Credit Sales */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Today's Credit Sales</h2>
                    {creditSales?.creditSales?.length > 0 ? (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-2xl font-bold text-yellow-600">{formatMoney(creditSales.totalCreditSales)}</p>
                                <p className="text-sm text-gray-500">{creditSales.transactionCount} transaction(s)</p>
                            </div>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {creditSales.creditSales.map((sale, index) => (
                                    <div key={index} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-medium text-gray-800">{sale.partyName}</span>
                                                <p className="text-xs text-gray-500">
                                                    {sale.fuelType} • {sale.shiftType} shift
                                                </p>
                                                {sale.remarks && (
                                                    <p className="text-xs text-gray-600 mt-1">{sale.remarks}</p>
                                                )}
                                            </div>
                                            <span className="font-bold text-yellow-600">{formatMoney(sale.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No credit sales for selected date</p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Dashboard Creditors Sub-Component
const DashboardCreditorsView = ({ formatMoney }) => {
    const [creditorsData, setCreditorsData] = useState(null);
    const [selectedCreditor, setSelectedCreditor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch detailed creditors data from API
    const fetchCreditorsData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/creditors-detailed`);
            setCreditorsData(response.data);
        } catch (err) {
            console.error('Error fetching creditors data:', err);
            setError('Failed to load creditors data. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCreditorsData();
    }, [fetchCreditorsData]);

    if (isLoading) {
        return (
            <div className="p-6 card text-center">
                <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
                <h2 className="text-lg font-semibold text-gray-700">Loading Creditors...</h2>
                <p className="text-gray-500 mt-2">Please wait while we fetch the creditors data.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 card text-center">
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded card">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                </div>
                <button 
                    onClick={fetchCreditorsData}
                    className="btn btn-primary"
                >
                    <i className="fas fa-refresh mr-2"></i>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* High-Level Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card p-6 text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
                        <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Outstanding Credit</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">{formatMoney(creditorsData?.totalOutstanding || 0)}</p>
                </div>
                
                <div className="card p-6 text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4">
                        <i className="fas fa-users text-2xl text-blue-600"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Active Creditors</h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{creditorsData?.creditorsCount || 0}</p>
                </div>
            </div>

            {/* Detailed Creditor Table */}
            <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-700 mb-6">Creditor Details</h2>
                {creditorsData?.creditors?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Party Name</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Amount Due</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Transactions</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Last Transaction</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {creditorsData.creditors.map((creditor, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div>
                                                <span className="font-medium text-gray-800">{creditor.name}</span>
                                                <p className="text-xs text-gray-500">
                                                    Since: {new Date(creditor.firstTransactionDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="font-bold text-red-600">{formatMoney(creditor.totalAmount)}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                {creditor.transactionCount}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-600">
                                            {new Date(creditor.lastTransactionDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button 
                                                className="btn btn-secondary text-xs px-3 py-1"
                                                onClick={() => setSelectedCreditor(creditor)}
                                            >
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
                        <p className="text-lg font-medium text-gray-500">No Active Creditors</p>
                        <p className="text-sm text-gray-400">All outstanding credit has been cleared!</p>
                    </div>
                )}
            </div>

            {/* Creditor Transaction History Modal */}
            {selectedCreditor && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{selectedCreditor.name}</h3>
                                    <p className="text-sm text-gray-500">Transaction History</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-red-600">{formatMoney(selectedCreditor.totalAmount)}</p>
                                    <p className="text-xs text-gray-500">{selectedCreditor.transactionCount} transactions</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-96">
                            <div className="space-y-3">
                                {selectedCreditor.transactions.map((transaction, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg border-l-4 border-yellow-400">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-800">{formatMoney(transaction.amount)}</p>
                                                <p className="text-sm text-gray-600">
                                                    {transaction.fuelType} • {transaction.shiftType} shift
                                                </p>
                                                {transaction.remarks && (
                                                    <p className="text-xs text-gray-500 mt-1">{transaction.remarks}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-gray-700">
                                                    {new Date(transaction.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 text-right">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setSelectedCreditor(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SettingsView = ({ initialSettings, onSave, showSuccessBanner }) => {
    const [settings, setSettings] = useState(JSON.parse(JSON.stringify(initialSettings)));
    const [editingSection, setEditingSection] = useState(null);
    const [originalSectionState, setOriginalSectionState] = useState(null);
    const [modal, setModal] = useState({ isOpen: false });
    const [tempPrices, setTempPrices] = useState({});
    const [activeSection, setActiveSection] = useState('general');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const handleEdit = (sectionName) => {
        setEditingSection(sectionName);
        
        // Store the original state based on section type
        switch (sectionName) {
            case 'general':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.general)));
                break;
            case 'rates':
            case 'nozzles':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.fuels)));
                break;
            case 'credit-types':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.creditTypes)));
                break;
            case 'expense-categories':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.expenseCategories)));
                break;
            case 'cash-modes':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.cashModes)));
                break;
            default:
                setOriginalSectionState(JSON.parse(JSON.stringify(settings)));
        }
    };

    const handleCancel = (sectionName) => {
        // Restore the original state based on section type
        switch (sectionName) {
            case 'general':
                setSettings(prev => ({ ...prev, general: originalSectionState }));
                break;
            case 'rates':
            case 'nozzles':
                setSettings(prev => ({ ...prev, fuels: originalSectionState }));
                break;
            case 'credit-types':
                setSettings(prev => ({ ...prev, creditTypes: originalSectionState }));
                break;
            case 'expense-categories':
                setSettings(prev => ({ ...prev, expenseCategories: originalSectionState }));
                break;
            case 'cash-modes':
                setSettings(prev => ({ ...prev, cashModes: originalSectionState }));
                break;
        }
        setEditingSection(null);
    };

    const handleSave = (sectionName) => {
        const changelog = generateChangelog(sectionName);

        if (changelog.length === 0) {
            setEditingSection(null);
            return;
        }

        showModal({
            title: 'Confirm Changes',
            text: 'You are about to make the following changes:',
            changelog,
            confirmText: 'Confirm Save',
            confirmClass: 'btn-primary',
            onConfirm: async () => {
                try {
                    await onSave(settings, sectionName);
                    setEditingSection(null);
                } catch (error) {
                    // Error is handled in the parent App component
                }
            }
        });
    };

    const generateChangelog = (sectionName) => {
        const changelog = [];
        
        switch (sectionName) {
            case 'general':
                if (settings.general?.pumpName !== originalSectionState?.pumpName) {
                    changelog.push(`Pump Name will be changed to "${settings.general?.pumpName}".`);
                }
                break;
                
            case 'rates':
                settings.fuels?.forEach(fuel => {
                    const originalFuel = originalSectionState?.find(f => f.id === fuel.id);
                    if (originalFuel && fuel.price !== originalFuel.price) {
                        changelog.push(`${fuel.name} price will be changed from ₹${(parseFloat(originalFuel.price) || 0).toFixed(2)} to ₹${(parseFloat(fuel.price) || 0).toFixed(2)}.`);
                    }
                });
                break;
                
            case 'nozzles':
                // Check for nozzle count changes
                settings.fuels?.forEach(fuel => {
                    const originalFuel = originalSectionState?.find(f => f.id === fuel.id);
                    if (originalFuel && fuel.nozzles !== originalFuel.nozzles) {
                        changelog.push(`${fuel.name} nozzle count will be changed from ${originalFuel.nozzles} to ${fuel.nozzles}.`);
                    }
                });
                
                // Check for new fuels added
                const originalFuelIds = originalSectionState?.map(f => f.id) || [];
                const newFuels = settings.fuels?.filter(fuel => !originalFuelIds.includes(fuel.id)) || [];
                newFuels.forEach(fuel => {
                    changelog.push(`New fuel type "${fuel.name}" will be added with ${fuel.nozzles} nozzles at ₹${(parseFloat(fuel.price) || 0).toFixed(2)}.`);
                });
                
                // Check for deleted fuels
                const currentFuelIds = settings.fuels?.map(f => f.id) || [];
                const deletedFuels = originalSectionState?.filter(fuel => !currentFuelIds.includes(fuel.id)) || [];
                deletedFuels.forEach(fuel => {
                    changelog.push(`Fuel type "${fuel.name}" will be removed.`);
                });
                break;
                
            case 'credit-types':
                const addedCreditTypes = settings.creditTypes?.filter(type => !originalSectionState?.includes(type)) || [];
                const removedCreditTypes = originalSectionState?.filter(type => !settings.creditTypes?.includes(type)) || [];
                
                addedCreditTypes.forEach(type => {
                    changelog.push(`Credit type "${type}" will be added.`);
                });
                removedCreditTypes.forEach(type => {
                    changelog.push(`Credit type "${type}" will be removed.`);
                });
                break;
                
            case 'expense-categories':
                const addedExpenseCategories = settings.expenseCategories?.filter(cat => !originalSectionState?.includes(cat)) || [];
                const removedExpenseCategories = originalSectionState?.filter(cat => !settings.expenseCategories?.includes(cat)) || [];
                
                addedExpenseCategories.forEach(cat => {
                    changelog.push(`Expense category "${cat}" will be added.`);
                });
                removedExpenseCategories.forEach(cat => {
                    changelog.push(`Expense category "${cat}" will be removed.`);
                });
                break;
                
            case 'cash-modes':
                const addedCashModes = settings.cashModes?.filter(mode => !originalSectionState?.includes(mode)) || [];
                const removedCashModes = originalSectionState?.filter(mode => !settings.cashModes?.includes(mode)) || [];
                
                addedCashModes.forEach(mode => {
                    changelog.push(`Cash collection mode "${mode}" will be added.`);
                });
                removedCashModes.forEach(mode => {
                    changelog.push(`Cash collection mode "${mode}" will be removed.`);
                });
                break;
        }
        
        return changelog;
    };

    const showModal = ({ title, text, changelog = [], confirmText, confirmClass, onConfirm }) => {
        setModal({ isOpen: true, title, text, changelog, confirmText, confirmClass, onConfirm });
    };

    const showItemSuccessMessage = (message) => {
        // Use a timeout to show the message after the modal closes
        setTimeout(() => {
            if (window.showSuccessBanner) {
                window.showSuccessBanner(message);
            }
        }, 100);
    };

    const hideModal = () => {
        setModal({ isOpen: false });
    };

    const addArrayItem = (arrayName, newItem) => {
        if (newItem.trim() && !settings[arrayName].includes(newItem.trim())) {
            const itemDisplayName = getArrayItemDisplayName(arrayName);
            
            showModal({
                title: 'Confirm Addition',
                text: `Are you sure you want to add "${newItem.trim()}" to ${itemDisplayName}?`,
                confirmText: 'Add',
                confirmClass: 'btn-primary',
                onConfirm: () => {
                    setSettings(prev => ({
                        ...prev,
                        [arrayName]: [...prev[arrayName], newItem.trim()]
                    }));
                    showSuccessBanner(`"${newItem.trim()}" added to ${itemDisplayName} successfully!`);
                }
            });
        }
    };

    const getArrayItemDisplayName = (arrayName) => {
        switch (arrayName) {
            case 'creditTypes': return 'Credit Sale Types';
            case 'expenseCategories': return 'Expense Categories';
            case 'cashModes': return 'Cash Collection Modes';
            default: return 'items';
        }
    };

    const removeArrayItem = (arrayName, itemToRemove) => {
        const itemDisplayName = getArrayItemDisplayName(arrayName);
        
        showModal({
            title: 'Confirm Deletion',
            text: `Are you sure you want to remove "${itemToRemove}" from ${itemDisplayName}?`,
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                setSettings(prev => ({
                    ...prev,
                    [arrayName]: prev[arrayName].filter(item => item !== itemToRemove)
                }));
                showSuccessBanner(`"${itemToRemove}" removed from ${itemDisplayName} successfully!`);
            }
        });
    };

    const updateFuelNozzles = (fuelId, action) => {
        const fuel = settings.fuels.find(f => f.id === fuelId);
        if (action === 'plus') {
            showModal({
                title: 'Confirm Nozzle Addition',
                text: `Are you sure you want to add a nozzle to ${fuel.name}?`,
                changelog: [`${fuel.name} nozzles will be increased from ${fuel.nozzles} to ${fuel.nozzles + 1}.`],
                confirmText: 'Add Nozzle',
                confirmClass: 'btn-primary',
                onConfirm: () => {
                    fuel.nozzles++;
                    setSettings(prev => ({ ...prev, fuels: [...prev.fuels] }));
                    showSuccessBanner(`Nozzle added to ${fuel.name} successfully!`);
                }
            });
        } else if (action === 'minus') {
            if (fuel.nozzles > 1) {
                showModal({
                    title: 'Confirm Nozzle Removal',
                    text: `Are you sure you want to remove a nozzle from ${fuel.name}?`,
                    changelog: [`${fuel.name} nozzles will be decreased from ${fuel.nozzles} to ${fuel.nozzles - 1}.`],
                    confirmText: 'Remove Nozzle',
                    confirmClass: 'btn-primary',
                    onConfirm: () => {
                        fuel.nozzles--;
                        setSettings(prev => ({ ...prev, fuels: [...prev.fuels] }));
                        showSuccessBanner(`Nozzle removed from ${fuel.name} successfully!`);
                    }
                });
            } else {
                showModal({
                    title: 'Confirm Fuel Type Deletion',
                    text: `Are you sure you want to delete the fuel type "${fuel.name}"?`,
                    changelog: [`Fuel type "${fuel.name}" will be completely removed.`],
                    confirmText: 'Delete Fuel Type',
                    confirmClass: 'btn-danger',
                    onConfirm: () => {
                        setSettings(prev => ({
                            ...prev,
                            fuels: prev.fuels.filter(f => f.id !== fuelId)
                        }));
                        showSuccessBanner(`${fuel.name} fuel type deleted successfully!`);
                    }
                });
            }
        }
    };

    const addNewFuel = (name, price, nozzles) => {
        if (name && price > 0 && nozzles > 0) {
            const newFuel = {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                price: parseFloat(price),
                nozzles: parseInt(nozzles)
            };
            
            showModal({
                title: 'Confirm New Fuel Addition',
                text: `Are you sure you want to add the new fuel type?`,
                changelog: [`New fuel "${name}" will be added with ${nozzles} nozzles at ₹${parseFloat(price).toFixed(2)} per liter.`],
                confirmText: 'Add Fuel',
                confirmClass: 'btn-primary',
                onConfirm: () => {
                    setSettings(prev => ({
                        ...prev,
                        fuels: [...prev.fuels, newFuel]
                    }));
                    showSuccessBanner(`New fuel "${name}" added successfully!`);
                }
            });
            return true;
        }
        return false;
    };

    const updateFuelPrice = (fuelId, newPrice) => {
        const fuel = settings.fuels.find(f => f.id === fuelId);
        const oldPrice = fuel.price;
        const price = parseFloat(newPrice);
        
        if (oldPrice !== price) {
            showModal({
                title: 'Confirm Price Change',
                text: `Are you sure you want to change the price for ${fuel.name}?`,
                changelog: [`Price will be changed from ₹${(parseFloat(oldPrice) || 0).toFixed(2)} to ₹${(parseFloat(price) || 0).toFixed(2)}.`],
                confirmText: 'Update Price',
                confirmClass: 'btn-primary',
                onConfirm: () => {
                    setSettings(prev => ({
                        ...prev,
                        fuels: prev.fuels.map(fuel =>
                            fuel.id === fuelId ? { ...fuel, price: price } : fuel
                        )
                    }));
                    showSuccessBanner(`${fuel.name} price updated to ₹${(parseFloat(price) || 0).toFixed(2)} successfully!`);
                }
            });
        }
    };

    useEffect(() => {
        const modalEl = document.getElementById('confirmation-modal');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const modalIconBg = document.getElementById('modal-icon-bg');
        const modalIcon = document.getElementById('modal-icon');

        const handleConfirm = () => {
            if (modal.onConfirm) modal.onConfirm();
            hideModal();
        };

        if (modal.isOpen) {
            modalEl.classList.remove('hidden');
            modalEl.classList.add('flex');
            document.getElementById('modal-title').textContent = modal.title;
            document.getElementById('modal-text').textContent = modal.text;
            document.getElementById('modal-changelog').innerHTML = modal.changelog.map(c => `<li>${c}</li>`).join('');
            document.getElementById('modal-changelog').style.display = modal.changelog.length > 0 ? 'block' : 'none';
            confirmBtn.textContent = modal.confirmText;
            confirmBtn.className = `btn ${modal.confirmClass}`;

            // Update modal icon based on type
            if (modal.confirmClass === 'btn-danger') {
                modalIconBg.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100';
                modalIcon.className = 'fas fa-exclamation-triangle text-red-600';
            } else {
                modalIconBg.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100';
                modalIcon.className = 'fas fa-info-circle text-blue-600';
            }

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', hideModal);
        } else {
            modalEl.classList.add('hidden');
            modalEl.classList.remove('flex');
        }

        return () => {
            confirmBtn?.removeEventListener('click', handleConfirm);
            cancelBtn?.removeEventListener('click', hideModal);
        };
    }, [modal]);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Mobile Header with Menu Toggle */}
            <div className="md:hidden mb-4">
                <div className="card p-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
                    <button
                        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                        className="btn btn-secondary px-3 py-2"
                    >
                        <i className={`fas ${isMobileSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                </div>
                
                {/* Mobile Dropdown Menu */}
                {isMobileSidebarOpen && (
                    <div className="card p-4 mt-2">
                        <nav className="space-y-2">
                            <MobileSettingSidebarItem
                                id="general"
                                label="General Settings"
                                icon="fa-cog"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="rates"
                                label="Fuel Rate Management"
                                icon="fa-rupee-sign"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="nozzles"
                                label="Fuel & Nozzle Management"
                                icon="fa-gas-pump"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="credit-types"
                                label="Credit Sale Types"
                                icon="fa-credit-card"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="expense-categories"
                                label="Expense Categories"
                                icon="fa-list"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="cash-modes"
                                label="Cash Collection Modes"
                                icon="fa-money-bill-wave"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                        </nav>
                    </div>
                )}
            </div>

            <div className="flex gap-6">
                {/* Desktop Sidebar Navigation */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <div className="card p-4 sticky top-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
                        <nav className="space-y-2">
                            <SettingSidebarItem
                                id="general"
                                label="General Settings"
                                icon="fa-cog"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="rates"
                                label="Fuel Rate Management"
                                icon="fa-rupee-sign"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="nozzles"
                                label="Fuel & Nozzle Management"
                                icon="fa-gas-pump"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="credit-types"
                                label="Credit Sale Types"
                                icon="fa-credit-card"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="expense-categories"
                                label="Expense Categories"
                                icon="fa-list"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="cash-modes"
                                label="Cash Collection Modes"
                                icon="fa-money-bill-wave"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 w-full md:w-auto">
                    {activeSection === 'general' && (
                        <SettingsCard
                            title="Pump Information"
                            isEditing={editingSection === 'general'}
                            onEdit={() => handleEdit('general')}
                            onSave={() => handleSave('general')}
                            onCancel={() => handleCancel('general')}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="pump-name" className="block text-sm font-medium text-gray-700">Pump Name *</label>
                                    <input
                                        type="text"
                                        id="pump-name"
                                        className="input-field mt-1"
                                        value={settings.general?.pumpName || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, pumpName: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="owner-name" className="block text-sm font-medium text-gray-700">Owner Name</label>
                                    <input
                                        type="text"
                                        id="owner-name"
                                        className="input-field mt-1"
                                        value={settings.general?.ownerName || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, ownerName: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                    <textarea
                                        id="address"
                                        rows="3"
                                        className="input-field mt-1"
                                        value={settings.general?.address || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, address: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        id="city"
                                        className="input-field mt-1"
                                        value={settings.general?.city || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, city: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                                    <input
                                        type="text"
                                        id="state"
                                        className="input-field mt-1"
                                        value={settings.general?.state || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, state: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">PIN Code</label>
                                    <input
                                        type="text"
                                        id="pincode"
                                        className="input-field mt-1"
                                        value={settings.general?.pincode || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, pincode: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        className="input-field mt-1"
                                        value={settings.general?.phone || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, phone: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="input-field mt-1"
                                        value={settings.general?.email || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, email: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="license-number" className="block text-sm font-medium text-gray-700">License Number</label>
                                    <input
                                        type="text"
                                        id="license-number"
                                        className="input-field mt-1"
                                        value={settings.general?.licenseNumber || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, licenseNumber: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="gst-number" className="block text-sm font-medium text-gray-700">GST Number</label>
                                    <input
                                        type="text"
                                        id="gst-number"
                                        className="input-field mt-1"
                                        value={settings.general?.gstNumber || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, gstNumber: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="established-date" className="block text-sm font-medium text-gray-700">Established Date</label>
                                    <input
                                        type="date"
                                        id="established-date"
                                        className="input-field mt-1"
                                        value={settings.general?.establishedDate || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, establishedDate: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
                                    <input
                                        type="url"
                                        id="website"
                                        className="input-field mt-1"
                                        value={settings.general?.website || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, website: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="operating-hours" className="block text-sm font-medium text-gray-700">Operating Hours</label>
                                    <input
                                        type="text"
                                        id="operating-hours"
                                        className="input-field mt-1"
                                        value={settings.general?.operatingHours || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, operatingHours: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                        placeholder="e.g., 24 Hours, 6:00 AM - 10:00 PM"
                                    />
                                </div>
                            </div>
                        </SettingsCard>
                    )}

                    {activeSection === 'rates' && (
                        <SettingsCard
                            title="Fuel Rate Management"
                            isEditing={editingSection === 'rates'}
                            onEdit={() => handleEdit('rates')}
                            onSave={() => handleSave('rates')}
                            onCancel={() => handleCancel('rates')}
                        >
                            <div className="space-y-4">
                                {settings.fuels?.map(fuel => (
                                    <div key={fuel.id}>
                                        <label className="block text-sm font-medium text-gray-700">{fuel.name}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={tempPrices[fuel.id] !== undefined ? tempPrices[fuel.id] : (parseFloat(fuel.price) || 0).toFixed(2)}
                                            className="input-field mt-1"
                                            onChange={(e) => setTempPrices(prev => ({ ...prev, [fuel.id]: e.target.value }))}
                                            onBlur={(e) => {
                                                const newPrice = parseFloat(e.target.value);
                                                if (!isNaN(newPrice) && newPrice !== fuel.price) {
                                                    updateFuelPrice(fuel.id, e.target.value);
                                                }
                                                setTempPrices(prev => ({ ...prev, [fuel.id]: undefined }));
                                            }}
                                            disabled={editingSection !== 'rates'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SettingsCard>
                    )}

                    {activeSection === 'nozzles' && (
                        <SettingsCard
                            title="Fuel & Nozzle Management"
                            isEditing={editingSection === 'nozzles'}
                            onEdit={() => handleEdit('nozzles')}
                            onSave={() => handleSave('nozzles')}
                            onCancel={() => handleCancel('nozzles')}
                        >
                            <div className="space-y-4">
                                {settings.fuels?.map(fuel => {
                                    const minusBtnClass = fuel.nozzles === 1 ? 'btn-danger-outline' : 'btn-secondary';
                                    const minusBtnIcon = fuel.nozzles === 1 ? <i className="fas fa-trash"></i> : '-';
                                    
                                    return (
                                        <div key={fuel.id} className="flex justify-between items-center">
                                            <span className="font-medium text-gray-800">{fuel.name}</span>
                                            <div className={`flex items-center gap-2 ${editingSection === 'nozzles' ? '' : 'hidden'}`}>
                                                <button
                                                    className={`btn ${minusBtnClass} h-8 w-8 p-0 flex items-center justify-center`}
                                                    onClick={() => updateFuelNozzles(fuel.id, 'minus')}
                                                >
                                                    {minusBtnIcon}
                                                </button>
                                                <span className="font-bold text-lg w-5 text-center">{fuel.nozzles}</span>
                                                <button
                                                    className="btn btn-secondary h-8 w-8 p-0 flex items-center justify-center"
                                                    onClick={() => updateFuelNozzles(fuel.id, 'plus')}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className={`text-gray-500 ${editingSection === 'nozzles' ? 'hidden' : ''}`}>
                                                {fuel.nozzles} Nozzles
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {editingSection === 'nozzles' && (
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="text-md font-semibold text-gray-700 mb-2">Add New Fuel</h3>
                                    <AddFuelForm onAdd={addNewFuel} />
                                </div>
                            )}
                        </SettingsCard>
                    )}

                    {activeSection === 'credit-types' && (
                        <SettingsCard
                            title="Credit Sale Fuel Types"
                            isEditing={editingSection === 'credit-types'}
                            onEdit={() => handleEdit('credit-types')}
                            onSave={() => handleSave('credit-types')}
                            onCancel={() => handleCancel('credit-types')}
                        >
                            <ArrayEditor
                                items={settings.creditTypes || []}
                                isEditing={editingSection === 'credit-types'}
                                onAdd={(item) => addArrayItem('creditTypes', item)}
                                onRemove={(item) => removeArrayItem('creditTypes', item)}
                                placeholder="New fuel type name"
                            />
                        </SettingsCard>
                    )}

                    {activeSection === 'expense-categories' && (
                        <SettingsCard
                            title="Expense Categories"
                            isEditing={editingSection === 'expense-categories'}
                            onEdit={() => handleEdit('expense-categories')}
                            onSave={() => handleSave('expense-categories')}
                            onCancel={() => handleCancel('expense-categories')}
                        >
                            <ArrayEditor
                                items={settings.expenseCategories || []}
                                isEditing={editingSection === 'expense-categories'}
                                onAdd={(item) => addArrayItem('expenseCategories', item)}
                                onRemove={(item) => removeArrayItem('expenseCategories', item)}
                                placeholder="New category name"
                            />
                        </SettingsCard>
                    )}

                    {activeSection === 'cash-modes' && (
                        <SettingsCard
                            title="Cash Collection Modes"
                            isEditing={editingSection === 'cash-modes'}
                            onEdit={() => handleEdit('cash-modes')}
                            onSave={() => handleSave('cash-modes')}
                            onCancel={() => handleCancel('cash-modes')}
                        >
                            <ArrayEditor
                                items={settings.cashModes || []}
                                isEditing={editingSection === 'cash-modes'}
                                onAdd={(item) => addArrayItem('cashModes', item)}
                                onRemove={(item) => removeArrayItem('cashModes', item)}
                                placeholder="New mode name"
                            />
                        </SettingsCard>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Settings Components ---

const SettingSidebarItem = ({ id, label, icon, activeSection, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-3 ${
            activeSection === id 
                ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
    >
        <i className={`fas ${icon} w-4 text-center`}></i>
        <span className="text-sm font-medium">{label}</span>
    </button>
);

const MobileSettingSidebarItem = ({ id, label, icon, activeSection, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center gap-3 ${
            activeSection === id 
                ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
    >
        <i className={`fas ${icon} w-5 text-center`}></i>
        <span className="font-medium">{label}</span>
        {activeSection === id && <i className="fas fa-check ml-auto text-blue-600"></i>}
    </button>
);

const SettingsCard = ({ title, isEditing, onEdit, onSave, onCancel, children }) => (
    <div className={`card p-6 ${isEditing ? 'editing' : ''}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-700">{title}</h2>
            {!isEditing && (
                <button onClick={onEdit} className="btn btn-secondary edit-btn">
                    <i className="fas fa-pencil-alt mr-2"></i>Edit
                </button>
            )}
        </div>
        <div className="space-y-4">{children}</div>
        {isEditing && (
            <div className="card-actions justify-end gap-2 mt-4 flex">
                <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
                <button onClick={onSave} className="btn btn-primary">Save Changes</button>
            </div>
        )}
    </div>
);

const ArrayEditor = ({ items, isEditing, onAdd, onRemove, placeholder }) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem);
            setNewItem('');
        }
    };

    return (
        <div>
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                        <span className="text-sm font-medium text-gray-700">{item}</span>
                        <button
                            className={`btn btn-danger-outline h-7 w-7 p-0 text-xs items-center justify-center ${isEditing ? 'flex' : 'hidden'}`}
                            onClick={() => onRemove(item)}
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>
            {isEditing && (
                <div className="flex gap-2 mt-4">
                    <input
                        type="text"
                        className="input-field flex-1"
                        placeholder={placeholder}
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} className="btn btn-secondary flex-shrink-0">
                        <i className="fas fa-plus"></i> Add
                    </button>
                </div>
            )}
        </div>
    );
};

const AddFuelForm = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [nozzles, setNozzles] = useState('');

    const handleAdd = () => {
        if (onAdd(name, price, nozzles)) {
            setName('');
            setPrice('');
            setNozzles('');
        } else {
            alert('Please fill all fields for the new fuel.');
        }
    };

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                    type="text"
                    className="input-field"
                    placeholder="Fuel Name (e.g., CNG)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="number"
                    className="input-field"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
                <input
                    type="number"
                    className="input-field"
                    placeholder="Nozzles"
                    value={nozzles}
                    onChange={(e) => setNozzles(e.target.value)}
                />
            </div>
            <button onClick={handleAdd} className="btn btn-secondary w-full mt-2">
                Add Fuel
            </button>
        </div>
    );
};

export default App;

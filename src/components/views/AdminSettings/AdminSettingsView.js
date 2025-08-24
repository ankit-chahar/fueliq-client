import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../../constants/api';
import StationSettings from './StationSettings';
import UserSettings from './UserSettings';

const AdminSettingsView = ({ showSuccessBanner }) => {
    const [activeSection, setActiveSection] = useState('stations');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [stations, setStations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch stations data
    const fetchStations = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // For now, we'll use the existing stations endpoint or create mock data
            // TODO: Replace with actual API call when backend is ready
            const response = await axios.get(`${API_URL}/api/stations/all`);
            
            if (response.data.success) {
                setStations(response.data.data || []);
            } else {
                throw new Error(response.data.message || 'Failed to fetch stations');
            }
        } catch (error) {
            console.error('Error fetching stations:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to load stations';
            setError(errorMsg);
            
            // Provide fallback data for development
            const fallbackStations = [
                {
                    id: '1',
                    station_code: 'MAIN001',
                    name: 'Main Station',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            setStations(fallbackStations);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStations();
    }, [fetchStations]);

    const sections = [
        { id: 'stations', label: 'Station Settings', icon: 'fa-building' },
        { id: 'users', label: 'User Settings', icon: 'fa-users' }
    ];

    const renderActiveSection = () => {
        switch (activeSection) {
            case 'stations':
                return (
                    <StationSettings 
                        stations={stations}
                        onStationsUpdate={fetchStations}
                        showSuccessBanner={showSuccessBanner}
                    />
                );
            case 'users':
                return (
                    <UserSettings 
                        stations={stations}
                        showSuccessBanner={showSuccessBanner}
                    />
                );
            default:
                return <div>Section not found</div>;
        }
    };

    if (isLoading && stations.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading admin settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Mobile Header with Menu Toggle */}
            <div className="md:hidden mb-4">
                <div className="card p-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Admin Settings</h2>
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
                            {sections.map(section => (
                                <MobileAdminSidebarItem
                                    key={section.id}
                                    id={section.id}
                                    label={section.label}
                                    icon={section.icon}
                                    activeSection={activeSection}
                                    onClick={(id) => {
                                        setActiveSection(id);
                                        setIsMobileSidebarOpen(false);
                                    }}
                                />
                            ))}
                        </nav>
                    </div>
                )}
            </div>

            <div className="flex gap-6">
                {/* Desktop Sidebar Navigation */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <div className="card p-4 sticky top-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Settings</h3>
                        <nav className="space-y-2">
                            {sections.map(section => (
                                <AdminSidebarItem
                                    key={section.id}
                                    id={section.id}
                                    label={section.label}
                                    icon={section.icon}
                                    activeSection={activeSection}
                                    onClick={setActiveSection}
                                />
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 w-full md:w-auto">
                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                    {renderActiveSection()}
                </div>
            </div>
        </div>
    );
};

// Sidebar Components (matching Settings design)
const AdminSidebarItem = ({ id, label, icon, activeSection, onClick }) => (
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

const MobileAdminSidebarItem = ({ id, label, icon, activeSection, onClick }) => (
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

export default AdminSettingsView;

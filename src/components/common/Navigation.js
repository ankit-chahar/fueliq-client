import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Navigation = ({ currentView, setView }) => {
    const { getAllowedViews } = useAuth();
    
    // All available tabs
    const allTabs = [
        { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
        { id: 'shift-entry', label: 'Shift Entry', icon: 'fa-clipboard-list' },
        { id: 'history', label: 'Historical Data', icon: 'fa-history' },
        { id: 'settings', label: 'Settings', icon: 'fa-cog' },
        { id: 'admin-settings', label: 'Admin Settings', icon: 'fa-users-cog' },
    ];
    
    // Filter tabs based on user's allowed views
    const allowedViews = getAllowedViews();
    const tabs = allTabs.filter(tab => allowedViews.includes(tab.id));
    
    // Don't show navigation if user has only one view
    if (tabs.length <= 1) {
        return null;
    }
    
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

export default Navigation;

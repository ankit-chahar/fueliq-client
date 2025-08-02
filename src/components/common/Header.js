import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ pumpName, onNavigate }) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const { user, logout } = useAuth();

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
    };

    const closeUserMenu = () => {
        setIsUserMenuOpen(false);
    };

    const handleLogout = async () => {
        try {
            await logout();
            closeUserMenu();
        } catch (error) {
            console.error('Logout error:', error);
        }
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
                <div className="flex items-center justify-between h-20">
                    {/* Left Section: Logo & Navigation */}
                    <div className="flex items-center space-x-6">
                        <div className="flex-shrink-0 flex items-center space-x-4">
                            <div className="flex items-center justify-center">
                                <img 
                                    src="/images/fueliq.png" 
                                    alt="FueliQ Logo" 
                                    className="h-24 w-24 object-contain flex-shrink-0"
                                />
                            </div>
                            <div className="flex items-center justify-center">
                                <span className="text-3xl font-poppins font-semibold text-gray-800">
                                    FueliQ
                                </span>
                            </div>
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
                                    <p className="text-sm font-semibold text-gray-800">{user?.full_name || 'Admin User'}</p>
                                    <p className="text-sm text-gray-500 truncate">{user?.email || 'admin.user@fueliq.com'}</p>
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
                                    {/* <button 
                                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" 
                                        role="menuitem"
                                        onClick={() => {
                                            closeUserMenu();
                                            onNavigate && onNavigate('settings');
                                        }}
                                    >
                                        Settings
                                    </button> */}
                                    <button 
                                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" 
                                        role="menuitem"
                                        onClick={() => {
                                            closeUserMenu();
                                            onNavigate && onNavigate('change-password');
                                        }}
                                    >
                                        {/* <i className="fas fa-key mr-2"></i> */}
                                        Change Password
                                    </button>
                                </div>
                                <div className="py-1 border-t border-gray-200" role="none">
                                    <button 
                                        className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" 
                                        role="menuitem"
                                        onClick={handleLogout}
                                    >
                                        <i className="fas fa-sign-out-alt mr-2"></i>
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

export default Header;

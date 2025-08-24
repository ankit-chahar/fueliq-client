import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = ({ pumpName, onNavigate }) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false); // new state for mobile collapsible panel
    const { user, stationInfo, logout } = useAuth();
    const avatarBtnRef = useRef(null);
    const menuRef = useRef(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });

    // Use station info from auth context, fallback to prop
    const displayStationName = stationInfo?.name || pumpName || 'Chahar Filling Station';

    const toggleUserMenu = (e) => {
        if (e) e.stopPropagation();
        setIsUserMenuOpen(prev => {
            const next = !prev;
            if (process.env.NODE_ENV !== 'production') console.log('User menu open:', next);
            return next;
        });
    };

    const closeUserMenu = () => {
        setIsUserMenuOpen(false);
    };

    const toggleMobilePanel = () => {
        setIsMobilePanelOpen(o => !o);
    };

    const handleLogout = async () => {
        try {
            await logout();
            closeUserMenu();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const calcMenuPosition = () => {
        if (!avatarBtnRef.current) return;
        const btnRect = avatarBtnRef.current.getBoundingClientRect();
        const desiredWidth = 260; // fallback
        const padding = 8;
        let left = btnRect.right - desiredWidth;
        if (left < padding) left = padding;
        if (left + desiredWidth > window.innerWidth - padding) left = window.innerWidth - desiredWidth - padding;
        const top = btnRect.bottom + 8; // 8px gap
        setMenuPos({ top, left, width: desiredWidth });
    };

    // Reposition on open, resize, scroll
    useLayoutEffect(() => {
        if (isUserMenuOpen) {
            calcMenuPosition();
            window.addEventListener('resize', calcMenuPosition);
            window.addEventListener('scroll', calcMenuPosition, true);
        }
        return () => {
            window.removeEventListener('resize', calcMenuPosition);
            window.removeEventListener('scroll', calcMenuPosition, true);
        };
    }, [isUserMenuOpen]);

    // Close menus independently when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (isUserMenuOpen && !target.closest('#user-menu-container')) {
                setIsUserMenuOpen(false);
            }
            if (isMobilePanelOpen && !target.closest('#mobile-panel') && !target.closest('#mobile-panel-trigger')) {
                setIsMobilePanelOpen(false);
            }
        };
        const handleKey = (e) => {
            if (e.key === 'Escape') {
                setIsUserMenuOpen(false);
                setIsMobilePanelOpen(false);
            }
        };
        if (isUserMenuOpen || isMobilePanelOpen) {
            document.addEventListener('click', handleClickOutside);
            document.addEventListener('keydown', handleKey);
        }
        return () => {
            document.removeEventListener('click', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [isUserMenuOpen, isMobilePanelOpen]);

    return (
        <header className="bg-white/95 backdrop-blur border-b border-gray-200 w-full mb-4 sticky top-0 z-50 shadow-sm">
            <div className="mx-auto px-2 sm:px-4 lg:px-8">
                {/* Top bar */}
                <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
                    {/* Left: Brand */}
                    <div className="flex items-center min-w-0 gap-2 sm:gap-3">
                        <button
                            id="mobile-panel-trigger"
                            type="button"
                            onClick={toggleMobilePanel}
                            className="inline-flex md:hidden items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            aria-label="Toggle menu"
                            aria-expanded={isMobilePanelOpen}
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <img
                            src="/images/fueliq.png"
                            alt="FueliQ Logo"
                            className="h-8 w-8 sm:h-10 sm:w-10 object-contain flex-shrink-0"
                        />
                        <span className="text-lg sm:text-xl font-poppins font-semibold text-gray-800 truncate">FueliQ</span>
                    </div>

                    {/* Center (desktop) search */}
                    <div className="hidden lg:flex flex-1 justify-center px-4">
                        <div className="relative w-full max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="block w-full bg-gray-100 border border-gray-200 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* Station badge (hide on very small; show md+) */}
                        <div className="hidden md:flex items-center bg-blue-50 px-3 py-1 rounded-lg border">
                            <div className="flex flex-col items-start">
                                <span className="text-xs font-medium text-gray-600">Station</span>
                                <span className="text-xs font-semibold text-blue-800 font-poppins truncate">{displayStationName}</span>
                                {stationInfo?.code && (
                                    <span className="text-xs text-gray-500">Code: {stationInfo.code}</span>
                                )}
                            </div>
                        </div>                        {/* Optional icons hidden on xs */}
                        <div className="hidden sm:flex items-center">
                            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-ring-blue">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </button>
                            <button className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-ring-blue relative">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                <span className="absolute top-1 right-1 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                            </button>
                        </div>

                        {/* User menu */}
                        <div className="relative" id="user-menu-container">
                            <button
                                ref={avatarBtnRef}
                                type="button"
                                className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 hover:ring-2 hover:ring-blue-300 transition-all duration-200"
                                onClick={toggleUserMenu}
                                aria-expanded={isUserMenuOpen}
                                aria-haspopup="true"
                                aria-controls="user-dropdown-menu"
                            >
                                <span className="sr-only">Open user menu</span>
                                <img className="h-8 w-8 sm:h-9 sm:w-9 rounded-full object-cover ring-2 ring-gray-200" src="https://placehold.co/100x100/E2E8F0/4A5568?text=A" alt="User avatar" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile collapsible panel */}
                <div
                    id="mobile-panel"
                    className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out ${isMobilePanelOpen ? 'max-h-96' : 'max-h-0'}`}
                >
                    <div className="pt-2 pb-3 space-y-3 border-t border-gray-100">
                        {/* Station & status */}
                        <div className="flex items-center gap-2 px-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-sm font-semibold text-blue-800 truncate">{displayStationName}</span>
                        </div>
                        {/* Search (mobile) */}
                        <div className="px-1">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="block w-full bg-gray-100 border border-gray-200 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        {/* Quick actions placeholder (future) */}
                        <div className="flex gap-2 px-1">
                            <button
                                onClick={() => { setIsMobilePanelOpen(false); onNavigate && onNavigate('dashboard'); }}
                                className="flex-1 py-2 text-xs font-medium bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
                            >Dashboard</button>
                            <button
                                onClick={() => { setIsMobilePanelOpen(false); onNavigate && onNavigate('shift-entry'); }}
                                className="flex-1 py-2 text-xs font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            >Shift</button>
                        </div>
                    </div>
                </div>

                {/* Portal: independent user dropdown */}
                {isUserMenuOpen && ReactDOM.createPortal(
                    <div
                        ref={menuRef}
                        id="user-dropdown-menu"
                        style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, width: menuPos.width || 260, zIndex: 10000 }}
                        className="max-w-[92vw] origin-top-right rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none animate-fade-in"
                        role="menu" aria-orientation="vertical" tabIndex={-1}
                    >
                        <div className="px-4 py-3 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-800">{user?.full_name || 'Admin User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email || 'admin.user@fueliq.com'}</p>
                        </div>
                        <div className="py-1" role="none">
                            <button className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">
                                <span>{displayStationName}</span>
                                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            </button>
                            <button className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem">Switch Station</button>
                            <button
                                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                role="menuitem"
                                onClick={() => { closeUserMenu(); onNavigate && onNavigate('change-password'); }}
                            >Change Password</button>
                        </div>
                        <div className="py-1 border-t border-gray-200" role="none">
                            <button className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left" role="menuitem" onClick={handleLogout}><i className="fas fa-sign-out-alt mr-2" />Sign out</button>
                        </div>
                    </div>, document.body)}
            </div>
        </header>
    );
};

export default Header;

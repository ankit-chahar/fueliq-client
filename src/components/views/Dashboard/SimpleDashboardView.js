import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

const SimpleDashboardView = () => {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Welcome back, {user?.full_name || 'Admin'}!</h1>
                        <p className="text-blue-100 mt-2">Petrol Pump Management System - Dashboard Overview</p>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-blue-100">Today's Date</div>
                        <div className="text-xl font-semibold">{new Date().toLocaleDateString()}</div>
                    </div>
                </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-green-100 text-green-600">
                            <i className="fas fa-chart-line text-xl"></i>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                            <p className="text-2xl font-semibold text-gray-900">₹0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <i className="fas fa-gas-pump text-xl"></i>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Fuel Dispensed</p>
                            <p className="text-2xl font-semibold text-gray-900">0L</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                            <i className="fas fa-credit-card text-xl"></i>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Digital Payments</p>
                            <p className="text-2xl font-semibold text-gray-900">₹0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                            <i className="fas fa-users text-xl"></i>
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Credit Sales</p>
                            <p className="text-2xl font-semibold text-gray-900">₹0</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <div className="text-center">
                            <i className="fas fa-plus-circle text-2xl text-gray-400 mb-2"></i>
                            <p className="text-sm font-medium text-gray-600">New Shift Entry</p>
                        </div>
                    </button>
                    
                    <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                        <div className="text-center">
                            <i className="fas fa-chart-bar text-2xl text-gray-400 mb-2"></i>
                            <p className="text-sm font-medium text-gray-600">View Reports</p>
                        </div>
                    </button>
                    
                    <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                        <div className="text-center">
                            <i className="fas fa-cog text-2xl text-gray-400 mb-2"></i>
                            <p className="text-sm font-medium text-gray-600">Settings</p>
                        </div>
                    </button>
                    
                    <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-colors">
                        <div className="text-center">
                            <i className="fas fa-history text-2xl text-gray-400 mb-2"></i>
                            <p className="text-sm font-medium text-gray-600">View History</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Database Connection</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <i className="fas fa-check-circle mr-1"></i>
                            Connected
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">API Server</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <i className="fas fa-check-circle mr-1"></i>
                            Running
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Authentication</span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <i className="fas fa-shield-alt mr-1"></i>
                            Secured
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimpleDashboardView;

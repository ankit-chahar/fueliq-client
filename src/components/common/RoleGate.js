import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Generic role gate component
export const RoleGate = ({ allowedRoles, children, fallback = null }) => {
    const { user } = useAuth();
    const userRole = user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
        return fallback;
    }
    
    return children;
};

// View access gate component
export const ViewAccessGate = ({ view, children, fallback = null }) => {
    const { canAccessView } = useAuth();
    
    if (!canAccessView(view)) {
        return fallback;
    }
    
    return children;
};

// Role-specific components
export const AdminOnly = ({ children, fallback = null }) => {
    return <RoleGate allowedRoles={['admin']} children={children} fallback={fallback} />;
};

export const ManagerOnly = ({ children, fallback = null }) => {
    return <RoleGate allowedRoles={['manager']} children={children} fallback={fallback} />;
};

export const OperatorOnly = ({ children, fallback = null }) => {
    return <RoleGate allowedRoles={['operator']} children={children} fallback={fallback} />;
};

export const ViewerOnly = ({ children, fallback = null }) => {
    return <RoleGate allowedRoles={['viewer']} children={children} fallback={fallback} />;
};

// Access denied component
export const AccessDenied = ({ message = "You don't have permission to access this page." }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="mx-auto mb-4">
                    <i className="fas fa-lock text-6xl text-gray-400"></i>
                </div>
                <h2 className="text-2xl font-semibold text-gray-700 mb-2">Access Denied</h2>
                <p className="text-gray-500">{message}</p>
            </div>
        </div>
    );
};

export default RoleGate;

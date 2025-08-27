// Role-based view access permissions
export const ROLE_VIEWS = {
    admin: ['admin-settings', 'change-password'],
    manager: ['dashboard', 'shift-entry', 'history', 'settings', 'change-password'],
    operator: ['shift-entry', 'change-password'],
    viewer: ['dashboard', 'change-password']
};

export const DEFAULT_VIEWS = {
    admin: 'admin-settings',
    manager: 'dashboard',
    operator: 'shift-entry',
    viewer: 'dashboard'
};

// Helper function to get allowed views for a role
export const getAllowedViews = (role) => {
    return ROLE_VIEWS[role] || [];
};

// Helper function to get default view for a role
export const getDefaultView = (role) => {
    return DEFAULT_VIEWS[role] || 'dashboard';
};

// Helper function to check if a role can access a specific view
export const canAccessView = (role, view) => {
    const allowedViews = getAllowedViews(role);
    return allowedViews.includes(view);
};

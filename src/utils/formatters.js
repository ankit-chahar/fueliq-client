// --- Helper Functions ---
export const roundMoney = (value) => Math.round(value || 0);
export const formatMoney = (value) => `₹${roundMoney(value).toLocaleString('en-IN')}`;
export const formatLitre = (value) => (parseFloat(value) || 0).toFixed(2);
export const generateId = () => `id_${new Date().getTime()}_${Math.random()}`;

// Generate initials from full name
export const generateInitials = (fullName) => {
    if (!fullName || typeof fullName !== 'string') {
        return 'U'; // Default to 'U' for User if no name provided
    }
    
    return fullName
        .trim()
        .split(' ')
        .filter(name => name.length > 0)
        .map(name => name.charAt(0).toUpperCase())
        .slice(0, 2) // Take only first 2 initials
        .join('');
};

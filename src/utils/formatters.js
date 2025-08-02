// --- Helper Functions ---
export const roundMoney = (value) => Math.round(value || 0);
export const formatMoney = (value) => `₹${roundMoney(value).toLocaleString('en-IN')}`;
export const formatLitre = (value) => (parseFloat(value) || 0).toFixed(2);
export const generateId = () => `id_${new Date().getTime()}_${Math.random()}`;

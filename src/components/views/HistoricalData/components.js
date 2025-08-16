// Sidebar Components
export const HistoricalSidebarItem = ({ id, label, icon, activeSection, onClick }) => (
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

export const MobileHistoricalSidebarItem = ({ id, label, icon, activeSection, onClick }) => (
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

// Error State Component
export const ErrorState = ({ message, onRetry }) => (
    <div className="text-center py-8">
        <div className="text-red-600 mb-4">
            <i className="fas fa-exclamation-circle text-3xl"></i>
        </div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        <button 
            onClick={onRetry}
            className="btn btn-primary"
        >
            <i className="fas fa-refresh mr-2"></i>
            Retry
        </button>
    </div>
);

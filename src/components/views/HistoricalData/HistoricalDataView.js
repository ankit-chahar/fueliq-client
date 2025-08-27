import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../constants/api';
import { HistoricalSidebarItem, MobileHistoricalSidebarItem, ErrorState } from './components';
import { 
    ShiftsHistoryContent, 
    CreditSalesHistoryContent, 
    CreditCollectionsHistoryContent, 
    LubeSalesHistoryContent, 
    ExpensesHistoryContent 
} from './contentComponents';
import { RoleGate, AccessDenied } from '../../common/RoleGate';

const HistoricalDataView = ({ showSuccessBanner }) => {
    return (
        <RoleGate 
            allowedRoles={['manager']} 
            fallback={<AccessDenied message="Only managers can access the Historical Data page." />}
        >
            <HistoricalDataContent showSuccessBanner={showSuccessBanner} />
        </RoleGate>
    );
};

const HistoricalDataContent = ({ showSuccessBanner }) => {
    const [activeSection, setActiveSection] = useState('shifts');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        shifts: [],
        creditSales: [],
        creditCollections: [],
        lubeSales: [],
        expenses: []
    });

    // Filter states
    const [filters, setFilters] = useState({
        fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        toDate: new Date().toISOString().split('T')[0], // today
        shiftType: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);

    // Fetch data based on active section
    const fetchData = async (section, filterParams = null) => {
        // Only fetch data for shifts section, others are placeholder cards
        if (section !== 'shifts') {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const params = new URLSearchParams();
            const currentFilters = filterParams || filters;
            
            params.append('fromDate', currentFilters.fromDate);
            params.append('toDate', currentFilters.toDate);
            if (currentFilters.shiftType !== 'all') {
                params.append('shiftType', currentFilters.shiftType);
            }

            // Fetch actual data from backend
            const response = await axios.get(`${API_URL}/api/shifts/history?${params.toString()}`);
            if (response.data.success) {
                setData(prev => ({
                    ...prev,
                    shifts: response.data.data || []
                }));
            } else {
                throw new Error(response.data.message || 'Failed to fetch shifts data');
            }
        } catch (error) {
            console.error('Error fetching shifts data:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to load shifts data';
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData(activeSection);
    }, [activeSection]);

    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const applyFilters = () => {
        fetchData(activeSection, filters);
        setShowFilters(false);
    };

    const resetFilters = () => {
        const defaultFilters = {
            fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            toDate: new Date().toISOString().split('T')[0],
            shiftType: 'all'
        };
        setFilters(defaultFilters);
        fetchData(activeSection, defaultFilters);
        setShowFilters(false);
    };

    const setQuickDateRange = (days) => {
        const toDate = new Date().toISOString().split('T')[0];
        const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const newFilters = {
            ...filters,
            fromDate,
            toDate
        };
        setFilters(newFilters);
        fetchData(activeSection, newFilters);
    };

    // Loading state - only show loading for shifts section
    if (isLoading && activeSection === 'shifts') {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="card p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading historical data...</p>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'shifts':
                return (
                    <ShiftsHistoryContent 
                        data={data.shifts} 
                        error={error} 
                        onRetry={() => fetchData('shifts')}
                        filters={filters}
                        showFilters={showFilters}
                        onToggleFilters={() => setShowFilters(!showFilters)}
                        onFilterChange={handleFilterChange}
                        onApplyFilters={applyFilters}
                        onResetFilters={resetFilters}
                        onQuickDateRange={setQuickDateRange}
                    />
                );
            case 'credit-sales':
                return <CreditSalesHistoryContent data={[]} error={null} onRetry={() => {}} />;
            case 'credit-collections':
                return <CreditCollectionsHistoryContent data={[]} error={null} onRetry={() => {}} />;
            case 'lube-sales':
                return <LubeSalesHistoryContent data={[]} error={null} onRetry={() => {}} />;
            case 'expenses':
                return <ExpensesHistoryContent data={[]} error={null} onRetry={() => {}} />;
            default:
                return (
                    <ShiftsHistoryContent 
                        data={data.shifts} 
                        error={error} 
                        onRetry={() => fetchData('shifts')}
                        filters={filters}
                        showFilters={showFilters}
                        onToggleFilters={() => setShowFilters(!showFilters)}
                        onFilterChange={handleFilterChange}
                        onApplyFilters={applyFilters}
                        onResetFilters={resetFilters}
                        onQuickDateRange={setQuickDateRange}
                    />
                );
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Mobile Header with Menu Toggle */}
            <div className="md:hidden mb-4">
                <div className="card p-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Historical Data</h2>
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
                            <MobileHistoricalSidebarItem
                                id="shifts"
                                label="Shifts"
                                icon="fa-clock"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileHistoricalSidebarItem
                                id="credit-sales"
                                label="Credit Sales"
                                icon="fa-credit-card"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileHistoricalSidebarItem
                                id="credit-collections"
                                label="Credit Collections"
                                icon="fa-money-bill-wave"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileHistoricalSidebarItem
                                id="lube-sales"
                                label="Lube Sales"
                                icon="fa-oil-can"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileHistoricalSidebarItem
                                id="expenses"
                                label="Expenses"
                                icon="fa-receipt"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                        </nav>
                    </div>
                )}
            </div>

            <div className="flex gap-6">
                {/* Desktop Sidebar Navigation */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <div className="card p-4 sticky top-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Historical Data</h3>
                        <nav className="space-y-2">
                            <HistoricalSidebarItem
                                id="shifts"
                                label="Shifts"
                                icon="fa-clock"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <HistoricalSidebarItem
                                id="credit-sales"
                                label="Credit Sales"
                                icon="fa-credit-card"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <HistoricalSidebarItem
                                id="credit-collections"
                                label="Credit Collections"
                                icon="fa-money-bill-wave"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <HistoricalSidebarItem
                                id="lube-sales"
                                label="Lube Sales"
                                icon="fa-oil-can"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <HistoricalSidebarItem
                                id="expenses"
                                label="Expenses"
                                icon="fa-receipt"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 w-full md:w-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default HistoricalDataView;

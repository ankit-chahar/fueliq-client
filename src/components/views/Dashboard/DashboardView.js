import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { formatMoney } from '../../../utils';
import { API_URL } from '../../../constants';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

const DashboardView = () => {
    const [activeDashboardTab, setActiveDashboardTab] = useState('overview');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const renderDashboardView = () => {
        switch (activeDashboardTab) {
            case 'overview':
                return <DashboardOverviewView formatMoney={formatMoney} formatDate={formatDate} onNavigateToTab={setActiveDashboardTab} />;
            case 'daily-report':
                return <DashboardDailyReportView selectedDate={selectedDate} formatMoney={formatMoney} />;
            case 'creditors':
                return <DashboardCreditorsView formatMoney={formatMoney} />;
            default:
                return <DashboardOverviewView selectedDate={selectedDate} formatMoney={formatMoney} formatDate={formatDate} onNavigateToTab={setActiveDashboardTab} />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
        {/* Dashboard Header with Conditional Date Selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            {activeDashboardTab === 'daily-report' && (
                <div className="mt-4 md:mt-0 flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Showing data for:</span>
                    <input 
                        type="date" 
                        className="bg-white border border-gray-300 rounded-md p-2 text-sm" 
                        value={selectedDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            )}
        </div>            {/* Dashboard Sub-Navigation */}
            <div className="mb-6 overflow-x-auto pb-2">
                <div className="flex space-x-2 min-w-max">
                    <button 
                        onClick={() => setActiveDashboardTab('overview')} 
                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            activeDashboardTab === 'overview' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                        }`}
                    >
                        <i className="fas fa-chart-line"></i>
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveDashboardTab('daily-report')} 
                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            activeDashboardTab === 'daily-report' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                        }`}
                    >
                        <i className="fas fa-file-alt"></i>
                        Daily Report
                    </button>
                    <button 
                        onClick={() => setActiveDashboardTab('creditors')} 
                        className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                            activeDashboardTab === 'creditors' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'bg-white text-gray-600 hover:bg-gray-50 border'
                        }`}
                    >
                        <i className="fas fa-users"></i>
                        Creditors
                    </button>
                </div>
            </div>

            {/* Dashboard Content */}
            {renderDashboardView()}
        </div>
    );
};

// Dashboard Overview Sub-Component
const DashboardOverviewView = ({ formatMoney, formatDate, onNavigateToTab }) => {
    const [activeChartTab, setActiveChartTab] = useState('amount');
    const [dashboardData, setDashboardData] = useState({
        summary: null,
        salesTrend: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [salesTrendChart, setSalesTrendChart] = useState(null);

    // Use current date for overview data
    const currentDate = new Date().toISOString().split('T')[0];

    // Initialize Chart.js chart
    const initializeSalesTrendChart = useCallback(() => {
        const canvas = document.getElementById('salesTrendChart');
        if (!canvas || !dashboardData.salesTrend?.trendData) return;

        // Destroy existing chart if it exists
        if (salesTrendChart) {
            salesTrendChart.destroy();
        }

        const ctx = canvas.getContext('2d');
        const trendData = dashboardData.salesTrend.trendData;

        // Prepare data based on active tab
        const labels = trendData.map(day => formatDate(day.date));
        
        let datasets = [];
        if (activeChartTab === 'amount') {
            datasets = [
                {
                    label: 'Total Sales',
                    data: trendData.map(day => day.totalSales),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0
                },
                {
                    label: 'MS Sales',
                    data: trendData.map(day => day.msSales),
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0
                },
                {
                    label: 'HSD Sales',
                    data: trendData.map(day => day.hsdSales),
                    borderColor: '#f59e0b',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0
                }
            ];
        } else {
            datasets = [
                {
                    label: 'Total Litres',
                    data: trendData.map(day => day.totalLitres),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0
                },
                {
                    label: 'MS Litres',
                    data: trendData.map(day => day.msLitres),
                    borderColor: '#10b981',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0
                },
                {
                    label: 'HSD Litres',
                    data: trendData.map(day => day.hsdLitres),
                    borderColor: '#f59e0b',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0
                }
            ];
        }

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 0 // Disable animations to prevent flickering
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (activeChartTab === 'amount') {
                                    return '₹' + value.toLocaleString();
                                } else {
                                    return value.toLocaleString() + 'L';
                                }
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                if (activeChartTab === 'amount') {
                                    return context.dataset.label + ': ₹' + context.raw.toLocaleString();
                                } else {
                                    return context.dataset.label + ': ' + context.raw.toLocaleString() + 'L';
                                }
                            }
                        }
                    }
                }
            }
        });

        setSalesTrendChart(chart);
    }, [dashboardData.salesTrend, activeChartTab, formatDate]);

    // Update chart when tab changes or data changes
    useEffect(() => {
        if (dashboardData.salesTrend?.trendData) {
            initializeSalesTrendChart();
        }
    }, [initializeSalesTrendChart]);

    // Cleanup chart on unmount
    useEffect(() => {
        return () => {
            if (salesTrendChart) {
                salesTrendChart.destroy();
            }
        };
    }, [salesTrendChart]);

    // Fetch dashboard overview data from API
    const fetchDashboardData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Fetch real sales trend data from API
            const salesTrendResponse = await axios.get(`${API_URL}/api/dashboard/sales-trend`, {
                params: {
                    date: currentDate,
                    numberOfDays: 7
                }
            });

            // Fetch monthly fuel summary data from API
            const monthlyFuelResponse = await axios.get(`${API_URL}/api/dashboard/monthly-fuel-summary`, {
                params: {
                    date: currentDate
                }
            });

            // For now, we'll create mock summary data. In a real implementation, this would also be an API call
            const mockSummary = {
                totalSales: 125000,
                totalLitres: 1250,
                totalCredit: 15000,
                cashInHand: 110000,
                shiftsCount: 3
            };

            setDashboardData({
                summary: mockSummary,
                salesTrend: salesTrendResponse.data.data.salesTrend,
                monthlyFuelSummary: monthlyFuelResponse.data.data.monthlyFuelSummary
            });
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, [currentDate]); // Use currentDate instead of selectedDate

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (isLoading) {
        return (
            <div className="p-6 card text-center">
                <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
                <h2 className="text-lg font-semibold text-gray-700">Loading Overview...</h2>
                <p className="text-gray-500 mt-2">Please wait while we fetch the latest data.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 card text-center">
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded card">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                </div>
                <button 
                    onClick={fetchDashboardData}
                    className="btn btn-primary"
                >
                    <i className="fas fa-refresh mr-2"></i>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Sales Trend Chart - Full Width */}
            <div className="card p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-700">Sales Trend (Last 7 Days)</h2>
                    <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                        <button 
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                activeChartTab === 'amount' 
                                    ? 'bg-indigo-50 text-indigo-600' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => setActiveChartTab('amount')}
                        >
                            Amount Trend (₹)
                        </button>
                        <button 
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                                activeChartTab === 'litre' 
                                    ? 'bg-indigo-50 text-indigo-600' 
                                    : 'text-gray-600 hover:text-gray-800'
                            }`}
                            onClick={() => setActiveChartTab('litre')}
                        >
                            Volume Trend (Ltr)
                        </button>
                    </div>
                </div>
                <div className="h-96">
                    {dashboardData.salesTrend && dashboardData.salesTrend.trendData ? (
                        <canvas id="salesTrendChart"></canvas>
                    ) : (
                        <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <i className="fas fa-chart-line text-4xl text-gray-400 mb-2"></i>
                                <p className="text-gray-500">No sales data available</p>
                                <p className="text-sm text-gray-400">Data will appear when shifts are recorded</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Monthly Fuel Volume Summary */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">This Month's Fuel Volume</h2>
                    <div className="space-y-4">
                        {dashboardData.monthlyFuelSummary && dashboardData.monthlyFuelSummary.fuelBreakdown ? (
                            <>
                                {dashboardData.monthlyFuelSummary.fuelBreakdown.map((fuel, index) => {
                                    const colorClasses = [
                                        { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-600' },
                                        { bg: 'bg-green-50', text: 'text-green-600', dot: 'bg-green-600' },
                                        { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-600' }
                                    ];
                                    const colors = colorClasses[index % colorClasses.length];
                                    
                                    return (
                                        <div key={fuel.fuelType} className={`flex justify-between items-center p-4 ${colors.bg} rounded-lg`}>
                                            <div className="flex items-center">
                                                <div className={`w-4 h-4 ${colors.dot} rounded-full mr-3`}></div>
                                                <div>
                                                    <span className="font-medium text-gray-800">{fuel.fuelName}</span>
                                                    <p className="text-sm text-gray-500">{fuel.volumePercentage}% of total</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl font-bold ${colors.text}`}>
                                                    {fuel.volume.toLocaleString()}
                                                </span>
                                                <p className="text-sm text-gray-500">Litres</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-700">Total Volume</span>
                                        <span className="text-xl font-bold text-gray-800">
                                            {dashboardData.monthlyFuelSummary.totalVolume.toLocaleString()} L
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <i className="fas fa-gas-pump text-4xl text-gray-400 mb-2"></i>
                                <p className="text-gray-500">No fuel data available</p>
                                <p className="text-sm text-gray-400">Data will appear when fuel entries are recorded</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Fuel Sales Summary */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">This Month's Fuel Sales</h2>
                    <div className="space-y-4">
                        {dashboardData.monthlyFuelSummary && dashboardData.monthlyFuelSummary.fuelBreakdown ? (
                            <>
                                {dashboardData.monthlyFuelSummary.fuelBreakdown.map((fuel, index) => {
                                    const colorClasses = [
                                        { bg: 'bg-purple-50', text: 'text-purple-600', dot: 'bg-purple-600' },
                                        { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-600' },
                                        { bg: 'bg-indigo-50', text: 'text-indigo-600', dot: 'bg-indigo-600' }
                                    ];
                                    const colors = colorClasses[index % colorClasses.length];
                                    
                                    return (
                                        <div key={fuel.fuelType} className={`flex justify-between items-center p-4 ${colors.bg} rounded-lg`}>
                                            <div className="flex items-center">
                                                <div className={`w-4 h-4 ${colors.dot} rounded-full mr-3`}></div>
                                                <div>
                                                    <span className="font-medium text-gray-800">{fuel.fuelName}</span>
                                                    <p className="text-sm text-gray-500">{fuel.salesPercentage}% of total</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl font-bold ${colors.text}`}>
                                                    {formatMoney(fuel.salesAmount)}
                                                </span>
                                                <p className="text-sm text-gray-500">@₹{fuel.avgPrice}/L avg</p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-700">Total Sales</span>
                                        <span className="text-xl font-bold text-gray-800">
                                            {formatMoney(dashboardData.monthlyFuelSummary.totalSales)}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <i className="fas fa-rupee-sign text-4xl text-gray-400 mb-2"></i>
                                <p className="text-gray-500">No sales data available</p>
                                <p className="text-sm text-gray-400">Data will appear when fuel entries are recorded</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Dashboard Daily Report Sub-Component
const DashboardDailyReportView = ({ selectedDate, formatMoney }) => {
    const [dashboardData, setDashboardData] = useState({
        summary: null,
        fuelBreakdown: null,
        paymentBreakdown: null,
        expenseBreakdown: null,
        creditSales: null,
        creditCollections: null
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch detailed daily report data from API
    const fetchDailyReportData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            // Mock data for daily report
            const mockSummary = {
                totalSales: 125000,
                totalLitres: 1250,
                totalCredit: 15000,
                cashInHand: 110000,
                shiftsCount: 3
            };

            const mockFuelBreakdown = {
                fuelBreakdown: [
                    { fuelType: 'MS', amount: 75000, volume: 750, avgPrice: 100, amountPercentage: 60, volumePercentage: 60 },
                    { fuelType: 'HSD', amount: 50000, volume: 500, avgPrice: 100, amountPercentage: 40, volumePercentage: 40 }
                ]
            };

            const mockPaymentBreakdown = {
                cashPayments: 100000,
                digitalPayments: 25000,
                breakdown: {
                    cashFromFuel: 85000,
                    cashFromCollections: 15000,
                    digitalFromFuel: 20000,
                    digitalFromCollections: 5000
                }
            };

            const mockExpenseBreakdown = {
                totalExpenses: 5000,
                expenseBreakdown: [
                    { category: 'Fuel Purchase', amount: 3000, transactionCount: 2, percentage: 60 },
                    { category: 'Maintenance', amount: 2000, transactionCount: 1, percentage: 40 }
                ]
            };

            const mockCreditSales = {
                totalCreditSales: 15000,
                transactionCount: 3,
                creditSales: [
                    { partyName: 'ABC Company', amount: 8000, fuelType: 'MS', shiftType: 'Morning', remarks: 'Regular client' },
                    { partyName: 'XYZ Motors', amount: 5000, fuelType: 'HSD', shiftType: 'Evening', remarks: '' },
                    { partyName: 'Local Transport', amount: 2000, fuelType: 'MS', shiftType: 'Night', remarks: 'Emergency' }
                ]
            };

            const mockCreditCollections = {
                totalCreditCollections: 12000,
                transactionCount: 4,
                creditCollections: [
                    { partyName: 'ABC Company', amount: 5000, mode: 'Cash', shiftType: 'Morning', remarks: 'Partial payment' },
                    { partyName: 'DEF Industries', amount: 3000, mode: 'Bank Transfer', shiftType: 'Morning', remarks: 'Online payment' },
                    { partyName: 'GHI Transport', amount: 2500, mode: 'Cash', shiftType: 'Evening', remarks: 'Full settlement' },
                    { partyName: 'JKL Motors', amount: 1500, mode: 'Cheque', shiftType: 'Night', remarks: 'Post-dated cheque' }
                ]
            };

            setDashboardData({
                summary: mockSummary,
                fuelBreakdown: mockFuelBreakdown,
                paymentBreakdown: mockPaymentBreakdown,
                expenseBreakdown: mockExpenseBreakdown,
                creditSales: mockCreditSales,
                creditCollections: mockCreditCollections
            });
        } catch (err) {
            console.error('Error fetching daily report data:', err);
            setError('Failed to load daily report data. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, []); // Remove selectedDate dependency as we're using mock data

    useEffect(() => {
        fetchDailyReportData();
    }, [fetchDailyReportData]);

    if (isLoading) {
        return (
            <div className="p-6 card text-center">
                <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
                <h2 className="text-lg font-semibold text-gray-700">Loading Daily Report...</h2>
                <p className="text-gray-500 mt-2">Please wait while we fetch the detailed data.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 card text-center">
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded card">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                </div>
                <button 
                    onClick={fetchDailyReportData}
                    className="btn btn-primary"
                >
                    <i className="fas fa-refresh mr-2"></i>
                    Retry
                </button>
            </div>
        );
    }

    const { summary, fuelBreakdown, paymentBreakdown, expenseBreakdown, creditSales, creditCollections } = dashboardData;

    return (
        <div>
            {/* Full KPI Header */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Sales */}
                <div className="card flex items-center p-6">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mr-4">
                        <i className="fas fa-rupee-sign text-2xl text-blue-600"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Sales</p>
                        <p className="text-3xl font-bold text-gray-800">{formatMoney(summary?.totalSales || 0)}</p>
                        {summary?.shiftsCount && (
                            <p className="text-xs text-gray-400">{summary.shiftsCount} shift(s)</p>
                        )}
                    </div>
                </div>
                
                {/* Litres Sold */}
                <div className="card flex items-center p-6">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mr-4">
                        <i className="fas fa-gas-pump text-2xl text-green-600"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Litres Sold</p>
                        <p className="text-3xl font-bold text-gray-800">{(summary?.totalLitres || 0).toLocaleString()} L</p>
                    </div>
                </div>
                
                {/* Total Credit */}
                <div className="card flex items-center p-6">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-yellow-100 mr-4">
                        <i className="fas fa-credit-card text-2xl text-yellow-600"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Credit</p>
                        <p className="text-3xl font-bold text-gray-800">{formatMoney(summary?.totalCredit || 0)}</p>
                    </div>
                </div>
                
                {/* Cash in Hand */}
                <div className="card flex items-center p-6">
                    <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-indigo-100 mr-4">
                        <i className="fas fa-wallet text-2xl text-indigo-600"></i>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Cash in Hand</p>
                        <p className="text-3xl font-bold text-gray-800">{formatMoney(summary?.cashInHand || 0)}</p>
                    </div>
                </div>
            </div>

            {/* Detailed Widgets Grid */}
            <div className="space-y-8">
                {/* First Row - Sales by Fuel and Payment Mode Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sales by Fuel */}
                    <div className="card p-6">
                    <div className="flex items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-700 mr-4">Sales by Fuel</h2>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-blue-600 mr-1.5"></span>₹
                            </span>
                            <span className="flex items-center">
                                <span className="w-3 h-3 rounded-full bg-green-600 mr-1.5"></span>Ltr
                            </span>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {fuelBreakdown?.fuelBreakdown?.length > 0 ? (
                            fuelBreakdown.fuelBreakdown.map((fuel, index) => (
                                <div key={index}>
                                    <p className="text-sm font-medium text-gray-800 mb-2">
                                        {fuel.fuelType.toUpperCase()} 
                                        {fuel.avgPrice > 0 && (
                                            <span className="text-xs text-gray-500 ml-2">@ ₹{fuel.avgPrice}/L</span>
                                        )}
                                    </p>
                                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-1">
                                        <span>Amount</span>
                                        <span>{formatMoney(fuel.amount)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full" 
                                            style={{ width: `${fuel.amountPercentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium text-gray-500 mb-1 mt-2">
                                        <span>Volume</span>
                                        <span>{fuel.volume} L</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-green-600 h-2 rounded-full" 
                                            style={{ width: `${fuel.volumePercentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm">No fuel sales data for selected date</p>
                        )}
                    </div>
                </div>

                {/* Payment Mode Summary */}
                <div className="card p-6 xl:col-span-1">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Payment Mode Summary</h2>
                    {paymentBreakdown ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                                <div className="flex items-center">
                                    <i className="fas fa-money-bill-wave text-green-600 mr-3"></i>
                                    <span className="font-medium">Cash Payments</span>
                                </div>
                                <span className="font-bold text-green-600">{formatMoney(paymentBreakdown.cashPayments)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center">
                                    <i className="fas fa-credit-card text-blue-600 mr-3"></i>
                                    <span className="font-medium">Digital Payments</span>
                                </div>
                                <span className="font-bold text-blue-600">{formatMoney(paymentBreakdown.digitalPayments)}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1 mt-4 pt-3 border-t">
                                <div className="flex justify-between">
                                    <span>Cash from Fuel Sales:</span>
                                    <span>{formatMoney(paymentBreakdown.breakdown?.cashFromFuel || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Cash Collections:</span>
                                    <span>{formatMoney(paymentBreakdown.breakdown?.cashFromCollections || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Digital from Fuel:</span>
                                    <span>{formatMoney(paymentBreakdown.breakdown?.digitalFromFuel || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Digital Collections:</span>
                                    <span>{formatMoney(paymentBreakdown.breakdown?.digitalFromCollections || 0)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No payment data for selected date</p>
                    )}
                </div>
            </div>

            {/* Second Row - Expense Breakdown, Credit Sales, and Credit Collections */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

                {/* Expense Breakdown */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Expense Breakdown</h2>
                    {expenseBreakdown?.expenseBreakdown?.length > 0 ? (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-2xl font-bold text-red-600">{formatMoney(expenseBreakdown.totalExpenses)}</p>
                                <p className="text-sm text-gray-500">Total Expenses</p>
                            </div>
                            <div className="space-y-3">
                                {expenseBreakdown.expenseBreakdown.map((expense, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <span className="font-medium text-gray-800">{expense.category}</span>
                                            <p className="text-xs text-gray-500">{expense.transactionCount} transaction(s)</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-bold text-gray-700">{formatMoney(expense.amount)}</span>
                                            <p className="text-xs text-gray-500">{expense.percentage}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No expenses for selected date</p>
                    )}
                </div>

                {/* Today's Credit Sales */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Today's Credit Sales</h2>
                    {creditSales?.creditSales?.length > 0 ? (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-2xl font-bold text-yellow-600">{formatMoney(creditSales.totalCreditSales)}</p>
                                <p className="text-sm text-gray-500">{creditSales.transactionCount} transaction(s)</p>
                            </div>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {creditSales.creditSales.map((sale, index) => (
                                    <div key={index} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-medium text-gray-800">{sale.partyName}</span>
                                                <p className="text-xs text-gray-500">
                                                    {sale.fuelType} • {sale.shiftType} shift
                                                </p>
                                                {sale.remarks && (
                                                    <p className="text-xs text-gray-600 mt-1">{sale.remarks}</p>
                                                )}
                                            </div>
                                            <span className="font-bold text-yellow-600">{formatMoney(sale.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No credit sales for selected date</p>
                    )}
                </div>

                {/* Today's Credit Collections */}
                <div className="card p-6">
                    <h2 className="text-xl font-bold text-gray-700 mb-4">Today's Credit Collections</h2>
                    {creditCollections?.creditCollections?.length > 0 ? (
                        <div className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-2xl font-bold text-green-600">{formatMoney(creditCollections.totalCreditCollections)}</p>
                                <p className="text-sm text-gray-500">{creditCollections.transactionCount} transaction(s)</p>
                            </div>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {creditCollections.creditCollections.map((collection, index) => (
                                    <div key={index} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-medium text-gray-800">{collection.partyName}</span>
                                                <p className="text-xs text-gray-500">
                                                    {collection.mode} • {collection.shiftType} shift
                                                </p>
                                                {collection.remarks && (
                                                    <p className="text-xs text-gray-600 mt-1">{collection.remarks}</p>
                                                )}
                                            </div>
                                            <span className="font-bold text-green-600">{formatMoney(collection.amount)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm">No credit collections for selected date</p>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};

// Dashboard Creditors Sub-Component
const DashboardCreditorsView = ({ formatMoney }) => {
    const [creditorsData, setCreditorsData] = useState(null);
    const [selectedCreditor, setSelectedCreditor] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCreditors, setFilteredCreditors] = useState([]);

    // Fetch detailed creditors data from API
    const fetchCreditorsData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/creditors`);
            
            if (response.data.success) {
                setCreditorsData(response.data.data);
                // Initialize filtered creditors with all creditors
                setFilteredCreditors(response.data.data.creditors || []);
            } else {
                throw new Error(response.data.message || 'Failed to fetch creditors data');
            }
        } catch (err) {
            console.error('Error fetching creditors data:', err);
            setError('Failed to load creditors data. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch transaction history for a specific creditor
    const fetchTransactionHistory = useCallback(async (creditorName) => {
        setLoadingTransactions(true);
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/creditors/${encodeURIComponent(creditorName)}/transactions`);
            
            if (response.data.success) {
                // Update the selected creditor with transaction history and additional data
                setSelectedCreditor(prev => ({
                    ...prev,
                    totalAmount: response.data.data.totalAmount,
                    transactionCount: response.data.data.transactionCount,
                    transactions: response.data.data.transactions
                }));
            } else {
                throw new Error(response.data.message || 'Failed to fetch transaction history');
            }
        } catch (err) {
            console.error('Error fetching transaction history:', err);
            setError('Failed to load transaction history.');
        } finally {
            setLoadingTransactions(false);
        }
    }, []);

    useEffect(() => {
        fetchCreditorsData();
    }, [fetchCreditorsData]);

    // Filter creditors based on search query
    useEffect(() => {
        if (creditorsData?.creditors) {
            if (searchQuery.trim() === '') {
                setFilteredCreditors(creditorsData.creditors);
            } else {
                const filtered = creditorsData.creditors.filter(creditor => {
                    // Split the name into words and check if any word starts with the search query
                    const nameWords = creditor.name.toLowerCase().split(' ');
                    return nameWords.some(word => 
                        word.startsWith(searchQuery.toLowerCase())
                    );
                });
                setFilteredCreditors(filtered);
            }
        }
    }, [creditorsData, searchQuery]);

    if (isLoading) {
        return (
            <div className="p-6 card text-center">
                <i className="fas fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
                <h2 className="text-lg font-semibold text-gray-700">Loading Creditors...</h2>
                <p className="text-gray-500 mt-2">Please wait while we fetch the creditors data.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 card text-center">
                <div className="p-4 mb-4 bg-red-100 text-red-700 rounded card">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                </div>
                <button 
                    onClick={fetchCreditorsData}
                    className="btn btn-primary"
                >
                    <i className="fas fa-refresh mr-2"></i>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* High-Level Summary Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-${searchQuery ? '3' : '2'} gap-6 mb-8`}>
                <div className="card p-6 text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
                        <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">Total Outstanding Credit</h3>
                    <p className="text-3xl font-bold text-red-600 mt-2">{formatMoney(creditorsData?.totalOutstanding || 0)}</p>
                </div>
                
                <div className="card p-6 text-center">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4">
                        <i className="fas fa-users text-2xl text-blue-600"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700">
                        {searchQuery ? 'Filtered' : 'Active'} Creditors
                    </h3>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                        {searchQuery ? filteredCreditors.length : (creditorsData?.creditorsCount || 0)}
                    </p>
                </div>

                {searchQuery && (
                    <div className="card p-6 text-center">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
                            <i className="fas fa-filter text-2xl text-green-600"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700">Filtered Outstanding</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {formatMoney(filteredCreditors.reduce((sum, creditor) => sum + creditor.totalAmount, 0))}
                        </p>
                    </div>
                )}
            </div>

            {/* Detailed Creditor Table */}
            <div className="card p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-700">Creditor Details</h2>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                            <i className="fas fa-search text-gray-400 text-sm"></i>
                        </div>
                        <input
                            type="text"
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Search creditors by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 hover:bg-gray-50 rounded-r-md"
                                type="button"
                            >
                                <i className="fas fa-times text-gray-400 hover:text-gray-600 text-sm"></i>
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-sm text-gray-600 mt-2">
                            Showing {filteredCreditors.length} of {creditorsData?.creditors?.length || 0} creditors
                        </p>
                    )}
                </div>
                {filteredCreditors.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Party Name</th>
                                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Amount Due</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Transactions</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Last Transaction</th>
                                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCreditors.map((creditor, index) => (
                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div>
                                                <span className="font-medium text-gray-800">{creditor.name}</span>
                                                <p className="text-xs text-gray-500">
                                                    Since: {new Date(creditor.firstTransactionDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="font-bold text-red-600">{formatMoney(creditor.totalAmount)}</span>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                                {creditor.transactionCount}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-center text-gray-600">
                                            {new Date(creditor.lastTransactionDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button 
                                                className="btn btn-secondary text-xs px-3 py-1"
                                                onClick={async () => {
                                                    setSelectedCreditor(creditor);
                                                    await fetchTransactionHistory(creditor.name);
                                                }}
                                            >
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : searchQuery ? (
                    <div className="text-center py-8">
                        <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                        <p className="text-lg font-medium text-gray-500">No Creditors Found</p>
                        <p className="text-sm text-gray-400">
                            No creditors match your search for "{searchQuery}"
                        </p>
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="btn btn-secondary mt-4"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
                        <p className="text-lg font-medium text-gray-500">No Active Creditors</p>
                        <p className="text-sm text-gray-400">All outstanding credit has been cleared!</p>
                    </div>
                )}
            </div>

            {/* Creditor Transaction History Modal */}
            {selectedCreditor && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">{selectedCreditor.name}</h3>
                                    <p className="text-sm text-gray-500">Transaction History</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-red-600">{formatMoney(selectedCreditor.totalAmount)}</p>
                                    <p className="text-xs text-gray-500">{selectedCreditor.transactionCount} transactions</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-96">
                            {loadingTransactions ? (
                                <div className="text-center py-8">
                                    <i className="fas fa-spinner fa-spin text-2xl text-blue-500 mb-4"></i>
                                    <p className="text-gray-600">Loading transaction history...</p>
                                </div>
                            ) : selectedCreditor.transactions && selectedCreditor.transactions.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedCreditor.transactions.map((transaction, index) => {
                                        // Determine border color based on transaction type
                                        const borderColor = transaction.transactionType === 'credit_sale' ? 'border-red-400' : 
                                                          transaction.transactionType === 'credit_collection' ? 'border-green-400' : 
                                                          'border-yellow-400';
                                        
                                        return (
                                            <div key={index} className={`p-4 bg-gray-50 rounded-lg border-l-4 ${borderColor}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-gray-800">{formatMoney(transaction.amount)}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {transaction.typeDetail} • {transaction.shiftType} shift
                                                        </p>
                                                        {transaction.remarks && (
                                                            <p className="text-xs text-gray-500 mt-1">{transaction.remarks}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-gray-700">
                                                            {new Date(transaction.date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <i className="fas fa-file-alt text-4xl text-gray-300 mb-4"></i>
                                    <p className="text-lg font-medium text-gray-500">No Transaction History</p>
                                    <p className="text-sm text-gray-400">No transactions found for this creditor.</p>
                                </div>
                            )}
                        </div>
                        <div className="p-6 border-t border-gray-200 text-right">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setSelectedCreditor(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardView;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../constants/api';
import { ErrorState } from './components';
import { SuccessBanner } from '../../common';

// Import the ShiftEntryView for reuse in modal
const ShiftEntryView = React.lazy(() => import('../ShiftEntry/ShiftEntryView'));

// Content Components
export const ShiftsHistoryContent = ({ 
    data, 
    error, 
    onRetry, 
    filters, 
    showFilters, 
    onToggleFilters, 
    onFilterChange, 
    onApplyFilters, 
    onResetFilters,
    onQuickDateRange 
}) => {
    const [selectedShift, setSelectedShift] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewDetails = (shift) => {
        setSelectedShift(shift);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedShift(null);
    };

    return (
        <>
            <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Shifts History</h2>
            <button 
                className={`btn ${showFilters ? 'btn-secondary' : 'btn-primary'}`}
                onClick={onToggleFilters}
            >
                <i className={`fas ${showFilters ? 'fa-times' : 'fa-filter'} mr-2`}></i>
                {showFilters ? 'Close Filters' : 'Filters'}
            </button>
        </div>
        
        {/* Filters Panel */}
        {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={filters.fromDate}
                            onChange={(e) => onFilterChange('fromDate', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={filters.toDate}
                            onChange={(e) => onFilterChange('toDate', e.target.value)}
                        />
                    </div>
                    
                    {/* Shift Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shift Type</label>
                        <select
                            className="input-field"
                            value={filters.shiftType}
                            onChange={(e) => onFilterChange('shiftType', e.target.value)}
                        >
                            <option value="all">All Shifts</option>
                            <option value="morning">Morning Only</option>
                            <option value="evening">Evening Only</option>
                        </select>
                    </div>
                    
                    {/* Filter Actions */}
                    <div className="flex items-end gap-2">
                        <button 
                            className="btn btn-primary flex-1"
                            onClick={onApplyFilters}
                        >
                            Apply
                        </button>
                        <button 
                            className="btn btn-secondary"
                            onClick={onResetFilters}
                        >
                            Reset
                        </button>
                    </div>
                </div>
                
                {/* Quick Date Range Buttons */}
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-gray-700 mr-2">Quick ranges:</span>
                    <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => onQuickDateRange(7)}
                    >
                        Last 7 days
                    </button>
                    <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => onQuickDateRange(30)}
                    >
                        Last 30 days
                    </button>
                    <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => onQuickDateRange(90)}
                    >
                        Last 3 months
                    </button>
                </div>
            </div>
        )}

        {/* Results Count */}
        {!error && (
            <div className="mb-4">
                <p className="text-sm text-gray-600">
                    Showing {data.length} shift{data.length !== 1 ? 's' : ''} 
                    {filters.fromDate && filters.toDate && (
                        <span> from {new Date(filters.fromDate).toLocaleDateString()} to {new Date(filters.toDate).toLocaleDateString()}</span>
                    )}
                    {filters.shiftType !== 'all' && (
                        <span> ({filters.shiftType} shifts only)</span>
                    )}
                </p>
            </div>
        )}
        
        {error ? (
            <ErrorState message={error} onRetry={onRetry} />
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                        <tr className="bg-gray-50">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Actual</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Online</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expenses</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                    <i className="fas fa-inbox text-3xl mb-2 block"></i>
                                    No shifts data found for the selected filters
                                </td>
                            </tr>
                        ) : (
                            data.map((shift, index) => (
                                <tr key={shift.id || index} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(shift.shift_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                            shift.shift_type === 'morning' 
                                                ? 'bg-yellow-100 text-yellow-800' 
                                                : 'bg-indigo-100 text-indigo-800'
                                        }`}>
                                            {shift.shift_type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{(shift.total_sale_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{(shift.total_cash_actual || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{(shift.total_online_fuel || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{(shift.total_credit || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{(shift.total_expenses || 0).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleViewDetails(shift)}
                                            className="btn btn-sm btn-primary"
                                            title="View shift details"
                                        >
                                            <i className="fas fa-eye mr-1"></i>
                                            Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        )}
    </div>

    {/* Shift Details Modal */}
    {isModalOpen && selectedShift && (
        <ShiftDetailsModal 
            shift={selectedShift} 
            onClose={handleCloseModal}
        />
    )}
</>
);
};

export const CreditSalesHistoryContent = ({ data, error, onRetry }) => (
    <div className="card p-6">
        <h2 className="text-xl font-bold mb-4">Credit Sales History</h2>
        <p>The credit sales history view with filters and a table will be implemented here.</p>
    </div>
);

export const CreditCollectionsHistoryContent = ({ data, error, onRetry }) => (
    <div className="card p-6">
        <h2 className="text-xl font-bold mb-4">Credit Collections History</h2>
        <p>The credit collections history view with filters and a table will be implemented here.</p>
    </div>
);

export const LubeSalesHistoryContent = ({ data, error, onRetry }) => (
    <div className="card p-6">
        <h2 className="text-xl font-bold mb-4">Lube Sales History</h2>
        <p>The lube sales history view with filters and a table will be implemented here.</p>
    </div>
);

export const ExpensesHistoryContent = ({ data, error, onRetry }) => (
    <div className="card p-6">
        <h2 className="text-xl font-bold mb-4">Expenses History</h2>
        <p>The expenses history view with filters and a table will be implemented here.</p>
    </div>
);

// Shift Details Modal Component - Reuses ShiftEntryView
const ShiftDetailsModal = ({ shift, onClose }) => {
    const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'edit'
    const [detailedShift, setDetailedShift] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const showSuccessBanner = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // Fetch detailed shift data when modal opens
    useEffect(() => {
        const fetchShiftDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const response = await axios.get(`${API_URL}/api/shifts/${shift.id}/details`);
                if (response.data.success) {
                    setDetailedShift(response.data.data);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch shift details');
                }
            } catch (error) {
                console.error('Error fetching shift details:', error);
                setError(error.response?.data?.message || error.message || 'Failed to load shift details');
            } finally {
                setIsLoading(false);
            }
        };

        if (shift?.id) {
            fetchShiftDetails();
        }
    }, [shift.id]);

    const handleRetry = () => {
        // Re-fetch data
        const fetchShiftDetails = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const response = await axios.get(`${API_URL}/api/shifts/${shift.id}/details`);
                if (response.data.success) {
                    setDetailedShift(response.data.data);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch shift details');
                }
            } catch (error) {
                console.error('Error fetching shift details:', error);
                setError(error.response?.data?.message || error.message || 'Failed to load shift details');
            } finally {
                setIsLoading(false);
            }
        };
        fetchShiftDetails();
    };

    const handleUpdateSuccess = () => {
        // Switch back to summary view and refresh the shift data
        setViewMode('summary');
        handleRetry(); // This will refresh the shift data to show updated values
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* Success Banner - positioned above modal */}
            {successMessage && <SuccessBanner message={successMessage} />}
            
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {viewMode === 'summary' ? 'Shift Details' : 'Edit Shift'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {new Date(shift.shift_date).toLocaleDateString()} - {shift.shift_type} shift
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {viewMode === 'summary' ? (
                            <button
                                onClick={() => setViewMode('edit')}
                                className="btn btn-primary"
                            >
                                <i className="fas fa-edit mr-2"></i>
                                Edit Shift
                            </button>
                        ) : (
                            <button
                                onClick={() => setViewMode('summary')}
                                className="btn btn-secondary"
                            >
                                <i className="fas fa-arrow-left mr-2"></i>
                                Back to Summary
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="btn btn-secondary"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Loading shift details...</span>
                        </div>
                    ) : error ? (
                        <div className="p-6">
                            <ErrorState message={error} onRetry={handleRetry} />
                        </div>
                    ) : viewMode === 'summary' ? (
                        <ShiftSummaryView shift={detailedShift?.shift || shift} detailedData={detailedShift} />
                    ) : (
                        <div className="p-4">
                            <React.Suspense fallback={
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                    <span className="ml-2 text-gray-600">Loading shift entry form...</span>
                                </div>
                            }>
                                <ShiftEntryView 
                                    showSuccessBanner={showSuccessBanner}
                                    editMode={true}
                                    initialShiftData={detailedShift?.shift || shift}
                                    onUpdateSuccess={handleUpdateSuccess}
                                />
                            </React.Suspense>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Shift Entry Style Summary View Component - Exact Match to ShiftEntryView
const ShiftSummaryView = ({ shift, detailedData }) => {
    // Calculate totals from detailed data if available
    const totalLitresSold = detailedData?.readings?.reduce((total, entry) => total + parseFloat(entry.total_litres || 0), 0) || 0;
    const totalFuelAmount = detailedData?.readings?.reduce((total, entry) => total + parseFloat(entry.total_amount || 0), 0) || 0;
    const avgPricePerLitre = totalLitresSold > 0 ? totalFuelAmount / totalLitresSold : 0;
    
    return (
        <div className="p-6">
            {/* Shift Header - Exactly matching ShiftEntryView */}
            <div className="card p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Shift Date</label>
                        <div className="input-field mt-1 max-w-xs bg-gray-50 cursor-not-allowed">
                            {new Date(shift.shift_date).toLocaleDateString()}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Shift Type</label>
                        <div className="input-field mt-1 max-w-xs bg-gray-50 cursor-not-allowed">
                            {shift.shift_type === 'morning' ? 'Morning (6AM - 6PM)' : 'Evening (6PM - 6AM)'}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Fuel Sales Card - Detailed Fuel Entries */}
                    <div className="card p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-700">Fuel Sales (MS & HSD)</h2>
                        </div>
                        
                        {/* Summary Row */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Fuel Sales</label>
                                    <div className="input-field bg-white cursor-not-allowed font-semibold text-green-700">
                                        ₹{(shift.total_sale_amount || 0).toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Litres Sold</label>
                                    <div className="input-field bg-white cursor-not-allowed">
                                        {totalLitresSold.toFixed(2)} L
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Avg Price/Litre</label>
                                    <div className="input-field bg-white cursor-not-allowed">
                                        ₹{avgPricePerLitre.toFixed(2)}/L
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Fuel Entries - Grouped by Fuel Type */}
                        {detailedData?.readings && detailedData.readings.length > 0 ? (
                            <div className="space-y-4">
                                {(() => {
                                    // Group readings by fuel type
                                    const groupedReadings = detailedData.readings.reduce((groups, entry) => {
                                        const fuelName = entry.fuel_name || entry.fuel_type || 'Unknown Fuel';
                                        if (!groups[fuelName]) {
                                            groups[fuelName] = [];
                                        }
                                        groups[fuelName].push(entry);
                                        return groups;
                                    }, {});

                                    return Object.entries(groupedReadings).map(([fuelName, entries]) => (
                                        <div key={fuelName} className="border border-gray-200 rounded-lg p-4 bg-white">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold text-gray-800">{fuelName}</h3>
                                                <span className="text-sm text-gray-500 bg-blue-100 px-2 py-1 rounded">
                                                    {entries.length} nozzle{entries.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            
                                            {/* Fuel Type Summary */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Litres</label>
                                                    <div className="text-sm font-semibold text-blue-700">
                                                        {entries.reduce((sum, entry) => sum + parseFloat(entry.total_litres || 0), 0).toFixed(2)} L
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Total Amount</label>
                                                    <div className="text-sm font-semibold text-green-700">
                                                        ₹{entries.reduce((sum, entry) => sum + parseFloat(entry.total_amount || 0), 0).toLocaleString()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Avg Rate</label>
                                                    <div className="text-sm font-semibold text-gray-700">
                                                        ₹{(entries.reduce((sum, entry) => sum + parseFloat(entry.unit_price || 0), 0) / entries.length).toFixed(2)}/L
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-600 mb-1">Testing</label>
                                                    <div className="text-sm font-semibold text-orange-700">
                                                        {entries.reduce((sum, entry) => sum + parseFloat(entry.testing_litres || 0), 0).toFixed(2)} L
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Individual Nozzle Details */}
                                            <div className="space-y-3">
                                                {entries.map((entry, index) => (
                                                    <div key={index} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className="text-sm font-medium text-gray-700">Nozzle #{entry.nozzle_number}</span>
                                                            <span className="text-sm font-semibold text-green-600">₹{(entry.total_amount || 0).toLocaleString()}</span>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">Opening</label>
                                                                <div className="input-field-sm bg-white cursor-not-allowed text-sm">
                                                                    {parseFloat(entry.opening_reading || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">Closing</label>
                                                                <div className="input-field-sm bg-white cursor-not-allowed text-sm">
                                                                    {parseFloat(entry.closing_reading || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">Testing (L)</label>
                                                                <div className="input-field-sm bg-white cursor-not-allowed text-sm">
                                                                    {parseFloat(entry.testing_litres || 0).toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">Litres Sold</label>
                                                                <div className="input-field-sm bg-blue-50 cursor-not-allowed text-sm font-semibold text-blue-700">
                                                                    {parseFloat(entry.total_litres || 0).toFixed(2)} L
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Digital Payments for this fuel type */}
                                            {detailedData?.digitalPayments && (() => {
                                                const digitalPayment = detailedData.digitalPayments.find(dp => dp.fuel_name === fuelName || dp.fuel_type === entries[0].fuel_type);
                                                return digitalPayment ? (
                                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                                        <label className="block text-xs font-medium text-gray-600 mb-2">Digital Payments for {fuelName}</label>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">PayTM</label>
                                                                <div className="input-field-sm bg-green-50 cursor-not-allowed text-sm font-semibold text-green-700">
                                                                    ₹{(digitalPayment.paytm_amount || 0).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">PhonePe</label>
                                                                <div className="input-field-sm bg-purple-50 cursor-not-allowed text-sm font-semibold text-purple-700">
                                                                    ₹{(digitalPayment.phonepe_amount || 0).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">Other Digital</label>
                                                                <div className="input-field-sm bg-indigo-50 cursor-not-allowed text-sm font-semibold text-indigo-700">
                                                                    ₹{(digitalPayment.other_digital_amount || 0).toLocaleString()}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-600 mb-1">Total Digital</label>
                                                                <div className="input-field-sm bg-blue-50 cursor-not-allowed text-sm font-semibold text-blue-700">
                                                                    ₹{(digitalPayment.total_digital_amount || 0).toLocaleString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </div>
                                    ));
                                })()}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500 text-sm">
                                No fuel entries recorded for this shift
                            </div>
                        )}
                    </div>

                    {/* Credit Sales Card - Detailed List */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Credit Sales</h2>
                        <div className="space-y-3">
                            {/* Summary Row */}
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Credit Amount</label>
                                        <div className="input-field bg-white cursor-not-allowed font-semibold text-red-700">
                                            ₹{(shift.total_credit || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Entries</label>
                                        <div className="input-field bg-white cursor-not-allowed">
                                            {detailedData?.creditSales?.length || 0} entries
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Credit Sales List */}
                            {detailedData?.creditSales && detailedData.creditSales.length > 0 ? (
                                <div className="bg-white border border-gray-200 rounded-lg">
                                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                                        <h4 className="text-sm font-medium text-gray-700">Credit Sales Details</h4>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {detailedData.creditSales.map((sale, index) => (
                                            <div key={index} className="flex justify-between items-center py-3 px-3 bg-gray-50 rounded border">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-800">{sale.party_name}</span>
                                                        <span className="text-xs text-gray-500">{sale.fuel_type}</span>
                                                    </div>
                                                    {sale.remarks && (
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            {sale.remarks}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-sm font-semibold text-red-600">₹{(sale.amount || 0).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No credit sales recorded for this shift
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lube Sales Card - Detailed List */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Lube Sales</h2>
                        <div className="space-y-3">
                            {/* Summary Row */}
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Lube Sales</label>
                                        <div className="input-field bg-white cursor-not-allowed font-semibold text-green-700">
                                            ₹{(shift.total_lube_sales || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Quantity</label>
                                        <div className="input-field bg-white cursor-not-allowed">
                                            {detailedData?.lubeSales?.reduce((total, sale) => total + parseFloat(sale.quantity || 0), 0).toFixed(2) || 0} units
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Lube Sales List */}
                            {detailedData?.lubeSales && detailedData.lubeSales.length > 0 ? (
                                <div className="bg-white border border-gray-200 rounded-lg">
                                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                                        <h4 className="text-sm font-medium text-gray-700">Lube Sales Details</h4>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {detailedData.lubeSales.map((sale, index) => (
                                            <div key={index} className="flex justify-between items-start py-3 px-3 bg-gray-50 rounded border">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-800">{sale.lube_type}</span>
                                                        <span className="text-xs text-gray-500">{sale.payment_mode || 'Cash'}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-600 mb-1">
                                                        Quantity: {parseFloat(sale.quantity || 0).toFixed(2)} units
                                                    </div>
                                                    {sale.remarks && (
                                                        <div className="text-xs text-gray-600">
                                                            {sale.remarks}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-sm font-semibold text-green-600">₹{(sale.amount || 0).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No lube sales recorded for this shift
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Credit Collection Card - Matching ShiftEntryView exactly */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Credit Collection</h2>
                        <div className="space-y-3">
                            {/* Summary Row */}
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Collections Today</label>
                                        <div className="input-field bg-white cursor-not-allowed font-semibold text-green-700">
                                            ₹{(shift.total_credit_collection || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Parties Paid</label>
                                        <div className="input-field bg-white cursor-not-allowed">
                                            {detailedData?.cashCollections?.length || 0} parties
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Credit Collections List */}
                            {detailedData?.cashCollections && detailedData.cashCollections.length > 0 ? (
                                <div className="bg-white border border-gray-200 rounded-lg">
                                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                                        <h4 className="text-sm font-medium text-gray-700">Credit Collection Details</h4>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {detailedData.cashCollections.map((collection, index) => (
                                            <div key={index} className="flex justify-between items-start py-3 px-3 bg-gray-50 rounded border">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-800">{collection.source}</span>
                                                    </div>
                                                    {collection.remarks && (
                                                        <div className="text-xs text-gray-600">
                                                            {collection.remarks}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-sm font-semibold text-green-600">₹{(collection.amount || 0).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No credit collections recorded for this shift
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expenses Card - Matching ShiftEntryView exactly */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Expenses</h2>
                        <div className="space-y-3">
                            {/* Summary Row */}
                            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total Expenses</label>
                                        <div className="input-field bg-white cursor-not-allowed font-semibold text-red-700">
                                            ₹{(shift.total_expenses || 0).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Number of Entries</label>
                                        <div className="input-field bg-white cursor-not-allowed">
                                            {detailedData?.expenses?.length || 0} entries
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Expenses List */}
                            {detailedData?.expenses && detailedData.expenses.length > 0 ? (
                                <div className="bg-white border border-gray-200 rounded-lg">
                                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                                        <h4 className="text-sm font-medium text-gray-700">Expense Details</h4>
                                    </div>
                                    <div className="p-3 space-y-2">
                                        {detailedData.expenses.map((expense, index) => (
                                            <div key={index} className="flex justify-between items-start py-3 px-3 bg-gray-50 rounded border">
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-sm font-medium text-gray-800">{expense.payee || 'No Payee'}</span>
                                                        <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">{expense.category}</span>
                                                    </div>
                                                    {expense.description && (
                                                        <div className="text-xs text-gray-600 mb-1">
                                                            {expense.description}
                                                        </div>
                                                    )}
                                                    {expense.remarks && (
                                                        <div className="text-xs text-gray-600">
                                                            {expense.remarks}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-right ml-4">
                                                    <div className="text-sm font-semibold text-red-600">₹{(expense.amount || 0).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4 text-gray-500 text-sm">
                                    No expenses recorded for this shift
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Matching ShiftEntryView exactly */}
                <div className="space-y-6">
                    {/* Shift Summary Card - Matching ShiftEntryView exactly */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Shift Summary</h2>
                        
                        {/* Cash Calculation */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-4">
                            <h3 className="text-md font-bold mb-3 text-gray-600">Cash Calculation</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>(+) Fuel Sales (Cash):</span>
                                    <span className="font-medium text-green-600">₹{((shift.total_sale_amount || 0) - (shift.total_online_fuel || 0)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>(-) Total Credit Sales:</span>
                                    <span className="font-medium text-red-600">₹{(shift.total_credit || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>(+) Lube Sales (Cash):</span>
                                    <span className="font-medium text-green-600">₹{(shift.total_lube_sales || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>(+) Credit Collection:</span>
                                    <span className="font-medium text-green-600">₹{(shift.total_credit_collection || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>(-) Total Expenses:</span>
                                    <span className="font-medium text-red-600">₹{(shift.total_expenses || 0).toLocaleString()}</span>
                                </div>
                                <div className="border-t border-gray-300 pt-2 mt-2">
                                    <div className="flex justify-between font-bold">
                                        <span>Expected Cash:</span>
                                        <span>₹{(((shift.total_sale_amount || 0) - (shift.total_online_fuel || 0) - (shift.total_credit || 0)) + (shift.total_lube_sales || 0) + (shift.total_credit_collection || 0) - (shift.total_expenses || 0)).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Online Transaction Summary */}
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h3 className="text-md font-bold mb-3 text-blue-700">Online Transaction Summary</h3>
                            <div className="space-y-2 text-sm">
                                {/* Fuel Digital Payments Breakdown */}
                                <div className="mb-3">
                                    <div className="text-xs font-medium text-blue-600 mb-2">Fuel Digital Payments:</div>
                                    {(() => {
                                        const fuelDigitalTotal = detailedData?.digitalPayments?.reduce((total, payment) => {
                                            return total + (payment.paytm_amount || 0) + (payment.phonepe_amount || 0) + (payment.other_digital_amount || 0);
                                        }, 0) || 0;
                                        
                                        const paytmTotal = detailedData?.digitalPayments?.reduce((total, payment) => total + (payment.paytm_amount || 0), 0) || 0;
                                        const phonepeTotal = detailedData?.digitalPayments?.reduce((total, payment) => total + (payment.phonepe_amount || 0), 0) || 0;
                                        const otherDigitalTotal = detailedData?.digitalPayments?.reduce((total, payment) => total + (payment.other_digital_amount || 0), 0) || 0;
                                        
                                        return (
                                            <div className="ml-2 space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span>• PayTM:</span>
                                                    <span className="font-medium text-green-600">₹{paytmTotal.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span>• PhonePe:</span>
                                                    <span className="font-medium text-purple-600">₹{phonepeTotal.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span>• Other Digital:</span>
                                                    <span className="font-medium text-indigo-600">₹{otherDigitalTotal.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm border-t border-blue-200 pt-1">
                                                    <span className="font-medium">Fuel Digital Total:</span>
                                                    <span className="font-medium text-blue-600">₹{fuelDigitalTotal.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Lube Online Sales */}
                                {(() => {
                                    const lubeOnlineTotal = detailedData?.lubeSales?.reduce((total, sale) => {
                                        const paymentMode = (sale.mode || sale.payment_mode || '').toLowerCase();
                                        const isOnline = paymentMode.includes('online') || paymentMode.includes('paytm') || 
                                                        paymentMode.includes('phonepe') || paymentMode.includes('upi') || 
                                                        paymentMode.includes('digital');
                                        return total + (isOnline ? (sale.amount || 0) : 0);
                                    }, 0) || 0;
                                    
                                    return (
                                        <div className="flex justify-between">
                                            <span>Lube Sales (Online):</span>
                                            <span className="font-medium text-blue-600">₹{lubeOnlineTotal.toLocaleString()}</span>
                                        </div>
                                    );
                                })()}

                                {/* Credit Collection Online */}
                                {(() => {
                                    const creditOnlineTotal = detailedData?.cashCollections?.reduce((total, collection) => {
                                        const paymentMode = (collection.mode || collection.payment_mode || '').toLowerCase();
                                        const isOnline = paymentMode.includes('online') || paymentMode.includes('paytm') || 
                                                        paymentMode.includes('phonepe') || paymentMode.includes('upi') || 
                                                        paymentMode.includes('digital');
                                        return total + (isOnline ? (collection.amount || 0) : 0);
                                    }, 0) || 0;
                                    
                                    return (
                                        <div className="flex justify-between">
                                            <span>Credit Collection (Online):</span>
                                            <span className="font-medium text-blue-600">₹{creditOnlineTotal.toLocaleString()}</span>
                                        </div>
                                    );
                                })()}

                                <div className="border-t border-blue-300 pt-2 mt-2">
                                    <div className="flex justify-between font-bold">
                                        <span>Total Online Transactions:</span>
                                        <span className="text-blue-800">₹{(() => {
                                            const fuelDigital = detailedData?.digitalPayments?.reduce((total, payment) => {
                                                return total + (payment.paytm_amount || 0) + (payment.phonepe_amount || 0) + (payment.other_digital_amount || 0);
                                            }, 0) || 0;
                                            
                                            const lubeOnline = detailedData?.lubeSales?.reduce((total, sale) => {
                                                const paymentMode = (sale.mode || sale.payment_mode || '').toLowerCase();
                                                const isOnline = paymentMode.includes('online') || paymentMode.includes('paytm') || 
                                                                paymentMode.includes('phonepe') || paymentMode.includes('upi') || 
                                                                paymentMode.includes('digital');
                                                return total + (isOnline ? (sale.amount || 0) : 0);
                                            }, 0) || 0;
                                            
                                            const creditOnline = detailedData?.cashCollections?.reduce((total, collection) => {
                                                const paymentMode = (collection.mode || collection.payment_mode || '').toLowerCase();
                                                const isOnline = paymentMode.includes('online') || paymentMode.includes('paytm') || 
                                                                paymentMode.includes('phonepe') || paymentMode.includes('upi') || 
                                                                paymentMode.includes('digital');
                                                return total + (isOnline ? (collection.amount || 0) : 0);
                                            }, 0) || 0;
                                            
                                            return (fuelDigital + lubeOnline + creditOnline).toLocaleString();
                                        })()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Status Card */}
                    <div className="card p-4">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Shift Status</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Status:</span>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                    <i className="fas fa-check-circle mr-1"></i>
                                    Completed
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Created:</span>
                                <span className="text-sm">{new Date(shift.shift_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="card p-4">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Actions</h3>
                        <div className="space-y-2">
                            <button className="btn btn-outline w-full text-left text-sm">
                                <i className="fas fa-print mr-2"></i>
                                Print Shift Report
                            </button>
                            <button className="btn btn-outline w-full text-left text-sm">
                                <i className="fas fa-download mr-2"></i>
                                Export to PDF
                            </button>
                            <button className="btn btn-outline w-full text-left text-sm">
                                <i className="fas fa-copy mr-2"></i>
                                Duplicate Shift
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info Notice - Matching ShiftEntryView Style */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <i className="fas fa-info-circle text-blue-600 mr-3 mt-1"></i>
                    <div>
                        <h4 className="font-semibold text-blue-800 mb-1">View Mode</h4>
                        <p className="text-sm text-blue-700">
                            This is a read-only view of the completed shift. Click "Edit Shift" above to modify 
                            this shift using the full shift entry interface with all controls and validations.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

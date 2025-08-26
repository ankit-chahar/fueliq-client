import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../../../constants/api';

const StationList = ({ stations, onEdit, onStationsUpdate, showSuccessBanner }) => {
    const [isDeleting, setIsDeleting] = useState(null);

    const handleDeleteStation = async (station) => {
        if (!window.confirm(`Are you sure you want to delete station "${station.name}"? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(station.id);
        
        try {
            const response = await axios.delete(`${API_URL}/api/stations/${station.id}`);
            
            if (response.data.success) {
                onStationsUpdate();
                showSuccessBanner('Station deleted successfully!');
            } else {
                throw new Error(response.data.message || 'Failed to delete station');
            }
        } catch (error) {
            console.error('Error deleting station:', error);
            
            let errorMessage = 'Failed to delete station. Please try again.';
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
        } finally {
            setIsDeleting(null);
        }
    };

    const toggleStationStatus = async (station) => {
        try {
            const response = await axios.put(`${API_URL}/api/stations/${station.id}`, {
                ...station,
                is_active: !station.is_active
            });
            
            if (response.data.success) {
                onStationsUpdate();
                showSuccessBanner(`Station ${!station.is_active ? 'activated' : 'deactivated'} successfully!`);
            } else {
                throw new Error(response.data.message || 'Failed to update station status');
            }
        } catch (error) {
            console.error('Error updating station status:', error);
            alert('Failed to update station status. Please try again.');
        }
    };

    if (stations.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <i className="fas fa-building text-5xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No stations found</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first station</p>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('add-station'))}
                    className="btn btn-primary"
                >
                    <i className="fas fa-plus mr-2"></i>
                    Add First Station
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Station Code
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Station Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created Date
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {stations.map((station) => (
                            <tr key={station.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <span className="text-sm font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                            {station.station_code}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <i className="fas fa-building text-gray-400 mr-3"></i>
                                        <span className="text-sm font-medium text-gray-900">{station.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        station.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                            station.is_active ? 'bg-green-600' : 'bg-red-600'
                                        }`}></span>
                                        {station.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(station.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => onEdit(station)}
                                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                                            title="Edit Station"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => toggleStationStatus(station)}
                                            className={`p-1 rounded transition-colors ${
                                                station.is_active 
                                                    ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                                                    : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                            }`}
                                            title={station.is_active ? 'Deactivate Station' : 'Activate Station'}
                                        >
                                            <i className={`fas ${station.is_active ? 'fa-pause' : 'fa-play'}`}></i>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStation(station)}
                                            disabled={isDeleting === station.id}
                                            className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors p-1 rounded hover:bg-red-50"
                                            title="Delete Station"
                                        >
                                            {isDeleting === station.id ? (
                                                <i className="fas fa-spinner fa-spin"></i>
                                            ) : (
                                                <i className="fas fa-trash"></i>
                                            )}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StationList;

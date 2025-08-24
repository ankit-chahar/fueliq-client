import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../../constants/api';

const StationForm = ({ station, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        station_code: '',
        name: '',
        is_active: true
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (station) {
            setFormData({
                station_code: station.station_code || '',
                name: station.name || '',
                is_active: station.is_active !== undefined ? station.is_active : true
            });
        }
    }, [station]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.station_code.trim()) {
            newErrors.station_code = 'Station code is required';
        } else if (!/^[A-Z0-9]{4,20}$/.test(formData.station_code)) {
            newErrors.station_code = 'Station code must be 4-20 characters, uppercase letters and numbers only';
        }

        if (!formData.name.trim()) {
            newErrors.name = 'Station name is required';
        } else if (formData.name.length < 2) {
            newErrors.name = 'Station name must be at least 2 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const url = station 
                ? `${API_URL}/api/stations/${station.id}`
                : `${API_URL}/api/stations`;
            
            const method = station ? 'put' : 'post';
            
            // TODO: Replace with actual API call when backend is ready
            const response = await axios[method](url, formData);
            
            if (response.data.success) {
                onSave();
            } else {
                throw new Error(response.data.message || 'Failed to save station');
            }
        } catch (error) {
            console.error('Error saving station:', error);
            
            if (error.response?.data?.message) {
                if (error.response.data.message.includes('already exists')) {
                    setErrors({ station_code: 'Station code already exists' });
                } else {
                    alert(error.response.data.message);
                }
            } else {
                alert('Failed to save station. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">
                            {station ? 'Edit Station' : 'Add New Station'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Station Code *
                            </label>
                            <input
                                type="text"
                                name="station_code"
                                value={formData.station_code}
                                onChange={handleChange}
                                placeholder="e.g., MAIN001"
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.station_code ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={isSubmitting}
                            />
                            {errors.station_code && (
                                <p className="mt-1 text-sm text-red-600">{errors.station_code}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500">
                                4-20 characters, uppercase letters and numbers only
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Station Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g., Main Station"
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                disabled={isSubmitting}
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="is_active"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={isSubmitting}
                            />
                            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                                Active Station
                            </label>
                        </div>

                        <div className="flex space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Saving...
                                    </>
                                ) : (
                                    station ? 'Update Station' : 'Create Station'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StationForm;

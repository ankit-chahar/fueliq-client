import React, { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../../constants/api';

const ChangePasswordView = ({ showSuccessBanner }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 6) {
            newErrors.newPassword = 'New password must be at least 6 characters long';
        }

        if (!formData.confirmNewPassword) {
            newErrors.confirmNewPassword = 'Please confirm your new password';
        } else if (formData.newPassword !== formData.confirmNewPassword) {
            newErrors.confirmNewPassword = 'New passwords do not match';
        }

        if (formData.currentPassword && formData.newPassword && 
            formData.currentPassword === formData.newPassword) {
            newErrors.newPassword = 'New password must be different from current password';
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
            const token = localStorage.getItem('accessToken');
            
            await axios.post(`${API_URL}/api/auth/change-password`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Clear form
            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmNewPassword: ''
            });
            
            showSuccessBanner('Password changed successfully!');
            
            // Optionally redirect to login after a delay
            setTimeout(() => {
                // If you want to force re-login, uncomment below:
                // localStorage.removeItem('accessToken');
                // localStorage.removeItem('refreshToken');
                // window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('Change password error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to change password';
            
            if (error.response?.status === 401) {
                setErrors({ currentPassword: 'Current password is incorrect' });
            } else {
                setErrors({ general: errorMessage });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, text: '', color: '' };
        
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        if (strength <= 2) return { strength, text: 'Weak', color: 'text-red-600' };
        if (strength <= 4) return { strength, text: 'Medium', color: 'text-yellow-600' };
        return { strength, text: 'Strong', color: 'text-green-600' };
    };

    const passwordStrength = getPasswordStrength(formData.newPassword);

    return (
        <div className="max-w-md mx-auto">
            <div className="card p-6">
                <div className="text-center mb-6">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                        <i className="fas fa-key text-blue-600 text-xl"></i>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Change Password</h2>
                    <p className="text-gray-600 mt-2">Update your account password</p>
                </div>

                {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                        <div className="flex">
                            <i className="fas fa-exclamation-circle text-red-400 mt-0.5 mr-2"></i>
                            <span className="text-sm text-red-800">{errors.general}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? 'text' : 'password'}
                                id="currentPassword"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                className={`input-field pr-10 ${errors.currentPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="Enter your current password"
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                <i className={`fas ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400`}></i>
                            </button>
                        </div>
                        {errors.currentPassword && (
                            <p className="text-sm text-red-600 mt-1">{errors.currentPassword}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            New Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                className={`input-field pr-10 ${errors.newPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="Enter your new password"
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400`}></i>
                            </button>
                        </div>
                        {formData.newPassword && (
                            <div className="mt-1 flex items-center justify-between">
                                <div className="flex space-x-1">
                                    {[...Array(6)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1 w-4 rounded ${
                                                i < passwordStrength.strength ? 
                                                (passwordStrength.strength <= 2 ? 'bg-red-500' : 
                                                 passwordStrength.strength <= 4 ? 'bg-yellow-500' : 'bg-green-500') : 
                                                'bg-gray-200'
                                            }`}
                                        ></div>
                                    ))}
                                </div>
                                <span className={`text-xs ${passwordStrength.color}`}>
                                    {passwordStrength.text}
                                </span>
                            </div>
                        )}
                        {errors.newPassword && (
                            <p className="text-sm text-red-600 mt-1">{errors.newPassword}</p>
                        )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirm New Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmNewPassword"
                                name="confirmNewPassword"
                                value={formData.confirmNewPassword}
                                onChange={handleInputChange}
                                className={`input-field pr-10 ${errors.confirmNewPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                                placeholder="Confirm your new password"
                                disabled={isSubmitting}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-gray-400`}></i>
                            </button>
                        </div>
                        {errors.confirmNewPassword && (
                            <p className="text-sm text-red-600 mt-1">{errors.confirmNewPassword}</p>
                        )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-600">
                        <p className="font-medium mb-1">Password requirements:</p>
                        <ul className="list-disc list-inside space-y-0.5 text-xs">
                            <li>At least 6 characters long</li>
                            <li>Mix of uppercase and lowercase letters (recommended)</li>
                            <li>Include numbers and special characters (recommended)</li>
                            <li>Different from your current password</li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full btn btn-primary"
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Changing Password...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save mr-2"></i>
                                Change Password
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordView;
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../constants';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [stationInfo, setStationInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if user is authenticated on app load
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setLoading(false);
                return;
            }

            // Set default authorization header
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Verify token by fetching user info
            const response = await axios.get(`${API_URL}/api/auth/me`);
            
            if (response.data.success) {
                setUser(response.data.data.user);
                setStationInfo({
                    id: response.data.data.user.station_id,
                    name: response.data.data.user.station_name || 'Station',
                    code: response.data.data.user.station_code || 'UNKNOWN'
                });
                setIsAuthenticated(true);
            } else {
                // Token is invalid, clear it
                clearAuthData();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            clearAuthData();
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/api/auth/login`, {
                username,
                password
            });

            if (response.data.success) {
                const { user, accessToken, refreshToken } = response.data.data;
                
                // Store tokens
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                
                // Set default authorization header
                axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                
                // Update state
                setUser(user);
                setStationInfo({
                    id: user.station_id,
                    name: user.station_name || 'Station',
                    code: user.station_code || 'UNKNOWN'
                });
                setIsAuthenticated(true);
                
                return { success: true };
            } else {
                return { success: false, message: response.data.message };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Login failed. Please try again.' 
            };
        }
    };

    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            
            // Call logout endpoint to invalidate refresh token
            if (refreshToken) {
                await axios.post(`${API_URL}/api/auth/logout`, { refreshToken });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            clearAuthData();
        }
    };

    const clearAuthData = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
        setStationInfo(null);
        setIsAuthenticated(false);
    };

    const refreshToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await axios.post(`${API_URL}/api/auth/refresh`, {
                refreshToken
            });

            if (response.data.success) {
                const { accessToken } = response.data.data;
                localStorage.setItem('accessToken', accessToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                return accessToken;
            } else {
                throw new Error('Token refresh failed');
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
            clearAuthData();
            throw error;
        }
    };

    // Setup axios interceptor for automatic token refresh
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    try {
                        await refreshToken();
                        return axios(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, redirect to login
                        clearAuthData();
                        return Promise.reject(refreshError);
                    }
                }
                
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const value = {
        user,
        stationInfo,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshToken,
        checkAuthStatus
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

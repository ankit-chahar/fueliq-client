import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../../../../constants/api';

const UserList = ({ station, onEdit, showSuccessBanner }) => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(null);

    const fetchUsers = async () => {
        if (!station) return;
        
        setIsLoading(true);
        try {
            // TODO: Replace with actual API call when backend is ready
            const response = await axios.get(`${API_URL}/api/users?stationId=${station.id}`);
            
            if (response.data.success) {
                setUsers(response.data.data || []);
            } else {
                throw new Error(response.data.message || 'Failed to fetch users');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            
            // Provide fallback data for development
            const fallbackUsers = [
                {
                    id: '1',
                    username: 'admin',
                    full_name: 'Administrator',
                    email: 'admin@example.com',
                    role: 'admin',
                    station_id: station.id,
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: '2',
                    username: 'operator1',
                    full_name: 'John Operator',
                    email: 'john@example.com',
                    role: 'operator',
                    station_id: station.id,
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ];
            setUsers(fallbackUsers);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [station]);

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(user.id);
        
        try {
            // TODO: Replace with actual API call when backend is ready
            const response = await axios.delete(`${API_URL}/api/users/${user.id}`);
            
            if (response.data.success) {
                fetchUsers(); // Reload users
                showSuccessBanner('User deleted successfully!');
            } else {
                throw new Error(response.data.message || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user. Please try again.');
        } finally {
            setIsDeleting(null);
        }
    };

    const toggleUserStatus = async (user) => {
        try {
            // TODO: Replace with actual API call when backend is ready
            const response = await axios.put(`${API_URL}/api/users/${user.id}`, {
                ...user,
                is_active: !user.is_active
            });
            
            if (response.data.success) {
                fetchUsers(); // Reload users
                showSuccessBanner(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully!`);
            } else {
                throw new Error(response.data.message || 'Failed to update user status');
            }
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Failed to update user status. Please try again.');
        }
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin':
                return 'bg-red-100 text-red-800';
            case 'manager':
                return 'bg-yellow-100 text-yellow-800';
            case 'operator':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin':
                return 'fa-user-shield';
            case 'manager':
                return 'fa-user-tie';
            case 'operator':
                return 'fa-user';
            default:
                return 'fa-user';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading users...</p>
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <i className="fas fa-user-plus text-5xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No users found</h3>
                <p className="text-gray-500 mb-4">Add your first user for {station.name}</p>
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('add-user'))}
                    className="btn btn-primary"
                >
                    <i className="fas fa-plus mr-2"></i>
                    Add First User
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
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Contact
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Created
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <i className={`fas ${getRoleIcon(user.role)} text-gray-600`}></i>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {user.full_name || 'N/A'}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {user.email || 'No email'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                                        <i className={`fas ${getRoleIcon(user.role)} mr-1`}></i>
                                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        user.is_active 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                            user.is_active ? 'bg-green-600' : 'bg-red-600'
                                        }`}></span>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(user.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => onEdit(user)}
                                            className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded hover:bg-blue-50"
                                            title="Edit User"
                                        >
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button
                                            onClick={() => toggleUserStatus(user)}
                                            className={`p-1 rounded transition-colors ${
                                                user.is_active 
                                                    ? 'text-orange-600 hover:text-orange-900 hover:bg-orange-50' 
                                                    : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                                            }`}
                                            title={user.is_active ? 'Deactivate User' : 'Activate User'}
                                        >
                                            <i className={`fas ${user.is_active ? 'fa-pause' : 'fa-play'}`}></i>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user)}
                                            disabled={isDeleting === user.id}
                                            className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-colors p-1 rounded hover:bg-red-50"
                                            title="Delete User"
                                        >
                                            {isDeleting === user.id ? (
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

export default UserList;

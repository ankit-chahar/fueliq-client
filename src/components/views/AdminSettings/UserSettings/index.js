import React, { useState, useEffect } from 'react';
import StationSelector from './StationSelector';
import UserList from './UserList';
import UserForm from './UserForm';

const UserSettings = ({ stations, showSuccessBanner }) => {
    const [selectedStation, setSelectedStation] = useState(null);
    const [users, setUsers] = useState([]);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    const handleStationSelect = (station) => {
        setSelectedStation(station);
        setUsers([]); // Clear users when station changes
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setShowUserForm(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowUserForm(true);
    };

    const handleCloseForm = () => {
        setShowUserForm(false);
        setEditingUser(null);
    };

    const handleUserSaved = () => {
        handleCloseForm();
        // Reload users for the selected station
        if (selectedStation) {
            // This will trigger the UserList to reload
            setUsers([]);
        }
        showSuccessBanner(editingUser ? 'User updated successfully!' : 'User created successfully!');
    };

    return (
        <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-700">User Management</h2>
                {selectedStation && (
                    <button
                        onClick={handleAddUser}
                        className="btn btn-secondary edit-btn"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add New User
                    </button>
                )}
            </div>

            <div className="mb-6">
                <StationSelector
                    stations={stations}
                    selectedStation={selectedStation}
                    onStationSelect={handleStationSelect}
                />
            </div>

            {selectedStation ? (
                <UserList
                    station={selectedStation}
                    onEdit={handleEditUser}
                    showSuccessBanner={showSuccessBanner}
                />
            ) : (
                <div className="text-center py-8">
                    <i className="fas fa-users text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500 mb-2">Select a station to manage users</p>
                    <p className="text-sm text-gray-400">Choose a station from the dropdown above to view and manage its users</p>
                </div>
            )}

            {showUserForm && (
                <UserForm
                    user={editingUser}
                    station={selectedStation}
                    onClose={handleCloseForm}
                    onSave={handleUserSaved}
                />
            )}
        </div>
    );
};

export default UserSettings;

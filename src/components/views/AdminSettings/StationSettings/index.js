import React, { useState } from 'react';
import StationList from './StationList';
import StationForm from './StationForm';

const StationSettings = ({ stations, onStationsUpdate, showSuccessBanner }) => {
    const [showStationForm, setShowStationForm] = useState(false);
    const [editingStation, setEditingStation] = useState(null);

    const handleAddStation = () => {
        setEditingStation(null);
        setShowStationForm(true);
    };

    const handleEditStation = (station) => {
        setEditingStation(station);
        setShowStationForm(true);
    };

    const handleCloseForm = () => {
        setShowStationForm(false);
        setEditingStation(null);
    };

    const handleStationSaved = () => {
        handleCloseForm();
        onStationsUpdate();
        showSuccessBanner(editingStation ? 'Station updated successfully!' : 'Station created successfully!');
    };

    return (
        <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-700">Station Management</h2>
                <button
                    onClick={handleAddStation}
                    className="btn btn-secondary edit-btn"
                >
                    <i className="fas fa-plus mr-2"></i>
                    Add New Station
                </button>
            </div>

            <StationList
                stations={stations}
                onEdit={handleEditStation}
                onStationsUpdate={onStationsUpdate}
                showSuccessBanner={showSuccessBanner}
            />

            {showStationForm && (
                <StationForm
                    station={editingStation}
                    onClose={handleCloseForm}
                    onSave={handleStationSaved}
                />
            )}
        </div>
    );
};

export default StationSettings;

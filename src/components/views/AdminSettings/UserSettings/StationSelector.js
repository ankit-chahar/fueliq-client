import React from 'react';

const StationSelector = ({ stations, selectedStation, onStationSelect }) => {
    const handleStationChange = (e) => {
        const stationId = e.target.value;
        if (stationId) {
            const station = stations.find(s => s.id === stationId);
            onStationSelect(station);
        } else {
            onStationSelect(null);
        }
    };

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
                <i className="fas fa-filter text-blue-600"></i>
                <label className="block text-sm font-medium text-blue-800">
                    Select Station to Manage Users
                </label>
            </div>
            <select
                value={selectedStation?.id || ''}
                onChange={handleStationChange}
                className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
                <option value="">-- Select a Station --</option>
                {stations
                    .filter(station => station.is_active)
                    .map(station => (
                        <option key={station.id} value={station.id}>
                            {station.name} ({station.station_code})
                        </option>
                    ))
                }
            </select>
            {selectedStation && (
                <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
                    <i className="fas fa-building text-blue-600"></i>
                    <span>Managing users for: <strong>{selectedStation.name}</strong></span>
                </div>
            )}
        </div>
    );
};

export default StationSelector;

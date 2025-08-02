import React from 'react';

const ConfirmationModal = () => (
    <div id="confirmation-modal" className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full hidden items-center justify-center z-50">
        <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100" id="modal-icon-bg">
                    <i className="fas fa-info-circle text-blue-600" id="modal-icon"></i>
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2" id="modal-title">Confirm Action</h3>
                <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500" id="modal-text">Are you sure?</p>
                    <ul id="modal-changelog" className="text-sm text-left text-gray-600 mt-4 list-disc list-inside space-y-1"></ul>
                </div>
                <div className="items-center px-4 py-3 gap-2 flex justify-center">
                    <button id="modal-cancel-btn" className="btn btn-secondary">Cancel</button>
                    <button id="modal-confirm-btn" className="btn btn-primary">Confirm</button>
                </div>
            </div>
        </div>
    </div>
);

export default ConfirmationModal;

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../../constants/api';
import { SearchableCreditorInput } from '../../common';

const SettingsView = ({ showSuccessBanner }) => {
    const [settings, setSettings] = useState(null);
    const [editingSection, setEditingSection] = useState(null);
    const [originalSectionState, setOriginalSectionState] = useState(null);
    const [modal, setModal] = useState({ isOpen: false });
    const [tempPrices, setTempPrices] = useState({});
    const [activeSection, setActiveSection] = useState('general');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [creditors, setCreditors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch settings when component mounts
    // Fetch creditors list
    const fetchCreditors = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/creditors`);
            setCreditors(response.data.data.creditors || []);
        } catch (error) {
            console.error('Error fetching creditors:', error);
            setCreditors([]);
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await axios.get(`${API_URL}/api/settings`);
            
            if (response.data.success) {
                setSettings(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to fetch settings');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to load settings';
            setError(errorMsg);
            
            // Provide fallback settings
            const fallbackSettings = {
                general: { pumpName: 'Petrol Pump Manager' },
                fuels: [],
                expenseCategories: [],
                creditTypes: [],
                cashModes: [],
                pumpInfo: null
            };
            setSettings(fallbackSettings);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Helper functions - must be defined before useEffect hooks that use them
    const hideModal = useCallback(() => {
        setModal({ isOpen: false });
    }, []);

    // Fetch creditors on component mount
    useEffect(() => {
        fetchCreditors();
    }, [fetchCreditors]);

    // Modal handling effect
    useEffect(() => {
        const modalEl = document.getElementById('confirmation-modal');
        const confirmBtn = document.getElementById('modal-confirm-btn');
        const cancelBtn = document.getElementById('modal-cancel-btn');
        const modalIconBg = document.getElementById('modal-icon-bg');
        const modalIcon = document.getElementById('modal-icon');

        const handleConfirm = () => {
            if (modal.onConfirm) modal.onConfirm();
            hideModal();
        };

        if (modal.isOpen) {
            modalEl.classList.remove('hidden');
            modalEl.classList.add('flex');
            document.getElementById('modal-title').textContent = modal.title;
            document.getElementById('modal-text').textContent = modal.text;
            document.getElementById('modal-changelog').innerHTML = modal.changelog.map(c => `<li>${c}</li>`).join('');
            document.getElementById('modal-changelog').style.display = modal.changelog.length > 0 ? 'block' : 'none';
            confirmBtn.textContent = modal.confirmText;
            confirmBtn.className = `btn ${modal.confirmClass}`;

            // Update modal icon based on type
            if (modal.confirmClass === 'btn-danger') {
                modalIconBg.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100';
                modalIcon.className = 'fas fa-exclamation-triangle text-red-600';
            } else {
                modalIconBg.className = 'mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100';
                modalIcon.className = 'fas fa-info-circle text-blue-600';
            }

            confirmBtn.addEventListener('click', handleConfirm);
            cancelBtn.addEventListener('click', hideModal);
        } else {
            modalEl.classList.add('hidden');
            modalEl.classList.remove('flex');
        }

        return () => {
            confirmBtn?.removeEventListener('click', handleConfirm);
            cancelBtn?.removeEventListener('click', hideModal);
        };
    }, [modal]);

    // Loading and error states handling
    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="card p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="card p-8 text-center">
                    <div className="text-red-600 mb-4">
                        <i className="fas fa-exclamation-circle text-3xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Settings</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={fetchSettings}
                        className="btn btn-primary"
                    >
                        <i className="fas fa-refresh mr-2"></i>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Save settings function
    const handleSaveSettings = async (newSettings, sectionName = null) => {
        try {
            console.log('Saving settings:', { newSettings, sectionName });
            
            const response = await axios.post(`${API_URL}/api/settings`, newSettings);
            
            if (response.data.success) {
                setSettings(response.data.data);
                showSuccessBanner('Settings saved successfully!');
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while saving settings';
            alert(`Error: ${errorMessage}`);
            throw error;
        }
    };

    const handleEdit = (sectionName) => {
        setEditingSection(sectionName);
        
        // Store the original state based on section type
        switch (sectionName) {
            case 'general':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.general)));
                break;
            case 'rates':
            case 'nozzles':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.fuels)));
                break;
            case 'credit-types':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.creditTypes)));
                break;
            case 'expense-categories':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.expenseCategories)));
                break;
            case 'cash-modes':
                setOriginalSectionState(JSON.parse(JSON.stringify(settings.cashModes)));
                break;
            default:
                setOriginalSectionState(JSON.parse(JSON.stringify(settings)));
        }
    };

    const handleCancel = (sectionName) => {
        // Restore the original state based on section type
        switch (sectionName) {
            case 'general':
                setSettings(prev => ({ ...prev, general: originalSectionState }));
                break;
            case 'rates':
            case 'nozzles':
                setSettings(prev => ({ ...prev, fuels: originalSectionState }));
                break;
            case 'credit-types':
                setSettings(prev => ({ ...prev, creditTypes: originalSectionState }));
                break;
            case 'expense-categories':
                setSettings(prev => ({ ...prev, expenseCategories: originalSectionState }));
                break;
            case 'cash-modes':
                setSettings(prev => ({ ...prev, cashModes: originalSectionState }));
                break;
        }
        setEditingSection(null);
    };

    const handleSave = (sectionName) => {
        const changelog = generateChangelog(sectionName);

        if (changelog.length === 0) {
            setEditingSection(null);
            return;
        }

        showModal({
            title: 'Confirm Changes',
            text: 'You are about to make the following changes:',
            changelog,
            confirmText: 'Confirm Save',
            confirmClass: 'btn-primary',
            onConfirm: async () => {
                try {
                    await handleSaveSettings(settings, sectionName);
                    setEditingSection(null);
                } catch (error) {
                    // Error is handled in the parent App component
                }
            }
        });
    };

    const generateChangelog = (sectionName) => {
        const changelog = [];
        
        switch (sectionName) {
            case 'general':
                if (settings.general?.pumpName !== originalSectionState?.pumpName) {
                    changelog.push(`Pump Name will be changed to "${settings.general?.pumpName}".`);
                }
                break;
                
            case 'rates':
                settings.fuels?.forEach(fuel => {
                    const originalFuel = originalSectionState?.find(f => f.id === fuel.id);
                    const currentPrice = fuel.current_price || fuel.price;
                    const originalPrice = originalFuel?.current_price || originalFuel?.price;
                    if (originalFuel && currentPrice !== originalPrice) {
                        changelog.push(`${fuel.name} price will be changed from ₹${(parseFloat(originalPrice) || 0).toFixed(2)} to ₹${(parseFloat(currentPrice) || 0).toFixed(2)}.`);
                    }
                });
                break;
                
            case 'nozzles':
                // Check for nozzle count changes
                settings.fuels?.forEach(fuel => {
                    const originalFuel = originalSectionState?.find(f => f.id === fuel.id);
                    if (originalFuel && fuel.nozzles !== originalFuel.nozzles) {
                        changelog.push(`${fuel.name} nozzle count will be changed from ${originalFuel.nozzles} to ${fuel.nozzles}.`);
                    }
                });
                
                // Check for new fuels added
                const originalFuelIds = originalSectionState?.map(f => f.id) || [];
                const newFuels = settings.fuels?.filter(fuel => !originalFuelIds.includes(fuel.id)) || [];
                newFuels.forEach(fuel => {
                    const fuelPrice = fuel.current_price || fuel.price;
                    changelog.push(`New fuel type "${fuel.name}" will be added with ${fuel.nozzles} nozzles at ₹${(parseFloat(fuelPrice) || 0).toFixed(2)}.`);
                });
                
                // Check for deleted fuels
                const currentFuelIds = settings.fuels?.map(f => f.id) || [];
                const deletedFuels = originalSectionState?.filter(fuel => !currentFuelIds.includes(fuel.id)) || [];
                deletedFuels.forEach(fuel => {
                    changelog.push(`Fuel type "${fuel.name}" will be removed.`);
                });
                break;
                
            case 'credit-types':
                const addedCreditTypes = settings.creditTypes?.filter(type => !originalSectionState?.includes(type)) || [];
                const removedCreditTypes = originalSectionState?.filter(type => !settings.creditTypes?.includes(type)) || [];
                
                addedCreditTypes.forEach(type => {
                    changelog.push(`Credit type "${type}" will be added.`);
                });
                removedCreditTypes.forEach(type => {
                    changelog.push(`Credit type "${type}" will be removed.`);
                });
                break;
                
            case 'expense-categories':
                const addedExpenseCategories = settings.expenseCategories?.filter(cat => !originalSectionState?.includes(cat)) || [];
                const removedExpenseCategories = originalSectionState?.filter(cat => !settings.expenseCategories?.includes(cat)) || [];
                
                addedExpenseCategories.forEach(cat => {
                    changelog.push(`Expense category "${cat}" will be added.`);
                });
                removedExpenseCategories.forEach(cat => {
                    changelog.push(`Expense category "${cat}" will be removed.`);
                });
                break;
                
            case 'cash-modes':
                const addedCashModes = settings.cashModes?.filter(mode => !originalSectionState?.includes(mode)) || [];
                const removedCashModes = originalSectionState?.filter(mode => !settings.cashModes?.includes(mode)) || [];
                
                addedCashModes.forEach(mode => {
                    changelog.push(`Cash collection mode "${mode}" will be added.`);
                });
                removedCashModes.forEach(mode => {
                    changelog.push(`Cash collection mode "${mode}" will be removed.`);
                });
                break;
        }
        
        return changelog;
    };

    const showModal = ({ title, text, changelog = [], confirmText, confirmClass, onConfirm }) => {
        setModal({ isOpen: true, title, text, changelog, confirmText, confirmClass, onConfirm });
    };

    const showItemSuccessMessage = (message) => {
        // Use a timeout to show the message after the modal closes
        setTimeout(() => {
            if (window.showSuccessBanner) {
                window.showSuccessBanner(message);
            }
        }, 100);
    };

    const addArrayItem = (arrayName, newItem) => {
        if (newItem.trim() && !settings[arrayName].includes(newItem.trim())) {
            const itemDisplayName = getArrayItemDisplayName(arrayName);
            
            showModal({
                title: 'Confirm Addition',
                text: `Are you sure you want to add "${newItem.trim()}" to ${itemDisplayName}?`,
                confirmText: 'Add',
                confirmClass: 'btn-primary',
                onConfirm: () => {
                    setSettings(prev => ({
                        ...prev,
                        [arrayName]: [...prev[arrayName], newItem.trim()]
                    }));
                    showSuccessBanner(`"${newItem.trim()}" added to ${itemDisplayName} successfully!`);
                }
            });
        }
    };

    const getArrayItemDisplayName = (arrayName) => {
        switch (arrayName) {
            case 'creditTypes': return 'Credit Sale Types';
            case 'expenseCategories': return 'Expense Categories';
            case 'cashModes': return 'Cash Collection Modes';
            default: return 'items';
        }
    };

    const removeArrayItem = (arrayName, itemToRemove) => {
        const itemDisplayName = getArrayItemDisplayName(arrayName);
        
        showModal({
            title: 'Confirm Deletion',
            text: `Are you sure you want to remove "${itemToRemove}" from ${itemDisplayName}?`,
            confirmText: 'Delete',
            confirmClass: 'btn-danger',
            onConfirm: () => {
                setSettings(prev => ({
                    ...prev,
                    [arrayName]: prev[arrayName].filter(item => item !== itemToRemove)
                }));
                showSuccessBanner(`"${itemToRemove}" removed from ${itemDisplayName} successfully!`);
            }
        });
    };

    const updateFuelNozzles = (fuelId, action) => {
        const fuel = settings.fuels.find(f => f.id === fuelId);
        if (action === 'plus') {
            showModal({
                title: 'Confirm Nozzle Addition',
                text: `Are you sure you want to add a nozzle to ${fuel.name}?`,
                changelog: [`${fuel.name} nozzles will be increased from ${fuel.nozzles} to ${fuel.nozzles + 1}.`],
                confirmText: 'Add Nozzle',
                confirmClass: 'btn-primary',
                onConfirm: () => {
                    fuel.nozzles++;
                    setSettings(prev => ({ ...prev, fuels: [...prev.fuels] }));
                    showSuccessBanner(`Nozzle added to ${fuel.name} successfully!`);
                }
            });
        } else if (action === 'minus') {
            if (fuel.nozzles > 1) {
                showModal({
                    title: 'Confirm Nozzle Removal',
                    text: `Are you sure you want to remove a nozzle from ${fuel.name}?`,
                    changelog: [`${fuel.name} nozzles will be decreased from ${fuel.nozzles} to ${fuel.nozzles - 1}.`],
                    confirmText: 'Remove Nozzle',
                    confirmClass: 'btn-primary',
                    onConfirm: () => {
                        fuel.nozzles--;
                        setSettings(prev => ({ ...prev, fuels: [...prev.fuels] }));
                        showSuccessBanner(`Nozzle removed from ${fuel.name} successfully!`);
                    }
                });
            } else {
                showModal({
                    title: 'Confirm Fuel Type Deletion',
                    text: `Are you sure you want to delete the fuel type "${fuel.name}"?`,
                    changelog: [`Fuel type "${fuel.name}" will be completely removed.`],
                    confirmText: 'Delete Fuel Type',
                    confirmClass: 'btn-danger',
                    onConfirm: () => {
                        setSettings(prev => ({
                            ...prev,
                            fuels: prev.fuels.filter(f => f.id !== fuelId)
                        }));
                        showSuccessBanner(`${fuel.name} fuel type deleted successfully!`);
                    }
                });
            }
        }
    };

    const addNewFuel = (name, price, nozzles) => {
        if (name && price > 0 && nozzles > 0) {
            const newFuel = {
                id: name.toLowerCase().replace(/\s+/g, '-'),
                name,
                price: parseFloat(price),
                nozzles: parseInt(nozzles)
            };
            
            showModal({
                title: 'Confirm New Fuel Addition',
                text: `Are you sure you want to add the new fuel type?`,
                changelog: [`New fuel "${name}" will be added with ${nozzles} nozzles at ₹${parseFloat(price).toFixed(2)} per liter.`],
                confirmText: 'Add Fuel',
                confirmClass: 'btn-primary',
                onConfirm: () => {
                    setSettings(prev => ({
                        ...prev,
                        fuels: [...prev.fuels, newFuel]
                    }));
                    showSuccessBanner(`New fuel "${name}" added successfully!`);
                }
            });
            return true;
        }
        return false;
    };

    const updateFuelPrice = (fuelId, newPrice) => {
        const fuel = settings.fuels.find(f => f.id === fuelId);
        const oldPrice = fuel.current_price || fuel.price;
        const price = parseFloat(newPrice);
        
        if (oldPrice !== price) {
            showModal({
                title: 'Confirm Price Change',
                text: `Are you sure you want to change the price for ${fuel.name}?`,
                changelog: [`Price will be changed from ₹${(parseFloat(oldPrice) || 0).toFixed(2)} to ₹${(parseFloat(price) || 0).toFixed(2)}.`],
                confirmText: 'Update Price',
                confirmClass: 'btn-primary',
                onConfirm: () => {
                    setSettings(prev => ({
                        ...prev,
                        fuels: prev.fuels.map(fuel =>
                            fuel.id === fuelId ? { ...fuel, current_price: price, price: price } : fuel
                        )
                    }));
                    showSuccessBanner(`${fuel.name} price updated to ₹${(parseFloat(price) || 0).toFixed(2)} successfully!`);
                }
            });
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Mobile Header with Menu Toggle */}
            <div className="md:hidden mb-4">
                <div className="card p-4 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
                    <button
                        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                        className="btn btn-secondary px-3 py-2"
                    >
                        <i className={`fas ${isMobileSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
                    </button>
                </div>
                
                {/* Mobile Dropdown Menu */}
                {isMobileSidebarOpen && (
                    <div className="card p-4 mt-2">
                        <nav className="space-y-2">
                            <MobileSettingSidebarItem
                                id="general"
                                label="General Settings"
                                icon="fa-cog"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="rates"
                                label="Fuel Rate Management"
                                icon="fa-rupee-sign"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="nozzles"
                                label="Fuel & Nozzle Management"
                                icon="fa-gas-pump"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="credit-types"
                                label="Credit Sale Types"
                                icon="fa-credit-card"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="expense-categories"
                                label="Expense Categories"
                                icon="fa-list"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="cash-modes"
                                label="Cash Collection Modes"
                                icon="fa-money-bill-wave"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                            <MobileSettingSidebarItem
                                id="historical-data"
                                label="Add Historical Data"
                                icon="fa-database"
                                activeSection={activeSection}
                                onClick={(id) => {
                                    setActiveSection(id);
                                    setIsMobileSidebarOpen(false);
                                }}
                            />
                        </nav>
                    </div>
                )}
            </div>

            <div className="flex gap-6">
                {/* Desktop Sidebar Navigation */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <div className="card p-4 sticky top-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Settings</h3>
                        <nav className="space-y-2">
                            <SettingSidebarItem
                                id="general"
                                label="General Settings"
                                icon="fa-cog"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="rates"
                                label="Fuel Rate Management"
                                icon="fa-rupee-sign"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="nozzles"
                                label="Fuel & Nozzle Management"
                                icon="fa-gas-pump"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="credit-types"
                                label="Credit Sale Types"
                                icon="fa-credit-card"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="expense-categories"
                                label="Expense Categories"
                                icon="fa-list"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="cash-modes"
                                label="Cash Collection Modes"
                                icon="fa-money-bill-wave"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                            <SettingSidebarItem
                                id="historical-data"
                                label="Add Historical Data"
                                icon="fa-database"
                                activeSection={activeSection}
                                onClick={setActiveSection}
                            />
                        </nav>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 w-full md:w-auto">
                    {activeSection === 'general' && (
                        <SettingsCard
                            title="Pump Information"
                            isEditing={editingSection === 'general'}
                            onEdit={() => handleEdit('general')}
                            onSave={() => handleSave('general')}
                            onCancel={() => handleCancel('general')}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="pump-name" className="block text-sm font-medium text-gray-700">Pump Name *</label>
                                    <input
                                        type="text"
                                        id="pump-name"
                                        className="input-field mt-1"
                                        value={settings.general?.pumpName || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, pumpName: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="owner-name" className="block text-sm font-medium text-gray-700">Owner Name</label>
                                    <input
                                        type="text"
                                        id="owner-name"
                                        className="input-field mt-1"
                                        value={settings.general?.ownerName || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, ownerName: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                                    <textarea
                                        id="address"
                                        rows="3"
                                        className="input-field mt-1"
                                        value={settings.general?.address || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, address: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City</label>
                                    <input
                                        type="text"
                                        id="city"
                                        className="input-field mt-1"
                                        value={settings.general?.city || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, city: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700">State</label>
                                    <input
                                        type="text"
                                        id="state"
                                        className="input-field mt-1"
                                        value={settings.general?.state || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, state: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">PIN Code</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        id="pincode"
                                        className="input-field mt-1"
                                        value={settings.general?.pincode || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, pincode: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        className="input-field mt-1"
                                        value={settings.general?.phone || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, phone: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        id="email"
                                        className="input-field mt-1"
                                        value={settings.general?.email || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, email: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="license-number" className="block text-sm font-medium text-gray-700">License Number</label>
                                    <input
                                        type="text"
                                        id="license-number"
                                        className="input-field mt-1"
                                        value={settings.general?.licenseNumber || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, licenseNumber: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="gst-number" className="block text-sm font-medium text-gray-700">GST Number</label>
                                    <input
                                        type="text"
                                        id="gst-number"
                                        className="input-field mt-1"
                                        value={settings.general?.gstNumber || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, gstNumber: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="established-date" className="block text-sm font-medium text-gray-700">Established Date</label>
                                    <input
                                        type="date"
                                        id="established-date"
                                        className="input-field mt-1"
                                        value={settings.general?.establishedDate || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, establishedDate: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
                                    <input
                                        type="url"
                                        id="website"
                                        className="input-field mt-1"
                                        value={settings.general?.website || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, website: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label htmlFor="operating-hours" className="block text-sm font-medium text-gray-700">Operating Hours</label>
                                    <input
                                        type="text"
                                        id="operating-hours"
                                        className="input-field mt-1"
                                        value={settings.general?.operatingHours || ''}
                                        onChange={(e) => setSettings(prev => ({
                                            ...prev,
                                            general: { ...prev.general, operatingHours: e.target.value }
                                        }))}
                                        disabled={editingSection !== 'general'}
                                        placeholder="e.g., 24 Hours, 6:00 AM - 10:00 PM"
                                    />
                                </div>
                            </div>
                        </SettingsCard>
                    )}

                    {activeSection === 'rates' && (
                        <SettingsCard
                            title="Fuel Rate Management"
                            isEditing={editingSection === 'rates'}
                            onEdit={() => handleEdit('rates')}
                            onSave={() => handleSave('rates')}
                            onCancel={() => handleCancel('rates')}
                        >
                            <div className="space-y-4">
                                {settings.fuels?.map(fuel => (
                                    <div key={fuel.id}>
                                        <label className="block text-sm font-medium text-gray-700">{fuel.name}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            inputMode="numeric"
                                            value={tempPrices[fuel.id] !== undefined ? tempPrices[fuel.id] : (parseFloat(fuel.current_price || fuel.price) || 0).toFixed(2)}
                                            className="input-field mt-1"
                                            onChange={(e) => setTempPrices(prev => ({ ...prev, [fuel.id]: e.target.value }))}
                                            onBlur={(e) => {
                                                const newPrice = parseFloat(e.target.value);
                                                if (!isNaN(newPrice) && newPrice !== (fuel.current_price || fuel.price)) {
                                                    updateFuelPrice(fuel.id, e.target.value);
                                                }
                                                setTempPrices(prev => ({ ...prev, [fuel.id]: undefined }));
                                            }}
                                            disabled={editingSection !== 'rates'}
                                        />
                                    </div>
                                ))}
                            </div>
                        </SettingsCard>
                    )}

                    {activeSection === 'nozzles' && (
                        <SettingsCard
                            title="Fuel & Nozzle Management"
                            isEditing={editingSection === 'nozzles'}
                            onEdit={() => handleEdit('nozzles')}
                            onSave={() => handleSave('nozzles')}
                            onCancel={() => handleCancel('nozzles')}
                        >
                            <div className="space-y-4">
                                {settings.fuels?.map(fuel => {
                                    const minusBtnClass = fuel.nozzles === 1 ? 'btn-danger-outline' : 'btn-secondary';
                                    const minusBtnIcon = fuel.nozzles === 1 ? <i className="fas fa-trash"></i> : '-';
                                    
                                    return (
                                        <div key={fuel.id} className="flex justify-between items-center">
                                            <span className="font-medium text-gray-800">{fuel.name}</span>
                                            <div className={`flex items-center gap-2 ${editingSection === 'nozzles' ? '' : 'hidden'}`}>
                                                <button
                                                    className={`btn ${minusBtnClass} h-8 w-8 p-0 flex items-center justify-center`}
                                                    onClick={() => updateFuelNozzles(fuel.id, 'minus')}
                                                >
                                                    {minusBtnIcon}
                                                </button>
                                                <span className="font-bold text-lg w-5 text-center">{fuel.nozzles}</span>
                                                <button
                                                    className="btn btn-secondary h-8 w-8 p-0 flex items-center justify-center"
                                                    onClick={() => updateFuelNozzles(fuel.id, 'plus')}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className={`text-gray-500 ${editingSection === 'nozzles' ? 'hidden' : ''}`}>
                                                {fuel.nozzles} Nozzles
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {editingSection === 'nozzles' && (
                                <div className="border-t pt-4 mt-4">
                                    <h3 className="text-md font-semibold text-gray-700 mb-2">Add New Fuel</h3>
                                    <AddFuelForm onAdd={addNewFuel} />
                                </div>
                            )}
                        </SettingsCard>
                    )}

                    {activeSection === 'credit-types' && (
                        <SettingsCard
                            title="Credit Sale Fuel Types"
                            isEditing={editingSection === 'credit-types'}
                            onEdit={() => handleEdit('credit-types')}
                            onSave={() => handleSave('credit-types')}
                            onCancel={() => handleCancel('credit-types')}
                        >
                            <ArrayEditor
                                items={settings.creditTypes || []}
                                isEditing={editingSection === 'credit-types'}
                                onAdd={(item) => addArrayItem('creditTypes', item)}
                                onRemove={(item) => removeArrayItem('creditTypes', item)}
                                placeholder="New fuel type name"
                            />
                        </SettingsCard>
                    )}

                    {activeSection === 'expense-categories' && (
                        <SettingsCard
                            title="Expense Categories"
                            isEditing={editingSection === 'expense-categories'}
                            onEdit={() => handleEdit('expense-categories')}
                            onSave={() => handleSave('expense-categories')}
                            onCancel={() => handleCancel('expense-categories')}
                        >
                            <ArrayEditor
                                items={settings.expenseCategories || []}
                                isEditing={editingSection === 'expense-categories'}
                                onAdd={(item) => addArrayItem('expenseCategories', item)}
                                onRemove={(item) => removeArrayItem('expenseCategories', item)}
                                placeholder="New category name"
                            />
                        </SettingsCard>
                    )}

                    {activeSection === 'cash-modes' && (
                        <SettingsCard
                            title="Cash Collection Modes"
                            isEditing={editingSection === 'cash-modes'}
                            onEdit={() => handleEdit('cash-modes')}
                            onSave={() => handleSave('cash-modes')}
                            onCancel={() => handleCancel('cash-modes')}
                        >
                            <ArrayEditor
                                items={settings.cashModes || []}
                                isEditing={editingSection === 'cash-modes'}
                                onAdd={(item) => addArrayItem('cashModes', item)}
                                onRemove={(item) => removeArrayItem('cashModes', item)}
                                placeholder="New mode name"
                            />
                        </SettingsCard>
                    )}

                    {activeSection === 'historical-data' && (
                        <HistoricalDataSection settings={settings} showSuccessBanner={showSuccessBanner} />
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Settings Components ---

const SettingSidebarItem = ({ id, label, icon, activeSection, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full text-left px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-3 ${
            activeSection === id 
                ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
    >
        <i className={`fas ${icon} w-4 text-center`}></i>
        <span className="text-sm font-medium">{label}</span>
    </button>
);

const MobileSettingSidebarItem = ({ id, label, icon, activeSection, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center gap-3 ${
            activeSection === id 
                ? 'bg-blue-100 text-blue-700 border-l-4 border-blue-500' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
        }`}
    >
        <i className={`fas ${icon} w-5 text-center`}></i>
        <span className="font-medium">{label}</span>
        {activeSection === id && <i className="fas fa-check ml-auto text-blue-600"></i>}
    </button>
);

const SettingsCard = ({ title, isEditing, onEdit, onSave, onCancel, children }) => (
    <div className={`card p-6 ${isEditing ? 'editing' : ''}`}>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-700">{title}</h2>
            {!isEditing && (
                <button onClick={onEdit} className="btn btn-secondary edit-btn">
                    <i className="fas fa-pencil-alt mr-2"></i>Edit
                </button>
            )}
        </div>
        <div className="space-y-4">{children}</div>
        {isEditing && (
            <div className="card-actions justify-end gap-2 mt-4 flex">
                <button onClick={onCancel} className="btn btn-secondary">Cancel</button>
                <button onClick={onSave} className="btn btn-primary">Save Changes</button>
            </div>
        )}
    </div>
);

const ArrayEditor = ({ items, isEditing, onAdd, onRemove, placeholder }) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
        if (newItem.trim()) {
            onAdd(newItem);
            setNewItem('');
        }
    };

    return (
        <div>
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                        <span className="text-sm font-medium text-gray-700">{item}</span>
                        <button
                            className={`btn btn-danger-outline h-7 w-7 p-0 text-xs items-center justify-center ${isEditing ? 'flex' : 'hidden'}`}
                            onClick={() => onRemove(item)}
                        >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                ))}
            </div>
            {isEditing && (
                <div className="flex gap-2 mt-4">
                    <input
                        type="text"
                        className="input-field flex-1"
                        placeholder={placeholder}
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
                    />
                    <button onClick={handleAdd} className="btn btn-secondary flex-shrink-0">
                        <i className="fas fa-plus"></i> Add
                    </button>
                </div>
            )}
        </div>
    );
};

const AddFuelForm = ({ onAdd }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [nozzles, setNozzles] = useState('');

    const handleAdd = () => {
        if (onAdd(name, price, nozzles)) {
            setName('');
            setPrice('');
            setNozzles('');
        } else {
            alert('Please fill all fields for the new fuel.');
        }
    };

    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                    type="text"
                    className="input-field"
                    placeholder="Fuel Name (e.g., CNG)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="number"
                    inputMode="numeric"
                    className="input-field"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                />
                <input
                    type="number"
                    inputMode="numeric"
                    className="input-field"
                    placeholder="Nozzles"
                    value={nozzles}
                    onChange={(e) => setNozzles(e.target.value)}
                />
            </div>
            <button onClick={handleAdd} className="btn btn-secondary w-full mt-2">
                Add Fuel
            </button>
        </div>
    );
};

// Historical Data Section Component
const HistoricalDataSection = ({ settings, showSuccessBanner }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedShift, setSelectedShift] = useState('morning');
    const [selectedDataType, setSelectedDataType] = useState('credit-sales');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [creditors, setCreditors] = useState([]);

    const fetchCreditors = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/creditors`);
            console.log('API Response:', response.data);
            setCreditors(response.data.data.creditors || []);
        } catch (error) {
            console.error('Error fetching creditors:', error);
            setCreditors([]);
        }
    };

    // Credit Sales Form State
    const [creditSaleData, setCreditSaleData] = useState({
        partyName: '',
        fuelType: '',
        amount: '',
        remarks: ''
    });

    // Credit Collection Form State
    const [creditCollectionData, setCreditCollectionData] = useState({
        receivedFrom: '',
        paymentMode: '',
        amount: '',
        remarks: ''
    });

    // Expenses Form State
    const [expenseData, setExpenseData] = useState({
        payee: '',
        category: '',
        amount: '',
        remarks: ''
    });

    const handleCreditSaleSubmit = async () => {
        if (!creditSaleData.partyName || !creditSaleData.fuelType || !creditSaleData.amount) {
            alert('Please fill all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${API_URL}/api/settings/historical-data/credit-sales`, {
                date: selectedDate,
                shift: selectedShift,
                customerName: creditSaleData.partyName,
                fuelType: creditSaleData.fuelType,
                amount: parseFloat(creditSaleData.amount),
                remarks: creditSaleData.remarks
            });

            if (response.data.success) {
                showSuccessBanner('Credit sale added successfully!');
                setCreditSaleData({ partyName: '', fuelType: '', amount: '', remarks: '' });
            } else {
                alert('Failed to add credit sale: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error adding credit sale:', error);
            alert('Error adding credit sale: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreditCollectionSubmit = async () => {
        if (!creditCollectionData.receivedFrom || !creditCollectionData.amount || !creditCollectionData.paymentMode) {
            alert('Please fill all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${API_URL}/api/settings/historical-data/credit-collections`, {
                date: selectedDate,
                shift: selectedShift,
                customerName: creditCollectionData.receivedFrom,
                amount: parseFloat(creditCollectionData.amount),
                paymentMode: creditCollectionData.paymentMode,
                remarks: creditCollectionData.remarks
            });

            if (response.data.success) {
                showSuccessBanner('Credit collection added successfully!');
                setCreditCollectionData({ receivedFrom: '', paymentMode: '', amount: '', remarks: '' });
                // Refresh creditors list to include any new creditor
                fetchCreditors();
            } else {
                alert('Failed to add credit collection: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error adding credit collection:', error);
            alert('Error adding credit collection: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExpenseSubmit = async () => {
        if (!expenseData.payee || !expenseData.category || !expenseData.amount) {
            alert('Please fill all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${API_URL}/api/settings/historical-data/expenses`, {
                date: selectedDate,
                shift: selectedShift,
                category: expenseData.category,
                amount: parseFloat(expenseData.amount),
                description: expenseData.payee,
                paymentMode: 'Cash', // Default to Cash for expenses as per shift entry pattern
                remarks: expenseData.remarks
            });

            if (response.data.success) {
                showSuccessBanner('Expense added successfully!');
                setExpenseData({ payee: '', category: '', amount: '', remarks: '' });
            } else {
                alert('Failed to add expense: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Error adding expense: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderDataTypeForm = () => {
        switch (selectedDataType) {
            case 'credit-sales':
                return (
                    <div className="card p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                            <i className="fas fa-credit-card mr-2 text-yellow-600"></i>
                            Add Credit Sale
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Party Name *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={creditSaleData.partyName}
                                    onChange={(e) => setCreditSaleData(prev => ({ ...prev, partyName: e.target.value }))}
                                    placeholder="Party Name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Credit Type *</label>
                                <select
                                    className="input-field"
                                    value={creditSaleData.fuelType}
                                    onChange={(e) => setCreditSaleData(prev => ({ ...prev, fuelType: e.target.value }))}
                                    required
                                >
                                    <option value="">Select Credit Type...</option>
                                    {settings.creditTypes?.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    inputMode="numeric"
                                    className="input-field"
                                    value={creditSaleData.amount}
                                    onChange={(e) => setCreditSaleData(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="₹ Amount"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={creditSaleData.remarks}
                                    onChange={(e) => setCreditSaleData(prev => ({ ...prev, remarks: e.target.value }))}
                                    placeholder="Remarks (optional)"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleCreditSaleSubmit}
                            disabled={isSubmitting}
                            className="btn btn-primary mt-4"
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus mr-2"></i>
                                    Add Credit Sale
                                </>
                            )}
                        </button>
                    </div>
                );

            case 'credit-collections':
                return (
                    <div className="card p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                            <i className="fas fa-hand-holding-usd mr-2 text-green-600"></i>
                            Add Credit Collection
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Received From *</label>
                                <SearchableCreditorInput
                                    value={creditCollectionData.receivedFrom}
                                    onChange={(value) => setCreditCollectionData(prev => ({ ...prev, receivedFrom: value }))}
                                    creditors={creditors}
                                    placeholder="Type to search creditors or enter new name..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
                                <select
                                    className="input-field"
                                    value={creditCollectionData.paymentMode}
                                    onChange={(e) => setCreditCollectionData(prev => ({ ...prev, paymentMode: e.target.value }))}
                                    required
                                >
                                    <option value="">Select Payment Mode...</option>
                                    {settings?.cashModes?.map(mode => (
                                        <option key={mode} value={mode}>{mode}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    inputMode="numeric"
                                    className="input-field"
                                    value={creditCollectionData.amount}
                                    onChange={(e) => setCreditCollectionData(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="₹ Amount"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={creditCollectionData.remarks}
                                    onChange={(e) => setCreditCollectionData(prev => ({ ...prev, remarks: e.target.value }))}
                                    placeholder="Remarks (optional)"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleCreditCollectionSubmit}
                            disabled={isSubmitting}
                            className="btn btn-primary mt-4"
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus mr-2"></i>
                                    Add Credit Collection
                                </>
                            )}
                        </button>
                    </div>
                );

            case 'expenses':
                return (
                    <div className="card p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">
                            <i className="fas fa-receipt mr-2 text-red-600"></i>
                            Add Expense
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payee *</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={expenseData.payee}
                                    onChange={(e) => setExpenseData(prev => ({ ...prev, payee: e.target.value }))}
                                    placeholder="Payee"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expense Category *</label>
                                <select
                                    className="input-field"
                                    value={expenseData.category}
                                    onChange={(e) => setExpenseData(prev => ({ ...prev, category: e.target.value }))}
                                    required
                                >
                                    <option value="">Select Expense Category...</option>
                                    {settings.expenseCategories?.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    inputMode="numeric"
                                    className="input-field"
                                    value={expenseData.amount}
                                    onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="₹ Amount"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    value={expenseData.remarks}
                                    onChange={(e) => setExpenseData(prev => ({ ...prev, remarks: e.target.value }))}
                                    placeholder="Remarks (optional)"
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleExpenseSubmit}
                            disabled={isSubmitting}
                            className="btn btn-primary mt-4"
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Adding...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus mr-2"></i>
                                    Add Expense
                                </>
                            )}
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Add Historical Data</h2>
                
                {/* Date and Shift Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                        <input
                            type="date"
                            className="input-field"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                        <select
                            className="input-field"
                            value={selectedShift}
                            onChange={(e) => setSelectedShift(e.target.value)}
                        >
                            <option value="morning">Morning Shift</option>
                            <option value="evening">Evening Shift</option>
                        </select>
                    </div>
                </div>

                {/* Data Type Selector */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">What would you like to add?</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <button
                            onClick={() => setSelectedDataType('credit-sales')}
                            className={`p-3 rounded-lg border-2 transition-all ${
                                selectedDataType === 'credit-sales'
                                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            <i className="fas fa-credit-card mb-2 block text-lg"></i>
                            Credit Sales
                        </button>
                        <button
                            onClick={() => setSelectedDataType('credit-collections')}
                            className={`p-3 rounded-lg border-2 transition-all ${
                                selectedDataType === 'credit-collections'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            <i className="fas fa-hand-holding-usd mb-2 block text-lg"></i>
                            Credit Collections
                        </button>
                        <button
                            onClick={() => setSelectedDataType('expenses')}
                            className={`p-3 rounded-lg border-2 transition-all ${
                                selectedDataType === 'expenses'
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}
                        >
                            <i className="fas fa-receipt mb-2 block text-lg"></i>
                            Expenses
                        </button>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            {renderDataTypeForm()}
        </div>
    );
};

export default SettingsView;

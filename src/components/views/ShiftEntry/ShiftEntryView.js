import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../../../constants/api';
import { formatMoney, formatLitre, generateId } from '../../../utils/formatters';
import { calculateShiftTotals } from '../../../utils/calculationHelpers';
import { SearchableCreditorInput } from '../../common';

const ShiftEntryView = ({ showSuccessBanner }) => {
    const [shiftData, setShiftData] = useState({
        shiftDate: new Date().toISOString().split('T')[0],
        shiftType: 'morning',
        fuelEntries: [],
        creditSales: [],
        expenses: [],
        cashCollections: [],
        actualCash: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [existingShiftId, setExistingShiftId] = useState(null);
    const [checkingExistingShift, setCheckingExistingShift] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [creditors, setCreditors] = useState([]);
    const [expensePayees, setExpensePayees] = useState([]);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    
    // Auto-populate previous shift readings state
    const [previousReadings, setPreviousReadings] = useState(null);
    const [loadingPreviousReadings, setLoadingPreviousReadings] = useState(false);
    const [autoPopulatedFields, setAutoPopulatedFields] = useState(new Set());
    
    // Settings data that this component needs
    const [settings, setSettings] = useState({
        fuels: [],
        creditTypes: [],
        cashModes: [],
        expenseCategories: []
    });
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsError, setSettingsError] = useState(null);

    const fuelTypes = settings.fuels || [];

    // Fetch settings data
    const fetchSettings = async () => {
        setSettingsLoading(true);
        setSettingsError(null);
        try {
            const response = await axios.get(`${API_URL}/api/settings`);
            if (response.data.success) {
                setSettings(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to fetch settings');
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to load settings';
            setSettingsError(errorMessage);
        } finally {
            setSettingsLoading(false);
        }
    };

    // Fetch settings and creditors on component mount
    useEffect(() => {
        fetchSettings();
        fetchCreditors();
        fetchExpensePayees();
    }, []);

    // Initialize fuel entries based on settings
    useEffect(() => {
        if (fuelTypes.length > 0 && shiftData.fuelEntries.length === 0) {
            const initialFuelEntries = fuelTypes.map(fuel => ({
                id: generateId(),
                fuelType: fuel.id,
                fuelName: fuel.name,
                openingReadings: Array(fuel.nozzles).fill(''),
                closingReadings: Array(fuel.nozzles).fill(''),
                testingLitres: '0',
                unitPrice: fuel.current_price || fuel.price || 0,
                digitalPayments: {
                    paytm: '0',
                    phonepe: '0',
                    other: '0'
                }
            }));

            setShiftData(prev => ({
                ...prev,
                fuelEntries: initialFuelEntries
            }));
        }
    }, [fuelTypes, shiftData.fuelEntries.length]);

    // Update fuel prices when fuel types change (even if entries already exist)
    useEffect(() => {
        if (fuelTypes.length > 0 && shiftData.fuelEntries.length > 0) {
            setShiftData(prev => ({
                ...prev,
                fuelEntries: prev.fuelEntries.map(entry => {
                    const updatedFuel = fuelTypes.find(f => f.id === entry.fuelType);
                    const fuelPrice = updatedFuel?.current_price || updatedFuel?.price || 0;
                    if (updatedFuel && fuelPrice !== entry.unitPrice) {
                        return { ...entry, unitPrice: fuelPrice };
                    }
                    return entry;
                })
            }));
        }
    }, [fuelTypes]);

    // Helper functions - must be defined before useEffect hooks that use them
    const checkExistingShift = useCallback(async () => {
        // Don't check if date or shift type is not set
        if (!shiftData.shiftDate || !shiftData.shiftType) {
            setExistingShiftId(null);
            return;
        }

        try {
            setCheckingExistingShift(true);
            console.log('Checking for existing shift:', shiftData.shiftDate, shiftData.shiftType);
            
            const response = await axios.get(`${API_URL}/api/shifts/check/${shiftData.shiftDate}/${shiftData.shiftType}`);
            console.log('Check existing shift response:', response.data);
            
            if (response.data.success && response.data.data && response.data.data.exists) {
                // Backend returns the shift object, extract the id
                const shiftId = response.data.data.shift?.id || response.data.data.shiftId;
                console.log('Setting existing shift ID:', shiftId);
                setExistingShiftId(shiftId);
            } else {
                console.log('No existing shift found');
                setExistingShiftId(null);
            }
        } catch (error) {
            console.error('Error checking existing shift:', error);
            console.log('Error response:', error.response?.data);
            setExistingShiftId(null);
        } finally {
            setCheckingExistingShift(false);
        }
    }, [shiftData.shiftDate, shiftData.shiftType]);

    // Helper function to determine previous shift details
    const getPreviousShiftDetails = (currentDate, currentShiftType) => {
        const date = new Date(currentDate);
        
        if (currentShiftType === 'morning') {
            // Previous shift is previous day's night shift
            date.setDate(date.getDate() - 1);
            return {
                date: date.toISOString().split('T')[0],
                type: 'night'
            };
        } else {
            // Previous shift is same day's morning shift
            return {
                date: currentDate,
                type: 'morning'
            };
        }
    };

    // Function to fetch previous shift readings
    const fetchPreviousShiftReadings = useCallback(async (date, shiftType) => {
        try {
            setLoadingPreviousReadings(true);
            const response = await axios.get(
                `${API_URL}/api/shifts/previous-readings/${date}/${shiftType}`
            );
            
            if (response.data.success && response.data.data.exists) {
                setPreviousReadings(response.data.data.readings);
                return response.data.data.readings;
            } else {
                setPreviousReadings(null);
                return null;
            }
        } catch (error) {
            console.error('Error fetching previous shift readings:', error);
            setPreviousReadings(null);
            return null;
        } finally {
            setLoadingPreviousReadings(false);
        }
    }, []);

    // Function to auto-populate opening readings from previous shift
    const autoPopulateOpeningReadings = useCallback(async () => {
        if (!shiftData.shiftDate || !shiftData.shiftType || fuelTypes.length === 0) {
            return;
        }

        const readings = await fetchPreviousShiftReadings(shiftData.shiftDate, shiftData.shiftType);
        
        if (readings && Object.keys(readings).length > 0) {
            const newAutoPopulatedFields = new Set();
            
            setShiftData(prev => ({
                ...prev,
                fuelEntries: prev.fuelEntries.map(entry => {
                    const fuelReadings = readings[entry.fuelType];
                    if (fuelReadings) {
                        const updatedOpeningReadings = [...entry.openingReadings];
                        
                        // Auto-populate each nozzle reading
                        entry.openingReadings.forEach((_, nozzleIndex) => {
                            const nozzleKey = `nozzle_${nozzleIndex + 1}`;
                            if (fuelReadings[nozzleKey] !== undefined) {
                                updatedOpeningReadings[nozzleIndex] = fuelReadings[nozzleKey].toString();
                                // Mark this field as auto-populated
                                newAutoPopulatedFields.add(`${entry.id}_opening_${nozzleIndex}`);
                            }
                        });
                        
                        return { ...entry, openingReadings: updatedOpeningReadings };
                    }
                    return entry;
                })
            }));
            
            setAutoPopulatedFields(newAutoPopulatedFields);
            
            // Show success message
            if (newAutoPopulatedFields.size > 0) {
                if (showSuccessBanner) {
                    showSuccessBanner('Opening readings auto-populated from previous shift');
                }
            }
        }
    }, [shiftData.shiftDate, shiftData.shiftType, fuelTypes, fetchPreviousShiftReadings, showSuccessBanner]);

    // Function to check if a field is auto-populated
    const isFieldAutoPopulated = (entryId, fieldType, nozzleIndex = null) => {
        if (fieldType === 'openingReadings' && nozzleIndex !== null) {
            return autoPopulatedFields.has(`${entryId}_opening_${nozzleIndex}`);
        }
        return false;
    };

    // Check for existing shift when date or type changes
    useEffect(() => {
        checkExistingShift();
    }, [checkExistingShift]);

    // Auto-populate opening readings when date, shift type changes, or fuel entries are initialized
    useEffect(() => {
        if (fuelTypes.length > 0 && shiftData.fuelEntries.length > 0) {
            autoPopulateOpeningReadings();
        }
    }, [shiftData.shiftDate, shiftData.shiftType, fuelTypes.length, autoPopulateOpeningReadings]);

    // Fetch creditors on component mount
    useEffect(() => {
        fetchCreditors();
        fetchExpensePayees();
    }, []);

    // Fetch creditors list
    const fetchCreditors = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/creditors`);
            console.log('Creditors API response:', response.data);
            setCreditors(response.data.data?.creditors || []);
        } catch (error) {
            console.error('Error fetching creditors:', error);
            setCreditors([]);
        }
    };

    // Fetch unique expense payees
    const fetchExpensePayees = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/dashboard/expense-payees`);
            console.log('Expense payees API response:', response.data);
            // Transform the data to match the SearchableCreditorInput expected format
            const payees = (response.data.data?.payees || []).map(payee => ({
                name: payee.payee || payee.name,
                totalAmount: payee.totalAmount || 0
            }));
            setExpensePayees(payees);
        } catch (error) {
            console.error('Error fetching expense payees:', error);
            setExpensePayees([]);
        }
    };

    // Loading and error states handling
    if (settingsLoading) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="card p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-600">Loading shift entry data...</p>
                </div>
            </div>
        );
    }

    if (settingsError) {
        return (
            <div className="max-w-7xl mx-auto">
                <div className="card p-8 text-center">
                    <div className="text-red-600 mb-4">
                        <i className="fas fa-exclamation-circle text-3xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
                    <p className="text-gray-600 mb-4">{settingsError}</p>
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

    // Date validation helper
    const isValidShiftDate = (date) => {
        const today = new Date().toISOString().split('T')[0];
        return date <= today;
    };

    const handleShiftDateChange = (e) => {
        const selectedDate = e.target.value;
        if (isValidShiftDate(selectedDate)) {
            setShiftData(prev => ({ ...prev, shiftDate: selectedDate }));
            // Clear auto-populated fields when date changes
            setAutoPopulatedFields(new Set());
            // Clear future date error if it exists
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.futureDate;
                return newErrors;
            });
        } else {
            // Set validation error for future date
            setValidationErrors(prev => ({
                ...prev,
                futureDate: true
            }));
        }
    };

    const handleShiftTypeChange = (e) => {
        const selectedType = e.target.value;
        setShiftData(prev => ({ ...prev, shiftType: selectedType }));
        // Clear auto-populated fields when shift type changes
        setAutoPopulatedFields(new Set());
    };

    // Validation utility functions
    const isValidNonNegativeNumber = (value) => {
        if (value === '' || value === null || value === undefined) return true; // Allow empty
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
    };

    const isClosingGreaterThanOpening = (opening, closing) => {
        if (opening === '' || closing === '' || opening === null || closing === null) return true;
        const openingNum = parseFloat(opening);
        const closingNum = parseFloat(closing);
        if (isNaN(openingNum) || isNaN(closingNum)) return true;
        return closingNum >= openingNum;
    };

    const getInputClassName = (baseClass, isValid) => {
        return `${baseClass} ${isValid ? '' : 'border-red-500 bg-red-50'}`;
    };

    // Function to manually refresh fuel prices from database
    const refreshFuelPrices = async () => {
        try {
            setIsLoading(true);
            // Fetch current fuel prices from new API
            const response = await axios.get(`${API_URL}/api/fuel-prices/current`);
            const currentPrices = response.data;
            
            if (currentPrices.length > 0 && shiftData.fuelEntries.length > 0) {
                setShiftData(prev => ({
                    ...prev,
                    fuelEntries: prev.fuelEntries.map(entry => {
                        const updatedFuel = currentPrices.find(f => f.id === entry.fuelType);
                        if (updatedFuel) {
                            return { ...entry, unitPrice: updatedFuel.current_price };
                        }
                        return entry;
                    })
                }));
                showSuccessBanner('Fuel prices refreshed from database!');
            } else {
                // Fallback to settings-based prices
                if (fuelTypes.length > 0 && shiftData.fuelEntries.length > 0) {
                    setShiftData(prev => ({
                        ...prev,
                        fuelEntries: prev.fuelEntries.map(entry => {
                            const updatedFuel = fuelTypes.find(f => f.id === entry.fuelType);
                            if (updatedFuel) {
                                return { ...entry, unitPrice: updatedFuel.current_price || updatedFuel.price || 0 };
                            }
                            return entry;
                        })
                    }));
                    showSuccessBanner('Fuel prices refreshed from settings!');
                }
            }
        } catch (error) {
            console.error('Error refreshing fuel prices:', error);
            // Fallback to settings-based prices
            if (fuelTypes.length > 0 && shiftData.fuelEntries.length > 0) {
                setShiftData(prev => ({
                    ...prev,
                    fuelEntries: prev.fuelEntries.map(entry => {
                        const updatedFuel = fuelTypes.find(f => f.id === entry.fuelType);
                        if (updatedFuel) {
                            return { ...entry, unitPrice: updatedFuel.current_price || updatedFuel.price || 0 };
                        }
                        return entry;
                    })
                }));
                showSuccessBanner('Fuel prices refreshed from settings (API unavailable)!');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const updateFuelEntry = (id, field, value, index = null) => {
        setShiftData(prev => ({
            ...prev,
            fuelEntries: prev.fuelEntries.map(entry => {
                if (entry.id === id) {
                    if (field === 'openingReadings' || field === 'closingReadings') {
                        const newReadings = [...entry[field]];
                        newReadings[index] = value;
                        
                        // If user manually edits an auto-populated field, remove it from auto-populated set
                        if (field === 'openingReadings' && isFieldAutoPopulated(id, field, index)) {
                            setAutoPopulatedFields(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(`${id}_opening_${index}`);
                                return newSet;
                            });
                        }
                        
                        return { ...entry, [field]: newReadings };
                    } else if (field.startsWith('digitalPayments.')) {
                        const paymentType = field.split('.')[1];
                        return {
                            ...entry,
                            digitalPayments: {
                                ...entry.digitalPayments,
                                [paymentType]: value
                            }
                        };
                    } else {
                        return { ...entry, [field]: value };
                    }
                }
                return entry;
            })
        }));
    };

    const addDynamicEntry = (type) => {
        const newEntry = {
            id: generateId(),
            partyName: '',
            category: '',
            amount: '',
            remarks: ''
        };

        // Map the type to the correct property name
        const propertyName = type === 'cash' ? 'cashCollections' : 
                           type === 'credit' ? 'creditSales' : 
                           type === 'expense' ? 'expenses' : type;

        setShiftData(prev => ({
            ...prev,
            [propertyName]: [...(prev[propertyName] || []), newEntry]
        }));
    };

    const removeDynamicEntry = (type, id) => {
        // Map the type to the correct property name
        const propertyName = type === 'cash' ? 'cashCollections' : 
                           type === 'credit' ? 'creditSales' : 
                           type === 'expense' ? 'expenses' : type;

        setShiftData(prev => ({
            ...prev,
            [propertyName]: prev[propertyName].filter(entry => entry.id !== id)
        }));
    };

    const updateDynamicEntry = (type, id, field, value) => {
        // Map the type to the correct property name
        const propertyName = type === 'cash' ? 'cashCollections' : 
                           type === 'credit' ? 'creditSales' : 
                           type === 'expense' ? 'expenses' : type;

        setShiftData(prev => ({
            ...prev,
            [propertyName]: prev[propertyName].map(entry => 
                entry.id === id ? { ...entry, [field]: value } : entry
            )
        }));
    };

    const calculateTotals = () => {
        // Use the consistent calculation helper
        return calculateShiftTotals(shiftData);
    };

    const validateShiftData = () => {
        const errors = [];
        const newValidationErrors = {};

        // Validate shift date - cannot be in future
        if (!isValidShiftDate(shiftData.shiftDate)) {
            errors.push('Cannot create shift for future dates');
            newValidationErrors.futureDate = true;
        }

        // Check for existing shift - prevent duplicate submission without explicit confirmation
        if (existingShiftId) {
            errors.push(`A shift already exists for ${shiftData.shiftDate} (${shiftData.shiftType}). Please use a different date/shift or confirm overwrite.`);
            newValidationErrors.duplicateShift = true;
        }

        // Check if fuel entries have valid readings
        shiftData.fuelEntries.forEach((entry, index) => {
            let hasReadings = false;
            entry.openingReadings.forEach((opening, nozzleIndex) => {
                const closing = entry.closingReadings[nozzleIndex];
                if (opening !== '' || closing !== '') {
                    hasReadings = true;
                }

                // Validate non-negative numbers
                if (opening !== '' && !isValidNonNegativeNumber(opening)) {
                    errors.push(`${entry.fuelName} Nozzle ${nozzleIndex + 1}: Opening reading must be non-negative`);
                    newValidationErrors[`fuel_${entry.id}_opening_${nozzleIndex}`] = true;
                }
                if (closing !== '' && !isValidNonNegativeNumber(closing)) {
                    errors.push(`${entry.fuelName} Nozzle ${nozzleIndex + 1}: Closing reading must be non-negative`);
                    newValidationErrors[`fuel_${entry.id}_closing_${nozzleIndex}`] = true;
                }

                // Validate closing >= opening
                if (opening !== '' && closing !== '' && !isClosingGreaterThanOpening(opening, closing)) {
                    errors.push(`${entry.fuelName} Nozzle ${nozzleIndex + 1}: Closing reading must be greater than or equal to opening reading`);
                    newValidationErrors[`fuel_${entry.id}_closing_${nozzleIndex}`] = true;
                }
            });

            if (!hasReadings) {
                errors.push(`${entry.fuelName}: Please enter at least one opening and closing reading`);
            }

            // Validate testing litres
            if (entry.testingLitres !== '' && !isValidNonNegativeNumber(entry.testingLitres)) {
                errors.push(`${entry.fuelName}: Testing litres must be non-negative`);
                newValidationErrors[`fuel_${entry.id}_testing`] = true;
            }

            // Validate digital payments
            if (entry.digitalPayments.paytm !== '' && !isValidNonNegativeNumber(entry.digitalPayments.paytm)) {
                errors.push(`${entry.fuelName}: Paytm amount must be non-negative`);
                newValidationErrors[`fuel_${entry.id}_paytm`] = true;
            }
            if (entry.digitalPayments.phonepe !== '' && !isValidNonNegativeNumber(entry.digitalPayments.phonepe)) {
                errors.push(`${entry.fuelName}: PhonePe amount must be non-negative`);
                newValidationErrors[`fuel_${entry.id}_phonepe`] = true;
            }
            if (entry.digitalPayments.other !== '' && !isValidNonNegativeNumber(entry.digitalPayments.other)) {
                errors.push(`${entry.fuelName}: Other digital amount must be non-negative`);
                newValidationErrors[`fuel_${entry.id}_other`] = true;
            }
        });

        // Validate credit sales amounts
        shiftData.creditSales?.forEach((sale, index) => {
            if (sale.amount !== '' && !isValidNonNegativeNumber(sale.amount)) {
                errors.push(`Credit Sale ${index + 1}: Amount must be non-negative`);
                newValidationErrors[`credit_${sale.id}_amount`] = true;
            }
        });

        // Validate expense amounts
        shiftData.expenses?.forEach((expense, index) => {
            if (expense.amount !== '' && !isValidNonNegativeNumber(expense.amount)) {
                errors.push(`Expense ${index + 1}: Amount must be non-negative`);
                newValidationErrors[`expense_${expense.id}_amount`] = true;
            }
        });

        // Validate cash collection amounts
        shiftData.cashCollections?.forEach((collection, index) => {
            if (collection.amount !== '' && !isValidNonNegativeNumber(collection.amount)) {
                errors.push(`Cash Collection ${index + 1}: Amount must be non-negative`);
                newValidationErrors[`cash_${collection.id}_amount`] = true;
            }
        });

        setValidationErrors(newValidationErrors);
        return errors;
    };

    const handleSubmitClick = () => {
        if (isSubmitting) return;

        // Normal flow for all shifts
        const validationErrors = validateShiftData();
        if (validationErrors.length > 0) {
            alert('Please fix the following errors:\n\n' + validationErrors.join('\n'));
            return;
        }

        // Show confirmation modal
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = () => {
        setShowConfirmModal(false);
        submitShift();
    };

    const handleCancelSubmit = () => {
        setShowConfirmModal(false);
    };

    const submitShift = async () => {
        if (isSubmitting) return;

        setIsSubmitting(true);

        try {
            const totals = calculateTotals();

            // Transform fuel entries for backend
            const transformedFuelEntries = [];
            const transformedDigitalPayments = [];

            shiftData.fuelEntries.forEach(entry => {
                // Calculate testing litres per nozzle (divided equally among all nozzles)
                const totalTestingLitres = parseFloat(entry.testingLitres) || 0;
                const totalNozzles = entry.openingReadings.length;
                const testingLitresPerNozzle = totalNozzles > 0 ? totalTestingLitres / totalNozzles : 0;
                
                entry.openingReadings.forEach((opening, nozzleIndex) => {
                    const closing = entry.closingReadings[nozzleIndex];
                    if (opening !== '' || closing !== '') {
                        transformedFuelEntries.push({
                            fuelType: entry.fuelType,
                            nozzleNumber: nozzleIndex + 1,
                            openingReading: parseFloat(opening) || 0,
                            closingReading: parseFloat(closing) || 0,
                            testingLitres: testingLitresPerNozzle,
                            unitPrice: parseFloat(entry.unitPrice) || 0
                        });
                    }
                });

                // Add digital payments if any
                const paytmAmount = Math.round(parseFloat(entry.digitalPayments.paytm) || 0);
                const phonepeAmount = Math.round(parseFloat(entry.digitalPayments.phonepe) || 0);
                const otherAmount = Math.round(parseFloat(entry.digitalPayments.other) || 0);

                if (paytmAmount > 0 || phonepeAmount > 0 || otherAmount > 0) {
                    transformedDigitalPayments.push({
                        fuelType: entry.fuelType,
                        paytmAmount,
                        phonepeAmount,
                        otherDigitalAmount: otherAmount
                    });
                }
            });

            // Transform other entries
            const transformedCreditSales = shiftData.creditSales
                .filter(sale => sale.partyName && sale.amount)
                .map(sale => ({
                    partyName: sale.partyName,
                    fuelType: sale.category,
                    amount: Math.round(parseFloat(sale.amount) || 0),
                    remarks: sale.remarks || ''
                }));

            const transformedExpenses = shiftData.expenses
                .filter(expense => expense.partyName && expense.amount)
                .map(expense => ({
                    payee: expense.partyName,
                    category: expense.category,
                    amount: Math.round(parseFloat(expense.amount) || 0),
                    remarks: expense.remarks || ''
                }));

            const transformedCashCollections = shiftData.cashCollections
                .filter(collection => {
                    return collection.partyName && collection.amount;
                })
                .map(collection => ({
                    source: collection.partyName,
                    mode: collection.category,
                    amount: Math.round(parseFloat(collection.amount) || 0),
                    remarks: collection.remarks || ''
                }));

            const payload = {
                shiftDate: shiftData.shiftDate,
                shiftType: shiftData.shiftType,
                fuelEntries: transformedFuelEntries,
                digitalPayments: transformedDigitalPayments,
                creditSales: transformedCreditSales,
                expenses: transformedExpenses,
                cashCollections: transformedCashCollections,
                totals
            };

            console.log('Submitting shift data:', payload);

            const response = await axios.post(`${API_URL}/api/shifts`, payload);
            
            showSuccessBanner(
                `Shift data saved successfully! Shift ID: ${response.data.shiftId}. ` +
                `Expected Cash: ${formatMoney(totals.expectedCash)}`
            );

            // Refresh creditors list to include any new creditors from cash collections
            fetchCreditors();
            
            // Refresh expense payees list to include any new payees from expenses
            fetchExpensePayees();

            // Reset form for new shift
            setShiftData({
                shiftDate: new Date().toISOString().split('T')[0],
                shiftType: 'morning',
                fuelEntries: [],
                creditSales: [],
                expenses: [],
                cashCollections: [],
                actualCash: ''
            });

            setExistingShiftId(response.data.shiftId);

        } catch (error) {
            console.error('Error submitting shift:', error);
            
            let errorMessage = 'Failed to save shift data. ';
            if (error.response?.status === 409) {
                errorMessage += 'A shift for this date and type already exists.';
            } else if (error.response?.status === 500) {
                errorMessage += 'Server error occurred. Please check the database connection.';
            } else if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
                errorMessage += 'Cannot connect to the server. Please ensure the backend is running.';
            } else {
                errorMessage += error.response?.data?.message || error.message || 'Please try again.';
            }
            
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totals = calculateTotals();

    return (
        <div>
            {/* Shift Header */}
            <div className="card p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="shift-date" className="block text-sm font-medium text-gray-700">Shift Date</label>
                        <input 
                            type="date" 
                            id="shift-date"
                            className={getInputClassName('input-field mt-1 max-w-xs bg-white', !validationErrors.futureDate)}
                            value={shiftData.shiftDate}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={handleShiftDateChange}
                        />
                        {validationErrors.futureDate && (
                            <p className="text-red-500 text-sm mt-1">
                                <i className="fas fa-exclamation-triangle mr-1"></i>
                                Cannot create shift for future dates
                            </p>
                        )}
                    </div>
                    <div>
                        <label htmlFor="shift-select" className="block text-sm font-medium text-gray-700">Shift Type</label>
                        <select 
                            id="shift-select" 
                            className="input-field mt-1 max-w-xs bg-white"
                            value={shiftData.shiftType}
                            onChange={handleShiftTypeChange}
                        >
                            <option value="morning">Morning (6AM - 6PM)</option>
                            <option value="night">Night (6PM - 6AM)</option>
                        </select>
                    </div>
                </div>
                
                {/* Checking for existing shift indicator */}
                {checkingExistingShift && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-300 rounded-md">
                        <div className="flex items-center">
                            <i className="fas fa-spinner fa-spin text-blue-600 mr-2"></i>
                            <span className="text-sm text-blue-700">Checking for existing shift...</span>
                        </div>
                    </div>
                )}
                
                {/* Existing shift warning banner */}
                {existingShiftId && (
                    <div className="mt-4 p-4 bg-red-100 border-2 border-red-500 rounded-lg shadow-lg">
                        <div className="flex items-start">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-red-800 mb-2 flex items-center">
                                    ⚠️ SHIFT ALREADY EXISTS
                                </h3>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-red-700">
                                        📅 Date: <span className="font-bold">{shiftData.shiftDate}</span>
                                    </p>
                                    <p className="text-sm font-medium text-red-700">
                                        🕐 Shift: <span className="font-bold">{shiftData.shiftType.toUpperCase()}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Fuel Sales Card */}
                    <div className="card p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-700">Fuel Sales (MS & HSD)</h2>
                            <div className="flex items-center gap-2">
                                {/* Auto-populate controls */}
                                {autoPopulatedFields.size > 0 && (
                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center">
                                        <i className="fas fa-magic mr-1"></i>
                                        {autoPopulatedFields.size} auto-filled
                                    </span>
                                )}
                                {loadingPreviousReadings && (
                                    <span className="text-xs text-gray-500 flex items-center">
                                        <i className="fas fa-spinner fa-spin mr-1"></i>
                                        Loading previous readings...
                                    </span>
                                )}
                                {fuelTypes.length > 0 && shiftData.fuelEntries.length > 0 && (
                                    <button 
                                        onClick={refreshFuelPrices}
                                        className="btn btn-secondary text-sm px-3 py-1"
                                        title="Refresh fuel prices from database"
                                    >
                                        <i className="fas fa-sync-alt mr-1"></i>
                                        Refresh Prices
                                    </button>
                                )}
                            </div>
                        </div>
                        {fuelTypes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <i className="fas fa-gas-pump text-4xl mb-4 text-gray-300"></i>
                                <p className="text-lg font-medium">No Fuel Types Configured</p>
                                <p className="text-sm mt-2">Please go to Settings → Fuel & Nozzle Management to add fuel types before creating a shift entry.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {shiftData.fuelEntries.map(entry => {
                                const fuel = fuelTypes.find(f => f.id === entry.fuelType);
                                let totalLitres = 0;
                                entry.openingReadings.forEach((opening, index) => {
                                    const closing = parseFloat(entry.closingReadings[index]) || 0;
                                    const openingVal = parseFloat(opening) || 0;
                                    if (closing > openingVal) {
                                        totalLitres += closing - openingVal;
                                    }
                                });
                                const testingLitres = parseFloat(entry.testingLitres) || 0;
                                const saleLitres = totalLitres - testingLitres;
                                const saleAmount = saleLitres * parseFloat(entry.unitPrice);

                                return (
                                    <div key={entry.id} className="p-4 border border-gray-200 rounded-lg">
                                        <h3 className="text-base font-semibold text-indigo-700 mb-3">{entry.fuelName}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                {entry.openingReadings.map((opening, index) => {
                                                    const openingValid = isValidNonNegativeNumber(opening);
                                                    const closingValid = isValidNonNegativeNumber(entry.closingReadings[index]) && 
                                                                         isClosingGreaterThanOpening(opening, entry.closingReadings[index]);
                                                    const isOpeningAutoPopulated = isFieldAutoPopulated(entry.id, 'openingReadings', index);
                                                    
                                                    return (
                                                        <div key={index} className="grid grid-cols-2 gap-x-3 gap-y-1">
                                                            <label className="text-sm text-gray-600 col-span-2 flex items-center gap-2">
                                                                Nozzle {index + 1}
                                                                {isOpeningAutoPopulated && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                        <i className="fas fa-magic mr-1"></i>
                                                                        Auto-filled
                                                                    </span>
                                                                )}
                                                            </label>
                                                            <div className="relative">
                                                                <input 
                                                                    type="number" 
                                                                    step="0.01" 
                                                                    inputMode="decimal"
                                                                    className={`${getInputClassName('input-field', openingValid && !validationErrors[`fuel_${entry.id}_opening_${index}`])} ${
                                                                        isOpeningAutoPopulated ? 'bg-blue-50 border-blue-300 text-blue-900 cursor-not-allowed' : ''
                                                                    }`}
                                                                    placeholder="Opening"
                                                                    value={opening}
                                                                    disabled={isOpeningAutoPopulated}
                                                                    readOnly={isOpeningAutoPopulated}
                                                                    onChange={(e) => updateFuelEntry(entry.id, 'openingReadings', e.target.value, index)}
                                                                />
                                                                {isOpeningAutoPopulated && (
                                                                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                                                        <i className="fas fa-lock text-blue-500 text-xs"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <input 
                                                                type="number" 
                                                                step="0.01" 
                                                                inputMode="decimal"
                                                                className={getInputClassName('input-field', closingValid && !validationErrors[`fuel_${entry.id}_closing_${index}`])}
                                                                placeholder="Closing"
                                                                value={entry.closingReadings[index]}
                                                                onChange={(e) => updateFuelEntry(entry.id, 'closingReadings', e.target.value, index)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="text-sm text-gray-600">Testing (Litres)</label>
                                                    <input 
                                                        type="number" 
                                                        step="0.01" 
                                                        inputMode="decimal"
                                                        value={entry.testingLitres} 
                                                        className={getInputClassName('input-field', 
                                                            isValidNonNegativeNumber(entry.testingLitres) && !validationErrors[`fuel_${entry.id}_testing`])}
                                                        onChange={(e) => updateFuelEntry(entry.id, 'testingLitres', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm text-gray-600">Unit Price (₹) - From Database</label>
                                                    <div className="input-field bg-gray-50 cursor-not-allowed flex items-center">
                                                        <span className="text-gray-700 font-medium">₹{(parseFloat(entry.unitPrice) || 0).toFixed(2)}</span>
                                                        <i className="fas fa-lock text-gray-400 ml-2 text-xs"></i>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">Price is automatically loaded from settings and cannot be modified here.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <hr className="my-4" />
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                            <div className="p-2 bg-gray-50 rounded">
                                                <label className="block font-medium text-gray-500">Sale (Ltr)</label>
                                                <p className="text-base font-bold text-gray-800 mt-1">{formatLitre(saleLitres)}</p>
                                            </div>
                                            <div className="p-2 bg-indigo-50 rounded">
                                                <label className="block font-medium text-indigo-500">Total Sale (₹)</label>
                                                <p className="text-base font-bold text-indigo-800 mt-1">{formatMoney(saleAmount)}</p>
                                            </div>
                                            <div className="p-2 bg-green-50 rounded">
                                                <label className="block font-medium text-green-500">Cash (₹)</label>
                                                <p className="text-base font-bold text-green-800 mt-1">
                                                    {formatMoney(saleAmount - (parseFloat(entry.digitalPayments.paytm) || 0) - (parseFloat(entry.digitalPayments.phonepe) || 0) - (parseFloat(entry.digitalPayments.other) || 0))}
                                                </p>
                                            </div>
                                        </div>
                                        <h4 className="text-sm font-semibold text-gray-600 mt-4 mb-2">Digital Payments</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                                            <div>
                                                <label className="text-sm text-gray-600">Paytm (₹)</label>
                                                <input 
                                                    type="number" 
                                                    inputMode="numeric"
                                                    value={entry.digitalPayments.paytm} 
                                                    className={getInputClassName('input-field', 
                                                        isValidNonNegativeNumber(entry.digitalPayments.paytm) && !validationErrors[`fuel_${entry.id}_paytm`])}
                                                    onChange={(e) => updateFuelEntry(entry.id, 'digitalPayments.paytm', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">PhonePe (₹)</label>
                                                <input 
                                                    type="number" 
                                                    inputMode="numeric"
                                                    value={entry.digitalPayments.phonepe} 
                                                    className={getInputClassName('input-field', 
                                                        isValidNonNegativeNumber(entry.digitalPayments.phonepe) && !validationErrors[`fuel_${entry.id}_phonepe`])}
                                                    onChange={(e) => updateFuelEntry(entry.id, 'digitalPayments.phonepe', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm text-gray-600">DTPlus/Other (₹)</label>
                                                <input 
                                                    type="number" 
                                                    inputMode="numeric"
                                                    value={entry.digitalPayments.other} 
                                                    className={getInputClassName('input-field', 
                                                        isValidNonNegativeNumber(entry.digitalPayments.other) && !validationErrors[`fuel_${entry.id}_other`])}
                                                    onChange={(e) => updateFuelEntry(entry.id, 'digitalPayments.other', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                        )}
                    </div>

                    {/* Credit Sales Card */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Credit Sales</h2>
                        <div className="space-y-3">
                            {shiftData.creditSales.map(sale => (
                                <div key={sale.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                                    <div className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-12 md:col-span-4">
                                            <SearchableCreditorInput
                                                value={sale.partyName}
                                                onChange={(value) => updateDynamicEntry('credit', sale.id, 'partyName', value)}
                                                creditors={creditors}
                                                placeholder="Type to search creditors or enter new name..."
                                                className="input-field bg-white"
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <select 
                                                className="input-field bg-white"
                                                value={sale.category}
                                                onChange={(e) => updateDynamicEntry('credit', sale.id, 'category', e.target.value)}
                                            >
                                                <option value="">Select Credit Type...</option>
                                                {(settings.creditTypes || []).length === 0 && (
                                                    <option value="" disabled>No credit types configured</option>
                                                )}
                                                {(settings.creditTypes || []).map(type => (
                                                    <option key={type.id || type.name || type} value={type.name || type}>{type.name || type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-8 md:col-span-3">
                                            <input 
                                                type="number" 
                                                inputMode="numeric"
                                                className={getInputClassName('input-field', 
                                                    isValidNonNegativeNumber(sale.amount) && !validationErrors[`credit_${sale.id}_amount`])}
                                                placeholder="₹ Amount"
                                                value={sale.amount}
                                                onChange={(e) => updateDynamicEntry('credit', sale.id, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <button 
                                                className="btn btn-danger w-full"
                                                onClick={() => removeDynamicEntry('credit', sale.id)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-12">
                                        <input 
                                            type="text" 
                                            className="input-field w-full" 
                                            placeholder="Remarks (optional)"
                                            value={sale.remarks || ''}
                                            onChange={(e) => updateDynamicEntry('credit', sale.id, 'remarks', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => addDynamicEntry('credit')} 
                            className="btn btn-secondary w-full mt-3"
                        >
                            <i className="fas fa-plus mr-2"></i>Add Credit Sale
                        </button>
                    </div>

                    {/* Credit Collections Card */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Credit Collection</h2>
                        <div className="space-y-3">
                            {shiftData.cashCollections.map(collection => (
                                <div key={collection.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                                    <div className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-12 md:col-span-4">
                                            <SearchableCreditorInput
                                                value={collection.partyName}
                                                onChange={(value) => updateDynamicEntry('cash', collection.id, 'partyName', value)}
                                                creditors={creditors}
                                                placeholder="Type to search creditors or enter new name..."
                                                className="input-field bg-white"
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <select 
                                                className="input-field bg-white"
                                                value={collection.category}
                                                onChange={(e) => updateDynamicEntry('cash', collection.id, 'category', e.target.value)}
                                            >
                                                <option value="">Select Payment Mode...</option>
                                                {(settings.cashModes || []).length === 0 && (
                                                    <option value="" disabled>No cash modes configured</option>
                                                )}
                                                {(settings.cashModes || []).map(mode => (
                                                    <option key={mode.id || mode.name || mode} value={mode.name || mode}>{mode.name || mode}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-8 md:col-span-3">
                                            <input 
                                                type="number" 
                                                inputMode="numeric"
                                                className={getInputClassName('input-field', 
                                                    isValidNonNegativeNumber(collection.amount) && !validationErrors[`cash_${collection.id}_amount`])}
                                                placeholder="₹ Amount"
                                                value={collection.amount}
                                                onChange={(e) => updateDynamicEntry('cash', collection.id, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <button 
                                                className="btn btn-danger w-full"
                                                onClick={() => removeDynamicEntry('cash', collection.id)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-12">
                                        <input 
                                            type="text" 
                                            className="input-field w-full" 
                                            placeholder="Remarks (optional)"
                                            value={collection.remarks || ''}
                                            onChange={(e) => updateDynamicEntry('cash', collection.id, 'remarks', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => addDynamicEntry('cash')} 
                            className="btn btn-secondary w-full mt-3"
                        >
                            <i className="fas fa-plus mr-2"></i>Add Credit Collection
                        </button>
                    </div>

                    {/* Expenses Card */}
                    <div className="card p-4">
                        <h2 className="text-lg font-bold mb-4 text-gray-700">Expenses</h2>
                        <div className="space-y-3">
                            {shiftData.expenses.map(expense => (
                                <div key={expense.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                                    <div className="grid grid-cols-12 gap-2 items-center">
                                        <div className="col-span-12 md:col-span-4">
                                            <SearchableCreditorInput
                                                value={expense.partyName}
                                                onChange={(value) => updateDynamicEntry('expense', expense.id, 'partyName', value)}
                                                creditors={expensePayees}
                                                placeholder="Type to search payees or enter new name..."
                                                className="input-field bg-white"
                                            />
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <select 
                                                className="input-field bg-white"
                                                value={expense.category}
                                                onChange={(e) => updateDynamicEntry('expense', expense.id, 'category', e.target.value)}
                                            >
                                                <option value="">Select Expense Category...</option>
                                                {(settings.expenseCategories || []).length === 0 && (
                                                    <option value="" disabled>No expense categories configured</option>
                                                )}
                                                {(settings.expenseCategories || []).map(category => (
                                                    <option key={category.id || category.name || category} value={category.name || category}>{category.name || category}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-8 md:col-span-3">
                                            <input 
                                                type="number" 
                                                inputMode="numeric"
                                                className={getInputClassName('input-field', 
                                                    isValidNonNegativeNumber(expense.amount) && !validationErrors[`expense_${expense.id}_amount`])}
                                                placeholder="₹ Amount"
                                                value={expense.amount}
                                                onChange={(e) => updateDynamicEntry('expense', expense.id, 'amount', e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2">
                                            <button 
                                                className="btn btn-danger w-full"
                                                onClick={() => removeDynamicEntry('expense', expense.id)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="col-span-12">
                                        <input 
                                            type="text" 
                                            className="input-field w-full" 
                                            placeholder="Remarks (optional)"
                                            value={expense.remarks || ''}
                                            onChange={(e) => updateDynamicEntry('expense', expense.id, 'remarks', e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={() => addDynamicEntry('expense')} 
                            className="btn btn-secondary w-full mt-3"
                        >
                            <i className="fas fa-plus mr-2"></i>Add Expense
                        </button>
                    </div>
                </div>

                {/* Right Summary Column */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4 space-y-6">
                        <div className="card p-4">
                            <h2 className="text-lg font-bold mb-4 text-gray-700">Shift Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between font-semibold">
                                    <span>(+) Cash from Fuel Sales:</span> 
                                    <span className="text-green-600">{formatMoney(totals.cashFromFuel)}</span>
                                </div>
                                <div className="text-xs text-gray-500 mb-1">
                                    (Fuel Sales - Digital Payments from Fuel)
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>(-) Total Credit Sales:</span> 
                                    <span className="text-red-600">{formatMoney(totals.totalCreditSales)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>(+) Credit Collection (Cash):</span> 
                                    <span className="text-green-600">{formatMoney(totals.creditReceipts)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>(-) Expenses (Cash):</span> 
                                    <span className="text-red-600">{formatMoney(totals.totalExpenses)}</span>
                                </div>
                                <hr className="my-2 border-t-2 border-gray-300" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold">Expected Cash:</span>
                                    <span className="font-bold text-blue-600">{formatMoney(totals.expectedCash)}</span>
                                </div>
                                
                                {/* Actual Cash Input */}
                                <div className="mt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Cash in Hand:</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        inputMode="numeric"
                                        className="input-field w-full" 
                                        placeholder="Enter actual cash amount"
                                        value={shiftData.actualCash}
                                        onChange={(e) => setShiftData(prev => ({ ...prev, actualCash: e.target.value }))}
                                    />
                                </div>
                                
                                {/* Difference Calculation */}
                                {shiftData.actualCash && !isNaN(parseFloat(shiftData.actualCash)) && (
                                    <div className="mt-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-gray-600">Difference (Expected - Actual):</span>
                                            <span className={`font-bold ${totals.cashDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {totals.cashDifference >= 0 ? '+' : ''}{formatMoney(Math.abs(totals.cashDifference))}
                                            </span>
                                        </div>
                                        {totals.cashDifference !== 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {totals.cashDifference > 0 ? 'Cash surplus' : 'Cash shortage'}
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <hr className="my-2" />
                                <div className="text-xs text-gray-500 space-y-1 pt-2">
                                    <div className="flex justify-between">
                                        <span>Total Fuel Sale Value:</span> 
                                        <span>{formatMoney(totals.totalFuelSale)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Credit Sales:</span> 
                                        <span>{formatMoney(totals.totalCreditSales)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Digital Payment from Fuel:</span> 
                                        <span>{formatMoney(totals.totalDigitalPaymentsFromFuel)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Digital Payment from Credit Collection:</span> 
                                        <span>{formatMoney(totals.otherDigitalPayments)}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>Total Digital Payments:</span> 
                                        <span>{formatMoney(totals.totalDigitalPayments)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button 
                            className={`btn w-full text-base py-3 ${isSubmitting ? 'btn-secondary cursor-not-allowed' : 'btn-primary'}`}
                            onClick={handleSubmitClick}
                            disabled={isSubmitting || fuelTypes.length === 0}
                        >
                            {isSubmitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Saving Shift Data...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-upload mr-2"></i>
                                    Submit Shift Data
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 h-full w-full flex items-center justify-center z-50">
                    <div className="relative p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                                <i className="fas fa-upload text-blue-600"></i>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Confirm Shift Submission</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to submit this shift data? This action will save all the entered information.
                                </p>
                                {existingShiftId && (
                                    <p className="text-sm text-orange-600 mt-2">
                                        <i className="fas fa-exclamation-triangle mr-1"></i>
                                        This will overwrite existing shift data.
                                    </p>
                                )}
                            </div>
                            <div className="items-center px-4 py-3 gap-2 flex justify-center">
                                <button 
                                    onClick={handleCancelSubmit}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleConfirmSubmit}
                                    className="btn btn-primary"
                                >
                                    <i className="fas fa-upload mr-2"></i>
                                    Submit Shift Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShiftEntryView;

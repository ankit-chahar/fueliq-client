import React, { useState, useEffect } from 'react';

const SearchableCreditorInput = ({ value, onChange, creditors, placeholder, required, className = "input-field" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value || '');
    const [filteredCreditors, setFilteredCreditors] = useState(creditors);

    useEffect(() => {
        setInputValue(value || '');
    }, [value]);

    useEffect(() => {
        // Filter creditors based on input
        if (inputValue.trim() === '') {
            setFilteredCreditors(creditors);
        } else {
            const filtered = creditors.filter(creditor =>
                creditor.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            setFilteredCreditors(filtered);
        }
    }, [inputValue, creditors]);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleCreditorSelect = (creditor) => {
        setInputValue(creditor.name);
        onChange(creditor.name);
        setIsOpen(false);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleInputBlur = () => {
        // Delay closing to allow for clicks on dropdown items
        setTimeout(() => setIsOpen(false), 200);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    return (
        <div className="relative">
            <input
                type="text"
                className={className}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                required={required}
                autoComplete="off"
            />
            
            {isOpen && (filteredCreditors.length > 0 || inputValue.trim() !== '') && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredCreditors.length > 0 ? (
                        <>
                            {filteredCreditors.map((creditor, index) => (
                                <button
                                    key={creditor.name}
                                    type="button"
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 border-none bg-white cursor-pointer flex justify-between items-center"
                                    onMouseDown={(e) => e.preventDefault()} // Prevent blur
                                    onClick={() => handleCreditorSelect(creditor)}
                                >
                                    <span className="font-medium text-gray-900">{creditor.name}</span>
                                    <span className="text-sm text-gray-500">₹{creditor.totalAmount.toLocaleString()}</span>
                                </button>
                            ))}
                        </>
                    ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                            No creditors found. Press Enter to use "{inputValue}" as new creditor.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableCreditorInput;

import React, { useState, useEffect } from 'react';

const SuccessBanner = ({ message }) => {
    const [show, setShow] = useState(false);
    
    useEffect(() => {
        if (message) {
            setShow(true);
            const timer = setTimeout(() => setShow(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    if (!show || !message) return null;

    return (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] bg-green-500 text-white py-4 px-6 rounded-lg shadow-2xl flex items-center justify-center transition-all duration-300 min-w-[300px] ${show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'}`}>
            <i className="fas fa-check-circle mr-3 text-xl"></i>
            <span className="text-lg font-medium">{message}</span>
        </div>
    );
};

export default SuccessBanner;

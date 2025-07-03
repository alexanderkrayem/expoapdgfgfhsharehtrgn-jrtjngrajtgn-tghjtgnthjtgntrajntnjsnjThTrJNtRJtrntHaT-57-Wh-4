// src/components/common/CityChangePopover.jsx
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const CityChangePopover = ({ onCitySelect, currentCityId, apiBaseUrl, onClose }) => {
    const [availableCities, setAvailableCities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const popoverRef = useRef(null); // Ref to get the popover element

    // --- Dynamic Positioning State ---
    const [popoverPosition, setPopoverPosition] = useState({
        top: 'top-full',
        right: 'right-0',
        left: 'auto',
    });

    useEffect(() => {
        const fetchCities = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${apiBaseUrl}/api/cities`);
                if (!response.ok) throw new Error("Failed to fetch cities");
                const data = await response.json();
                setAvailableCities(data);
            } catch (err) {
                console.error("Failed to fetch cities for popover:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCities();
    }, [apiBaseUrl]);


    // --- This effect handles the dynamic positioning ---
    useLayoutEffect(() => {
        if (popoverRef.current) {
            const popoverRect = popoverRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let newPosition = { ...popoverPosition };

            // Check horizontal overflow (right side)
            if (popoverRect.right > viewportWidth) {
                newPosition.right = 'auto';
                newPosition.left = 'left-0';
            }
            
            // Check horizontal overflow (left side, less common but good to have)
             if (popoverRect.left < 0) {
                newPosition.left = 'left-0';
                newPosition.right = 'auto';
            }
            
            // Check vertical overflow (bottom)
            if (popoverRect.bottom > viewportHeight) {
                newPosition.top = 'bottom-full'; // Flip to appear above the parent
            }
            
            setPopoverPosition(newPosition);
        }
    }, [isLoading]); // Rerun after loading is finished and content is rendered

    const handleSelect = (city) => {
        onCitySelect(city);
        onClose(); // Close the popover after selection
    };

    return (
        <>
            {/* Backdrop to close when clicking outside */}
            
<div onClick={onClose} className="fixed inset-0 z-30"></div>
            
            <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                // Use the dynamic position state here
                className={`absolute mt-2 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-40 ${popoverPosition.top} ${popoverPosition.right} ${popoverPosition.left}`}
                style={{
                    // Prevent initial flicker by hiding until position is calculated
                    visibility: isLoading ? 'hidden' : 'visible'
                }}
            >
                <div className="p-2">
                    <h3 className="px-3 py-2 text-sm font-semibold text-gray-500">اختر مدينتك</h3>
                    <div className="max-h-60 overflow-y-auto">
                        {isLoading ? (
                            // Simple skeleton for loading state
                            <div className="space-y-1 p-2">
                                <div className="h-6 bg-gray-200 rounded-md animate-pulse"></div>
                                <div className="h-6 bg-gray-200 rounded-md animate-pulse" style={{ animationDelay: '100ms' }}></div>
                                <div className="h-6 bg-gray-200 rounded-md animate-pulse" style={{ animationDelay: '200ms' }}></div>
                            </div>
                        ) : (
                            availableCities.map(city => (
                                <button
                                    key={city.id}
                                    onClick={() => handleSelect(city)}
                                    className="w-full text-right flex items-center justify-between px-3 py-2 text-sm text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    <span>{city.name}</span>
                                    {currentCityId === city.id && (
                                        <Check className="h-4 w-4 text-blue-600" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default CityChangePopover;
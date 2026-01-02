"use client";

import { useState, useEffect } from "react";
import { findShortestPath, PathResult } from "@/utils/pathfinding";

interface RoutePlannerProps {
    onPathFound: (result: PathResult | null) => void;
}

type InputType = 'start' | 'waypoint' | 'end';

interface RouteInput {
    id: string;
    type: InputType;
    value: string;
    placeholder: string;
    borderColor: string;
}

export default function RoutePlanner({ onPathFound }: RoutePlannerProps) {
    const [inputs, setInputs] = useState<RouteInput[]>([
        { id: 'start', type: 'start', value: '', placeholder: '출발역', borderColor: 'border-green-500' },
        { id: 'end', type: 'end', value: '', placeholder: '도착역', borderColor: 'border-red-500' }
    ]);

    // Update path whenever inputs change
    useEffect(() => {
        const calculateRoute = () => {
            // 1. Filter valid inputs
            const validNames = inputs.map(i => i.value.trim()).filter(v => v.length > 0);
            if (validNames.length < 2) {
                onPathFound(null);
                return;
            }

            // 2. Chain pathfinding
            // If any segment fails, returns null overall
            const fullPath: string[] = [];
            let totalWeight = 0;
            let totalTransfers = 0;

            for (let i = 0; i < validNames.length - 1; i++) {
                const start = validNames[i];
                const end = validNames[i + 1];

                const result = findShortestPath(start, end);
                if (!result) {
                    onPathFound(null);
                    return; // Invalid link
                }

                // Merge paths
                if (i === 0) {
                    fullPath.push(...result.path);
                } else {
                    // Remove first element to avoid duplication (it's same as prev end)
                    fullPath.push(...result.path.slice(1));
                }

                totalWeight += result.totalWeight;
                totalTransfers += result.transferCount;
            }

            onPathFound({
                path: fullPath,
                totalWeight,
                transferCount: totalTransfers
            });
        };

        const timeout = setTimeout(calculateRoute, 500); // Debounce
        return () => clearTimeout(timeout);
    }, [inputs, onPathFound]);

    const handleInputChange = (id: string, newValue: string) => {
        setInputs(prev => prev.map(input =>
            input.id === id ? { ...input, value: newValue } : input
        ));
    };

    const addWaypoint = () => {
        setInputs(prev => {
            const endInput = prev[prev.length - 1];
            const others = prev.slice(0, prev.length - 1);

            const newWaypoint: RouteInput = {
                id: `waypoint-${Date.now()}`,
                type: 'waypoint',
                value: '',
                placeholder: '경유지',
                borderColor: 'border-gray-400'
            };

            return [...others, newWaypoint, endInput];
        });
    };

    const removeWaypoint = (id: string) => {
        setInputs(prev => prev.filter(input => input.id !== id));
    };

    return (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[1000] flex flex-row items-center gap-3 bg-white/80 backdrop-blur-xl p-3 pr-5 pl-5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/50 animate-in slide-in-from-bottom-10 fade-in duration-500 transition-all hover:scale-[1.01] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)]">
            {inputs.map((input, index) => (
                <div key={input.id} className="flex items-center">
                    {/* Input Field */}
                    <div className="relative group">
                        <input
                            type="text"
                            value={input.value}
                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                            placeholder={input.placeholder}
                            className={`w-36 py-3 px-5 bg-white/90 text-gray-800 font-bold rounded-full border-[3px] outline-none text-center shadow-sm placeholder:text-gray-400 focus:w-44 transition-all duration-300 ${input.borderColor} focus:shadow-md`}
                        />
                        {/* Remove button for waypoints */}
                        {input.type === 'waypoint' && (
                            <button
                                onClick={() => removeWaypoint(input.id)}
                                className="absolute -top-1 -right-1 bg-white text-gray-400 border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-[10px] hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors shadow-sm"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Plus Button: Connector Style */}
                    {index < inputs.length - 1 && (
                        <div className="mx-1 relative">
                            {/* Connector Line */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-[2px] bg-gray-300 -z-10"></div>
                            <button
                                onClick={addWaypoint}
                                className="w-6 h-6 rounded-full bg-white hover:bg-gray-50 text-gray-400 hover:text-blue-600 border border-gray-200 flex items-center justify-center shadow-sm transition-all hover:scale-110 active:scale-95 z-10 relative"
                                title="경유지 추가"
                            >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

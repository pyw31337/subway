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
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[1000] w-[95%] max-w-2xl px-4 pointer-events-none flex justify-center">
            {/* Glassmorphism Container */}
            <div className="pointer-events-auto flex flex-row items-center gap-4 bg-white/75 backdrop-blur-2xl p-5 pl-8 pr-8 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] transition-all duration-500 animate-in slide-in-from-bottom-20 fade-in border border-white/20">

                {inputs.map((input, index) => (
                    <div key={input.id} className="flex items-center relative">
                        {/* Input Field */}
                        <div className="relative group">
                            {/* Label for context (Departure/Arrival) */}
                            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold tracking-widest uppercase ${input.id === 'start' ? 'text-green-600' : input.id === 'end' ? 'text-red-500' : 'text-gray-400'} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}>
                                {input.id === 'start' ? 'Start' : input.id === 'end' ? 'End' : 'Via'}
                            </div>

                            <input
                                type="text"
                                value={input.value}
                                onChange={(e) => handleInputChange(input.id, e.target.value)}
                                placeholder={input.placeholder}
                                className={`w-32 sm:w-40 py-3 px-0 bg-transparent text-gray-900 font-black text-xl text-center outline-none placeholder:text-gray-300/50 transition-all duration-300 border-b-[3px] focus:w-48 sm:focus:w-56 ${input.id === 'start' ? 'border-green-500/50 focus:border-green-500 placeholder:text-green-800/10' :
                                    input.id === 'end' ? 'border-red-500/50 focus:border-red-500 placeholder:text-red-800/10' :
                                        'border-gray-300 focus:border-gray-500 placeholder:text-gray-400'
                                    }`}
                            />

                            {/* Remove button for waypoints */}
                            {input.type === 'waypoint' && (
                                <button
                                    onClick={() => removeWaypoint(input.id)}
                                    className="absolute -top-4 -right-2 bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-all duration-200 shadow-sm opacity-0 group-hover:opacity-100"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Plus Button: Connector Style */}
                        {index < inputs.length - 1 && (
                            <div className="mx-3 relative flex items-center justify-center">
                                {/* Dynamic Connector */}
                                <div className="w-6 h-[2px] bg-gray-200/50 rounded-full"></div>

                                {/* Hover to reveal add button */}
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center">
                                    <button
                                        onClick={addWaypoint}
                                        className="w-6 h-6 rounded-full bg-white hover:bg-blue-600 text-gray-300 hover:text-white border border-gray-100 hover:border-blue-600 flex items-center justify-center shadow-sm transition-all duration-300 hover:scale-125 hover:shadow-lg group"
                                        title="경유지 추가"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:rotate-90">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}


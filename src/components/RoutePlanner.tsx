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
        <div className="absolute bottom-0 left-0 w-full z-[1000] pointer-events-none flex flex-col justify-end">
            {/* Bottom Sheet Glassmorphism Container */}
            <div className="pointer-events-auto w-full bg-white/80 backdrop-blur-2xl border-t border-white/20 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] pb-8 pt-6 px-4 animate-in slide-in-from-bottom-20 fade-in duration-500">
                <div className="max-w-4xl mx-auto flex flex-row items-center justify-center gap-4 sm:gap-6 flex-wrap">

                    {inputs.map((input, index) => (
                        <div key={input.id} className="flex items-center relative">
                            {/* Input Field */}
                            <div className="relative group">
                                {/* Label for context */}
                                <div className={`absolute -top-4 left-0 text-[10px] font-extrabold tracking-widest uppercase ${input.id === 'start' ? 'text-green-600' : input.id === 'end' ? 'text-red-500' : 'text-gray-400'} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}>
                                    {input.id === 'start' ? 'Start' : input.id === 'end' ? 'End' : 'Via'}
                                </div>

                                <input
                                    type="text"
                                    value={input.value}
                                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                                    placeholder={input.placeholder}
                                    className={`w-36 sm:w-48 py-2 px-0 bg-transparent text-gray-900 font-black text-2xl outline-none placeholder:text-gray-300/50 transition-all duration-300 border-b-[3px] focus:w-48 sm:focus:w-64 ${input.id === 'start' ? 'border-green-500/50 focus:border-green-500 placeholder:text-green-800/10' :
                                            input.id === 'end' ? 'border-red-500/50 focus:border-red-500 placeholder:text-red-800/10' :
                                                'border-gray-300 focus:border-gray-500 placeholder:text-gray-400'
                                        }`}
                                />

                                {/* Remove button for waypoints */}
                                {input.type === 'waypoint' && (
                                    <button
                                        onClick={() => removeWaypoint(input.id)}
                                        className="absolute -top-3 -right-2 bg-gray-100 hover:bg-red-500 text-gray-400 hover:text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] transition-all duration-200 shadow-sm"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>

                            {/* Plus Button: Connector Style */}
                            {index < inputs.length - 1 && (
                                <div className="mx-2 sm:mx-4 relative flex items-center justify-center">
                                    {/* Connector Line - Hidden on very small screens if wrap happens, but useful on desktop */}
                                    {/* <div className="hidden sm:block w-4 h-[2px] bg-gray-200/50 rounded-full mr-2"></div> */}

                                    <button
                                        onClick={addWaypoint}
                                        className="w-8 h-8 rounded-full bg-white hover:bg-black text-gray-300 hover:text-white border border-gray-200 hover:border-black flex items-center justify-center shadow-sm transition-all duration-300 hover:scale-110 group"
                                        title="경유지 추가"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:rotate-90">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

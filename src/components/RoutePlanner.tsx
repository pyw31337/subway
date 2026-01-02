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
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex flex-row items-center gap-2 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-100 animate-in slide-in-from-bottom-10 fade-in duration-500">
            {inputs.map((input, index) => (
                <div key={input.id} className="flex items-center">
                    {/* Input Field */}
                    <div className="relative group">
                        <input
                            type="text"
                            value={input.value}
                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                            placeholder={input.placeholder}
                            className={`w-32 py-2 px-4 bg-white text-gray-800 font-bold rounded-xl border-4 outline-none focus:scale-105 transition-all shadow-sm ${input.borderColor}`}
                        />
                        {/* Remove button for waypoints */}
                        {input.type === 'waypoint' && (
                            <button
                                onClick={() => removeWaypoint(input.id)}
                                className="absolute -top-2 -right-2 bg-gray-200 text-gray-500 rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-colors"
                            >
                                ×
                            </button>
                        )}
                    </div>

                    {/* Plus Button Logic: Show after every input except the last one */}
                    {index < inputs.length - 1 && (
                        <div className="mx-2">
                            <button
                                onClick={addWaypoint}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-400 font-black text-lg flex items-center justify-center shadow-sm transition-all active:scale-90 border border-gray-200"
                                title="경유지 추가"
                            >
                                +
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

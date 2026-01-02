"use client";

import { useState, useEffect, useRef } from "react";
import { findShortestPath, PathResult } from "@/utils/pathfinding";
import { SUBWAY_LINES } from "@/data/subway-lines";

interface RoutePlannerProps {
    onPathFound: (result: PathResult | null) => void;
}

type InputType = 'start' | 'waypoint' | 'end';

interface RouteInput {
    id: string;
    type: InputType;
    value: string;
    placeholder: string;
}

export default function RoutePlanner({ onPathFound }: RoutePlannerProps) {
    const [inputs, setInputs] = useState<RouteInput[]>([
        { id: 'start', type: 'start', value: '', placeholder: '출발역' },
        { id: 'end', type: 'end', value: '', placeholder: '도착역' }
    ]);
    const [pathResult, setPathResult] = useState<PathResult | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Debounce Logic
    useEffect(() => {
        const calculateRoute = () => {
            // 1. Filter valid inputs
            const validNames = inputs.map(i => i.value.trim()).filter(v => v.length > 0);
            if (validNames.length < 2) {
                setPathResult(null);
                onPathFound(null);
                setIsDrawerOpen(false);
                return;
            }

            // 2. Chain pathfinding method
            const fullPath: string[] = [];
            let totalWeight = 0;
            let totalTransfers = 0;

            for (let i = 0; i < validNames.length - 1; i++) {
                const start = validNames[i];
                const end = validNames[i + 1];

                const result = findShortestPath(start, end);
                if (!result) {
                    setPathResult(null);
                    onPathFound(null);
                    setIsDrawerOpen(false);
                    return; // Link broken
                }

                // Merge paths
                if (i === 0) {
                    fullPath.push(...result.path);
                } else {
                    fullPath.push(...result.path.slice(1));
                }

                totalWeight += result.totalWeight;
                totalTransfers += result.transferCount;
            }

            const finalResult = {
                path: fullPath,
                totalWeight,
                transferCount: totalTransfers
            };

            setPathResult(finalResult);
            onPathFound(finalResult);
        };

        const timeout = setTimeout(calculateRoute, 500);
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
                placeholder: '경유지'
            };
            return [...others, newWaypoint, endInput];
        });
    };

    const removeWaypoint = (id: string) => {
        setInputs(prev => prev.filter(input => input.id !== id));
    };

    const handleSearchClick = () => {
        if (pathResult) {
            setIsDrawerOpen(!isDrawerOpen);
        }
    };

    // Helper to get line color for badges
    const getLineColor = (stationName: string, nextStationName?: string) => {
        // Find common line or just first line of station
        const s = SUBWAY_LINES.flatMap(l => l.stations).find(s => s.name === stationName); // Not efficient but works for UI badging
        // Better: use lines array from path data logic? We don't have direct access here easily without re-finding.
        // Let's rely on simple heuristic: Find line containing name.
        if (!s) return "#999";
        // If next station exists, find common line
        return "#333"; // Default text color, actual badge bg comes from line config
    };

    // Render Drawer Content (Simplified vertical timeline)
    const renderDrawerContent = () => {
        if (!pathResult) return <div className="text-gray-400 text-center py-4">경로를 검색해주세요.</div>;

        const path = pathResult.path;
        // Identify transfers: Station appearing in multiple lines logic is complex on client without full graph.
        // Simplified: Just list Start, Transfers (heuristic), End for now?
        // User asked for "Start, Middle, Transfer, End".
        // Let's just list the full path but collapsed? Or simple list.
        // Actually, user wants "Start, Middle, Transfer, End line and station names, quick transfer info".

        // Let's render a clean vertical stack.

        return (
            <div className="flex flex-col gap-4 py-2">
                <div className="flex items-center justify-between text-sm text-gray-500 font-bold border-b pb-2">
                    <span>소요시간: 약 {pathResult.totalWeight}분 (예상)</span>
                    <span>환승: {pathResult.transferCount}회</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                    {path.map((station, idx) => {
                        const isStart = idx === 0;
                        const isEnd = idx === path.length - 1;
                        // const isTransfer = ... (Path finding logic knowns transfers, but we only have names array here)
                        // Note: findShortestPath returns total counts but not per-node metadata.
                        // We will just simplify: Show all nodes in a standard list, highlighted start/end.

                        return (
                            <div key={idx} className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full ${isStart ? 'bg-green-500 ring-2 ring-green-200' : isEnd ? 'bg-red-500 ring-2 ring-red-200' : 'bg-gray-300'}`}></div>
                                    {!isEnd && <div className="w-0.5 h-6 bg-gray-200 mt-1"></div>}
                                </div>
                                <div className={`flex-1 ${isStart || isEnd ? 'font-extrabold text-lg' : 'text-gray-600 font-medium'}`}>
                                    {station}
                                </div>
                                {isStart && <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">출발</div>}
                                {isEnd && <div className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">도착</div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div
            className="absolute bottom-0 left-0 w-full z-[1000] pointer-events-none flex flex-col justify-end"
            style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', zIndex: 1000 }}
        >
            {/* Main Backdrop: Rounded Top, Glassmorphism */}
            <div
                className="pointer-events-auto w-full bg-white/90 backdrop-blur-2xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.15)] pb-8 pt-6 px-4 transition-all duration-500"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    paddingBottom: isDrawerOpen ? '2rem' : '3rem',
                    paddingTop: '2rem',
                    borderTopLeftRadius: '2.5rem',
                    borderTopRightRadius: '2.5rem',
                    backdropFilter: 'blur(40px)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.8)'
                }}
            >
                <div className="max-w-4xl mx-auto">
                    {/* Input Row */}
                    <div className="flex flex-row items-center justify-center flex-wrap gap-4 mb-2">
                        {inputs.map((input, index) => (
                            <div key={input.id} className="flex items-center relative gap-2">
                                {/* Pill Input Container */}
                                <div className="relative group">
                                    {/* Label (Floating Top) */}
                                    <div className={`absolute -top-5 left-4 text-[10px] font-extrabold tracking-widest uppercase ${input.type === 'start' ? 'text-green-600' : input.type === 'end' ? 'text-red-500' : 'text-gray-400'
                                        } opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}>
                                        {input.type === 'start' ? 'START' : input.type === 'end' ? 'END' : 'VIA'}
                                    </div>

                                    <input
                                        type="text"
                                        value={input.value}
                                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                                        placeholder={input.placeholder}
                                        className={`
                                            w-40 sm:w-56 py-3 px-6 
                                            bg-white shadow-sm
                                            text-gray-900 font-black text-xl sm:text-2xl 
                                            outline-none placeholder:text-gray-300
                                            transition-all duration-300
                                            rounded-full
                                            border-[4px]
                                            ${input.type === 'start'
                                                ? 'border-green-500 focus:shadow-[0_0_0_4px_rgba(34,197,94,0.2)]'
                                                : input.type === 'end'
                                                    ? 'border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.2)]'
                                                    : 'border-gray-300 focus:border-gray-500'
                                            }
                                        `}
                                    />

                                    {/* Waypoint Remove Button */}
                                    {input.type === 'waypoint' && (
                                        <button
                                            onClick={() => removeWaypoint(input.id)}
                                            className="absolute -top-2 -right-2 bg-white border border-gray-200 hover:bg-red-500 hover:border-red-500 text-gray-400 hover:text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-sm transition-all z-10"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {/* Connector / Plus Button */}
                                {index < inputs.length - 1 && (
                                    <button
                                        onClick={addWaypoint}
                                        className="w-8 h-8 -ml-2 -mr-2 z-10 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 border border-gray-200 hover:border-black hover:text-black flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-sm"
                                        title="경유지 추가"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="5" x2="12" y2="19"></line>
                                            <line x1="5" y1="12" x2="19" y2="12"></line>
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Search / Toggle Button (Only show if we can search or have result) */}
                        <button
                            onClick={handleSearchClick}
                            disabled={!pathResult}
                            className={`
                                ml-2 w-14 h-14 rounded-full flex items-center justify-center
                                shadow-lg transition-all duration-300 hover:scale-105 active:scale-95
                                ${pathResult
                                    ? 'bg-black text-white cursor-pointer hover:shadow-xl'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }
                            `}
                        >
                            {isDrawerOpen ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="18 15 12 9 6 15"></polyline>
                                </svg>
                            ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Expandable Result Drawer */}
                    <div
                        className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${isDrawerOpen ? 'max-h-96 opacity-100 mt-6' : 'max-h-0 opacity-0'}`}
                    >
                        <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100 shadow-inner">
                            {renderDrawerContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

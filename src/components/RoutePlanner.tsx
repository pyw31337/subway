"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { findShortestPath, PathResult } from "@/utils/pathfinding";
import { SUBWAY_LINES } from "@/data/subway-lines";

// Sub-components
import ResponsiveDrawer from "./ui/ResponsiveDrawer";
import SearchPanel, { RouteInput } from "./ui/SearchPanel";
import TimelineResult, { TimelineSegment, SegmentType } from "./ui/TimelineResult";

interface RoutePlannerProps {
    onPathFound: (result: PathResult | null) => void;
    // Optional props for initial state if lifted further later
}

export default function RoutePlanner({ onPathFound }: RoutePlannerProps) {
    const [inputs, setInputs] = useState<RouteInput[]>([
        { id: 'start', type: 'start', value: '', placeholder: '출발역' },
        { id: 'end', type: 'end', value: '', placeholder: '도착역' }
    ]);
    const [pathResult, setPathResult] = useState<PathResult | null>(null);
    const [timelineData, setTimelineData] = useState<TimelineSegment[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // --- LOGIC: Timeline Generation (Moved from inline) ---
    const generateTimeline = (path: string[]) => {
        if (!path || path.length < 2) return [];

        // Helper Random Time
        const getRandomTime = (baseTime: Date, addMinutes: number) => {
            const newTime = new Date(baseTime.getTime() + addMinutes * 60000);
            return newTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
        };

        const segments: TimelineSegment[] = [];
        let currentTime = new Date();
        currentTime.setMinutes(currentTime.getMinutes() + 2);

        let currentSegment: Partial<TimelineSegment> | null = null;

        const getCommonLines = (s1Name: string, s2Name: string) => {
            const s1 = SUBWAY_LINES.flatMap(l => l.stations).find(s => s.name === s1Name);
            const s2 = SUBWAY_LINES.flatMap(l => l.stations).find(s => s.name === s2Name);
            if (!s1 || !s2) return [];
            return s1.lines.filter(l => s2.lines.includes(l));
        };

        const getLineInfo = (lineName: string) => SUBWAY_LINES.find(l => l.name === lineName);

        for (let i = 0; i < path.length - 1; i++) {
            const s1 = path[i];
            const s2 = path[i + 1];

            const commonLines = getCommonLines(s1, s2);
            let chosenLineName = commonLines[0];

            if (currentSegment && currentSegment.lineName && commonLines.includes(currentSegment.lineName)) {
                chosenLineName = currentSegment.lineName;
            }

            if (currentSegment && currentSegment.lineName !== chosenLineName) {
                // Segment Change -> Close Previous
                segments.push(currentSegment as TimelineSegment);

                // Add Walk
                const walkDuration = 5;
                const walkEndTimeDate = new Date(currentTime.getTime() + walkDuration * 60000);

                segments.push({
                    type: 'WALK',
                    startStation: currentSegment.endStation!,
                    endStation: s1,
                    duration: walkDuration,
                    distance: 250,
                    startTime: currentSegment.endTime!,
                    endTime: getRandomTime(walkEndTimeDate, 0),
                });
                currentTime = walkEndTimeDate;
                currentSegment = null;
            }

            const travelTime = 2; // Default
            currentTime = new Date(currentTime.getTime() + travelTime * 60000);

            if (!currentSegment) {
                // New Segment
                const lineInfo = getLineInfo(chosenLineName);
                currentSegment = {
                    type: 'SUBWAY',
                    lineName: chosenLineName,
                    lineColor: lineInfo?.color || '#999',
                    startStation: s1,
                    endStation: s2,
                    duration: travelTime,
                    stationCount: 1,
                    stations: [s1, s2],
                    startTime: getRandomTime(new Date(currentTime.getTime() - travelTime * 60000), 0),
                    endTime: getRandomTime(currentTime, 0),
                    headsign: `${path[path.length - 1]}행`,
                    nextStation: s2,
                };
            } else {
                // Extend Segment
                currentSegment.endStation = s2;
                currentSegment.duration! += travelTime;
                currentSegment.stationCount! += 1;
                currentSegment.stations!.push(s2);
                currentSegment.endTime = getRandomTime(currentTime, 0);
            }
        }
        if (currentSegment) segments.push(currentSegment as TimelineSegment);
        return segments;
    };


    // --- LOGIC: Pathfinding (Debounced) ---
    useEffect(() => {
        const timer = setTimeout(() => {
            const startVal = inputs.find(i => i.id === 'start')?.value.trim();
            const endVal = inputs.find(i => i.id === 'end')?.value.trim();

            if (!startVal || !endVal) {
                setPathResult(null);
                onPathFound(null);
                return;
            }

            // Simple Direct Path calc for now (Can extend to multi-waypoint loop)
            const result = findShortestPath(startVal, endVal);

            if (result) {
                // Mock wrapper for older API expectation if needed, or direct usage
                const finalResult = {
                    ...result,
                    transferCount: result.transferCount // Ensure compatibility
                };
                setPathResult(finalResult);
                setTimelineData(generateTimeline(finalResult.path));
                onPathFound(finalResult);

                // Auto open drawer on mobile if result found
                if (window.innerWidth < 768) setIsDrawerOpen(true);
            } else {
                setPathResult(null);
                onPathFound(null);
            }

        }, 500); // 500ms Debounce

        return () => clearTimeout(timer);
    }, [inputs, onPathFound]);


    // --- HANDLERS ---
    const handleInputChange = useCallback((id: string, val: string) => {
        setInputs(prev => prev.map(p => p.id === id ? { ...p, value: val } : p));
    }, []);

    const handleSwap = useCallback(() => {
        setInputs(prev => {
            const s = prev.find(i => i.id === 'start');
            const e = prev.find(i => i.id === 'end');
            if (!s || !e) return prev;
            return prev.map(p => {
                if (p.id === 'start') return { ...p, value: e.value };
                if (p.id === 'end') return { ...p, value: s.value };
                return p;
            });
        });
    }, []);

    const handleSearch = useCallback(() => {
        // Triggered manually (optional, since debounce handles it)
        setIsDrawerOpen(true);
    }, []);

    // --- RENDER HELPERS ---
    const desktopSidebarContent = (
        <>
            <div className="p-6 bg-white z-20 relative">
                <h1 className="text-[26px] font-black italic tracking-tighter mb-6 px-1 text-gray-900 select-none">
                    Metro <span className="text-[#03C75A]">Live</span>
                </h1>
                <SearchPanel
                    inputs={inputs}
                    onInputChange={handleInputChange}
                    onSwap={handleSwap}
                    onSearch={handleSearch}
                    canSearch={!!(inputs[0].value && inputs[1].value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
                {pathResult ? (
                    <div className="pb-10 pt-2">
                        <TimelineResult segments={timelineData} pathResult={pathResult} />
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-60 pb-20 select-none">
                        <svg className="w-16 h-16 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        <p className="text-md font-bold text-gray-400">출발, 도착역을 입력해주세요</p>
                    </div>
                )}
            </div>
        </>
    );

    return (
        <ResponsiveDrawer
            isOpen={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
            desktopSidebarContent={desktopSidebarContent}
            hasResult={!!pathResult}
        >
            {/* Mobile Content */}
            <div className="md:hidden">
                {/* Simplified Mobile Search (Could use SearchPanel but maybe too big? Let's use it for consistency first) */}
                <div className="mb-4">
                    <SearchPanel
                        inputs={inputs}
                        onInputChange={handleInputChange}
                        onSwap={handleSwap}
                        onSearch={handleSearch}
                        canSearch={!!(inputs[0].value && inputs[1].value)}
                    />
                </div>
                {/* Mobile Result */}
                {pathResult && (
                    <div className="max-h-[60vh] overflow-y-auto pr-1 text-sm custom-scrollbar">
                        <TimelineResult segments={timelineData} pathResult={pathResult} />
                    </div>
                )}
            </div>
        </ResponsiveDrawer>
    );
}

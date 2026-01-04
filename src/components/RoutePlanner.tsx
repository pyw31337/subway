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

// Data structures for Timeline
type SegmentType = 'WALK' | 'SUBWAY';

interface TimelineSegment {
    type: SegmentType;
    lineName?: string;
    lineColor?: string;
    startStation: string;
    endStation: string;
    duration: number; // minutes
    distance?: number; // meters (mock)
    stationCount?: number; // for subway
    stations?: string[]; // list of stations in this ride
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    headsign?: string; // e.g. "장암행"
    door?: string;     // "오른쪽" | "왼쪽"
    quickTransfer?: string; // "8-4"
}

export default function RoutePlanner({ onPathFound }: RoutePlannerProps) {
    const [inputs, setInputs] = useState<RouteInput[]>([
        { id: 'start', type: 'start', value: '', placeholder: '출발역' },
        { id: 'end', type: 'end', value: '', placeholder: '도착역' }
    ]);
    const [pathResult, setPathResult] = useState<PathResult | null>(null);
    const [timelineData, setTimelineData] = useState<TimelineSegment[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Mock Helper for random realistic data
    const getRandomTime = (baseTime: Date, addMinutes: number) => {
        const newTime = new Date(baseTime.getTime() + addMinutes * 60000);
        return newTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // Process flat path into Timeline Segments
    const generateTimeline = (path: string[]) => {
        if (!path || path.length < 2) return [];

        const segments: TimelineSegment[] = [];
        let currentTime = new Date();
        const startTimeStr = getRandomTime(currentTime, 0);

        // We need to group stations by Line.
        // Heuristic: Iterate stations, check if current and next share a line.
        // If they share multiple, pick the one that continues the previous segment if possible, or just the first one.

        let currentSegment: Partial<TimelineSegment> | null = null;

        // Helper to find common lines between s1, s2
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

            // 1. Determine connection type
            const commonLines = getCommonLines(s1, s2);
            // In our simplifed graph, if commonLines exist, it's a ride. If not (transfer edge), it's a walk.
            // But usually transfers happen AT a station node in real graphs, or between s1->s2 if simple graph.
            // Our simple graph returns s1->s2 even for transfer if they are connected.
            // Wait, our graph connects s1->s2 via lineId.
            // Let's assume if commonLines.length > 0 it is a ride. 
            // BUT: If the previous segment was Line A, and s1->s2 supports Line A and Line B, we stay on Line A.
            // If they support ONLY Line B, we switched.

            let chosenLineName = commonLines[0];
            let isTransfer = false;

            if (currentSegment && currentSegment.type === 'SUBWAY') {
                // Check if we can continue on current line
                if (commonLines.includes(currentSegment.lineName!)) {
                    chosenLineName = currentSegment.lineName!;
                } else {
                    isTransfer = true;
                }
            } else {
                // First segment
            }

            // If it's a transfer (line switch), we inject a WALK segment first?
            // "Transfer" usually means getting off at S1 and walking to S1(Line B).
            // But our path is S1 -> S2.
            // If we switch lines AT s1, s1 is the transfer point.

            // Simplified Logic: 
            // Just look at the line required for s1->s2.
            // If it differs from previous segment's line, close previous, add walk, start new.

            if (currentSegment && currentSegment.lineName !== chosenLineName) {
                // Finish current segment
                segments.push(currentSegment as TimelineSegment);

                // Add Transfer Walk
                const walkDuration = 5; // mock 5 min walk
                currentTime = new Date(currentTime.getTime() + walkDuration * 60000);

                segments.push({
                    type: 'WALK',
                    startStation: currentSegment.endStation!, // Walking within the station usually
                    endStation: s1, // Actually we are AT s1. The transfer happens AT s1.
                    // This is tricky visually. The timeline usually shows:
                    // Station A (Line 1)
                    //   |
                    // Station B (Line 1) -> Transfer
                    //   : (Walk)
                    // Station B (Line 2)
                    //   |
                    // Station C (Line 2)

                    // So we need a "Walk" segment distinct from the ride.
                    // Let's just create a Walk segment that represents the transfer time AT s1.
                    // But our path array is [A, B, C]. If A->B is Line 1, B->C is Line 2.
                    // Transfer happens at B.

                    duration: walkDuration,
                    distance: 200,
                    startTime: getRandomTime(currentTime, -5), // Backtrack slightly for logic or just accumulate
                    endTime: getRandomTime(currentTime, 0)
                });

                currentSegment = null;
            }

            // Start or Continue Segment
            const travelTime = 2; // 2 min per station default
            currentTime = new Date(currentTime.getTime() + travelTime * 60000);

            if (!currentSegment) {
                const lineInfo = getLineInfo(chosenLineName);
                currentSegment = {
                    type: 'SUBWAY',
                    lineName: chosenLineName,
                    lineColor: lineInfo?.color || '#999',
                    startStation: s1,
                    endStation: s2,
                    duration: travelTime,
                    stationCount: 1,
                    stations: [s1, s2], // Start accumulating
                    startTime: getRandomTime(currentTime, -2), // Start of this hop
                    endTime: getRandomTime(currentTime, 0),
                    headsign: `${path[path.length - 1]}행`, // Mock headsign
                    door: Math.random() > 0.5 ? "오른쪽" : "왼쪽",
                    quickTransfer: `${Math.floor(Math.random() * 8) + 1}-${Math.floor(Math.random() * 4) + 1}`
                };
            } else {
                // Extend
                currentSegment.endStation = s2;
                currentSegment.duration! += travelTime;
                currentSegment.stationCount! += 1;
                currentSegment.stations!.push(s2);
                currentSegment.endTime = getRandomTime(currentTime, 0);
            }
        }

        // Push final
        if (currentSegment) {
            segments.push(currentSegment as TimelineSegment);
        }

        return segments;
    };

    // Debounce Logic
    useEffect(() => {
        const calculateRoute = () => {
            const validNames = inputs.map(i => i.value.trim()).filter(v => v.length > 0);
            if (validNames.length < 2) {
                setPathResult(null);
                onPathFound(null);
                setIsDrawerOpen(false);
                return;
            }

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
                    return;
                }

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
            setTimelineData(generateTimeline(fullPath));
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
            const newWaypoint: RouteInput = { id: `waypoint-${Date.now()}`, type: 'waypoint', value: '', placeholder: '경유지' };
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

    // --- TIMELINE DISPLAY COMPONENT ---
    const TimelineView = ({ segments }: { segments: TimelineSegment[] }) => {
        return (
            <div className="flex flex-col">
                {/* Header Summary */}
                <div className="flex flex-col mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-3xl font-black text-gray-900">{pathResult?.totalWeight}분</span>
                        <div className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded font-bold">최단시간</div>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                        {segments.filter(s => s.type === 'SUBWAY').reduce((acc, s) => acc + (s.stationCount || 0), 0)}개역 이동
                        <span className="mx-2 text-gray-300">|</span>
                        환승 {pathResult?.transferCount}회
                        <span className="mx-2 text-gray-300">|</span>
                        카드 1,650원
                    </div>
                </div>

                {/* Timeline Items */}
                <div className="relative pl-2">
                    {segments.map((segment, idx) => {
                        const isWalk = segment.type === 'WALK';
                        const isLast = idx === segments.length - 1;

                        return (
                            <div key={idx} className="flex relative pb-8 last:pb-0">
                                {/* Time Column */}
                                <div className="w-12 text-xs text-gray-400 pt-1 font-medium tabular-nums text-right pr-3 flex-shrink-0">
                                    {segment.startTime}
                                </div>

                                {/* Graphic Column */}
                                <div className="relative flex flex-col items-center mr-4">
                                    {/* Line Connector */}
                                    {!isLast && (
                                        <div
                                            className={`absolute top-3 bottom-[-32px] w-[2px] ${isWalk ? 'border-l-2 border-dotted border-gray-300 left-[50%] ml-[-1px]' : 'left-[50%] ml-[-1px]'}`}
                                            style={{ backgroundColor: isWalk ? 'transparent' : segment.lineColor }}
                                        ></div>
                                    )}

                                    {/* Node */}
                                    <div
                                        className={`z-10 w-3 h-3 rounded-full border-[2.5px] bg-white box-border`}
                                        style={{
                                            borderColor: isWalk ? '#d1d5db' : segment.lineColor,
                                        }}
                                    ></div>
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 pt-0.5">
                                    {isWalk ? (
                                        // Walk / Transfer Info
                                        <div className="flex flex-col gap-1 mb-2">
                                            <div className="flex items-center gap-1.5 text-gray-800 font-bold text-sm">
                                                <span>🏃 도보 {segment.duration}분</span>
                                                <span className="text-gray-400 font-normal text-xs">{segment.distance}m</span>
                                            </div>
                                        </div>
                                    ) : (
                                        // Subway Ride Info
                                        <div className="flex flex-col">
                                            {/* Start Station Name */}
                                            <div className="flex items-center gap-2 mb-1">
                                                <div
                                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                                                    style={{ backgroundColor: segment.lineColor }}
                                                >
                                                    {segment.lineName?.replace('호선', '')}
                                                </div>
                                                <span className="text-base font-extrabold text-gray-900 leading-none">
                                                    {segment.startStation}
                                                </span>
                                                <span className="text-gray-400 text-xs font-normal">(749)</span>
                                            </div>

                                            {/* Headsign & Info */}
                                            <div className="text-xs text-gray-500 mb-2 pl-7">
                                                <p className="mb-0.5">{segment.headsign} 방면</p>
                                                <p className="text-gray-800 font-semibold">빠른환승 {segment.quickTransfer}</p>
                                            </div>

                                            {/* Expanded Ride Details */}
                                            <div className={`pl-7 mb-2`}>
                                                <div className="inline-block bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-1.5 border border-gray-200 transition-colors cursor-pointer group">
                                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                                        <span className="font-bold">{segment.duration}분</span>
                                                        <span className="w-[1px] h-2 bg-gray-300"></span>
                                                        <span>{segment.stationCount}개 역 이동</span>
                                                        <svg className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* End Station if Last */}
                                            {idx === segments.length - 1 && (
                                                <div className="flex items-center gap-2 mt-6">
                                                    <div
                                                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold"
                                                        style={{ backgroundColor: segment.lineColor }}
                                                    >
                                                        {segment.lineName?.replace('호선', '')}
                                                    </div>
                                                    <span className="text-base font-extrabold text-gray-900 leading-none">
                                                        {segment.endStation}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* End Time (Right side mostly or just implied) */}
                                {idx === segments.length - 1 && (
                                    <div className="absolute bottom-0 right-0 text-gray-400 text-xs">
                                        도착 {segment.endTime}
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Final Destination Marker (Replicated logic inside loop for flow, but need distinct node for very end) */}
                    {/* Actually the loop above handles Start->(Run)->End for each segment. 
                        We need to properly handle the connection.
                        Visual Pattern:
                        Time | O StartStation
                             | |
                             | | <Details>
                             | |
                        Time | O TransferStation (End of Seg 1, Start of Walk)
                             | :
                             | : <Walk>
                             | :
                        Time | O TransferStation (End of Walk, Start of Seg 2)
                             | |
                             | O FinalStation
                     */}
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
                        className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out ${isDrawerOpen ? 'max-h-[600px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}
                    >
                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl overflow-y-auto max-h-[500px] scrollbar-hide">
                            <TimelineView segments={timelineData} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

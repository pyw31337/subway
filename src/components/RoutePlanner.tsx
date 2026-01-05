"use client";

import { useState, useEffect } from "react";
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
    startStationCode?: string;
    endStation: string;
    endStationCode?: string;
    duration: number; // minutes
    distance?: number; // meters
    stationCount?: number;
    stations?: string[];
    startTime: string; // HH:MM
    endTime: string;   // HH:MM
    headsign?: string;
    nextStation?: string;
    door?: string;
    quickTransfer?: string;
    walkTime?: number;
}

// Helper: Mock random realistic time
const getRandomTime = (baseTime: Date, addMinutes: number) => {
    const newTime = new Date(baseTime.getTime() + addMinutes * 60000);
    return newTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// --- TIMELINE DISPLAY COMPONENT (Now Top Level) ---
const TimelineView = ({ segments, pathResult }: { segments: TimelineSegment[], pathResult: PathResult | null }) => {
    if (!segments || segments.length === 0) return null;

    return (
        <div className="flex flex-col w-full">
            {/* Header Summary */}
            <div className="flex flex-col mb-6 pb-4 border-b border-gray-100 px-1">
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-black text-gray-900 tracking-tighter">{pathResult?.totalWeight}<span className="text-xl">분</span></span>
                    <span className="text-blue-600 font-bold text-sm">최단시간</span>
                </div>
                <div className="text-sm text-gray-500 font-medium">
                    도착 {segments[segments.length - 1].endTime}
                    <span className="mx-2 text-gray-300">|</span>
                    환승 {pathResult?.transferCount}회
                    <span className="mx-2 text-gray-300">|</span>
                    카드 1,650원
                </div>
            </div>

            {/* Timeline Items */}
            <div className="relative pl-0">
                {segments.map((segment, idx) => {
                    const isWalk = segment.type === 'WALK';
                    const isLast = idx === segments.length - 1;

                    if (isWalk) {
                        // WALK / TRANSFER Segment
                        return (
                            <div key={idx} className="flex relative pb-6 min-h-[80px]">
                                {/* Time Column */}
                                <div className="w-[52px] text-xs text-gray-400 font-medium text-right pr-4 flex-shrink-0 pt-1">
                                    {segment.startTime}
                                </div>

                                {/* Graphic Column */}
                                <div className="relative flex flex-col items-center mr-0 w-4 flex-shrink-0">
                                    {/* Dotted Line */}
                                    <div className="absolute top-3 bottom-[-24px] w-[2px] border-l-2 border-dotted border-gray-300 left-[50%] ml-[-1px]"></div>

                                    {/* Walk Icon */}
                                    <div className="z-10 bg-white py-1">
                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" /></svg>
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 pl-5 pt-0.5">
                                    <div className="text-sm text-gray-800 font-medium mb-1">
                                        내리는 문: {segment.door || '확인필요'}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                        도보 {segment.duration}분 <span className="text-gray-300 mx-1">|</span> {segment.distance}m
                                    </div>
                                </div>
                            </div>
                        );
                    } else {
                        // SUBWAY RIDE Segment
                        return (
                            <div key={idx} className="flex relative pb-6 last:pb-0">
                                {/* Time Column */}
                                <div className="w-[52px] flex flex-col justify-between text-right pr-4 flex-shrink-0">
                                    <div className="text-xs text-gray-600 font-medium pt-1.5">{segment.startTime}</div>
                                    {isLast && <div className="text-xs text-gray-600 font-medium mt-auto pb-0.5">{segment.endTime}</div>}
                                </div>

                                {/* Graphic Column */}
                                <div className="relative flex flex-col items-center mr-0 w-4 flex-shrink-0">
                                    {/* Solid Line */}
                                    {!isLast && (
                                        <div
                                            className="absolute top-3 bottom-[-24px] w-[4px] left-[50%] ml-[-2px]"
                                            style={{ backgroundColor: segment.lineColor }}
                                        ></div>
                                    )}

                                    {/* Start Node */}
                                    <div
                                        className="z-10 w-3 h-3 rounded-full bg-white ring-2 ring-white"
                                        style={{ border: `3px solid ${segment.lineColor}` }}
                                    ></div>

                                    {/* End Node (only if last) */}
                                    {isLast && (
                                        <div
                                            className="absolute bottom-0 z-10 w-3 h-3 rounded-full bg-white ring-2 ring-white"
                                            style={{ border: `3px solid ${segment.lineColor}` }}
                                        ></div>
                                    )}
                                </div>

                                {/* Content Column */}
                                <div className={`flex-1 pl-5 ${isLast ? '' : 'pb-6'}`}>
                                    {/* Start Station Header */}
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div
                                            className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] text-white font-bold leading-none shadow-sm"
                                            style={{ backgroundColor: segment.lineColor }}
                                        >
                                            {segment.lineName?.replace(/호선|선/g, '')}
                                        </div>
                                        <span className="text-base font-bold text-gray-900 leading-none">
                                            {segment.startStation}
                                        </span>
                                        {segment.startStationCode && <span className="text-gray-400 text-sm font-medium">({segment.startStationCode})</span>}
                                    </div>

                                    {/* Ride Details (If not just a single point) */}
                                    {!isLast && (
                                        <div className="flex flex-col gap-2 mt-2">
                                            <div className="text-sm text-gray-600">
                                                {segment.nextStation} 방면 ({segment.headsign})
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                빠른환승 {segment.quickTransfer || '확인필요'}
                                            </div>

                                            {/* Accordion Trigger (Mock) */}
                                            <div className="inline-flex items-center gap-2 mt-1 px-0 py-1 text-gray-500 text-sm cursor-pointer hover:text-gray-700 transition-colors">
                                                <span className="font-bold text-gray-900">{segment.duration}분</span>
                                                <span className="text-gray-300">|</span>
                                                <span>{segment.stationCount}개 역 이동</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    )}

                                    {/* End Station Header (If Last) */}
                                    {isLast && (
                                        <div className="flex items-center gap-2 mt-8">
                                            <div
                                                className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] text-white font-bold leading-none shadow-sm"
                                                style={{ backgroundColor: segment.lineColor }}
                                            >
                                                {segment.lineName?.replace(/호선|선/g, '')}
                                            </div>
                                            <span className="text-base font-bold text-gray-900 leading-none">
                                                {segment.endStation}
                                            </span>
                                            {segment.endStationCode && <span className="text-gray-400 text-sm font-medium">({segment.endStationCode})</span>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }
                })}
            </div>
        </div>
    );
};

// --- SEARCH FORM COMPONENT (Now Top Level) ---
const SearchForm = ({ inputs, handleInputChange, pathResult }: {
    inputs: RouteInput[],
    handleInputChange: (id: string, val: string) => void,
    pathResult: any
}) => (
    <div className="flex flex-col gap-4">
        {inputs.map((input) => (
            <div key={input.id} className="relative group">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${input.type === 'start' ? 'bg-green-500' :
                    input.type === 'end' ? 'bg-red-500' : 'bg-gray-300'
                    }`}></div>
                <input
                    type="text"
                    value={input.value}
                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                    placeholder={input.placeholder}
                    className="w-full h-12 pl-10 pr-4 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-black focus:ring-1 focus:ring-black outline-none transition-all font-bold text-lg"
                />
            </div>
        ))}

        {/* Desktop Search Button */}
        <button
            disabled={!pathResult}
            className={`
                w-full h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-2
                transition-all duration-300
                ${pathResult
                    ? 'bg-black text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
            `}
        >
            {pathResult ? '경로 안내 시작' : '역 이름을 입력하세요'}
        </button>
    </div>
);


export default function RoutePlanner({ onPathFound }: RoutePlannerProps) {
    const [inputs, setInputs] = useState<RouteInput[]>([
        { id: 'start', type: 'start', value: '', placeholder: '출발역' },
        { id: 'end', type: 'end', value: '', placeholder: '도착역' }
    ]);
    const [pathResult, setPathResult] = useState<PathResult | null>(null);
    const [timelineData, setTimelineData] = useState<TimelineSegment[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Process flat path into Timeline Segments
    const generateTimeline = (path: string[]) => {
        if (!path || path.length < 2) return [];

        const segments: TimelineSegment[] = [];
        let currentTime = new Date();
        currentTime.setMinutes(currentTime.getMinutes() + 2); // Start + 2 min

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
                // Close current segment
                segments.push(currentSegment as TimelineSegment);

                // Add Walk/Transfer
                const walkDuration = 5;
                const walkDistance = 276;

                const walkStartTime = currentSegment.endTime!;
                const walkEndTimeDate = new Date(currentTime.getTime() + walkDuration * 60000);
                const walkEndTime = walkEndTimeDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
                currentTime = walkEndTimeDate;

                segments.push({
                    type: 'WALK',
                    startStation: currentSegment.endStation!,
                    endStation: s1,
                    duration: walkDuration,
                    distance: walkDistance,
                    startTime: walkStartTime,
                    endTime: walkEndTime,
                    door: undefined
                });

                currentSegment = null;
            }

            const travelTime = 2; // Default travel time
            currentTime = new Date(currentTime.getTime() + travelTime * 60000);

            if (!currentSegment) {
                const lineInfo = getLineInfo(chosenLineName);
                currentSegment = {
                    type: 'SUBWAY',
                    lineName: chosenLineName,
                    lineColor: lineInfo?.color || '#999',
                    startStation: s1,
                    startStationCode: undefined, // No data
                    endStation: s2,
                    endStationCode: undefined, // No data
                    duration: travelTime,
                    stationCount: 1,
                    stations: [s1, s2],
                    startTime: getRandomTime(new Date(currentTime.getTime() - travelTime * 60000), 0),
                    endTime: getRandomTime(currentTime, 0),
                    headsign: `${path[path.length - 1]}행`,
                    nextStation: s2,
                    door: undefined,     // No data
                    quickTransfer: undefined // No data
                };
            } else {
                currentSegment.endStation = s2;
                currentSegment.endStationCode = undefined;
                currentSegment.duration! += travelTime;
                currentSegment.stationCount! += 1;
                currentSegment.stations!.push(s2);
                currentSegment.endTime = getRandomTime(currentTime, 0);
            }
        }

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

    const handleSearchClick = () => {
        if (pathResult) {
            setIsDrawerOpen(!isDrawerOpen);
        }
    };

    return (
        <>
            {/* === MOBILE LAYOUT (Bottom Sheet) === */}
            <div className="md:hidden fixed bottom-0 left-0 w-full z-[5000] pointer-events-none flex flex-col justify-end">
                <div
                    className="pointer-events-auto w-full bg-white/95 backdrop-blur-2xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.15)] pb-8 pt-6 px-5 transition-all duration-500 rounded-t-[2.5rem] border-t border-white/50"
                    style={{
                        paddingBottom: isDrawerOpen ? '2rem' : '2rem', // Fixed safe padding
                    }}
                >
                    {/* Mobile Input Row (Compact) */}
                    <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                        {inputs.map((input) => (
                            <div key={input.id} className="flex-shrink-0 relative">
                                <input
                                    className={`
                                        w-32 h-10 px-4 rounded-full text-base font-bold border-2 outline-none bg-white shadow-sm
                                        ${input.type === 'start' ? 'border-green-500/50 focus:border-green-500' :
                                            input.type === 'end' ? 'border-red-500/50 focus:border-red-500' : 'border-gray-200'}
                                    `}
                                    value={input.value}
                                    placeholder={input.placeholder}
                                    onChange={(e) => handleInputChange(input.id, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Mobile Result Area */}
                    <div className={`overflow-hidden transition-all duration-500 ${isDrawerOpen || pathResult ? 'max-h-[60vh] opacity-100' : 'max-h-0 opacity-0'}`}>
                        {pathResult && (
                            <div className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                <TimelineView segments={timelineData} pathResult={pathResult} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === DESKTOP LAYOUT (Left Sidebar) === */}
            <div className="hidden md:flex flex-col fixed top-4 left-4 h-[calc(100vh-2rem)] w-[400px] z-[5000] bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
                {/* Sidebar Header */}
                <div className="p-6 pb-4 border-b border-gray-100/50 bg-white/50">
                    <h1 className="text-2xl font-black italic tracking-tighter mb-6">
                        Metro <span className="text-red-500">Live</span>
                    </h1>
                    <SearchForm inputs={inputs} handleInputChange={handleInputChange} pathResult={pathResult} />
                </div>

                {/* Sidebar Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {pathResult ? (
                        <TimelineView segments={timelineData} pathResult={pathResult} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            <p className="font-bold">출발역과 도착역을 입력해주세요</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

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
        <div className="flex flex-col w-full font-sans">
            {/* Header Summary */}
            <div className="flex flex-col mb-4 pb-4 border-b border-gray-100 px-1">
                <div className="flex items-end gap-3 mb-2">
                    <span className="text-[28px] font-black text-gray-900 leading-none tracking-tighter">
                        {pathResult?.totalWeight}<span className="text-xl font-bold ml-0.5">분</span>
                    </span>
                    <span className="text-blue-600 font-bold text-sm mb-1">최단시간</span>
                </div>
                <div className="text-sm text-gray-500 font-medium flex items-center gap-2">
                    <span>도착 {segments[segments.length - 1].endTime}</span>
                    <span className="w-[1px] h-3 bg-gray-300"></span>
                    <span>환승 {pathResult?.transferCount}회</span>
                    <span className="w-[1px] h-3 bg-gray-300"></span>
                    <span>카드 1,650원</span>
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
                            <div key={idx} className="flex relative pb-4 min-h-[60px]">
                                {/* Time Column */}
                                <div className="w-[52px] text-xs text-gray-400 font-medium text-right pr-4 flex-shrink-0 pt-1">
                                    {segment.startTime}
                                </div>

                                {/* Graphic Column */}
                                <div className="relative flex flex-col items-center mr-0 w-4 flex-shrink-0">
                                    {/* Dotted Line */}
                                    <div className="absolute top-2 bottom-[-16px] w-[2px] border-l-2 border-dotted border-gray-300 left-[50%] ml-[-1px]"></div>

                                    {/* Walk Icon */}
                                    <div className="z-10 bg-white py-1">
                                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 pl-4 pt-1">
                                    <div className="text-xs text-gray-500 font-medium">
                                        도보 {segment.duration}분 <span className="text-gray-300 mx-1">|</span> {segment.distance}m
                                    </div>
                                </div>
                            </div>
                        );
                    } else {
                        // SUBWAY RIDE Segment
                        // Determine line info for color
                        const lineColor = segment.lineColor || '#999';

                        return (
                            <div key={idx} className="flex relative pb-8 last:pb-0">
                                {/* Time Column */}
                                <div className="w-[52px] flex flex-col justify-between text-right pr-4 flex-shrink-0">
                                    <div className="text-sm font-bold text-gray-900 leading-none">{segment.startTime}</div>
                                    {isLast && <div className="text-sm font-bold text-gray-900 mt-auto leading-none">{segment.endTime}</div>}
                                </div>

                                {/* Graphic Column */}
                                <div className="relative flex flex-col items-center mr-0 w-4 flex-shrink-0">
                                    {/* Solid Line */}
                                    {!isLast && (
                                        <div
                                            className="absolute top-3 bottom-(-24px) w-[4px] left-[50%] ml-[-2px]"
                                            style={{ backgroundColor: lineColor }}
                                        ></div>
                                    )}

                                    {/* Start Node (White circle with colored border) */}
                                    <div
                                        className="z-10 w-[14px] h-[14px] rounded-full bg-white relative box-border"
                                        style={{ border: `3px solid ${lineColor}` }}
                                    ></div>

                                    {/* End Node (only if last) */}
                                    {isLast && (
                                        <div
                                            className="absolute bottom-0 z-10 w-[14px] h-[14px] rounded-full bg-white relative box-border"
                                            style={{ border: `3px solid ${lineColor}` }}
                                        ></div>
                                    )}
                                </div>

                                {/* Content Column */}
                                <div className={`flex-1 pl-4 ${isLast ? '' : 'pb-2'}`}>
                                    {/* Start Station Header */}
                                    <div className="flex items-center gap-2 -mt-1 mb-3">
                                        <span className="text-lg font-black text-gray-900 leading-none tracking-tight">
                                            {segment.startStation}
                                        </span>
                                        {segment.startStationCode && <span className="text-gray-400 text-sm font-medium pt-0.5">({segment.startStationCode})</span>}
                                    </div>

                                    {/* Ride Details (If not just a single point) */}
                                    {!isLast && (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs text-gray-500 font-medium">
                                                    {segment.nextStation} 방면 ({segment.headsign})
                                                </div>
                                            </div>

                                            {/* Fast Transfer Badge */}
                                            {segment.quickTransfer && (
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-2 py-0.5 rounded-full border border-gray-200">
                                                        빠른환승 {segment.quickTransfer}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {segment.door ? segment.door : '확인필요'}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Accordion Trigger (Mock) */}
                                            <div className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 bg-gray-50 rounded-lg w-fit cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100">
                                                <span className="font-bold text-gray-700 text-sm">{segment.duration}분</span>
                                                <span className="text-gray-300 text-xs">|</span>
                                                <span className="text-gray-500 text-xs">{segment.stationCount}개 역 이동</span>
                                                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    )}

                                    {/* End Station Header (If Last) */}
                                    {isLast && (
                                        <div className="flex items-center gap-2 mt-[calc(100%-8px)] pt-1">
                                            <span className="text-lg font-black text-gray-900 leading-none tracking-tight">
                                                {segment.endStation}
                                            </span>
                                            {segment.endStationCode && <span className="text-gray-400 text-sm font-medium pt-0.5">({segment.endStationCode})</span>}
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
const SearchForm = ({ inputs, handleInputChange, pathResult, onSwap }: {
    inputs: RouteInput[],
    handleInputChange: (id: string, val: string) => void,
    pathResult: any,
    onSwap: () => void
}) => (
    <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.08)] border border-gray-100 p-4">
        {/* Mock Tabs */}
        <div className="flex items-center gap-4 mb-4 border-b border-gray-100 pb-2">
            <button className="text-sm font-bold text-gray-900 border-b-2 border-black pb-2 -mb-2.5">대중교통</button>
            <button className="text-sm font-medium text-gray-400 hover:text-gray-600 pb-2">자동차</button>
            <button className="text-sm font-medium text-gray-400 hover:text-gray-600 pb-2">도보</button>
            <button className="text-sm font-medium text-gray-400 hover:text-gray-600 pb-2">자전거</button>
        </div>

        {/* Input Area */}
        <div className="flex flex-col gap-2 relative">
            {/* Start Input */}
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full ring-2 ring-green-500 bg-white"></div>
                <input
                    type="text"
                    value={inputs.find(i => i.id === 'start')?.value}
                    onChange={(e) => handleInputChange('start', e.target.value)}
                    placeholder="출발역 검색"
                    className="w-full h-10 pl-8 pr-10 bg-gray-50 rounded-md border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-[15px] font-medium placeholder-gray-400"
                />
            </div>

            {/* Swap Button (Absolute Centered) */}
            <button
                onClick={onSwap}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 z-10 transition-transform hover:rotate-180"
                aria-label="출발/도착 전환"
            >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
            </button>

            {/* End Input */}
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full ring-2 ring-red-500 bg-white"></div>
                <input
                    type="text"
                    value={inputs.find(i => i.id === 'end')?.value}
                    onChange={(e) => handleInputChange('end', e.target.value)}
                    placeholder="도착역 검색"
                    className="w-full h-10 pl-8 pr-10 bg-gray-50 rounded-md border border-gray-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-[15px] font-medium placeholder-gray-400"
                />
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-3">
            <button className="flex-1 h-9 rounded-md border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 flex items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                다시입력
            </button>
            <button className="flex-1 h-9 rounded-md border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 flex items-center justify-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                경유지
            </button>
            <button
                disabled={!pathResult}
                className={`
                    w-24 h-9 rounded-md font-bold text-xs flex items-center justify-center
                    transition-all duration-300
                    ${pathResult
                        ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
                `}
            >
                길찾기
            </button>
        </div>
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

    const handleSwap = () => {
        setInputs(prev => {
            const start = prev.find(i => i.id === 'start');
            const end = prev.find(i => i.id === 'end');
            if (!start || !end) return prev;
            return prev.map(input => {
                if (input.id === 'start') return { ...input, value: end.value };
                if (input.id === 'end') return { ...input, value: start.value };
                return input;
            });
        });
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
            <div className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[400px] z-[5000] bg-white shadow-2xl border-r border-gray-200 overflow-hidden font-sans">
                {/* Sidebar Header */}
                <div className="p-4 bg-white z-10 relative">
                    <h1 className="text-2xl font-black italic tracking-tighter mb-4 px-2">
                        Metro <span className="text-blue-600">Live</span>
                    </h1>
                    <SearchForm
                        inputs={inputs}
                        handleInputChange={handleInputChange}
                        pathResult={pathResult}
                        onSwap={handleSwap}
                    />
                </div>

                {/* Sidebar Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50/50">
                    {pathResult ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <TimelineView segments={timelineData} pathResult={pathResult} />
                        </div>
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

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

// --- TIMELINE DISPLAY COMPONENT ---
const TimelineView = ({ segments, pathResult }: { segments: TimelineSegment[], pathResult: PathResult | null }) => {
    if (!segments || segments.length === 0) return null;

    return (
        <div className="flex flex-col w-full font-sans bg-white relative">
            {/* Header Summary - Sticky Top */}
            <div className="flex flex-col mb-6 pb-5 border-b-2 border-gray-100/80 px-1 bg-white sticky top-0 z-20">
                <div className="flex items-end gap-2 mb-3">
                    <span className="text-[32px] font-black text-gray-900 leading-none tracking-tighter">
                        {pathResult?.totalWeight}<span className="text-[20px] font-bold ml-1 text-gray-800">분</span>
                    </span>
                    <span className="text-blue-600 font-bold text-sm mb-1.5 px-1.5 py-0.5 bg-blue-50 rounded">최단시간</span>
                </div>
                <div className="text-[15px] text-gray-600 font-medium flex items-center gap-3">
                    <span className="text-gray-900 font-bold">도착 {segments[segments.length - 1].endTime}</span>
                    <span className="w-[1px] h-3 bg-gray-300"></span>
                    <span>환승 {pathResult?.transferCount}회</span>
                    <span className="w-[1px] h-3 bg-gray-300"></span>
                    <span>카드 1,650원</span>
                </div>
            </div>

            {/* Timeline Items */}
            <div className="relative pl-2 pr-1">
                {segments.map((segment, idx) => {
                    const isWalk = segment.type === 'WALK';
                    const isLast = idx === segments.length - 1;

                    if (isWalk) {
                        // === WALK / TRANSFER SEGMENT ===
                        return (
                            <div key={idx} className="flex relative pb-6 min-h-[70px]">
                                {/* Time Column */}
                                <div className="w-[55px] text-[13px] text-gray-400 font-medium text-right pr-5 flex-shrink-0 pt-1.5">
                                    {segment.startTime}
                                </div>

                                {/* Graphic Column */}
                                <div className="relative flex flex-col items-center w-5 flex-shrink-0">
                                    {/* Dotted Line */}
                                    <div className="absolute top-3 bottom-[-24px] w-[2px] border-l-[2px] border-dotted border-gray-300 left-[50%] ml-[-1px] z-0"></div>

                                    {/* Walk Icon (White Background to hide line behind) */}
                                    <div className="z-10 bg-white py-1.5">
                                        <div className="w-6 h-6 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                            <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 pl-5 pt-1.5">
                                    <div className="text-[15px] text-gray-800 font-medium mb-1">
                                        <span className="text-gray-500 mr-2">도보</span>
                                        <span className="font-bold text-gray-900">{segment.duration}분</span>
                                        <span className="text-gray-300 mx-2">|</span>
                                        <span className="text-gray-500">{segment.distance}m</span>
                                    </div>
                                </div>
                            </div>
                        );
                    } else {
                        // === SUBWAY RIDE SEGMENT ===
                        const lineColor = segment.lineColor || '#999';

                        return (
                            <div key={idx} className="flex relative pb-10 last:pb-0">
                                {/* Time Column */}
                                <div className="w-[55px] flex flex-col justify-between text-right pr-5 flex-shrink-0">
                                    <div className="text-[15px] font-bold text-gray-900 leading-none pt-0.5">{segment.startTime}</div>
                                    {isLast && <div className="text-[15px] font-bold text-gray-900 mt-auto leading-none pb-0.5">{segment.endTime}</div>}
                                </div>

                                {/* Graphic Column */}
                                <div className="relative flex flex-col items-center w-5 flex-shrink-0">
                                    {/* Solid Line (The main route line) */}
                                    {!isLast && (
                                        <div
                                            className="absolute top-3 bottom-[-24px] w-[5px] left-[50%] ml-[-2.5px] z-0"
                                            style={{ backgroundColor: lineColor }}
                                        ></div>
                                    )}

                                    {/* Start Node */}
                                    <div
                                        className="z-10 w-[18px] h-[18px] rounded-full bg-white relative box-border shadow-sm"
                                        style={{ border: `4px solid ${lineColor}` }}
                                    ></div>

                                    {/* End Node (only if last) */}
                                    {isLast && (
                                        <div
                                            className="absolute bottom-0 z-10 w-[18px] h-[18px] rounded-full bg-white relative box-border shadow-sm"
                                            style={{ border: `4px solid ${lineColor}` }}
                                        ></div>
                                    )}
                                </div>

                                {/* Content Column */}
                                <div className={`flex-1 pl-5 ${isLast ? '' : 'pb-2'}`}>
                                    {/* Start Station Name */}
                                    <div className="flex items-center gap-2 mb-3 -mt-1.5">
                                        <span className="text-[22px] font-black text-gray-900 leading-none tracking-tight">
                                            {segment.startStation}
                                        </span>
                                        {segment.startStationCode && (
                                            <span className="text-gray-400 text-[14px] font-medium pt-1">
                                                {segment.startStationCode}
                                            </span>
                                        )}
                                    </div>

                                    {/* Ride Info Box (Direction, Badge etc) */}
                                    {!isLast && (
                                        <div className="flex flex-col gap-3">
                                            <div className="text-[14px] text-gray-600 font-medium tracking-tight">
                                                {segment.nextStation} 방면
                                                <span className="text-gray-400 ml-1">({segment.headsign})</span>
                                            </div>

                                            {/* Info Pill Badges */}
                                            {segment.quickTransfer && (
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-gray-100 text-[12px] font-bold text-gray-600 border border-gray-200">
                                                        빠른환승 {segment.quickTransfer}
                                                    </span>
                                                    <span className="text-[13px] text-gray-500">
                                                        내리는 문 <span className="text-gray-700 font-bold">{segment.door || '정보없음'}</span>
                                                    </span>
                                                </div>
                                            )}

                                            {/* Expandable Details Button */}
                                            <div className="mt-1">
                                                <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100 group">
                                                    <span className="text-[14px] font-bold text-gray-800">{segment.duration}분</span>
                                                    <span className="w-[1px] h-3 bg-gray-300"></span>
                                                    <span className="text-[13px] text-gray-500">{segment.stationCount}개 역 이동</span>
                                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* End Station Name (If Last) */}
                                    {isLast && (
                                        <div className="flex items-center gap-2 mt-[calc(100%-8px)] pt-1">
                                            <span className="text-[22px] font-black text-gray-900 leading-none tracking-tight">
                                                {segment.endStation}
                                            </span>
                                            {segment.endStationCode && <span className="text-gray-400 text-[14px] font-medium pt-1">({segment.endStationCode})</span>}
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

// --- SEARCH FORM COMPONENT ---
const SearchForm = ({ inputs, handleInputChange, pathResult, onSwap }: {
    inputs: RouteInput[],
    handleInputChange: (id: string, val: string) => void,
    pathResult: any,
    onSwap: () => void
}) => (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-100/80 p-5 z-50 relative">
        {/* Helper Tabs */}
        <div className="flex items-center justify-between mb-5 border-b border-gray-100">
            <div className="flex items-center gap-6">
                <button className="text-[15px] font-black text-gray-900 border-b-[3px] border-gray-900 pb-2.5 -mb-[1px]">대중교통</button>
                <button className="text-[15px] font-medium text-gray-400 hover:text-gray-600 pb-2.5 -mb-[1px] transition-colors">자동차</button>
                <button className="text-[15px] font-medium text-gray-400 hover:text-gray-600 pb-2.5 -mb-[1px] transition-colors">도보</button>
            </div>
        </div>

        {/* Input Fields Container */}
        <div className="flex flex-col gap-2.5 relative">
            {/* Start Input */}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full box-content border-[3px] border-white ring-1 ring-gray-200 bg-green-500 shadow-sm z-20"></div>
                <input
                    type="text"
                    value={inputs.find(i => i.id === 'start')?.value}
                    onChange={(e) => handleInputChange('start', e.target.value)}
                    placeholder="출발지 입력"
                    className="w-full h-[52px] pl-10 pr-12 bg-gray-50/50 rounded-lg border border-gray-200 focus:bg-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all text-[16px] font-bold text-gray-900 placeholder-gray-400"
                />
            </div>

            {/* Swap Button */}
            <button
                onClick={onSwap}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-50 hover:shadow-lg hover:border-gray-300 z-30 transition-all active:scale-95"
                aria-label="출발/도착 전환"
                title="출발/도착 전환"
            >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
            </button>

            {/* End Input */}
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full box-content border-[3px] border-white ring-1 ring-gray-200 bg-red-500 shadow-sm z-20"></div>
                <input
                    type="text"
                    value={inputs.find(i => i.id === 'end')?.value}
                    onChange={(e) => handleInputChange('end', e.target.value)}
                    placeholder="도착지 입력"
                    className="w-full h-[52px] pl-10 pr-12 bg-gray-50/50 rounded-lg border border-gray-200 focus:bg-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all text-[16px] font-bold text-gray-900 placeholder-gray-400"
                />
            </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex gap-2.5 mt-4">
            <button className="flex-1 h-10 rounded-lg border border-gray-200 bg-white text-gray-600 text-[13px] font-bold hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-1.5 transition-all">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                다시입력
            </button>
            <button className="flex-1 h-10 rounded-lg border border-gray-200 bg-white text-gray-600 text-[13px] font-bold hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center gap-1.5 transition-all">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                경유지
            </button>
            <button
                disabled={!pathResult}
                className={`
                    w-28 h-10 rounded-lg font-black text-[14px] flex items-center justify-center
                    transition-all duration-200 shadow-sm
                    ${pathResult
                        ? 'bg-[#27C34B] text-white hover:bg-[#20A93F] hover:shadow-md active:scale-95' // Naver Green-ish
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
                    className="pointer-events-auto w-full bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-safe-bottom pt-5px rounded-t-[24px] overflow-hidden"
                    style={{
                        maxHeight: isDrawerOpen || pathResult ? '80vh' : 'auto'
                    }}
                >
                    {/* Drag Handle */}
                    <div className="w-full flex justify-center py-3" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
                        <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
                    </div>

                    <div className="px-5 pb-6">
                        {/* Mobile Input Row (Compact) */}
                        <div className="flex items-center gap-3 mb-5 overflow-x-auto pb-1 scrollbar-hide py-1">
                            {inputs.map((input) => (
                                <div key={input.id} className="flex-shrink-0 relative group">
                                    <input
                                        className={`
                                            w-[120px] h-[44px] px-4 rounded-xl text-[15px] font-bold border-0 outline-none
                                            bg-gray-100/80 focus:bg-white focus:ring-2
                                            ${input.type === 'start' ? 'ring-green-500/20 text-green-900 focus:ring-green-500' :
                                                input.type === 'end' ? 'ring-red-500/20 text-red-900 focus:ring-red-500' : 'ring-gray-200'}
                                            transition-all shadow-sm
                                        `}
                                        value={input.value}
                                        placeholder={input.placeholder}
                                        onChange={(e) => handleInputChange(input.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Mobile Result Area */}
                        <div className={`transition-all duration-300 ${pathResult ? 'opacity-100' : 'opacity-0'}`}>
                            {pathResult && (
                                <div className="max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                                    <TimelineView segments={timelineData} pathResult={pathResult} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* === DESKTOP LAYOUT (Left Sidebar) === */}
            <div className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-[420px] z-[5000] bg-white shadow-[4px_0_24px_rgba(0,0,0,0.1)] border-r border-gray-100 font-sans">
                {/* Sidebar Header */}
                <div className="p-5 bg-white z-20 relative">
                    <h1 className="text-[26px] font-black italic tracking-tighter mb-5 px-1 text-gray-900">
                        Metro <span className="text-[#27C34B]">Live</span> {/* Naver Green */}
                    </h1>
                    <SearchForm
                        inputs={inputs}
                        handleInputChange={handleInputChange}
                        pathResult={pathResult}
                        onSwap={handleSwap}
                    />
                </div>

                {/* Sidebar Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
                    {pathResult ? (
                        <div className="pb-10 pt-2">
                            <TimelineView segments={timelineData} pathResult={pathResult} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-80 pb-20">
                            <svg className="w-20 h-20 mb-6 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7m0 0a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            <p className="text-lg font-bold text-gray-400">출발역과 도착역을 입력하세요</p>
                            <p className="text-sm text-gray-400 mt-2">지하철 노선도에서 역을 클릭할 수도 있습니다.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

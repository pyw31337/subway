"use client";

import { PathResult } from "@/utils/pathfinding";

// Data structures for Timeline
export type SegmentType = 'WALK' | 'SUBWAY';

export interface TimelineSegment {
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

interface TimelineResultProps {
    segments: TimelineSegment[];
    pathResult: PathResult | null;
}

export default function TimelineResult({ segments, pathResult }: TimelineResultProps) {
    if (!segments || segments.length === 0 || !pathResult) return null;

    const arrivalTime = segments[segments.length - 1].endTime;
    const totalFare = "1,400원"; // Mock fare logic

    return (
        <div className="flex flex-col w-full font-sans bg-white relative animate-fade-in-up">
            {/* Header Summary - Sticky Top with Glass Effect */}
            <div className="flex flex-col mb-4 pb-5 border-b border-gray-100 px-6 pt-2 bg-white/95 backdrop-blur-sm sticky top-0 z-20">
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-[36px] font-black text-gray-900 leading-none tracking-tighter">
                        {pathResult.totalWeight}<span className="text-[20px] font-bold ml-1 text-gray-800 tracking-normal">분</span>
                    </span>
                    <div className="flex mb-1.5 ml-1">
                        <span className="text-[#03C75A] font-bold text-xs bg-[#03C75A]/10 px-2 py-0.5 rounded-md">최단시간</span>
                    </div>
                </div>
                <div className="text-[15px] text-gray-500 font-medium flex items-center gap-3">
                    <span className="text-gray-900 font-bold tracking-tight">{arrivalTime} 도착</span>
                    <span className="w-[1px] h-3 bg-gray-200"></span>
                    <span>환승 {pathResult.transferCount}회</span>
                    <span className="w-[1px] h-3 bg-gray-200"></span>
                    <span>카드 {totalFare}</span>
                </div>
            </div>

            {/* Timeline Items */}
            <div className="relative pl-4 pr-4">
                {segments.map((segment, idx) => {
                    const isWalk = segment.type === 'WALK';
                    const isLast = idx === segments.length - 1;

                    if (isWalk) {
                        // === WALK / TRANSFER SEGMENT ===
                        return (
                            <div key={idx} className="flex relative pb-4 min-h-[60px]">
                                {/* Time Column */}
                                <div className="w-[55px] text-[13px] text-gray-400 font-medium text-right pr-4 flex-shrink-0 pt-1.5 tracking-tight">
                                    {segment.startTime}
                                </div>

                                {/* Graphic Column */}
                                <div className="relative flex flex-col items-center w-5 flex-shrink-0">
                                    {/* Dotted Line */}
                                    <div className="absolute top-3 bottom-0 w-[2px] border-l-[2px] border-dotted border-gray-300 left-[50%] ml-[-1px] z-0"></div>

                                    {/* Walk Icon */}
                                    <div className="z-10 bg-white py-1">
                                        <div className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                                            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" /></svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Content Column */}
                                <div className="flex-1 pl-4 pt-1">
                                    <div className="text-[14px] text-gray-800 font-medium mb-1 flex items-center gap-2">
                                        <span className="font-bold text-gray-900">도보 {segment.duration}분</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-gray-500">{segment.distance}m</span>
                                    </div>
                                    <div className="text-[13px] text-gray-400">
                                        환승을 위해 이동
                                    </div>
                                </div>
                            </div>
                        );
                    } else {
                        // === SUBWAY RIDE SEGMENT ===
                        const lineColor = segment.lineColor || '#999';

                        return (
                            <div key={idx} className="flex relative pb-8 last:pb-0">
                                {/* Time Column */}
                                <div className="w-[55px] flex flex-col justify-between text-right pr-4 flex-shrink-0">
                                    <div className="text-[15px] font-bold text-gray-900 leading-none pt-0.5 tracking-tight">{segment.startTime}</div>
                                    {isLast && <div className="text-[15px] font-bold text-gray-900 mt-auto leading-none pb-0.5 tracking-tight">{segment.endTime}</div>}
                                </div>

                                {/* Graphic Column */}
                                <div className="relative flex flex-col items-center w-5 flex-shrink-0">
                                    {/* Solid Line */}
                                    {!isLast && (
                                        <div
                                            className="absolute top-3 bottom-[-20px] w-[5px] left-[50%] ml-[-2.5px] z-0 rounded-full"
                                            style={{ backgroundColor: lineColor }}
                                        ></div>
                                    )}

                                    {/* Start Node */}
                                    <div
                                        className="z-10 w-[18px] h-[18px] rounded-full bg-white relative box-border shadow-sm transform transition-transform hover:scale-110"
                                        style={{ border: `4px solid ${lineColor}` }}
                                    ></div>

                                    {/* End Node (only if last) */}
                                    {isLast && (
                                        <div
                                            className="absolute bottom-0 z-10 w-[18px] h-[18px] rounded-full bg-white relative box-border shadow-sm transform transition-transform hover:scale-110"
                                            style={{ border: `4px solid ${lineColor}` }}
                                        ></div>
                                    )}
                                </div>

                                {/* Content Column */}
                                <div className={`flex-1 pl-4 ${isLast ? '' : 'pb-2'}`}>
                                    {/* Start Station Name */}
                                    <div className="flex items-center gap-2 mb-3 -mt-1.5">
                                        <span className="text-[20px] font-black text-gray-900 leading-none tracking-tight">
                                            {segment.startStation}
                                        </span>
                                    </div>

                                    {/* Ride Info Box */}
                                    {!isLast && (
                                        <div className="flex flex-col gap-3">
                                            <div className="text-[14px] text-gray-600 font-medium tracking-tight flex items-center gap-2">
                                                <span className="font-bold text-gray-800">{segment.nextStation} 방면</span>
                                                {segment.headsign && <span className="text-gray-400">({segment.headsign})</span>}
                                            </div>

                                            {/* Info Pill Badges */}
                                            {segment.quickTransfer && (
                                                <div className="flex items-center flex-wrap gap-2">
                                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-gray-100 text-[11px] font-bold text-gray-600 border border-gray-200">
                                                        빠른환승 {segment.quickTransfer}
                                                    </span>
                                                    {segment.door && (
                                                        <span className="text-[12px] text-gray-400">
                                                            {segment.door}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {/* Expandable Details Button */}
                                            <div className="mt-1">
                                                <button className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100 group w-full sm:w-auto">
                                                    <span className="text-[14px] font-bold text-gray-800 tabular-nums">{segment.duration}분</span>
                                                    <span className="w-[1px] h-3 bg-gray-300"></span>
                                                    <span className="text-[13px] text-gray-500">{segment.stationCount}개 역 이동</span>
                                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors ml-auto sm:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* End Station Name */}
                                    {isLast && (
                                        <div className="flex items-center gap-2 mt-[calc(100%-8px)] pt-1">
                                            <span className="text-[20px] font-black text-gray-900 leading-none tracking-tight">
                                                {segment.endStation}
                                            </span>
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
}

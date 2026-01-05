"use client";

import { useEffect, useRef } from "react";

export type InputType = 'start' | 'waypoint' | 'end';

export interface RouteInput {
    id: string;
    type: InputType;
    value: string;
    placeholder: string;
}

interface SearchPanelProps {
    inputs: RouteInput[];
    onInputChange: (id: string, val: string) => void;
    onSwap: () => void;
    onSearch: () => void;
    canSearch: boolean;
}

export default function SearchPanel({
    inputs,
    onInputChange,
    onSwap,
    onSearch,
    canSearch
}: SearchPanelProps) {

    return (
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 p-6 z-50 relative font-sans">
            {/* Helper Tabs */}
            <div className="flex items-center justify-between mb-5 border-b border-gray-100">
                <div className="flex items-center gap-6">
                    <button className="text-[17px] font-extrabold text-gray-900 border-b-[3px] border-gray-900 pb-2.5 -mb-[1.5px] leading-none">대중교통</button>
                    <button className="text-[17px] font-bold text-gray-400 hover:text-gray-600 pb-2.5 -mb-[1.5px] transition-colors leading-none">자동차</button>
                    <button className="text-[17px] font-bold text-gray-400 hover:text-gray-600 pb-2.5 -mb-[1.5px] transition-colors leading-none">도보</button>
                </div>
            </div>

            {/* Input Fields Container */}
            <div className="flex flex-col gap-3 relative">
                {/* Connector Line Logic: If both inputs exist, draw line? */}
                <div className="absolute left-[21px] top-[26px] bottom-[26px] w-[2px] bg-gray-100 z-10 pointer-events-none"></div>

                {/* Iterate Inputs */}
                {inputs.map((input) => {
                    const isStart = input.type === 'start';
                    const isEnd = input.type === 'end';

                    // Colors
                    const dotBorder = isStart ? 'border-green-500' : (isEnd ? 'border-red-500' : 'border-gray-400');
                    const ringColor = isStart ? 'focus:ring-green-500/20 focus:border-green-500' : (isEnd ? 'focus:ring-red-500/20 focus:border-red-500' : 'focus:ring-gray-200');

                    return (
                        <div key={input.id} className="relative group">
                            {/* Dot Icon */}
                            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full box-border border-[3px] bg-white z-20 shadow-sm ${dotBorder}`}></div>

                            <input
                                type="text"
                                value={input.value}
                                onChange={(e) => onInputChange(input.id, e.target.value)}
                                placeholder={input.placeholder}
                                className={`
                                    w-full h-[54px] pl-12 pr-12 
                                    bg-gray-50 rounded-xl border border-transparent
                                    outline-none transition-all duration-200
                                    text-[17px] font-bold text-gray-900 placeholder-gray-400
                                    focus:bg-white focus:ring-4 ${ringColor}
                                `}
                            />
                        </div>
                    );
                })}

                {/* Swap Button - Absolute Centered */}
                <button
                    onClick={onSwap}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-md text-gray-400 hover:text-green-600 hover:shadow-lg hover:border-gray-200 z-30 transition-all active:scale-90 active:rotate-180 duration-300"
                    aria-label="출발/도착 전환"
                    title="출발/도착 전환"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path></svg>
                </button>
            </div>

            {/* Action Buttons Row */}
            <div className="flex gap-2.5 mt-5">
                <button className="flex-1 h-11 rounded-lg bg-gray-50 text-gray-500 hover:text-gray-700 hover:bg-gray-100 text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    경유지
                </button>
                <button
                    onClick={onSearch}
                    disabled={!canSearch}
                    className={`
                        flex-[2] h-11 rounded-xl font-extrabold text-[15px] flex items-center justify-center gap-2
                        transition-all duration-200 shadow-sm transform active:scale-95
                        ${canSearch
                            ? 'bg-[#03C75A] text-white hover:bg-[#02b351] hover:shadow-green-500/30 hover:shadow-lg' // Naver Green
                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
                    `}
                >
                    길찾기
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                </button>
            </div>
        </div>
    );
}

import { useState, useEffect } from "react";
import { Search, MapPin, ArrowRight, Navigation } from "lucide-react";
import { motion } from "framer-motion";

interface BottomSearchProps {
    startStation: string;
    onStartChange: (val: string) => void;
    onSearch: (start: string, end: string) => void;
    loading?: boolean;
}

export default function BottomSearch({ startStation, onStartChange, onSearch, loading }: BottomSearchProps) {
    const [endStation, setEndStation] = useState("");
    const [isFocused, setIsFocused] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (startStation && endStation) {
            onSearch(startStation, endStation);
        }
    };

    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-4xl mx-auto"
        >
            <form
                onSubmit={handleSubmit}
                className={`
                    relative flex items-center gap-2 p-3 rounded-2xl border transition-all duration-300
                    ${isFocused
                        ? "bg-white/90 border-cyan-400 shadow-[0_0_30px_rgba(0,176,80,0.2)]"
                        : "bg-white/80 border-white/20 shadow-xl backdrop-blur-md"
                    }
                `}
            >
                {/* Start Input */}
                <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-cyan-500/50 transition-all">
                    <div className="p-1.5 bg-cyan-100 rounded-lg text-cyan-600">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Start</label>
                        <input
                            type="text"
                            value={startStation}
                            onChange={(e) => onStartChange(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-full bg-transparent outline-none text-gray-800 font-bold placeholder-gray-400"
                            placeholder="출발지 (GPS)"
                        />
                    </div>
                </div>

                {/* Divider Arrow */}
                <div className="text-gray-300">
                    <ArrowRight className="w-5 h-5" />
                </div>

                {/* End Input */}
                <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-purple-500/50 transition-all">
                    <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                        <Navigation className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">Destination</label>
                        <input
                            type="text"
                            value={endStation}
                            onChange={(e) => setEndStation(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            className="w-full bg-transparent outline-none text-gray-800 font-bold placeholder-gray-400"
                            placeholder="목적지 검색"
                        />
                    </div>
                </div>

                {/* Search Button */}
                <button
                    type="submit"
                    disabled={loading || !startStation || !endStation}
                    className="h-14 px-8 bg-[#1f1f1f] hover:bg-black text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <span>검색</span>
                            <Search className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
}

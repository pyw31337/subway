"use client";

import { MapPin, Search, Navigation } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import ArrivalBoard from "@/components/features/ArrivalBoard";
import NavigationCard from "@/components/features/NavigationCard";
import LocationCard from "@/components/features/LocationCard";
import { RealtimeArrival } from "@/types";

import Background from "@/components/ui/Background";

import { fetchArrivals } from "@/lib/api-client";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [arrivals, setArrivals] = useState<RealtimeArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentStation, setCurrentStation] = useState<string>("");

  // Search Handler
  const handleSearch = async (query: string) => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setArrivals([]);

    try {
      // Use Helper (Supports Static Export with Mock)
      const data = await fetchArrivals(query);
      setArrivals(data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  return (
    <main className="flex flex-col h-full min-h-screen text-gray-100 relative selection:bg-green-500/30 overflow-x-hidden">
      <Background />

      {/* Glass Header */}
      <header className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 bg-[#111]/80 backdrop-blur-md border-b border-white/5">
        <div
          onClick={() => {
            setHasSearched(false);
            setSearchQuery("");
            setArrivals([]);
          }}
          className="cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00B050] flex items-center justify-center text-white font-black italic shadow-lg shadow-green-900/50">
              S
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Subway<span className="text-[#00B050]">Live</span>
            </h1>
          </div>
        </div>
        <div className="w-9 h-9 bg-[#1C1C1E] rounded-full flex items-center justify-center border border-white/10 active:scale-90 transition-transform cursor-pointer">
          <Navigation className="w-4 h-4 text-gray-400" />
        </div>
      </header>

      <div className="flex-1 p-6 flex flex-col relative z-0">
        {/* Dynamic Header Text */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 mt-4"
          >
            <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
              어디로<br />떠나시나요?
            </h2>
            <p className="text-gray-500 text-sm">목적지를 설정하고 가장 빠른 경로를 확인하세요</p>
          </motion.div>
        )}


        {/* Location Card & Navigation Start */}
        {!hasSearched && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <LocationCard
              onSelectStation={(name) => { setSearchQuery(name); handleSearch(name); }}
              onLocationUpdate={(name) => setCurrentStation(name)}
            />

            {/* New Navigation Section */}
            <div className="mt-4">
              {currentStation ? (
                <NavigationCard currentStation={currentStation} />
              ) : (
                <div className="p-8 bg-gray-900/30 rounded-3xl text-center border-2 border-dashed border-gray-800 flex flex-col items-center justify-center gap-2">
                  <p className="text-gray-400 font-bold">출발지가 설정되지 않았습니다</p>
                  <p className="text-xs text-gray-500">위의 카드에서 연필 버튼을 눌러 위치를 설정하세요</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Floating Search Bar */}
        <div className={`sticky ${hasSearched ? 'top-20 z-40' : 'relative z-20'} transition-all duration-500 mb-8`}>
          <div className="relative group shadow-2xl shadow-black/50 rounded-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-500 group-focus-within:text-[#00B050] transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-20 py-4 bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-full text-white placeholder-gray-500 focus:outline-none focus:border-[#00B050]/50 focus:ring-2 focus:ring-[#00B050]/20 transition-all text-base font-medium"
              placeholder={hasSearched ? searchQuery : "역 이름 검색 (예: 강남)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <button
              onClick={() => handleSearch(searchQuery)}
              className="absolute inset-y-1.5 right-1.5 px-6 bg-[#00B050] hover:bg-[#009643] text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-green-900/20 active:scale-95"
            >
              Go
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[40vh]">
          {hasSearched ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-2xl font-bold text-white">{searchQuery}</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-gray-400 font-medium tracking-wide">LIVE</span>
                </div>
              </div>
              <ArrivalBoard arrivals={arrivals} loading={loading} />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pl-2">
                Favorites
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: "강남", lines: ["2", "D"], color: "#00B050" },
                  { name: "서울역", lines: ["1", "4", "A", "K"], color: "#0052A4" },
                  { name: "홍대입구", lines: ["2", "A", "K"], color: "#00B050" },
                  { name: "여의도", lines: ["5", "9"], color: "#996CAC" },
                ].map((station, idx) => (
                  <motion.div
                    key={station.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + idx * 0.05 }}
                    onClick={() => { setSearchQuery(station.name); handleSearch(station.name); }}
                    className="flex items-center p-4 bg-[#1C1C1E] rounded-[1.5rem] border border-white/5 hover:bg-white/10 active:scale-[0.98] transition-all cursor-pointer group"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black mr-4 shadow-lg group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: station.color, color: 'white' }}
                    >
                      {station.lines[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{station.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">
                        {station.lines.join(" · ")}호선
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </main>
  );
}

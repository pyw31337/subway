import { useState, useEffect } from "react";
import { ArrowRight, Map, Navigation as NavIcon, Clock, Shuffle } from "lucide-react";
import { motion } from "framer-motion";
import { LINE_COLORS, SUBWAY_ID_MAP } from "@/lib/subway-data";

interface NavigationCardProps {
    currentStation: string;
}

export default function NavigationCard({ currentStation }: NavigationCardProps) {
    const [destination, setDestination] = useState("");
    const [mode, setMode] = useState<"INPUT" | "GUIDE">("INPUT");
    const [loading, setLoading] = useState(false);
    const [routeData, setRouteData] = useState<any>(null);

    const startNavigation = async () => {
        if (!destination) return;
        setLoading(true);

        try {
            const res = await fetch(`/api/nav?start=${encodeURIComponent(currentStation)}&end=${encodeURIComponent(destination)}`);
            const data = await res.json();

            // API returns 'shortestRouteList'
            const list = data.shortestRouteList || data.realtimeArrivalList;

            if (data.errorMessage?.code === "INFO-000" && list && list.length > 0) {
                setRouteData(list[0]);
                setMode("GUIDE");
            } else {
                console.warn("API Data:", data);
                alert("경로를 찾을 수 없습니다. 역 이름을 확인해주세요.");
            }
        } catch (e) {
            console.error(e);
            alert("경로 검색 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const openApp = (app: "kakao" | "naver") => {
        const startEnc = encodeURIComponent(currentStation + "역");
        const endEnc = encodeURIComponent(destination + "역");
        if (app === "kakao") {
            window.location.href = `kakaomap://route?spn=${startEnc}&epn=${endEnc}&by=publictransit`;
        } else {
            window.location.href = `nmap://route/public?sname=${startEnc}&dname=${endEnc}`;
        }
    };

    if (mode === "INPUT") {
        return (
            <div className="bg-[#1C1C1E] border border-gray-800 rounded-2xl p-5 mb-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <NavIcon className="w-5 h-5 text-[#00B050]" />
                    경로 안내 시작
                </h3>

                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 p-3 bg-gray-800/50 rounded-xl text-center text-gray-400 text-sm font-bold">
                        {currentStation}
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-600" />
                    <input
                        type="text"
                        className="flex-1 p-3 bg-gray-800 rounded-xl text-center text-white placeholder-gray-500 text-sm focus:ring-1 focus:ring-[#00B050] outline-none font-bold"
                        placeholder="도착역 입력"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && startNavigation()}
                    />
                </div>

                <button
                    onClick={startNavigation}
                    disabled={loading}
                    className="w-full py-3 bg-[#00B050] hover:bg-[#009b45] disabled:bg-gray-700 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                >
                    {loading ? <span className="animate-spin text-xl">⏳</span> : "최단 경로 찾기"}
                </button>
            </div>
        );
    }

    // Parse Path Data
    // shtStatnNm: "강남, 역삼, 선릉..." (Comma separated)
    // shtStatnId: "1002000222, 1002000223..." (To deduce lines)

    const stationNames = routeData.shtStatnNm.split(",").map((s: string) => s.trim()).filter(Boolean);
    const stationIds = routeData.shtStatnId.split(",").map((s: string) => s.trim()).filter(Boolean);

    // Helper to color
    const getStationColor = (idx: number) => {
        // ID format: 1002000222 -> 1002 (Line 2)
        // Use SUBWAY_ID_MAP
        const fullId = stationIds[idx];
        if (!fullId) return "#555";
        const lineId = fullId.substring(0, 4);
        const lineCode = SUBWAY_ID_MAP[lineId] || "2"; // Default fallback
        return LINE_COLORS[lineCode] || "#555";
    };

    return (
        <div className="bg-[#1C1C1E] border border-gray-700 rounded-3xl p-6 mb-6 relative overflow-hidden">
            {/* Header Info */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                            최단 경로
                        </span>
                        <span className="text-gray-400 text-xs">
                            총 {routeData.shtStatnCnt}개 역
                        </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {destination}행
                    </h2>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1.5 text-white font-bold">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {routeData.shtTravelTm}분
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-400">
                            <Shuffle className="w-4 h-4" />
                            환승 {routeData.shtTransferCnt}회
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setMode("INPUT")}
                    className="bg-gray-800 p-2 rounded-full hover:bg-gray-700 transition-colors"
                >
                    <span className="text-xs text-gray-400">닫기</span>
                </button>
            </div>

            {/* Graphic Route Visualization */}
            <div className="relative pl-0 space-y-0 mb-8 max-h-[50vh] overflow-hidden flex">
                {/* SVG Connector Line */}
                <div className="w-16 relative flex-shrink-0">
                    <svg className="absolute top-4 left-0 w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#00B050" stopOpacity="1" />
                                <stop offset="100%" stopColor="#0052A4" stopOpacity="0.5" />
                            </linearGradient>
                            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Base Track */}
                        <line
                            x1="50%" y1="0" x2="50%" y2="100%"
                            stroke="#333" strokeWidth="4" strokeLinecap="round"
                        />

                        {/* Active Flowing Line */}
                        <motion.path
                            d={`M 32 0 V 1000`} // Simple vertical line
                            stroke="url(#routeGradient)"
                            strokeWidth="4"
                            strokeLinecap="round"
                            initial={{ pathLength: 0, opacity: 0 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            filter="url(#glow)"
                        />
                    </svg>

                    {/* Station Nodes on top of SVG */}
                    <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-between items-center py-2">
                        {stationNames.map((_: string, idx: number) => (
                            <div
                                key={idx}
                                className="w-4 h-4 rounded-full border-2 border-[#1C1C1E] z-10 relative bg-[#333]"
                                style={{
                                    backgroundColor: idx === 0 || idx === stationNames.length - 1 ? getStationColor(idx) : '#333',
                                    borderColor: idx === 0 ? '#fff' : '#1C1C1E',
                                    boxShadow: idx === 0 ? `0 0 15px ${getStationColor(idx)}` : 'none'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Station Lists */}
                <div className="flex-1 py-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 relative z-10" style={{ maxHeight: '300px' }}>
                    {stationNames.map((station: string, idx: number) => {
                        const isStart = idx === 0;
                        const isEnd = idx === stationNames.length - 1;
                        const color = getStationColor(idx);

                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`flex items-center justify-between p-3 rounded-xl transition-all ${isStart || isEnd ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5'}`}
                            >
                                <div className="flex flex-col">
                                    <span className={`text-lg font-bold ${isStart || isEnd ? 'text-white' : 'text-gray-400'}`}>
                                        {station}
                                    </span>
                                    {isStart && <span className="text-[10px] text-green-400">출발</span>}
                                </div>

                                {/* Transfer Badge */}
                                {idx > 0 && idx < stationIds.length - 1 &&
                                    stationIds[idx].substring(0, 4) !== stationIds[idx + 1].substring(0, 4) && (
                                        <span className="px-2 py-1 rounded bg-[#EF7C1C]/20 border border-[#EF7C1C]/50 text-[#EF7C1C] text-xs font-bold">
                                            환승
                                        </span>
                                    )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Map Links */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => openApp("kakao")}
                    className="flex items-center justify-center gap-2 py-3 bg-[#FAE100] text-black font-bold rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all"
                >
                    <Map className="w-4 h-4" /> 카카오맵 상세
                </button>
                <button
                    onClick={() => openApp("naver")}
                    className="flex items-center justify-center gap-2 py-3 bg-[#03C75A] text-white font-bold rounded-xl text-sm hover:brightness-110 active:scale-95 transition-all"
                >
                    <Map className="w-4 h-4" /> 네이버지도 상세
                </button>
            </div>
        </div>
    );
}

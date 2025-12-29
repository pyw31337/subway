import { useState, useEffect } from "react";
import { RealtimeArrival } from "@/types";
import { LINE_COLORS, SUBWAY_ID_MAP } from "@/lib/subway-data";
import { Clock, TrainFront, ChevronRight, MapPin } from "lucide-react";
import { fetchArrivals } from "@/lib/api-client";

interface ArrivalBoardProps {
    station: string;
}

export default function ArrivalBoard({ station }: ArrivalBoardProps) {
    const [arrivals, setArrivals] = useState<RealtimeArrival[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!station) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await fetchArrivals(station);
                setArrivals(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Optional: Auto-refresh every 30s?
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [station]);

    if (loading && arrivals.length === 0) {
        return (
            <div className="space-y-4 animate-pulse px-2 mb-6">
                {[1, 2].map((i) => (
                    <div key={i} className="h-24 bg-gray-800/50 rounded-3xl" />
                ))}
            </div>
        );
    }

    if (arrivals.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-4 mb-6">
                <TrainFront className="w-10 h-10 opacity-20" />
                <p className="text-sm">도착 정보가 없습니다.</p>
            </div>
        );
    }

    // 1. Group by Line ID
    const groupedByLine = arrivals.reduce((acc, curr) => {
        const lineId = curr.subwayId; // e.g., "1002"
        if (!acc[lineId]) acc[lineId] = [];
        acc[lineId].push(curr);
        return acc;
    }, {} as Record<string, RealtimeArrival[]>);

    return (
        <div className="space-y-8 pb-10">
            {Object.entries(groupedByLine).map(([lineId, lineArrivals]) => {
                const lineCode = SUBWAY_ID_MAP[lineId] || "?";
                const lineColor = LINE_COLORS[lineCode] || "#888";

                // 2. Separate Up/Down (In Seoul API, updnLine is "상행"/"하행" or "내선"/"외선")
                const upTrains = lineArrivals.filter(t => t.updnLine === "상행" || t.updnLine === "내선").sort((a, b) => parseInt(a.barvlDt) - parseInt(b.barvlDt));
                const downTrains = lineArrivals.filter(t => t.updnLine === "하행" || t.updnLine === "외선").sort((a, b) => parseInt(a.barvlDt) - parseInt(b.barvlDt));

                return (
                    <div key={lineId} className="relative">
                        {/* Line Title Badge */}
                        <div className="flex items-center gap-3 mb-4 mx-2">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-lg shadow-black/50"
                                style={{ backgroundColor: lineColor }}
                            >
                                {lineCode}
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                                {lineCode === "2" ? "2호선 순환" : `${lineCode}호선`}
                            </h2>
                        </div>

                        {/* Render Directions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {upTrains.length > 0 && (
                                <DirectionCard
                                    title={upTrains[0].updnLine}
                                    trains={upTrains}
                                    color={lineColor}
                                />
                            )}
                            {downTrains.length > 0 && (
                                <DirectionCard
                                    title={downTrains[0].updnLine}
                                    trains={downTrains}
                                    color={lineColor}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function DirectionCard({ title, trains, color }: { title: string, trains: RealtimeArrival[], color: string }) {
    // Extract destination from the first train usually represents the direction
    const directionName = trains[0]?.trainLineNm.split("-")[1]?.trim() || title;

    return (
        <div className="bg-[#1C1C1E] rounded-[2rem] p-5 shadow-2xl border border-white/5 relative overflow-hidden">
            {/* Glossy Header Effect */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-end mb-6 relative z-10">
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Toward</span>
                    <h3 className="text-2xl font-bold text-white leading-none">
                        {directionName.replace("방면", "")}
                    </h3>
                </div>
                <div className="bg-gray-800/80 backdrop-blur px-3 py-1 rounded-full border border-gray-700">
                    <span className="text-xs text-blue-400 font-bold">{title}</span>
                </div>
            </div>

            {/* Timeline Container */}
            <div className="relative pl-4 space-y-8">
                {/* Vertical Line */}
                <div className="absolute left-[23px] top-2 bottom-4 w-[3px] rounded-full bg-gray-800">
                    {/* Active Color Line Segment could go here */}
                </div>

                {trains.map((train, idx) => (
                    <div key={idx} className="relative flex items-start gap-4 z-10 group">
                        {/* Timeline Node */}
                        <div className="relative">
                            <div
                                className={`w-5 h-5 rounded-full border-[3px] bg-[#1C1C1E] z-10 relative mt-1 transition-all duration-500 ${idx === 0 ? 'scale-110 shadow-[0_0_15px_rgba(0,176,80,0.5)]' : 'opacity-70'}`}
                                style={{ borderColor: idx === 0 ? color : '#555' }}
                            />
                            {idx === 0 && (
                                <div
                                    className="absolute top-1 left-0 w-5 h-5 rounded-full animate-ping opacity-75"
                                    style={{ backgroundColor: color }}
                                />
                            )}
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 bg-gray-800/30 rounded-2xl p-3 border border-gray-700/50 backdrop-blur-sm group-hover:bg-gray-800/50 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-base font-bold text-gray-200">
                                        {train.trainLineNm.split("-")[0]} 행
                                    </span>
                                    {train.btrainSttus === "급행" && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-500/20 text-red-400 border border-red-500/50">
                                            EXPRESS
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className={`block text-xl font-bold ${idx === 0 ? 'text-[#00B050]' : 'text-gray-400'}`}>
                                        {train.arvlMsg2}
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3" />
                                    <span>{train.arvlMsg3}</span>
                                </div>
                                {train.barvlDt !== "0" && (
                                    <div className="font-mono bg-black/30 px-2 py-0.5 rounded text-gray-400">
                                        {Math.floor(Number(train.barvlDt) / 60)}m {Number(train.barvlDt) % 60}s
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

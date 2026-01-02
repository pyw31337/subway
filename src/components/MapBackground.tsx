"use client";

import { useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import { SUBWAY_LINES, getAllStations, Station } from "@/data/subway-lines";

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);


const ZoomHandler = dynamic(
    () => import("./ZoomHandler"),
    { ssr: false }
);

const SubwayCanvasLayer = dynamic(
    () => import("./SubwayCanvasLayer"),
    { ssr: false }
);

import { findShortestPath, PathResult } from "@/utils/pathfinding";
import { useRealtimeTrains } from "@/hooks/useRealtimeTrains";


// ... existing imports ...

function MapBackground() {
    const [isClient, setIsClient] = useState(false);
    const [stations, setStations] = useState<Station[]>([]);
    const [zoomLevel, setZoomLevel] = useState(12);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Real-time trains
    const trains = useRealtimeTrains();

    // Pathfinding state
    const [startStation, setStartStation] = useState<string | null>(null);
    const [endStation, setEndStation] = useState<string | null>(null);
    const [pathResult, setPathResult] = useState<PathResult | null>(null);

    useEffect(() => {
        setIsClient(true);
        setStations(getAllStations());
    }, []);

    // Calculate path when both selected
    useEffect(() => {
        if (startStation && endStation) {
            const result = findShortestPath(startStation, endStation);
            setPathResult(result);
        } else {
            setPathResult(null);
        }
    }, [startStation, endStation]);

    const handleStationClick = (name: string) => {
        if (!startStation) {
            setStartStation(name);
        } else if (!endStation && name !== startStation) {
            setEndStation(name);
        } else {
            // Reset if full
            if (endStation) {
                setStartStation(name);
                setEndStation(null);
                setPathResult(null);
            }
        }
    };

    const resetPath = () => {
        setStartStation(null);
        setEndStation(null);
        setPathResult(null);
    };



    if (!isClient) {
        // ... existing loading state ...
        return (
            <div className="absolute inset-0 w-full h-full z-0 bg-gray-100 flex items-center justify-center">
                <div className="text-gray-400 text-sm animate-pulse">지도 로딩 중...</div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 w-full h-full z-0 relative">
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                crossOrigin=""
            />

            {/* UI Overlay for Navigation */}
            {(startStation || endStation) && (
                <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
                    <h3 className="font-bold text-lg mb-2 text-gray-800">길찾기</h3>
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm">
                            <span className="w-12 text-gray-500">출발</span>
                            <span className="font-medium text-blue-600">{startStation || "선택해주세요"}</span>
                        </div>
                        <div className="flex items-center text-sm">
                            <span className="w-12 text-gray-500">도착</span>
                            <span className="font-medium text-red-600">{endStation || "지도에서 역을 선택하세요"}</span>
                        </div>
                    </div>

                    {pathResult && (
                        <div className="bg-gray-50 p-3 rounded mb-3 text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-600">총 정거장</span>
                                <span>{pathResult.path.length}개</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">환승</span>
                                <span>{pathResult.transferCount}회</span>
                            </div>
                            <div className="mt-2 text-xs text-gray-400">
                                예상 소요시간: 약 {pathResult.totalWeight}분
                            </div>
                        </div>
                    )}

                    <button
                        onClick={resetPath}
                        className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors text-sm font-medium"
                    >
                        초기화
                    </button>
                </div>
            )}

            {/* Dark Mode Toggle */}
            <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                title={isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
                {isDarkMode ? "☀️" : "🌙"}
            </button>

            <MapContainer
                center={[37.5665, 126.9780]}
                zoom={12}
                scrollWheelZoom={true}
                zoomControl={false}
                attributionControl={false}
                preferCanvas={true}
                style={{ height: "100%", width: "100%", background: "#f8f9fa" }}
            >
                {/* Internal component to track zoom */}
                <ZoomHandler onZoomChange={setZoomLevel} />

                {/* Base Map Tile Layer */}
                <TileLayer
                    url={isDarkMode
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }
                />

                {/* Canvas Layer for optimum performance */}
                <SubwayCanvasLayer
                    stations={stations}
                    zoomLevel={zoomLevel}
                    startStation={startStation}
                    endStation={endStation}
                    pathResult={pathResult}
                    trains={trains}
                    onStationClick={handleStationClick}
                    isDarkMode={isDarkMode}
                />
            </MapContainer>

        </div >
    );
}

export default memo(MapBackground);

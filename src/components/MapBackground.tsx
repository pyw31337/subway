"use client";

import { useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import { getAllStations, Station } from "@/data/subway-lines";
import { findShortestPath, PathResult } from "@/utils/pathfinding";
import { useRealtimeTrains } from "@/hooks/useRealtimeTrains";

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

const RoutePlanner = dynamic(
    () => import("./RoutePlanner"),
    { ssr: false }
);


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

    // Sync path result and markers from RoutePlanner
    const handlePathFound = (result: PathResult | null) => {
        setPathResult(result);
        if (result && result.path.length > 0) {
            setStartStation(result.path[0]);
            setEndStation(result.path[result.path.length - 1]);
        } else {
            setStartStation(null);
            setEndStation(null);
        }
    };

    // Note: handleStationClick is kept for compatibility but might need integration with RoutePlanner
    // Currently RoutePlanner drives the path finding.
    const handleStationClick = (name: string) => {
        // Optional: We could implement "Click map to fill empty input" here if we lifted state.
        // For now, map click just highlights locally, but won't trigger pathfinding until RoutePlanner is updated.
        // To avoid confusion, let's just log it or do nothing for now, as RoutePlanner is the UI source of truth.
        console.log("Clicked station:", name);
    };

    if (!isClient) {
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

            {/* Route Planner UI */}
            <RoutePlanner onPathFound={handlePathFound} />

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

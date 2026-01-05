"use client";

import { useEffect, useState, memo } from "react";
import dynamic from "next/dynamic";
import { getAllStations, Station } from "@/data/subway-lines";
import { PathResult } from "@/utils/pathfinding";
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

interface MapBackgroundProps {
    pathResult: PathResult | null;
    startStation: string | null;
    endStation: string | null;
    onStationClick?: (name: string) => void;
}

function MapBackground({ pathResult, startStation, endStation, onStationClick }: MapBackgroundProps) {
    const [isClient, setIsClient] = useState(false);
    const [stations, setStations] = useState<Station[]>([]);
    const [zoomLevel, setZoomLevel] = useState(12);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Real-time trains
    const trains = useRealtimeTrains();

    useEffect(() => {
        setIsClient(true);
        setStations(getAllStations());
    }, []);

    // Helper for station click if passed
    const handleStationClick = (name: string) => {
        if (onStationClick) onStationClick(name);
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
        <div className="absolute inset-0 w-full h-full z-0">
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                crossOrigin=""
            />

            {/* Map Container First */}

            <MapContainer
                center={[37.5665, 126.9780]}
                zoom={12}
                scrollWheelZoom={true}
                zoomControl={false}
                attributionControl={false}
                preferCanvas={true}
                minZoom={9}
                maxBounds={[[36.5, 125.5], [38.5, 128.5]]} // Seoul/Gyeonggi area with buffer
                maxBoundsViscosity={1.0} // Sticky bounds
                style={{ height: "100%", width: "100%", background: "#f8f9fa" }}
            >
                {/* Internal component to track zoom */}
                <ZoomHandler onZoomChange={setZoomLevel} />

                {/* Base Map Tile Layer - Positron (Light/Gray) */}
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

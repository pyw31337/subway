"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useMap, useMapEvents, ScaleControl } from "react-leaflet";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SUBWAY_LINES, Station } from "@/data/subway-lines";
import SubwayCanvasLayer from "./SubwayCanvasLayer";
import { Train } from "@/hooks/useRealtimeTrains";

// Dynamic import for MapContainer to avoid SSR issues
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);

// Constants
const SEOUL_CENTER: [number, number] = [37.5665, 126.9780];
const SEOUL_BOUNDS: [[number, number], [number, number]] = [
    [37.4, 126.7], // SouthWest
    [37.7, 127.2]  // NorthEast
];

function ZoomHandler({ setZoomLevel }: { setZoomLevel: (zoom: number) => void }) {
    const map = useMapEvents({
        zoomend: () => {
            setZoomLevel(map.getZoom());
        },
    });
    return null;
}

interface MapBackgroundProps {
    stations: Station[];
    trains: Train[];
    startStation: string | null;
    endStation: string | null;
    pathResult: { path: string[]; totalWeight: number; transferCount: number } | null;
    setStartStation: (station: string | null) => void;
    setEndStation: (station: string | null) => void;
    isDarkMode?: boolean;
}

export default function MapBackground({
    stations,
    trains,
    startStation,
    endStation,
    pathResult,
    setStartStation,
    setEndStation,
    isDarkMode = false
}: MapBackgroundProps) {
    const [zoomLevel, setZoomLevel] = useState(12);
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle station click from CanvasLayer
    const handleStationClick = (name: string) => {
        if (!startStation) {
            setStartStation(name);
        } else if (!endStation) {
            if (startStation === name) return; // Ignore self
            setEndStation(name);
        } else {
            // Reset
            setStartStation(name);
            setEndStation(null);
        }
    };

    return (
        <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 bg-white">
            <MapContainer
                center={SEOUL_CENTER}
                zoom={12}
                className="w-full h-full outline-none"
                zoomControl={false}
                minZoom={10}
                maxZoom={18}
                maxBounds={SEOUL_BOUNDS}
                maxBoundsViscosity={1.0}
            >
                <ZoomHandler setZoomLevel={setZoomLevel} />
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

                {/* Scale Control: Bottom Left */}
                <ScaleControl position="bottomleft" imperial={false} />
            </MapContainer>

            {/* Bottom Input UI */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-md px-4">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 border-2 border-gray-100 ring-1 ring-black/5 flex flex-col gap-3">
                    {/* Inputs */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center shadow-sm shrink-0">
                            <span className="text-white text-xs font-bold">출발</span>
                        </div>
                        <div
                            className={`flex-1 h-12 rounded-xl border-2 px-4 flex items-center bg-gray-50/50 transition-all ${startStation ? 'border-green-500 bg-green-50/30 text-gray-900 font-bold' : 'border-gray-200 text-gray-400'}`}
                        >
                            {startStation || "지도에서 역 선택"}
                        </div>
                        {startStation && (
                            <button onClick={() => setStartStation(null)} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-sm shrink-0">
                            <span className="text-white text-xs font-bold">도착</span>
                        </div>
                        <div
                            className={`flex-1 h-12 rounded-xl border-2 px-4 flex items-center bg-gray-50/50 transition-all ${endStation ? 'border-red-500 bg-red-50/30 text-gray-900 font-bold' : 'border-gray-200 text-gray-400'}`}
                        >
                            {endStation || "지도에서 역 선택"}
                        </div>
                        {endStation && (
                            <button onClick={() => setEndStation(null)} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>

                    {/* Result Summary */}
                    {pathResult && (
                        <div className="mt-2 pt-3 border-t border-gray-100 flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-5">
                                <div>
                                    <span className="text-gray-500 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Time</span>
                                    <span className="font-black text-2xl text-gray-900">{pathResult.totalWeight}<span className="text-sm font-medium text-gray-500 ml-1">min</span></span>
                                </div>
                                <div className="h-8 w-px bg-gray-200"></div>
                                <div>
                                    <span className="text-gray-500 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Transfer</span>
                                    <span className="font-black text-xl text-gray-900">{pathResult.transferCount}<span className="text-sm font-medium text-gray-500 ml-1">times</span></span>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <span className="text-white font-bold text-xs bg-black px-3 py-1.5 rounded-full shadow-lg">Fastest Route</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}

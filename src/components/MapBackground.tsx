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
const Polyline = dynamic(
    () => import("react-leaflet").then((mod) => mod.Polyline),
    { ssr: false }
);
const CircleMarker = dynamic(
    () => import("react-leaflet").then((mod) => mod.CircleMarker),
    { ssr: false }
);
const Tooltip = dynamic(
    () => import("react-leaflet").then((mod) => mod.Tooltip),
    { ssr: false }
);

function MapBackground() {
    const [isClient, setIsClient] = useState(false);
    const [stations, setStations] = useState<Station[]>([]);

    useEffect(() => {
        setIsClient(true);
        setStations(getAllStations());
    }, []);

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
            <MapContainer
                center={[37.5665, 126.9780]}
                zoom={12}
                scrollWheelZoom={true}
                zoomControl={false}
                attributionControl={false}
                style={{ height: "100%", width: "100%", background: "#f8f9fa" }}
            >
                {/* CartoDB Positron - Clean grayscale basemap */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                {/* Subway Lines - Polylines */}
                {SUBWAY_LINES.map((line) => (
                    <Polyline
                        key={line.id}
                        positions={line.stations.map((s) => [s.lat, s.lng])}
                        pathOptions={{
                            color: line.color,
                            weight: 4,
                            opacity: 0.85,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                ))}

                {/* Station Markers - Circle markers */}
                {stations.map((station, idx) => {
                    // Get primary line color
                    const primaryLine = SUBWAY_LINES.find(l => l.id === station.lines[0]);
                    const color = primaryLine?.color || "#888";
                    const isTransfer = station.lines.length > 1;

                    return (
                        <CircleMarker
                            key={`${station.name}-${idx}`}
                            center={[station.lat, station.lng]}
                            radius={isTransfer ? 6 : 4}
                            pathOptions={{
                                color: isTransfer ? "#333" : color,
                                fillColor: isTransfer ? "#fff" : color,
                                fillOpacity: 1,
                                weight: isTransfer ? 2 : 1.5,
                            }}
                        >
                            <Tooltip
                                direction="top"
                                offset={[0, -5]}
                                className="station-tooltip"
                            >
                                <div className="font-bold text-xs">
                                    {station.name}
                                    {isTransfer && (
                                        <span className="text-gray-500 ml-1">
                                            ({station.lines.join("·")})
                                        </span>
                                    )}
                                </div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default memo(MapBackground);

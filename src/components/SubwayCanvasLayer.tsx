"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from 'leaflet';
import { SUBWAY_LINES, Station } from "@/data/subway-lines";
import { Train } from "@/hooks/useRealtimeTrains";

interface SubwayCanvasLayerProps {
    stations: Station[];
    zoomLevel: number;
    startStation: string | null;
    endStation: string | null;
    pathResult: { path: string[]; totalWeight: number; transferCount: number } | null;
    trains: Train[];
    onStationClick: (name: string) => void;
    isDarkMode?: boolean;
}

export default function SubwayCanvasLayer({
    stations,
    zoomLevel,
    startStation,
    endStation,
    pathResult,
    trains,
    onStationClick,
    isDarkMode = false
}: SubwayCanvasLayerProps) {
    const map = useMap();

    // Separate LayerGroups for better performance
    const staticLayerRef = useRef<L.LayerGroup | null>(null); // Lines & Stations
    const dynamicLayerRef = useRef<L.LayerGroup | null>(null); // Trains
    const highlightLayerRef = useRef<L.LayerGroup | null>(null); // Path Highlights

    // Initialize Layers
    useEffect(() => {
        const staticLayer = L.layerGroup().addTo(map);
        const dynamicLayer = L.layerGroup().addTo(map);
        const highlightLayer = L.layerGroup().addTo(map);

        staticLayerRef.current = staticLayer;
        dynamicLayerRef.current = dynamicLayer;
        highlightLayerRef.current = highlightLayer;

        return () => {
            staticLayer.remove();
            dynamicLayer.remove();
            highlightLayer.remove();
        };
    }, [map]);


    // 1. Static Layer: Draw Lines & Stations
    // Redraw whenever Zoom, Theme, or Path Active State changes
    useEffect(() => {
        if (!staticLayerRef.current) return;
        const layerGroup = staticLayerRef.current;
        layerGroup.clearLayers();

        const myRenderer = L.canvas({ padding: 0.5 });
        const isPathActive = !!pathResult;

        // Draw Lines
        SUBWAY_LINES.forEach((line) => {
            const latlngs = line.stations.map(s => [s.lat, s.lng] as [number, number]);

            // If path is active, draw all background lines in GRAY
            const color = isPathActive ? "#e5e7eb" : line.color; // Gray-200
            const opacity = isPathActive ? 0.3 : 0.85; // Lower opacity for background
            const weight = isPathActive ? 3 : 4;

            const polyline = L.polyline(latlngs, {
                color: color,
                weight: weight,
                opacity: opacity,
                lineCap: "round",
                lineJoin: "round",
                renderer: myRenderer,
            });

            layerGroup.addLayer(polyline);
        });

        // Draw Stations
        // Filter out stations if zoom is low? Or keep them?
        // User wants "Pins" on click. Regular stations are dots.
        // If path active, maybe dim non-path stations?
        const isZoomOut = zoomLevel < 12;

        stations.forEach((station) => {
            const primaryLine = SUBWAY_LINES.find(l => l.name === station.lines[0]);
            let color = primaryLine?.color || "#888";
            let fillColor = "#fff";
            let opacity = 1;

            if (isPathActive) {
                const inPath = pathResult.path.includes(station.name);
                if (!inPath) {
                    color = "#d1d5db"; // Gray-300
                    fillColor = "#f3f4f6";
                    opacity = 0.5;
                }
            }

            const isTransfer = station.lines.length > 1;
            let radius = isZoomOut ? (isTransfer ? 3 : 1.5) : (isTransfer ? 5 : 3.5);
            let weight = isZoomOut ? (isTransfer ? 1.5 : 1) : (isTransfer ? 2 : 1.5);

            const marker = L.circleMarker([station.lat, station.lng], {
                radius: radius,
                color: color,
                fillColor: fillColor,
                fillOpacity: opacity === 1 ? 1 : 0.8,
                opacity: opacity,
                weight: weight,
                renderer: myRenderer,
                clickable: true,
                interactive: true,
                bubblingMouseEvents: false
            } as any);

            marker.on('click', () => onStationClick(station.name));

            // Tooltips
            // Show tooltips for all stations if zoom is high enough
            // If path is active, maybe only show tooltips for path stations?
            const showTooltip = zoomLevel >= 13 && (!isPathActive || pathResult.path.includes(station.name));

            if (showTooltip) {
                marker.bindTooltip(station.name, {
                    permanent: true,
                    direction: "top",
                    offset: [0, -8],
                    className: "station-label",
                });
            }

            layerGroup.addLayer(marker);
        });

    }, [zoomLevel, stations, pathResult]);


    // 2. Highlight Layer: Selected Path & Pins
    useEffect(() => {
        if (!highlightLayerRef.current) return;
        const layerGroup = highlightLayerRef.current;
        layerGroup.clearLayers();

        if (!startStation && !endStation && !pathResult) return;

        const myRenderer = L.canvas({ padding: 0.5 });

        // Draw Path Line (COLOR)
        if (pathResult) {
            for (let i = 0; i < pathResult.path.length - 1; i++) {
                const sname1 = pathResult.path[i];
                const sname2 = pathResult.path[i + 1];
                const s1 = stations.find(s => s.name === sname1);
                const s2 = stations.find(s => s.name === sname2);

                if (s1 && s2) {
                    // Find common line for color
                    const commonLine = s1.lines.find(l => s2.lines.includes(l));
                    const lineData = SUBWAY_LINES.find(l => l.name === commonLine);
                    const color = lineData ? lineData.color : "#000";

                    // Draw Segment
                    layerGroup.addLayer(L.polyline([[s1.lat, s1.lng], [s2.lat, s2.lng]], {
                        color: color,
                        weight: 6,
                        opacity: 1,
                        renderer: myRenderer
                    }));
                }
            }
        }

        // Draw Pins (Start/End/Pass)
        const createPinIcon = (type: 'start' | 'end') => {
            const label = type === 'start' ? '출발' : '도착';
            const bgClass = type === 'start' ? 'bg-green-600' : 'bg-red-600';
            const ringClass = type === 'start' ? 'ring-green-200' : 'ring-red-200';

            // Custom Pin HTML
            return L.divIcon({
                className: '',
                html: `
                    <div class="relative flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-full" style="width: 60px; height: 70px;">
                        <div class="${bgClass} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md mb-2 whitespace-nowrap z-20">
                            ${label}
                        </div>
                        <div class="w-10 h-10 ${bgClass} rounded-full border-[3px] border-white shadow-xl flex items-center justify-center relative z-10 ring-4 ${ringClass}">
                            <div class="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                        <div class="w-1 h-5 bg-gray-400/80 -mt-2 rounded-b-full"></div>
                        <div class="absolute bottom-0 w-8 h-2 bg-black/20 rounded-[100%] blur-[2px] transform translate-y-1"></div>
                    </div>
                `,
                iconSize: [60, 70],
                iconAnchor: [30, 68], // Anchor at bottom tip
            });
        };

        if (startStation) {
            const s = stations.find(st => st.name === startStation);
            if (s) {
                L.marker([s.lat, s.lng], { icon: createPinIcon('start'), zIndexOffset: 2000 }).addTo(layerGroup);
            }
        }
        if (endStation) {
            const s = stations.find(st => st.name === endStation);
            if (s) {
                L.marker([s.lat, s.lng], { icon: createPinIcon('end'), zIndexOffset: 2000 }).addTo(layerGroup);
            }
        }

    }, [pathResult, stations, startStation, endStation]);


    // 3. Dynamic Layer: Trains
    const trainMarkersRef = useRef<Map<string, L.Marker>>(new Map());

    useEffect(() => {
        if (!dynamicLayerRef.current) return;
        const layerGroup = dynamicLayerRef.current;
        const currentMarkers = trainMarkersRef.current;

        // Filter trains if path is active
        // Only show trains that are on the edges of the path
        let visibleTrains = trains;
        if (pathResult) {
            const pathSet = new Set<string>();
            // Create "A|B" and "B|A" keys for all edges
            for (let i = 0; i < pathResult.path.length - 1; i++) {
                pathSet.add(`${pathResult.path[i]}|${pathResult.path[i + 1]}`);
                pathSet.add(`${pathResult.path[i + 1]}|${pathResult.path[i]}`);
            }

            visibleTrains = trains.filter(t => {
                const key = `${t.prevStation}|${t.nextStation}`;
                return pathSet.has(key);
            });
        }

        const activeTrainIds = new Set(visibleTrains.map(t => t.id));

        // 1. Update/Create Markers
        if (zoomLevel >= 11) { // Hide trains when zoomed out too much
            visibleTrains.forEach(train => {
                let marker = currentMarkers.get(train.id);

                if (!marker) {
                    const line = SUBWAY_LINES.find(l => l.id === train.lineId);
                    const color = line?.color || "#000";

                    // Train SVG
                    const svgIcon = `
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));">
                             <rect x="4" y="6" width="16" height="12" rx="2" fill="${color}" stroke="white" stroke-width="2"/>
                             <path d="M6 18V20" stroke="#555" stroke-width="2" stroke-linecap="round"/>
                             <path d="M18 18V20" stroke="#555" stroke-width="2" stroke-linecap="round"/>
                             <rect x="7" y="9" width="4" height="4" rx="0.5" fill="white"/>
                             <rect x="13" y="9" width="4" height="4" rx="0.5" fill="white"/>
                        </svg>
                    `;

                    const icon = L.divIcon({
                        className: 'train-marker-container',
                        html: `<div class="train-marker transition-transform duration-300">${svgIcon}</div>`,
                        iconSize: [28, 28],
                        iconAnchor: [14, 14]
                    });

                    marker = L.marker([train.lat, train.lng], {
                        icon: icon,
                        interactive: false,
                        zIndexOffset: 1500
                    });

                    // Add tooltip (optional)
                    // marker.bindTooltip(...)

                    marker.addTo(layerGroup);
                    currentMarkers.set(train.id, marker);
                } else {
                    // Update Position
                    // Just set LatLng. CSS transition on leafet-marker-icon? 
                    // Leaflet moves marker via transform.
                    // For smooth animation, we rely on the rapid updates of lat/lng from hook (60fps ideally)
                    // or CSS transition on Leaflet layer (might be glitchy).
                    // Stick to rapid updates.
                    marker.setLatLng([train.lat, train.lng]);
                }
            });
        }

        // 2. Remove Stale
        currentMarkers.forEach((marker, id) => {
            if (!activeTrainIds.has(id) || zoomLevel < 11) {
                marker.remove();
                currentMarkers.delete(id);
            }
        });

    }, [trains, zoomLevel, pathResult]);

    return null;
}

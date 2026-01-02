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
    useEffect(() => {
        if (!staticLayerRef.current) return;
        const layerGroup = staticLayerRef.current;
        layerGroup.clearLayers();

        const myRenderer = L.canvas({ padding: 0.5 });

        // Draw Lines (Straight)
        SUBWAY_LINES.forEach((line) => {
            const latlngs = line.stations.map(s => [s.lat, s.lng] as [number, number]);

            const polyline = L.polyline(latlngs, {
                color: line.color,
                weight: 4,
                opacity: 0.85,
                lineCap: "round",
                lineJoin: "round",
                renderer: myRenderer,
            });

            layerGroup.addLayer(polyline);
        });

        // Draw Stations
        const isZoomOut = zoomLevel < 12;
        const zoomThreshold = 13;

        stations.forEach((station) => {
            const primaryLine = SUBWAY_LINES.find(l => l.name === station.lines[0]);
            const color = primaryLine?.color || "#888";
            const isTransfer = station.lines.length > 1;

            let radius = isZoomOut ? (isTransfer ? 4 : 2) : (isTransfer ? 6 : 4);
            let weight = isZoomOut ? (isTransfer ? 2 : 1) : (isTransfer ? 3 : 2);
            let fillColor = "#fff";

            const marker = L.circleMarker([station.lat, station.lng], {
                radius: radius,
                color: color,
                fillColor: fillColor,
                fillOpacity: 1,
                weight: weight,
                renderer: myRenderer,
                interactive: true,
                bubblingMouseEvents: false
            });

            marker.on('click', () => onStationClick(station.name));

            if (zoomLevel >= zoomThreshold) {
                marker.bindTooltip(station.name, {
                    permanent: true,
                    direction: "top",
                    offset: [0, -8],
                    className: "station-label",
                });
            }

            layerGroup.addLayer(marker);
        });

    }, [zoomLevel, stations]);

    // 2. Highlight Layer: Selection & Path
    useEffect(() => {
        if (!highlightLayerRef.current) return;
        const layerGroup = highlightLayerRef.current;
        layerGroup.clearLayers();

        if (!startStation && !endStation && !pathResult) return;

        const myRenderer = L.canvas({ padding: 0.5 });

        // Draw Path Line (Straight)
        if (pathResult) {
            const pathCoords = pathResult.path.map((name) => {
                const s = stations.find((st) => st.name === name);
                return s ? [s.lat, s.lng] as [number, number] : null;
            }).filter((c): c is [number, number] => c !== null);

            if (pathCoords.length > 0) {
                layerGroup.addLayer(L.polyline(pathCoords, {
                    color: "#00ffcc",
                    weight: 6,
                    opacity: 1,
                    renderer: myRenderer
                }));
            }
        }

        // Draw Selected Stations (Overlays)
        const drawHighlightMarker = (name: string, type: 'start' | 'end' | 'path') => {
            const s = stations.find(st => st.name === name);
            if (!s) return;

            const color = type === 'start' ? "#3b82f6" : (type === 'end' ? "#ef4444" : "#00ffcc");
            const radius = type === 'path' ? 5 : 8;

            layerGroup.addLayer(L.circleMarker([s.lat, s.lng], {
                radius: radius,
                color: "#000",
                fillColor: color,
                fillOpacity: 1,
                weight: 2,
                renderer: myRenderer
            }));
        };

        if (startStation) drawHighlightMarker(startStation, 'start');
        if (endStation) drawHighlightMarker(endStation, 'end');
    }, [startStation, endStation, pathResult, stations]);


    // 3. Dynamic Layer (Trains) - Linear Interpolation
    const markersRef = useRef<{ [key: string]: HTMLDivElement }>({});

    useEffect(() => {
        if (!dynamicLayerRef.current) return;
        const layerGroup = dynamicLayerRef.current;
        const currentMarkers = markersRef.current;
        const activeIds = new Set<string>();

        trains.forEach((train) => {
            activeIds.add(train.id);

            // Position is directly provided by the hook
            const lat = train.lat;
            const lng = train.lng;

            // Resolve Line Color
            const line = SUBWAY_LINES.find(l => l.id === train.lineId);
            const lineColor = line?.color || "#000";

            // Calculate simple rotation (angle between prev and next)
            let angle = 0;
            const s1 = stations.find(s => s.name === train.prevStation);
            const s2 = stations.find(s => s.name === train.nextStation);

            if (s1 && s2) {
                angle = Math.atan2(s2.lng - s1.lng, s2.lat - s1.lat) * (180 / Math.PI);
            }

            let markerElement = currentMarkers[train.id];

            if (!markerElement) {
                // Create Marker DOM
                markerElement = document.createElement('div');
                markerElement.className = 'train-marker-container';
                // Restore Original Train SVG
                // A stylized front/top view of a train
                markerElement.innerHTML = `
                    <svg viewBox="0 0 24 24" width="30" height="30" style="overflow: visible;">
                        <defs>
                            <filter id="glow-${train.id}" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        <path d="M4 6V17H20V6C20 6 20 4 12 4C4 4 4 6 4 6ZM4 17V19H20V17M6 10H9V13H6V10ZM15 10H18V13H15V10ZM6 19L5 21H7L8 19H16L17 21H19L18 19"
                              fill="${lineColor}" stroke="#fff" stroke-width="1.5" stroke-linejoin="round" filter="url(#glow-${train.id})"/>
                    </svg>
                `;

                // Icon instance
                const icon = L.divIcon({
                    html: markerElement,
                    className: 'train-div-icon',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                });

                const marker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(layerGroup);
                (markerElement as any)._leaflet_marker = marker;
                currentMarkers[train.id] = markerElement;
            }

            // Update Position & Rotation
            const markerInstance = (markerElement as any)._leaflet_marker as L.Marker;
            if (markerInstance) {
                markerInstance.setLatLng([lat, lng]);
                const svg = markerElement.querySelector('svg');
                if (svg) {
                    // Apply rotation to align with the line
                    svg.style.transform = `rotate(${angle}deg)`;
                    svg.style.transition = 'transform 0.1s linear';
                }
            }

        });

        // Cleanup
        Object.keys(currentMarkers).forEach((id) => {
            if (!activeIds.has(id)) {
                const markerElement = currentMarkers[id];
                const marker = (markerElement as any)._leaflet_marker as L.Marker;
                marker.remove();
                delete currentMarkers[id];
            }
        });

    }, [trains, stations]);

    return null;
}

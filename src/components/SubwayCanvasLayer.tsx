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
    // Only redraw if ZOOM changes (for marker size) or Theme changes
    // Assuming 'stations' prop remains stable reference ideally, or check length
    useEffect(() => {
        if (!staticLayerRef.current) return;
        const layerGroup = staticLayerRef.current;
        layerGroup.clearLayers();

        // Canvas renderer for performance
        const myRenderer = L.canvas({ padding: 0.5 });

        // Draw Lines
        SUBWAY_LINES.forEach((line) => {
            const latlngs = line.stations.map(s => [s.lat, s.lng] as [number, number]);

            // Dim lines if path is active is handled by highlight layer overlay?
            // Or we can just keep them opaque. Let's keep them somewhat consistent.
            // Note: If we want to dim them dynamically without clearing everything, it's tricky.
            // For OOM prevention, we prioritize NOT clearing this layer.
            // We will handle dimming via CSS or just overlaying a semi-transparent 'fog' if needed, OR 
            // accept that we don't dim the base lines for now to save memory.
            // Let's keep them standard opacity.

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

            // We handle selection highlight in highlightLayer to avoid redrawing all stations
            // Base station style:

            const marker = L.circleMarker([station.lat, station.lng], {
                radius: radius,
                color: color,
                fillColor: fillColor,
                fillOpacity: 1,
                weight: weight,
                renderer: myRenderer,
                bubblingMouseEvents: false
            });

            marker.on('click', () => onStationClick(station.name));

            // Tooltips
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

    }, [zoomLevel, stations]); // Re-runs on zoom, but NOT on 'trains' update!

    // 2. Highlight Layer: Selection & Path
    useEffect(() => {
        if (!highlightLayerRef.current) return;
        const layerGroup = highlightLayerRef.current;
        layerGroup.clearLayers();

        if (!startStation && !endStation && !pathResult) return;

        const myRenderer = L.canvas({ padding: 0.5 });

        // Draw Path Line
        if (pathResult) {
            const pathCoords = pathResult.path.map((name) => {
                const s = stations.find((st) => st.name === name);
                return s ? [s.lat, s.lng] as [number, number] : null;
            }).filter((c): c is [number, number] => c !== null);

            if (pathCoords.length > 0) {
                // Neon Glow
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


    // 3. Dynamic Layer: Trains (DOM Markers with Caching)
    // We use a ref to cache markers: Map<trainId, L.Marker>
    const trainMarkersRef = useRef<Map<string, L.Marker>>(new Map());

    useEffect(() => {
        // Note: DynamicLayer is still good for grouping, but strictly we are managing markers directly now.
        // We can add them to dynamicLayerRef.current to manage lifecycle (remove on unmount).

        if (!dynamicLayerRef.current) return;
        const layerGroup = dynamicLayerRef.current; // We will add new markers here

        const currentMarkers = trainMarkersRef.current;
        const activeTrainIds = new Set(trains.map(t => t.id));

        // 1. Update or Create Markers
        if (zoomLevel >= 11) {
            trains.forEach(train => {
                let marker = currentMarkers.get(train.id);

                if (!marker) {
                    // Create New Marker
                    // Visual: 🚆 Emoji or simple DIV
                    const line = SUBWAY_LINES.find(l => l.id === train.lineId);
                    const color = line?.color || "#000";

                    const icon = L.divIcon({
                        className: 'train-marker-container',
                        html: `<div class="train-marker" style="color: ${color};">🚆</div>`,
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    });

                    marker = L.marker([train.lat, train.lng], {
                        icon: icon,
                        interactive: false
                    });

                    // Add tooltip
                    marker.bindTooltip(`${train.lineName} (${train.headingTo})`, {
                        direction: 'top',
                        offset: [0, -10],
                        className: 'train-label',
                        permanent: false
                    });

                    marker.addTo(layerGroup);
                    currentMarkers.set(train.id, marker);
                } else {
                    // Update Position
                    // Leaflet handles smooth transition if CSS transition is set on the element?
                    // Or just setLatLng is enough.
                    marker.setLatLng([train.lat, train.lng]);

                    // Update Tooltip content if needed (heading changes)
                    const tooltip = marker.getTooltip();
                    if (tooltip) {
                        tooltip.setContent(`${train.lineName} (${train.headingTo})`);
                    }
                }
            });
        }

        // 2. Remove Stale Markers (Trains that disappeared)
        // Also remove ALL markers if zoom is too low
        currentMarkers.forEach((marker, id) => {
            if (!activeTrainIds.has(id) || zoomLevel < 11) {
                marker.remove();
                currentMarkers.delete(id);
            }
        });

    }, [trains, zoomLevel]);

    return null;
}

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

    // 4. Helper: Determine active lines from path
    const activeRouteLineIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!pathResult) {
            activeRouteLineIds.current.clear();
            return;
        }

        const ids = new Set<string>();
        // Simple heuristic: If a station on the path belongs to a line, that line is "relevant"?
        // Or strictly strictly only lines used in the path segments?
        // Since we don't have explicit edge->line mapping in result, let's include all lines touching the path stations.
        // This is safe enough (e.g. at transfer stations, both lines are "active" effectively).
        // A tighter filter would require path finding to return line IDs. For now this is good optimization.
        pathResult.path.forEach(sName => {
            const s = stations.find(st => st.name === sName);
            if (s) {
                s.lines.forEach(lName => {
                    const lineConfig = SUBWAY_LINES.find(l => l.name === lName);
                    if (lineConfig) ids.add(lineConfig.id);
                });
            }
        });
        activeRouteLineIds.current = ids;
    }, [pathResult, stations]);

    // 1. Static Layer: Draw Lines & Stations
    useEffect(() => {
        if (!staticLayerRef.current) return;
        const layerGroup = staticLayerRef.current;
        layerGroup.clearLayers();

        const myRenderer = L.canvas({ padding: 0.5 });
        const isRouteActive = !!pathResult;

        // Draw Lines
        SUBWAY_LINES.forEach((line) => {
            const latlngs = line.stations.map(s => [s.lat, s.lng] as [number, number]);

            // Optimization: If route active, gray out unused lines
            // Actually, user said "exclude that section (path)... rest is gray".
            // So we draw EVERYTHING gray here, and let Highlight Layer draw the color path on top.
            const color = isRouteActive ? "#e5e7eb" : line.color;
            const opacity = isRouteActive ? 0.3 : 0.85;
            const weight = isRouteActive ? 2 : 4; // Thinner inactive lines

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
        const isZoomOut = zoomLevel < 12;
        const zoomThreshold = 13;

        stations.forEach((station) => {
            const primaryLine = SUBWAY_LINES.find(l => l.name === station.lines[0]);
            const isTransfer = station.lines.length > 1;

            // Gray out stations if route active
            const baseColor = primaryLine?.color || "#888";
            const color = isRouteActive ? "#d1d5db" : baseColor;

            // Should we hide non-path stations? User didn't say hide, just gray/dim.
            // Let's keep them but dim.

            let radius = isZoomOut ? (isTransfer ? 4 : 2) : (isTransfer ? 6 : 4);
            let weight = isZoomOut ? (isTransfer ? 2 : 1) : (isTransfer ? 3 : 2);
            // If inactive, maybe smaller?
            if (isRouteActive) {
                radius = Math.max(2, radius - 1);
                weight = 1;
            }

            const marker = L.circleMarker([station.lat, station.lng], {
                radius: radius,
                color: color,
                fillColor: "#fff",
                fillOpacity: isRouteActive ? 0.5 : 1, // Dim fill too
                weight: weight,
                renderer: myRenderer,
                bubblingMouseEvents: false
            });

            marker.on('click', () => onStationClick(station.name));

            // Tooltips - Only show if zoomed in OR if it's a path station (optional logic, kept simple for now)
            if (zoomLevel >= zoomThreshold && !isRouteActive) {
                marker.bindTooltip(station.name, {
                    permanent: true,
                    direction: "top",
                    offset: [0, -8],
                    className: "station-label",
                });
            }

            layerGroup.addLayer(marker);
        });

    }, [zoomLevel, stations, pathResult]); // Added pathResult dependency to trigger redraw

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
                // Determine color? User might want line colors preserved.
                // Since path can span multiple lines, using a single highlight color (Neon) is safest/clearest.
                // The user requested: "restore full colors... reset...".
                // "exclude that section (of search)... rest gray".
                // This implies the SEARCH section should be COLORED.
                // But a multi-line path is hard to color segment-by-segment without edge data.
                // For now, Neon Green/Blue is standard for "Active Route".
                // Or we can try to find color of each segment?
                // Let's stick to High Contrast Neon for the route itself as it's visibly distinct from gray.

                layerGroup.addLayer(L.polyline(pathCoords, {
                    color: "#00E0C6", // Bright turquoise
                    weight: 8,
                    opacity: 1,
                    renderer: myRenderer,
                    lineCap: "round",
                    lineJoin: "round"
                }));
            }
        }

        // Draw Selected Stations (Overlays)
        // ... (unchanged logic)
        const drawHighlightMarker = (name: string, type: 'start' | 'end' | 'path') => {
            const s = stations.find(st => st.name === name);
            if (!s) return;

            const color = type === 'start' ? "#3b82f6" : (type === 'end' ? "#ef4444" : "#00ffcc");
            const radius = type === 'path' ? 5 : 8; // Start/End bigger

            // Add tooltip for Start/End even if zoomed out
            const marker = L.circleMarker([s.lat, s.lng], {
                radius: radius,
                color: "#000",
                fillColor: color,
                fillOpacity: 1,
                weight: 3,
                renderer: myRenderer
            }).addTo(layerGroup);

            if (type !== 'path') {
                marker.bindTooltip(name, {
                    permanent: true,
                    className: "station-label font-bold text-lg z-50",
                    direction: "top",
                    offset: [0, -12]
                });
            }
        };

        if (startStation) drawHighlightMarker(startStation, 'start');
        if (endStation) drawHighlightMarker(endStation, 'end');
    }, [startStation, endStation, pathResult, stations]);


    // 3. Dynamic Layer: Trains (DOM Markers with Caching)
    // We use a ref to cache markers: Map<trainId, L.Marker>
    const trainMarkersRef = useRef<Map<string, L.Marker>>(new Map());

    useEffect(() => {
        if (!dynamicLayerRef.current) return;
        const layerGroup = dynamicLayerRef.current;

        const currentMarkers = trainMarkersRef.current;
        const activeTrainIds = new Set(trains.map(t => t.id));
        const isRouteActive = !!pathResult;

        // 1. Update or Create Markers
        if (zoomLevel >= 11) {
            trains.forEach(train => {
                // Optimization: Filter out trains if route active and train line is not relevant
                if (isRouteActive) {
                    // Check if train.lineId is in activeRouteLineIds
                    // Note: activeRouteLineIds is a ref, so correct current value is available
                    if (!activeRouteLineIds.current.has(train.lineId)) {
                        // Skip this train (it's effectively "removed" from view)
                        return;
                    }
                }

                let marker = currentMarkers.get(train.id);

                if (!marker) {
                    // Create New Marker
                    const line = SUBWAY_LINES.find(l => l.id === train.lineId);
                    const color = line?.color || "#000";

                    // Simple Train SVG (No drop shadow per request)
                    const svgIcon = `
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6V17H20V6C20 6 20 4 12 4C4 4 4 6 4 6ZM4 17V19H20V17M6 10H9V13H6V10ZM15 10H18V13H15V10ZM6 19L5 21H7L8 19H16L17 21H19L18 19" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                    `;

                    const icon = L.divIcon({
                        className: 'train-marker-container',
                        html: `<div class="train-marker">${svgIcon}</div>`,
                        iconSize: [24, 24],
                        iconAnchor: [12, 12]
                    });

                    marker = L.marker([train.lat, train.lng], {
                        icon: icon,
                        interactive: false
                    });

                    marker.bindTooltip(`${train.lineName} (${train.headingTo})`, {
                        direction: 'top',
                        offset: [0, -10],
                        className: 'train-label',
                        permanent: false
                    });

                    marker.addTo(layerGroup);
                    currentMarkers.set(train.id, marker);
                } else {
                    marker.setLatLng([train.lat, train.lng]);

                    // Force update visibility if it was hidden?
                    // Markers are removed if not in loop, so if it WAS hidden, it's not in the map.
                    // If it IS in the map but shouldn't be, removing key is handled in step 2.
                    if (!layerGroup.hasLayer(marker)) {
                        marker.addTo(layerGroup);
                    }

                    const tooltip = marker.getTooltip();
                    if (tooltip) {
                        tooltip.setContent(`${train.lineName} (${train.headingTo})`);
                    }
                }
            });
        }

        // 2. Remove Stale Markers (Trains that disappeared OR filtered out)
        currentMarkers.forEach((marker, id) => {
            const train = trains.find(t => t.id === id);

            let shouldRemove = false;
            if (!train) shouldRemove = true; // Train gone
            else if (zoomLevel < 11) shouldRemove = true; // Zoom out
            else if (isRouteActive && train && !activeRouteLineIds.current.has(train.lineId)) shouldRemove = true; // Filtered out

            if (shouldRemove) {
                marker.remove();
                currentMarkers.delete(id);
            }
        });

    }, [trains, zoomLevel, pathResult]); // Added pathResult dependency

    return null;
}

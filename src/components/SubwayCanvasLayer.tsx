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

        // Iterate segments to find the connecting line
        for (let i = 0; i < pathResult.path.length - 1; i++) {
            const s1Name = pathResult.path[i];
            const s2Name = pathResult.path[i + 1];

            const s1 = stations.find(s => s.name === s1Name);
            const s2 = stations.find(s => s.name === s2Name);

            if (s1 && s2) {
                // Find common line(s)
                const commonLines = s1.lines.filter(l => s2.lines.includes(l));

                commonLines.forEach(lName => {
                    // CRITICAL FIX: Add ALL IDs matching this name (e.g. "2호선" -> Inner & Outer)
                    const matchingLines = SUBWAY_LINES.filter(l => l.name === lName);
                    matchingLines.forEach(l => ids.add(l.id));
                });
            }
        }
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

        // Draw Path Segments with Original Colors
        if (pathResult && pathResult.path.length > 1) {
            for (let i = 0; i < pathResult.path.length - 1; i++) {
                const s1Name = pathResult.path[i];
                const s2Name = pathResult.path[i + 1];

                const s1 = stations.find(s => s.name === s1Name);
                const s2 = stations.find(s => s.name === s2Name);

                if (s1 && s2) {
                    // Identify the Line Color for this segment
                    const commonLineNames = s1.lines.filter(l => s2.lines.includes(l));
                    let segmentColor = "#00E0C6"; // Fallback

                    if (commonLineNames.length > 0) {
                        // Prefer the first common line
                        const lineConfig = SUBWAY_LINES.find(l => l.name === commonLineNames[0]);
                        if (lineConfig) segmentColor = lineConfig.color;
                    } else {
                        // Transfer Walk or Transfer Edge
                        segmentColor = "#6b7280"; // Neutral gray for transfers
                    }

                    layerGroup.addLayer(L.polyline([[s1.lat, s1.lng], [s2.lat, s2.lng]], {
                        color: segmentColor,
                        weight: 8,
                        opacity: 1,
                        renderer: myRenderer,
                        lineCap: "round",
                        lineJoin: "round"
                    }));
                }
            }
        }

        // Draw Selected Stations (Overlays)
        // ... (unchanged logic)
        // Draw Selected Stations & INFO LABELS
        const drawPathStationInfo = (name: string, index: number) => {
            const s = stations.find(st => st.name === name);
            if (!s) return;

            const isStart = index === 0;
            const isEnd = index === (pathResult?.path.length || 0) - 1;
            const isTransfer = s.lines.length > 1;

            // Determining Marker Style
            let color = "#000"; // stroke
            let fillColor = "#fff";

            if (isStart) {
                color = "#16a34a"; // Green-600
                fillColor = "#22c55e"; // Green-500
            } else if (isEnd) {
                color = "#dc2626"; // Red-600
                fillColor = "#ef4444"; // Red-500
            } else {
                // Intermediate: Use Line Color for stroke, White for fill (Existing style)
                const primaryLine = SUBWAY_LINES.find(l => l.name === s.lines[0]);
                color = primaryLine?.color || "#888";
                fillColor = "#fff";
            }

            const radius = (isStart || isEnd) ? 7 : 5;
            const weight = (isStart || isEnd) ? 2 : 3;

            // 1. The Marker
            layerGroup.addLayer(L.circleMarker([s.lat, s.lng], {
                radius: radius,
                color: (isStart || isEnd) ? "#fff" : color, // White border for Start/End? No, standard is Stroke=Color.
                // Re-read: "Start Green, End Red". Usually implies Solid Fill.
                // Let's stick to what I planned: Green Fill, Dark Green Stroke.
                color: (isStart || isEnd) ? "#fff" : color, // Actually white stroke looks good on colored fill
                fillColor: fillColor,
                fillOpacity: 1,
                weight: weight,
                color: (isStart || isEnd) ? "#14532d" : color, // Dark stroke for start/end
                renderer: myRenderer
            }));

            // 2. The Detailed Label
            const now = new Date();
            const arrivalTime = new Date(now.getTime() + index * 2 * 60000);
            const timeStr = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            // Info Content - White Rounded, No Shadow
            const timeInfo = `<div class="bg-white rounded-xl px-2 py-0.5 mt-1 border border-gray-300 text-xs font-extrabold text-black whitespace-nowrap leading-none">${timeStr}</div>`;

            const transferInfo = isTransfer && !isStart && !isEnd
                ? `<div class="bg-white rounded-xl px-2 py-0.5 mt-0.5 border border-gray-300 text-xs font-extrabold text-black whitespace-nowrap leading-none">환승 5-1</div>`
                : "";

            // Name Style: Simple, dark text. "Existing style"
            const nameHtml = `<span class="text-black font-bold text-sm leading-none" style="-webkit-text-stroke: 1px white; paint-order: stroke fill;">${name}</span>`;

            // HTML Content
            const labelHtml = `
                <div class="flex flex-col items-center leading-tight">
                    ${nameHtml}
                    ${timeInfo}
                    ${transferInfo}
                </div>
            `;

            const labelIcon = L.divIcon({
                className: 'bg-transparent',
                html: labelHtml,
                iconSize: [100, 60],
                iconAnchor: [50, -8] // Position nicely above
            });

            layerGroup.addLayer(L.marker([s.lat, s.lng], {
                icon: labelIcon,
                interactive: false,
                zIndexOffset: 1000
            }));
        };

        if (pathResult) {
            pathResult.path.forEach((name, idx) => drawPathStationInfo(name, idx));
        }
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

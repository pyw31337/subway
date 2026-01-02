"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
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
    const layerGroupRef = useRef<L.LayerGroup | null>(null);

    // Initialize Canvas Renderer
    useEffect(() => {
        // Create a canvas renderer
        const myRenderer = L.canvas({ padding: 0.5 });
        layerGroupRef.current = L.layerGroup().addTo(map);

        return () => {
            if (layerGroupRef.current) {
                layerGroupRef.current.remove();
            }
        };
    }, [map]);

    // Redraw whenever relevant props change
    useEffect(() => {
        if (!layerGroupRef.current) return;
        const layerGroup = layerGroupRef.current;

        // Clear existing layers
        layerGroup.clearLayers();

        // 1. Draw Lines (Polylines)
        // If pathResult exists, we dim regular lines.
        SUBWAY_LINES.forEach((line) => {
            const latlngs = line.stations.map(s => [s.lat, s.lng] as [number, number]);

            const isDimmed = !!pathResult;
            const polyline = L.polyline(latlngs, {
                color: line.color,
                weight: 4,
                opacity: isDimmed ? 0.3 : 0.85,
                lineCap: "round",
                lineJoin: "round",
                renderer: L.canvas({ padding: 0.5 }), // Use canvas renderer
            });

            layerGroup.addLayer(polyline);
        });

        // 2. Draw Path Highlight (if exists)
        if (pathResult) {
            const pathCoords = pathResult.path.map((name) => {
                const s = stations.find((st) => st.name === name);
                return s ? [s.lat, s.lng] as [number, number] : null;
            }).filter((c): c is [number, number] => c !== null);

            if (pathCoords.length > 0) {
                // Black border
                const highlightBorder = L.polyline(pathCoords, {
                    color: "#000",
                    weight: 8,
                    opacity: 0.5,
                    lineCap: "round",
                    lineJoin: "round",
                    renderer: L.canvas({ padding: 0.5 }),
                });
                layerGroup.addLayer(highlightBorder);

                // Neon Line
                const highlightLine = L.polyline(pathCoords, {
                    color: "#00ffcc",
                    weight: 5,
                    opacity: 1,
                    lineCap: "round",
                    lineJoin: "round",
                    renderer: L.canvas({ padding: 0.5 }),
                });
                layerGroup.addLayer(highlightLine);
            }
        }

        // 3. Draw Stations (CircleMarkers)
        // Optimization: Use a single loop

        // Define styles based on zoom
        const isZoomOut = zoomLevel < 12;
        const zoomThreshold = 13;

        stations.forEach((station) => {
            const primaryLine = SUBWAY_LINES.find(l => l.name === station.lines[0]);
            const color = primaryLine?.color || "#888";
            const isTransfer = station.lines.length > 1;

            const isSelected = startStation === station.name || endStation === station.name;
            const isInPath = pathResult?.path.includes(station.name);

            // Style calculation
            let radius = isZoomOut ? (isTransfer ? 5 : 3) : (isTransfer ? 7 : 5);
            let weight = isZoomOut ? (isTransfer ? 2 : 1) : (isTransfer ? 3.5 : 3);
            let fillColor = "#fff";
            let borderColor = color; // default

            if (isSelected) {
                radius = 10;
                weight = 4;
                borderColor = "#000";
                fillColor = startStation === station.name ? "#3b82f6" : "#ef4444";
            } else if (pathResult && !isInPath) {
                // Dimmed
                borderColor = "#ddd";
            }

            const marker = L.circleMarker([station.lat, station.lng], {
                radius: radius,
                color: borderColor,
                fillColor: fillColor,
                fillOpacity: 1,
                weight: weight,
                renderer: L.canvas({ padding: 0.5 }),
                bubblingMouseEvents: false
            });

            // Bind interactions
            marker.on('click', () => {
                onStationClick(station.name);
            });

            // Tooltips

            const showTooltip = zoomLevel >= zoomThreshold || isSelected;

            if (showTooltip) {
                marker.bindTooltip(station.name, {
                    permanent: true,
                    direction: "top",
                    offset: [0, -8],
                    className: "station-label", // We can use CSS to hide if needed, but here we conditionally bind
                });
            } else {
                // If interactive (hover) tooltips are desired for zoomed out view:
                // marker.bindTooltip(station.name); // Default is hover
            }

            layerGroup.addLayer(marker);
        });

        // 4. Draw Trains
        // Only draw trains if not zoomed out too much (optional performance tweak)
        // And don't draw if path is active (to reduce noise?) -> Optional
        if (zoomLevel >= 11) {
            trains.forEach(train => {
                const line = SUBWAY_LINES.find(l => l.id === train.lineId);
                const color = line?.color || "#000";

                // Train marker
                const trainMarker = L.circleMarker([train.lat, train.lng], {
                    radius: 6,
                    color: "#fff",
                    weight: 2,
                    fillColor: color, // Line color for the train
                    fillOpacity: 1,
                    renderer: L.canvas({ padding: 0.5 }),
                    bubblingMouseEvents: false
                });

                // Tooltip for train
                // Show destination info
                if (zoomLevel >= 13) {
                    trainMarker.bindTooltip(`${train.lineName} (${train.headingTo}행)`, {
                        direction: 'top',
                        offset: [0, -6],
                        className: 'train-label'
                    });
                }

                layerGroup.addLayer(trainMarker);
            });
        }

    }, [
        map,
        stations,
        zoomLevel,
        startStation,
        endStation,
        pathResult,
        onStationClick,
        trains
    ]);

    return null;
}

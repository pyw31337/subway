"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from 'leaflet';
import { SUBWAY_LINES, Station } from "@/data/subway-lines";
import { Train } from "@/hooks/useRealtimeTrains";
import { getCatmullRomControlPoints, getPointOnCubicBezier, getTangentAngleOnCubicBezier } from "@/utils/bezier";

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

    // Curve Lookup Map: "StationA|StationB" -> [CP1, CP2]
    const curveMapRef = useRef<Map<string, [L.Point, L.Point]>>(new Map());

    // 0. Pre-calculate Curves (Catmull-Rom to Cubic Bezier)
    useEffect(() => {
        const curveMap = new Map<string, [L.Point, L.Point]>();

        SUBWAY_LINES.forEach((line) => {
            const stations = line.stations;
            for (let i = 0; i < stations.length - 1; i++) {
                const p0 = stations[Math.max(0, i - 1)];
                const p1 = stations[i];
                const p2 = stations[i + 1];
                const p3 = stations[Math.min(stations.length - 1, i + 2)];

                // We use Lat/Lng directly as x/y for the math. 
                const pt0 = { x: p0.lat, y: p0.lng };
                const pt1 = { x: p1.lat, y: p1.lng };
                const pt2 = { x: p2.lat, y: p2.lng };
                const pt3 = { x: p3.lat, y: p3.lng };

                const [cp1, cp2] = getCatmullRomControlPoints(pt0, pt1, pt2, pt3, 0.5);

                curveMap.set(`${p1.name}|${p2.name}`, [
                    new L.Point(cp1.x, cp1.y),
                    new L.Point(cp2.x, cp2.y)
                ]);
            }
        });
        curveMapRef.current = curveMap;
    }, [stations]);

    // 1. Static Layer: Draw Lines & Stations
    // Only redraw if ZOOM changes (for marker size) or Theme changes
    // Assuming 'stations' prop remains stable reference ideally, or check length
    useEffect(() => {
        if (!staticLayerRef.current) return;
        const layerGroup = staticLayerRef.current;
        layerGroup.clearLayers();

        // Canvas renderer for performance
        const myRenderer = L.canvas({ padding: 0.5 });

        // Draw Bezier Lines
        SUBWAY_LINES.forEach((line) => {
            const pathPoints: [number, number][] = [];

            for (let i = 0; i < line.stations.length - 1; i++) {
                const s1 = line.stations[i];
                const s2 = line.stations[i + 1];
                const key = `${s1.name}|${s2.name}`;
                const cps = curveMapRef.current.get(key);

                if (cps) {
                    const [cp1, cp2] = cps;
                    // Refine curve into segments
                    const SEGMENTS = 15; // Smoothness
                    for (let j = 0; j <= SEGMENTS; j++) {
                        const t = j / SEGMENTS;
                        // Cubic Bezier interpolation in LatLng space
                        const pt = getPointOnCubicBezier(
                            { x: s1.lat, y: s1.lng },
                            { x: cp1.x, y: cp1.y },
                            { x: cp2.x, y: cp2.y },
                            { x: s2.lat, y: s2.lng },
                            t
                        );
                        pathPoints.push([pt.x, pt.y]);
                    }
                } else {
                    // Fallback to straight line
                    pathPoints.push([s1.lat, s1.lng]);
                    pathPoints.push([s2.lat, s2.lng]);
                }
            }

            const polyline = L.polyline(pathPoints, {
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

        // Draw Path Line with Curves
        if (pathResult) {
            const refinedPath: [number, number][] = [];

            for (let i = 0; i < pathResult.path.length - 1; i++) {
                const sname1 = pathResult.path[i];
                const sname2 = pathResult.path[i + 1];

                const s1 = stations.find(s => s.name === sname1);
                const s2 = stations.find(s => s.name === sname2);

                if (s1 && s2) {
                    let cps = curveMapRef.current.get(`${sname1}|${sname2}`);
                    let isReverse = false;

                    if (!cps) {
                        cps = curveMapRef.current.get(`${sname2}|${sname1}`);
                        isReverse = true;
                    }

                    if (cps) {
                        const [cp1, cp2] = cps;
                        const SEGMENTS = 15;
                        for (let j = 0; j <= SEGMENTS; j++) {
                            // If Reverse (B->A), we iterate j=0..1. 
                            // Curve is A->B. P1=A, P2=B.
                            // We want to generate points from B to A.
                            // So t should go from 1 to 0.
                            const t = isReverse ? 1 - (j / SEGMENTS) : j / SEGMENTS;

                            const pt = getPointOnCubicBezier(
                                { x: s1.lat, y: s1.lng }, // Line Start (P1)
                                { x: cp1.x, y: cp1.y },
                                { x: cp2.x, y: cp2.y },
                                { x: s2.lat, y: s2.lng }, // Line End (P2)
                                t
                            );
                            refinedPath.push([pt.x, pt.y]);
                        }
                    } else {
                        refinedPath.push([s1.lat, s1.lng]);
                        refinedPath.push([s2.lat, s2.lng]);
                    }
                }
            }

            if (refinedPath.length > 0) {
                // Neon Glow
                layerGroup.addLayer(L.polyline(refinedPath, {
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
                    // Visual: SVG Icon for better consistency and styling
                    const line = SUBWAY_LINES.find(l => l.id === train.lineId);
                    const color = line?.color || "#000";

                    // Simple Train SVG
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

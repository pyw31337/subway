"use client";

import { useState, useEffect, useMemo } from "react";
import MapBackground from "@/components/MapBackground";
import Logo from "@/components/Logo";
import { SUBWAY_LINES, Station } from "@/data/subway-lines";
import { useRealtimeTrains } from "@/hooks/useRealtimeTrains";
import { findShortestPath, PathResult } from "@/utils/pathfinding";

export default function Home() {
    // 1. Stations Data (Flattened)
    const stations = useMemo(() => {
        const stationMap = new Map<string, Station>();
        SUBWAY_LINES.forEach(line => {
            line.stations.forEach(s => {
                // Merge stations if they appear in multiple lines (usually they do for transfers)
                // In this data structure, Station objects are unique per line logic but we need a unified list?
                // Actually MapBackground expects Station array.
                // Let's just pass all stations. Dupes might exist if not deduplicated.
                // Ideally dedupe by name for the map pins.
                if (!stationMap.has(s.name)) {
                    stationMap.set(s.name, s);
                } else {
                    // Update lines array if needed (already handled in data?)
                    const existing = stationMap.get(s.name)!;
                    // Merge lines
                    const mergedLines = Array.from(new Set([...existing.lines, ...s.lines]));
                    existing.lines = mergedLines;
                }
            });
        });
        return Array.from(stationMap.values());
    }, []);

    // 2. State
    const [startStation, setStartStation] = useState<string | null>(null);
    const [endStation, setEndStation] = useState<string | null>(null);
    const [pathResult, setPathResult] = useState<PathResult | null>(null);

    // 3. Trains Hook
    // We need to fetch trains for ALL lines.
    const trains = useRealtimeTrains();

    // 4. Pathfinding Effect
    useEffect(() => {
        if (startStation && endStation) {
            const result = findShortestPath(startStation, endStation);
            setPathResult(result);
        } else {
            setPathResult(null);
        }
    }, [startStation, endStation]);

    return (
        <main className="relative w-full h-screen overflow-hidden">
            <MapBackground
                stations={stations}
                trains={trains}
                startStation={startStation}
                endStation={endStation}
                pathResult={pathResult}
                setStartStation={setStartStation}
                setEndStation={setEndStation}
                isDarkMode={false}
            />
            <Logo />
        </main>
    );
}

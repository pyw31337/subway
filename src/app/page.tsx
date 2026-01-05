"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import MapBackground from "@/components/MapBackground";
import Logo from "@/components/Logo";
import { PathResult } from "@/utils/pathfinding";

// Import RoutePlanner dynamically to match previous behavior, 
// though regular import is likely fine given the 'use client' directive in RoutePlanner.
const RoutePlanner = dynamic(
    () => import("@/components/RoutePlanner"),
    { ssr: false }
);

export default function Home() {
    // State lifted from MapBackground
    const [pathResult, setPathResult] = useState<PathResult | null>(null);
    const [startStation, setStartStation] = useState<string | null>(null);
    const [endStation, setEndStation] = useState<string | null>(null);

    const handlePathFound = (result: PathResult | null) => {
        setPathResult(result);
        if (result && result.path.length > 0) {
            setStartStation(result.path[0]);
            setEndStation(result.path[result.path.length - 1]);
        } else {
            setStartStation(null);
            setEndStation(null);
        }
    };

    return (
        <main className="relative w-full h-screen overflow-hidden">
            {/* Map Layer (Background) */}
            <MapBackground
                pathResult={pathResult}
                startStation={startStation}
                endStation={endStation}
            />

            {/* UI Layer (Foreground) */}
            {/* Z-index 5000 is defined in RoutePlanner for the panels, 
                but basic sibling order here helps too. */}
            <RoutePlanner onPathFound={handlePathFound} />

            {/* Logo Layer */}
            <Logo />
        </main>
    );
}

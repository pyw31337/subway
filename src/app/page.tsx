"use client";

import { useState } from "react";
import ArrivalBoard from "@/components/features/ArrivalBoard";
import NavigationCard from "@/components/features/NavigationCard";
import LocationCard from "@/components/features/LocationCard";
import BackgroundMap from "@/components/features/BackgroundMap";

export default function Home() {
  const [currentStation, setCurrentStation] = useState("강남");

  // Handler for Location Update from GPS
  const handleLocationUpdate = (stationName: string) => {
    setCurrentStation(stationName);
  };

  return (
    <main className="relative w-full h-full min-h-screen overflow-hidden text-white font-sans selection:bg-cyan-500/30">

      {/* 1. Full Screen Map Background (Z-0) */}
      <BackgroundMap />

      {/* 2. Floating UI Layer (Z-20) */}
      {/* Positioned at bottom (Mobile) or Top-Left (PC) */}
      <div className="absolute inset-x-0 bottom-0 top-0 z-20 pointer-events-none flex flex-col justify-end sm:justify-start sm:pt-6">
        {/* Content Wrapper */}
        <div className="w-full max-w-md mx-auto px-4 pb-6 sm:pb-0 pointer-events-auto h-auto max-h-[85vh] overflow-y-auto custom-scrollbar">

          {/* Header / Title */}
          <div className="text-center mb-4 sm:mb-6 drop-shadow-md">
            <h1 className="text-3xl font-black tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
              SUBWAY <span className="text-cyan-400">NAV</span>
            </h1>
          </div>

          {/* Cards */}
          <LocationCard
            onSelectStation={setCurrentStation}
            onLocationUpdate={handleLocationUpdate}
          />

          <NavigationCard currentStation={currentStation} />

          {/* Arrival Board */}
          <ArrivalBoard station={currentStation} />

        </div>
      </div>
    </main>
  );
}

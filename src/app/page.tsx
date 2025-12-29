"use client";

import { useState } from "react";
import ArrivalBoard from "@/components/features/ArrivalBoard";
import NavigationCard from "@/components/features/NavigationCard";
import LocationCard from "@/components/features/LocationCard"; // We'll keep this for GPS logic but maybe hide UI?
import BackgroundMap from "@/components/features/BackgroundMap";
import BottomSearch from "@/components/features/BottomSearch";

export default function Home() {
  const [currentStation, setCurrentStation] = useState("강남"); // Default
  const [navRoute, setNavRoute] = useState<{ start: string, end: string } | null>(null);

  // Handler for Location Update from GPS (via hidden LocationCard or Hook)
  // We can just use LocationCard as a logic provider if we hide it?
  // Or better, let's just render LocationCard hidden or integrated?
  // Use LocationCard for the "GPS Button" logic?
  // Ideally we rewrite the hook usage here, but time constraint.
  // Let's keep LocationCard visible for now? 
  // User said: "Start input allows editing, but defaults to current location".
  // BottomSearch has an input. 
  // We pass `currentStation` to BottomSearch.

  const handleSearch = (start: string, end: string) => {
    setNavRoute({ start, end });
  };

  return (
    <main className="relative w-full h-full min-h-screen overflow-hidden text-gray-800 font-sans selection:bg-cyan-500/30 bg-gray-100">

      {/* 1. Full Screen Map (Z-0) */}
      <BackgroundMap />

      {/* 2. Top Area: Title & Arrival Board (Z-10) */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 pointer-events-none flex justify-between items-start">
        {/* Title */}
        <div className="drop-shadow-sm pointer-events-auto">
          <h1 className="text-4xl font-black tracking-tighter italic text-gray-900">
            SUBWAY <span className="text-cyan-600">NAV</span>
          </h1>
          <p className="text-xs text-gray-500 font-bold mt-1">SEOUL METRO LIVE</p>
        </div>

        {/* Arrival Board (Floating Top Right) */}
        {/* Show only if no active navigation? Or always? */}
        <div className="pointer-events-auto w-80 hidden sm:block">
          <ArrivalBoard station={currentStation} />
        </div>
      </div>

      {/* 3. Center/Result Area */}
      {/* If Navigation Active, show Card */}
      {navRoute && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-white/10 backdrop-blur-[2px]">
          <div className="w-full max-w-lg px-4 pointer-events-auto">
            {/* We pass props to NavCard to Force Guide Mode */}
            {/* We need to modify NavCard to accept props first, for now let's mount it and hope. 
                       Actually, NavCard requires refactoring to accept 'start'/'end' via props.
                       For this step, I'll pass them as 'defaultStart' etc if possible?
                       Wait, NavCard currently takes `currentStation`.
                       I will rely on `currentStation` = `navRoute.start`.
                       But I need to set destination.
                   */}
            <NavigationCard
              currentStation={navRoute.start}
              initialDestination={navRoute.end} // Need to add this prop to NavCard
              onClose={() => setNavRoute(null)} // Need add this
            />
          </div>
        </div>
      )}

      {/* 4. Bottom Search Bar (Z-30) */}
      <div className="absolute bottom-10 left-0 right-0 z-30 px-6 flex justify-center pointer-events-auto">
        <BottomSearch
          startStation={currentStation}
          onStartChange={setCurrentStation}
          onSearch={handleSearch}
        />
      </div>

      {/* Hidden Location Logic Provider */}
      <div className="hidden">
        <LocationCard onSelectStation={setCurrentStation} onLocationUpdate={setCurrentStation} />
      </div>

    </main>
  );
}

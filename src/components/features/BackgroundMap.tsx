"use client";

import { useEffect, useState, useRef } from "react";
import useGeolocation from "@/hooks/useGeolocation";
import { motion } from "framer-motion";

// Declare global kakao object
declare global {
    interface Window {
        kakao: any;
    }
}

export default function BackgroundMap() {
    const { coordinates } = useGeolocation();
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapInstance, setMapInstance] = useState<any>(null);
    const [debugStatus, setDebugStatus] = useState<string>("Initializing...");

    useEffect(() => {
        // Initialize Map
        const initMap = () => {
            if (window.kakao && window.kakao.maps && mapRef.current) {
                try {
                    const centerLat = coordinates ? coordinates.lat : 37.498095; // Default: Gangnam
                    const centerLng = coordinates ? coordinates.lng : 127.027610;

                    const options = {
                        center: new window.kakao.maps.LatLng(centerLat, centerLng),
                        level: 3 // Zoom level
                    };
                    const map = new window.kakao.maps.Map(mapRef.current, options);
                    setMapInstance(map);
                    setDebugStatus("Map Rendered Successfully");
                } catch (e) {
                    setDebugStatus(`Map Error: ${(e as any).message}`);
                    console.error("Kakao Map Init Error:", e);
                }
            } else {
                setDebugStatus("Kakao Object Missing");
            }
        };

        // If Kakao SDK is already loaded
        if (window.kakao && window.kakao.maps) {
            initMap();
        } else {
            setDebugStatus("Waiting for Script...");
            // Wait for script onLoad if needed, or retry
            // Since we use strategy="beforeInteractive", it should be ready, but just in case
            const timer = setInterval(() => {
                if (window.kakao && window.kakao.maps) {
                    initMap();
                    clearInterval(timer);
                }
            }, 500);

            // Timeout check
            setTimeout(() => {
                if (!window.kakao) {
                    setDebugStatus("Timeout: Kakao Script Failed to Load. Check API Key/Domain.");
                    clearInterval(timer);
                }
            }, 5000); // 5 sec timeout

            return () => clearInterval(timer);
        }
    }, [coordinates]); // Re-init if coordinates change initially (optional, or rely on panTo below)

    // Update center when coordinates change
    useEffect(() => {
        if (mapInstance && coordinates) {
            const moveLatLon = new window.kakao.maps.LatLng(coordinates.lat, coordinates.lng);
            mapInstance.panTo(moveLatLon);
        }
    }, [coordinates, mapInstance]);

    return (
        <div className="fixed inset-0 z-0">
            <div ref={mapRef} className="absolute inset-0 w-full h-full" />

            {/* Optional Overlay to dim map slightly if needed */}
            <div className="absolute inset-0 bg-white/30 pointer-events-none" />

            {/* Info badge */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm z-10 flex flex-col items-start">
                <span className="text-xs text-gray-500 font-medium">
                    🚇 서울 지하철 실시간 정보 (Kakao Map)
                </span>
                <span className="text-[10px] text-red-500 font-bold">
                    Debug: {debugStatus}
                </span>
            </div>
        </div>
    );
}

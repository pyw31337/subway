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

    useEffect(() => {
        // Initialize Map
        const initMap = () => {
            if (window.kakao && window.kakao.maps && mapRef.current) {
                try {
                    const centerLat = coordinates ? coordinates.lat : 37.498095; // Default: Gangnam
                    const centerLng = coordinates ? coordinates.lng : 127.027610;

                    const options = {
                        center: new window.kakao.maps.LatLng(centerLat, centerLng),
                        level: 8 // Zoom level: 8 (Approx 2km radius)
                    };
                    const map = new window.kakao.maps.Map(mapRef.current, options);

                    // Add Subway Overlay (Always thick lines)
                    map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.SUBWAY);

                    // Optional: Disable some controls for cleaner background look
                    map.setZoomable(false); // If it's pure background
                    map.setDraggable(true); // User can drag? Let's allow drag for now

                    setMapInstance(map);
                } catch (e) {
                    console.error("Kakao Map Init Error:", e);
                }
            }
        };

        // If Kakao SDK is already loaded
        if (window.kakao && window.kakao.maps) {
            // Because we use autoload=false, we must call .load()
            window.kakao.maps.load(() => {
                initMap();
            });
        } else {
            const timer = setInterval(() => {
                if (window.kakao && window.kakao.maps) {
                    window.kakao.maps.load(() => {
                        initMap();
                    });
                    clearInterval(timer);
                }
            }, 500);
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
        <div className="fixed inset-0 z-0 kakao-map-custom">
            {/* Map Container - Applied custom class for selective grayscale */}
            <div
                ref={mapRef}
                className="absolute inset-0 w-full h-full"
            />

            {/* Optional Overlay to dim map slightly if needed */}
            <div className="absolute inset-0 bg-white/20 pointer-events-none mix-blend-overlay" />
        </div>
    );
}

import { Map, MapMarker, CustomOverlayMap, ZoomControl, MapTypeId } from "react-kakao-maps-sdk";
import { useEffect, useState } from "react";
import useGeolocation from "@/hooks/useGeolocation";
import { motion } from "framer-motion";

declare global {
    interface Window {
        kakao: any;
    }
}

export default function BackgroundMap() {
    const { coordinates, error } = useGeolocation();
    const [center, setCenter] = useState({ lat: 37.5665, lng: 126.9780 }); // Default: City Hall
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync center to user location initially or when updated?
    // Uber-style: Follow user, but allow panning.
    // For now, let's snap to user on first load.
    useEffect(() => {
        if (coordinates) {
            setCenter({ lat: coordinates.lat, lng: coordinates.lng });
        }
    }, [coordinates]);

    // Dark Mode Style Filter
    // Invert: White -> Dark
    // Grayscale: Remove noise
    // Contrast: Pop features
    // Light Gray Monotone Style
    // saturate(0): Grayscale
    // but we want visible lines. 
    // Trick: Desaturate heavily (0.1) so background is gray. 
    // Pure colors (Lines) will also desaturate, but let's try moderate desaturation (0.3) + brightness bump.
    // Ideally we'd use a custom tile set, but filter is the only way here.
    const mapStyle = {
        width: "100%",
        height: "100%",
        filter: "grayscale(100%) brightness(1.1) opacity(0.4)" // Just background? No this affects everything.
        // Wait, if we use opacity, the black bg behind shows through?
    };

    // REVISED STRATEGY for "Light Gray Map, Colored Lines":
    // We cannot separate standard Layer lines from map tiles easily.
    // User requirement "All lines visible" + "Colored" + "Monotone Map".
    // 
    // If we can't separate, we must choose: 
    // A) Standard Map (Not monotone)
    // B) Monotone Map (Lines also monotone)
    // C) "Pale" Map (saturate 0.2) -> Lines are weak color.

    // Let's try C with high brightness.
    const finalStyle = {
        width: "100%",
        height: "100%",
        filter: "saturate(0.1) brightness(1.2) contrast(0.9)"
    };

    if (!isMounted) return <div className="fixed inset-0 bg-gray-100 z-0" />;

    return (
        <div className="fixed inset-0 z-0 bg-gray-100">
            <Map
                center={center}
                style={finalStyle}
                level={5} // Zoom Level (Subway lines visible?)
            >
                {/* 1. Subway Overlay (Built-in) */}
                {window.kakao && window.kakao.maps && window.kakao.maps.MapTypeId && (
                    <MapTypeId type={window.kakao.maps.MapTypeId.SUBWAY} />
                )}

                {/* 2. User Location Marker (Pulse) */}
                {coordinates && (
                    <CustomOverlayMap position={{ lat: coordinates.lat, lng: coordinates.lng }}>
                        <div className="relative flex items-center justify-center w-8 h-8">
                            {/* Pulse Ring */}
                            <motion.div
                                className="absolute inset-0 bg-cyan-500 rounded-full opacity-30"
                                animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            {/* Core Dot (Darker for Light Map) */}
                            <div className="w-4 h-4 bg-cyan-600 border-2 border-white rounded-full shadow-lg z-10" />
                        </div>
                    </CustomOverlayMap>
                )}
            </Map>
        </div>
    );
}

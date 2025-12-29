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
    const mapStyle = {
        width: "100%",
        height: "100%",
        filter: "grayscale(80%) invert(90%) hue-rotate(180deg) contrast(1.2) brightness(0.8)"
    };

    if (!isMounted) return <div className="fixed inset-0 bg-black z-0" />;

    return (
        <div className="fixed inset-0 z-0 bg-black">
            <Map
                center={center}
                style={mapStyle}
                level={5} // Zoom Level (Subway lines visible?)
            >
                {/* 1. Subway Overlay (Built-in) */}
                {/* Check if window.kakao exists just in case, though isMounted helps */}
                {window.kakao && window.kakao.maps && window.kakao.maps.MapTypeId && (
                    <MapTypeId type={window.kakao.maps.MapTypeId.SUBWAY} />
                )}

                {/* 2. User Location Marker (Pulse) */}
                {coordinates && (
                    <CustomOverlayMap position={{ lat: coordinates.lat, lng: coordinates.lng }}>
                        <div className="relative flex items-center justify-center w-8 h-8">
                            {/* Pulse Ring */}
                            <motion.div
                                className="absolute inset-0 bg-cyan-400 rounded-full opacity-50"
                                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            {/* Core Dot */}
                            <div className="w-4 h-4 bg-cyan-500 border-2 border-white rounded-full shadow-[0_0_10px_rgba(0,255,255,0.8)] z-10" />
                        </div>
                    </CustomOverlayMap>
                )}
            </Map>

            {/* Gradient Overlay for Text Readability at top/bottom? */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/40 via-transparent to-black/60 z-10" />
        </div>
    );
}

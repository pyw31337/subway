"use client";

import { useEffect, useState } from "react";
import useGeolocation from "@/hooks/useGeolocation";
import { motion } from "framer-motion";

// Simple fallback map component that doesn't depend on Kakao SDK
// This ensures the app works even when Kakao API fails
export default function BackgroundMap() {
    const { coordinates } = useGeolocation();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return <div className="fixed inset-0 bg-gray-100 z-0" />;

    return (
        <div className="fixed inset-0 z-0">
            {/* Stylized subway-themed background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200">
                {/* Subway line pattern */}
                <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="subway-grid" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                            <path d="M 100 0 L 0 100" stroke="#00B050" strokeWidth="2" fill="none" />
                            <path d="M 50 0 L 0 50" stroke="#0052A4" strokeWidth="1.5" fill="none" />
                            <path d="M 100 50 L 50 100" stroke="#EF7C1C" strokeWidth="1.5" fill="none" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#subway-grid)" />
                </svg>

                {/* Animated gradient orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-cyan-400/10 blur-3xl"
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 30, 0],
                        y: [0, -20, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-green-400/10 blur-3xl"
                    animate={{
                        scale: [1, 1.1, 1],
                        x: [0, -20, 0],
                        y: [0, 30, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* User location indicator */}
            {coordinates && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="relative flex items-center justify-center">
                        {/* Pulse Ring */}
                        <motion.div
                            className="absolute w-16 h-16 bg-cyan-500 rounded-full opacity-20"
                            animate={{ scale: [1, 2, 2], opacity: [0.2, 0.1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                            className="absolute w-12 h-12 bg-cyan-500 rounded-full opacity-30"
                            animate={{ scale: [1, 1.5, 1.5], opacity: [0.3, 0.15, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                        {/* Core Dot */}
                        <div className="w-6 h-6 bg-cyan-600 border-3 border-white rounded-full shadow-lg z-10" />
                    </div>
                </div>
            )}

            {/* Info badge */}
            <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-xs text-gray-500 font-medium">
                    🚇 서울 지하철 실시간 정보
                </span>
            </div>
        </div>
    );
}

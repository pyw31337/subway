"use client";
import { useEffect, useRef } from "react";

declare global {
    interface Window {
        kakao: any;
    }
}

export default function MapBackground() {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initMap = () => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    if (!mapContainer.current) return;
                    const options = {
                        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // Seoul City Hall
                        level: 7,
                    };
                    const map = new window.kakao.maps.Map(mapContainer.current, options);

                    // Disable map controls for a pure "background" feel? 
                    // The user asked for "background map", usually implies limited interaction, but "zoomable" was mentioned in previous chats.
                    // For now, I'll valid defaults.

                    // Optional: Add strict boundary checks if needed later.
                });
            } else {
                // Retry if script not yet loaded
                setTimeout(initMap, 100);
            }
        };

        initMap();
    }, []);

    return (
        <div
            ref={mapContainer}
            className="absolute inset-0 w-full h-full -z-10 filter grayscale brightness-110 contrast-75"
        // grayscale: monotone, brightness/contrast: adjustment for "light gray" feel
        />
    );
}

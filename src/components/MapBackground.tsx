"use client";
import { useEffect, useRef, memo } from "react";

declare global {
    interface Window {
        kakao: any;
    }
}

function MapBackground() {
    const mapContainer = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initMap = () => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    if (!mapContainer.current) return;
                    const options = {
                        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // Seoul City Hall
                        level: 7,
                        draggable: true,
                        scrollwheel: true,
                        disableDoubleClickZoom: false,
                    };
                    const map = new window.kakao.maps.Map(mapContainer.current, options);

                    // Explicitly enable zoom and drag just in case
                    map.setZoomable(true);
                    map.setDraggable(true);

                    // Add Subway Overlay
                    map.addOverlayMapTypeId(window.kakao.maps.MapTypeId.SUBWAY);

                    // Note: Standard map styling used to ensure subway lines are colored.
                    // Advanced styling (white background) would require custom tiles or complex CSS.
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
            className="custom-map-style absolute inset-0 w-full h-full z-0"
        // Removed grayscale filter from Tailwind classes; handling via global CSS
        />
    );
}

// Memoize to prevent unnecessary re-renders
export default memo(MapBackground);

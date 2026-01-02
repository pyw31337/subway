"use client";
import { useMapEvents } from "react-leaflet";

interface ZoomHandlerProps {
    onZoomChange: (zoom: number) => void;
}

export default function ZoomHandler({ onZoomChange }: ZoomHandlerProps) {
    const map = useMapEvents({
        zoomend: () => {
            onZoomChange(map.getZoom());
        },
    });
    return null;
}

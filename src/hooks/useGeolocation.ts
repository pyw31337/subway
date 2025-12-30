import { useState, useEffect } from "react";

interface LocationState {
    loaded: boolean;
    coordinates: { lat: number; lng: number } | null;
    error?: { code: number; message: string };
}

export default function useGeolocation() {
    const [location, setLocation] = useState<LocationState>({
        loaded: false,
        coordinates: null,
    });

    const onSuccess = (location: GeolocationPosition) => {
        setLocation({
            loaded: true,
            coordinates: {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
            },
        });
    };

    const onError = (error: GeolocationPositionError) => {
        setLocation({
            loaded: true,
            coordinates: null,
            error: {
                code: error.code,
                message: error.message,
            },
        });
    };

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            // Prevent synchronous setState in effect
            Promise.resolve().then(() => {
                onError({
                    code: 0,
                    message: "Geolocation not supported",
                    PERMISSION_DENIED: 1,
                    POSITION_UNAVAILABLE: 2,
                    TIMEOUT: 3,
                } as GeolocationPositionError);
            });
            return;
        }

        const options = {
            enableHighAccuracy: true, // Crucial for "Subway" precision
            timeout: 20000,
            maximumAge: 1000,
        };

        const watcher = navigator.geolocation.watchPosition(onSuccess, onError, options);

        return () => navigator.geolocation.clearWatch(watcher);
    }, []);

    return location;
}

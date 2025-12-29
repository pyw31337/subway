import { Station } from "./subway-data";

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export function findNearestStation(lat: number, lng: number, stations: Station[]): Station | null {
    if (!stations.length) return null;

    let minDistance = Infinity;
    let nearest: Station | null = null;

    for (const station of stations) {
        const distance = getDistanceFromLatLonInKm(lat, lng, station.lat, station.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = station;
        }
    }

    return nearest;
}

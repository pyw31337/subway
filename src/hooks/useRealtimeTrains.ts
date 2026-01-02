import { useState, useEffect } from 'react';
import { SUBWAY_LINES } from '@/data/subway-lines';

export interface Train {
    id: string;
    lineId: string;
    lineName: string;
    status: 'RUNNING' | 'STOPPED';
    lat: number;
    lng: number;
    headingTo: string; // Station name
}

// Helper to interpolate position between two stations
function interpolate(start: { lat: number, lng: number }, end: { lat: number, lng: number }, ratio: number) {
    return {
        lat: start.lat + (end.lat - start.lat) * ratio,
        lng: start.lng + (end.lng - start.lng) * ratio
    };
}

export function useRealtimeTrains() {
    const [trains, setTrains] = useState<Train[]>([]);

    useEffect(() => {
        // Init mock trains: 2 trains per line for demo
        const initialTrains: any[] = [];

        SUBWAY_LINES.forEach(line => {
            if (line.stations.length < 2) return;

            // Train 1: Early in the line
            initialTrains.push({
                id: `t-${line.id}-1`,
                lineId: line.id,
                lineName: line.name,
                stationIndex: 0,
                progress: 0, // 0 to 1 between stations
                direction: 1 // 1: forward, -1: backward (simplified)
            });

            // Train 2: Middle of the line
            initialTrains.push({
                id: `t-${line.id}-2`,
                lineId: line.id,
                lineName: line.name,
                stationIndex: Math.floor(line.stations.length / 2),
                progress: 0,
                direction: -1
            });
        });

        const activeTrains = initialTrains;

        const interval = setInterval(() => {
            // Update positions
            const updatedTrains: Train[] = activeTrains.map(t => {
                const line = SUBWAY_LINES.find(l => l.id === t.lineId)!;
                const stations = line.stations;

                // Move logic
                t.progress += 0.05; // Speed

                if (t.progress >= 1) {
                    t.progress = 0;
                    t.stationIndex += t.direction;

                    // Bounce at ends
                    if (t.stationIndex >= stations.length - 1) {
                        t.direction = -1;
                        t.stationIndex = stations.length - 1;
                    } else if (t.stationIndex <= 0) {
                        t.direction = 1;
                        t.stationIndex = 0;
                    }
                }

                const currentStation = stations[t.stationIndex];
                const nextStation = stations[t.stationIndex + t.direction] || currentStation;

                const pos = interpolate(currentStation, nextStation, t.progress);

                return {
                    id: t.id,
                    lineId: t.lineId,
                    lineName: t.lineName,
                    status: 'RUNNING',
                    lat: pos.lat,
                    lng: pos.lng,
                    headingTo: nextStation.name
                };
            });

            setTrains(updatedTrains);
        }, 1000); // 1 sec update

        return () => clearInterval(interval);
    }, []);

    return trains;
}

import { NextRequest, NextResponse } from 'next/server';
import { generateMockData } from '@/lib/mock-data';

const SEOUL_API_KEY = process.env.SEOUL_API_KEY || 'sample';
const BASE_URL = 'http://swopenAPI.seoul.go.kr/api/subway';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const stationName = searchParams.get('station');

    if (!stationName) {
        return NextResponse.json({ error: 'Station name is required' }, { status: 400 });
    }

    // Normalize: Remove '역' suffix if present (e.g., "강남역" -> "강남")
    const cleanedName = stationName.endsWith('역') ? stationName.slice(0, -1) : stationName;

    try {
        const encodedStation = encodeURIComponent(cleanedName);
        const url = `${BASE_URL}/${SEOUL_API_KEY}/json/realtimeStationArrival/0/20/${encodedStation}`;

        console.log(`Fetching: ${url}`);
        const response = await fetch(url);

        let data;

        // Handle API failure or non-JSON response gracefully
        if (!response.ok) {
            console.warn(`API Error ${response.status}, falling back to mock.`);
            data = { realtimeArrivalList: [] };
        } else {
            try {
                data = await response.json();
            } catch (e) {
                console.warn("Invalid JSON from API, falling back to mock.");
                data = { realtimeArrivalList: [] };
            }
        }

        // Check if data is empty or invalid (Seoul API "INFO-200" means no data)
        const isEmpty = !data.realtimeArrivalList || data.realtimeArrivalList.length === 0 || data.code === "INFO-200" || data.status === 500;

        if (isEmpty) {
            console.log(`No real data for ${cleanedName}, generating mock data.`);
            return NextResponse.json({
                realtimeArrivalList: generateMockData(cleanedName),
                isMock: true
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching subway data:', error);
        // Fallback to mock on crash
        return NextResponse.json({
            realtimeArrivalList: generateMockData(cleanedName),
            isMock: true
        });
    }
}

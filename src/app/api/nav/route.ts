import { NextRequest, NextResponse } from 'next/server';

const SEOUL_API_KEY = process.env.SEOUL_API_KEY || 'sample';
const BASE_URL = 'http://swopenAPI.seoul.go.kr/api/subway';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    if (!start || !end) {
        return NextResponse.json({ error: 'Start and End stations are required' }, { status: 400 });
    }

    // Clean names: Remove '역' suffix if present
    const cleanStart = start.endsWith('역') ? start.slice(0, -1) : start;
    const cleanEnd = end.endsWith('역') ? end.slice(0, -1) : end;

    try {
        const encStart = encodeURIComponent(cleanStart);
        const encEnd = encodeURIComponent(cleanEnd);
        const url = `${BASE_URL}/${SEOUL_API_KEY}/json/shortestRoute/0/5/${encStart}/${encEnd}`;

        console.log(`Fetching Route: ${url}`);
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to fetch route");
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Route API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch route' }, { status: 500 });
    }
}

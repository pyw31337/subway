import { RealtimeArrival } from "@/types";
import { MOCK_ARRIVALS } from "./mock-data";

/**
 * API Helper for GitHub Pages Compatibility
 * Since GitHub Pages is static, it cannot run Next.js API Routes (/api/...).
 * We must detect the environment and strategy:
 * 
 * 1. Localhost: Use Next.js Proxy (/api/arrival) -> Seoul API
 * 2. Production (GitHub Pages): 
 *    - Option A: Direct Fetch to Seoul API (Blocked by CORS usually)
 *    - Option B: Use Mock Data (Safe Fallback)
 * 
 * For this MVP, we will default to Mock Data on Production to ensure the app "works" visually.
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const MOCK_DELAY = 800;

export async function fetchArrivals(station: string): Promise<RealtimeArrival[]> {
    if (IS_PRODUCTION) {
        console.warn("⚠️ Production Mode: Using Mock Data (No Server Proxy)");
        // Simulate Network Delay
        await new Promise(r => setTimeout(r, MOCK_DELAY));

        // Return Mock Data based on station name if possible, or generic
        // We already have generator in mock-data.ts? 
        // Let's rely on the mock-data.ts logic if refined, or just return basic mocks.
        // For now, let's use the MOCK_ARRIVALS from mock-data.ts
        return MOCK_ARRIVALS;
    }

    // Localhost: Use Proxy
    const res = await fetch(`/api/arrival?station=${encodeURIComponent(station)}`);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return data.realtimeArrivalList || [];
}

export async function fetchNavigation(start: string, end: string): Promise<any> {
    if (IS_PRODUCTION) {
        console.warn("⚠️ Production Mode: Using Mock Navigation Data");
        await new Promise(r => setTimeout(r, MOCK_DELAY));

        // Return a mock route
        const mockRoute = {
            shtStatnNm: `${start}, ${start}입구, 중간역1, 중간역2, 환승역, ${end}`,
            shtStatnId: "1002000222,1002000223,1002000224,1002000225,1003000333,1003000334", // Fake IDs for color
            shtTravelTm: "35",
            shtTransferCnt: "1",
            shtStatnCnt: "6"
        };

        return {
            errorMessage: { code: "INFO-000" },
            shortestRouteList: [mockRoute]
        };
    }

    const res = await fetch(`/api/nav?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    if (!res.ok) throw new Error("Failed to fetch nav");
    return await res.json();
}

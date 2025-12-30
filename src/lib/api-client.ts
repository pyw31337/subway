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
        return MOCK_ARRIVALS;
    }

    // Localhost: Use Proxy
    const res = await fetch(`/api/arrival?station=${encodeURIComponent(station)}`);
    if (!res.ok) throw new Error("Failed to fetch");
    const data = await res.json();
    return data.realtimeArrivalList || [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchNavigation(start: string, end: string): Promise<any> {
    if (IS_PRODUCTION) {
        // Option A: Try Real API via CORS Proxy
        const SEOUL_KEY = process.env.NEXT_PUBLIC_SEOUL_API_KEY;
        if (SEOUL_KEY) {
            try {
                // Use allorigins.win as a CORS proxy
                // Target: http://swopenapi.seoul.go.kr/api/subway/(KEY)/json/shortestRoute/0/5/(Start)/(End)
                const targetUrl = `http://swopenapi.seoul.go.kr/api/subway/${SEOUL_KEY}/json/shortestRoute/0/5/${encodeURIComponent(start)}/${encodeURIComponent(end)}`;
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

                const res = await fetch(proxyUrl);
                if (res.ok) {
                    const data = await res.json();
                    // Basic validation
                    if (data.shortestRouteList && data.shortestRouteList.length > 0) {
                        return data;
                    }
                }
            } catch (e) {
                console.error("Proxy fetch failed, falling back to mock", e);
            }
        }

        console.warn("⚠️ Production Mode: Fallback to Mock (Key missing or Proxy failed)");
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

/**
 * Kakao Local API: Search Category (SW8 = Subway)
 * Docs: https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-category
 */
export async function fetchNearbyStationsKakao(lat: number, lng: number): Promise<string | null> {
    const KAKAO_KEY = "e18ee199818819d830c3fe479aa1ca71"; // REST API Key

    // If no key, fallback to null (caller handles fallback)
    if (!KAKAO_KEY) {
        console.warn("Kakao API Key missing. Skipping external API call.");
        return null;
    }

    try {
        const res = await fetch(
            `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=SW8&x=${lng}&y=${lat}&radius=2000&sort=distance`,
            {
                headers: {
                    Authorization: `KakaoAK ${KAKAO_KEY}`
                }
            }
        );

        if (!res.ok) {
            throw new Error(`Kakao API Error: ${res.status}`);
        }

        const data = await res.json();
        if (data.documents && data.documents.length > 0) {
            // Return the closest station name (e.g. "양평역 5호선" -> "양평")
            const placeName = data.documents[0].place_name;
            return placeName.split(" ")[0].replace("역", "");
        }
    } catch (err) {
        console.error("Failed to fetch from Kakao:", err);
    }
    return null;
}

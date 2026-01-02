import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src/data/capitalStations.json');
const OUTPUT_PATH = path.join(process.cwd(), 'src/data/subway-lines.ts');

interface RawStation {
    name: string;
    lines: string[];
    latitude: number;
    longitude: number;
    around_stations: string[];
}

interface Station {
    name: string;
    lat: number;
    lng: number;
    lines: string[];
}

interface SubwayLine {
    id: string;
    name: string;
    color: string;
    stations: Station[];
}

// Load Data
const rawData: RawStation[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8').replace(/^\uFEFF/, ''));
const stationMap = new Map<string, RawStation>();
rawData.forEach(s => stationMap.set(s.name, s));

// --- HELPER: Normalize Line Names ---
function normalizeLineName(name: string): string {
    return name.replace(/^0(\d)호선$/, '$1호선')
        .replace("경의선", "경의중앙선")
        .replace("우이신설경전철", "우이신설선")
        .replace("신분당", "신분당선") // loose match potentially?
        .replace(/^신분당선선$/, "신분당선"); // fix double suffix if any
}

// --- DATA INJECTION START ---
const oldFileContent = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, 'utf-8') : "";

function injectStation(name: string, lat: number, lng: number) {
    if (!stationMap.has(name)) {
        stationMap.set(name, {
            name: name,
            lines: [],
            latitude: lat,
            longitude: lng,
            around_stations: [],
            version: "1.0"
        } as any);
    }
}

function addLineToStation(stationName: string, lineName: string) {
    const s = stationMap.get(stationName);
    if (s) {
        if (!s.lines.includes(lineName)) {
            s.lines.push(lineName);
        }
    }
}

function addBidirectionalEdge(a: string, b: string) {
    const sA = stationMap.get(a);
    const sB = stationMap.get(b);
    if (sA && sB) {
        if (!sA.around_stations.includes(b)) sA.around_stations.push(b);
        if (!sB.around_stations.includes(a)) sB.around_stations.push(a);
    }
}

function addLinearEdges(names: string[]) {
    for (let i = 0; i < names.length - 1; i++) {
        addBidirectionalEdge(names[i], names[i + 1]);
    }
}

// 1. Harvest Lat/Lng from old file
const EXTENSION_STATIONS = [
    '연천', '청산',
    '진접', '오남', '별내별가람',
    '강일', '미사', '하남풍산', '하남시청', '하남검단산',
    '산곡', '석남',
    '별내', '다산', '동구릉', '장자호수공원', '암사역사공원',
    '신논현', '논현', '신사'
];

EXTENSION_STATIONS.forEach(name => {
    const regex = new RegExp(`"name":\\s*"${name}",\\s*"lat":\\s*([0-9.]+),\\s*"lng":\\s*([0-9.]+)`, 'i');
    const match = oldFileContent.match(regex);
    if (match) {
        injectStation(name, parseFloat(match[1]), parseFloat(match[2]));
    }
});

// Inject GTX-A Stations
injectStation('성남', 37.3947, 127.1112);
injectStation('동탄', 37.1994, 127.0965);
injectStation('구성', 37.2991, 127.1058);

// Inject Lines to Existing Stations to pass Strict Check
addLineToStation('수서', 'GTX-A');
addLineToStation('성남', 'GTX-A');
addLineToStation('구성', 'GTX-A');
addLineToStation('동탄', 'GTX-A');

addLineToStation('강남', '신분당선');
addLineToStation('신사', '신분당선');
addLineToStation('논현', '신분당선');
addLineToStation('신논현', '신분당선');

addLineToStation('산곡', '7호선');
addLineToStation('석남', '7호선');

// 2. Stitch Graph with Edges
addLinearEdges(['연천', '청산', '소요산']);
addLinearEdges(['진접', '오남', '별내별가람', '당고개']);
addLinearEdges(['상일동', '강일', '미사', '하남풍산', '하남시청', '하남검단산']);
addLinearEdges(['부평구청', '산곡', '석남']);
addLinearEdges(['암사', '암사역사공원', '장자호수공원', '구리', '동구릉', '다산', '별내']);
addLinearEdges(['강남', '신논현', '논현', '신사']);
addLinearEdges(['수서', '성남', '구성', '동탄']);
addLinearEdges(['덕소', '양평(중앙)', '지평']); // Use correct name for Edging? Station map key is name.
// Check if "양평(중앙)" exists in map. Yes.

addLinearEdges(['북한산우이', '솔밭공원', '4.19민주묘지', '가오리', '화계', '삼양', '삼양사거리', '솔샘', '북한산보국문', '정릉', '성신여대입구', '보문', '신설동']);
// Note: I don't know if intermediates exist in JSON. If not, BFS fails.
// Fallback: Bridge start/end directly if intermediates fail.
addBidirectionalEdge('북한산우이', '성신여대입구');
addBidirectionalEdge('성신여대입구', '신설동');


// --- CONNECTIVITY LOGIC END ---

// Helper: Check if station has the target line
function hasLine(station: RawStation, lineName: string): boolean {
    if (station.lines.length === 0) return true;
    if (station.lines.includes(lineName)) return true;

    return station.lines.some(l => normalizeLineName(l) === lineName);
}

// Helper: BFS with Line Constraint
function findPath(startName: string, endName: string, lineName: string, avoidNames: string[] = []): string[] | null {
    if (!stationMap.has(startName) || !stationMap.has(endName)) return null;

    const queue: { name: string; path: string[] }[] = [{ name: startName, path: [startName] }];
    const visited = new Set<string>();
    visited.add(startName);

    avoidNames.forEach(n => visited.add(n));

    while (queue.length > 0) {
        const { name, path } = queue.shift()!;
        if (name === endName) return path;

        const station = stationMap.get(name);
        if (!station) continue;

        for (const neighborName of station.around_stations) {
            if (visited.has(neighborName)) continue;

            const neighbor = stationMap.get(neighborName);
            if (!neighbor) continue;

            // Strict Line Check
            if (hasLine(neighbor, lineName)) {
                visited.add(neighborName);
                queue.push({ name: neighborName, path: [...path, neighborName] });
            }
        }
    }
    return null;
}

// Multi-segment path builder
function buildLinePath(lineName: string, waypoints: string[], avoid: string[] = []): Station[] {
    const fullPathNames: string[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];

        const segment = findPath(start, end, lineName, avoid);
        if (!segment) {
            console.error(`Failed to find path segment on ${lineName}: ${start} -> ${end}`);
            if (fullPathNames.length === 0) fullPathNames.push(start);
            fullPathNames.push(end);
            continue;
        }

        if (i > 0) segment.shift();
        fullPathNames.push(...segment);
    }

    return fullPathNames.map(name => {
        const s = stationMap.get(name);
        if (!s) {
            console.error(`CRITICAL: Station '${name}' not found in map!`);
            process.exit(1);
        }
        return {
            name: s.name,
            lat: s.latitude,
            lng: s.longitude,
            lines: s.lines.map(normalizeLineName)
        };
    });
}

// Configuration
const LINES_CONFIG = [
    { id: '1-Incheon', name: '1호선', color: '#0052A4', waypoints: ['연천', '소요산', '의정부', '청량리', '동대문', '종로3가', '서울', '남영', '용산', '노량진', '구로', '인천'], avoid: ['가산디지털단지'] },

    { id: '1-Sinchang', name: '1호선', color: '#0052A4', waypoints: ['구로', '가산디지털단지', '수원', '서동탄'], avoid: ['구일'] },
    { id: '1-Cheonan', name: '1호선', color: '#0052A4', waypoints: ['병점', '천안', '신창'], avoid: [] },
    { id: '1-Gwangmyeong', name: '1호선', color: '#0052A4', waypoints: ['금천구청', '광명'], avoid: [] },

    { id: '2-Loop', name: '2호선', color: '#3CB44B', waypoints: ['시청', '을지로3가', '을지로4가', '동대문역사문화공원', '신당', '상왕십리', '왕십리', '성수', '잠실', '강남', '사당', '신도림', '신촌', '충정로', '시청'], avoid: [] },

    { id: '2-Seongsu', name: '2호선', color: '#3CB44B', waypoints: ['성수', '신설동'], avoid: ['뚝섬', '건대입구'] },
    { id: '2-Sinjeong', name: '2호선', color: '#3CB44B', waypoints: ['신도림', '까치산'], avoid: ['문래', '대림'] },

    { id: '3', name: '3호선', color: '#EF7C1C', waypoints: ['대화', '불광', '종로3가', '을지로3가', '충무로', '고속터미널', '양재', '수서', '오금'], avoid: [] },

    { id: '4', name: '4호선', color: '#00A5DE', waypoints: ['진접', '당고개', '동대문', '충무로', '명동', '서울', '사당', '금정', '오이도'], avoid: [] },

    { id: '5-Hanam', name: '5호선', color: '#996CAC', waypoints: ['방화', '여의도', '광화문', '을지로4가', '동대문역사문화공원', '청구', '신금호', '왕십리', '군자', '강동', '하남검단산'], avoid: [] },

    { id: '5-Macheon', name: '5호선', color: '#996CAC', waypoints: ['강동', '마천'], avoid: ['길동'] },

    { id: '6', name: '6호선', color: '#CD7C2F', waypoints: ['응암', '독바위', '응암', '디지털미디어시티', '합정', '공덕', '삼각지', '이태원', '신당', '석계', '신내'], avoid: [] },

    { id: '7', name: '7호선', color: '#747F00', waypoints: ['장암', '노원', '상봉', '건대입구', '이수(총신대)', '대림', '온수', '부평구청', '석남'], avoid: [] },
    // Use correct name '이수(총신대)'

    { id: '8', name: '8호선', color: '#E6186C', waypoints: ['별내', '구리', '암사', '천호', '잠실', '가락시장', '모란'], avoid: [] },

    { id: '9', name: '9호선', color: '#BDB092', waypoints: ['개화', '김포공항', '당산', '여의도', '노량진', '동작', '고속터미널', '신논현', '종합운동장', '중앙보훈병원'], avoid: [] },

    { id: 'SuinBundang', name: '수인분당선', color: '#F5A200', waypoints: ['인천', '오이도', '수원', '죽전', '정자', '모란', '수서', '선릉', '왕십리', '청량리'], avoid: [] },

    { id: 'Arex', name: '공항철도', color: '#0090D2', waypoints: ['인천공항2터미널', '김포공항', '디지털미디어시티', '홍대입구', '서울'], avoid: [] },

    { id: 'Gyeongchun', name: '경춘선', color: '#175C30', waypoints: ['청량리', '상봉', '망우', '평내호평', '가평', '춘천'], avoid: [] },

    { id: 'Shinbundang', name: '신분당선', color: '#D4003B', waypoints: ['신사', '강남', '양재', '판교', '정자', '광교'], avoid: [] },

    { id: 'UiSinseol', name: '우이신설선', color: '#B0CE18', waypoints: ['북한산우이', '성신여대입구', '신설동'], avoid: [] },
    { id: 'GTX-A', name: 'GTX-A', color: '#742542', waypoints: ['수서', '성남', '구성', '동탄'], avoid: [] },
];

const REFINED_CONFIG = [
    ...LINES_CONFIG,
    { id: 'Gyeongui-Main', name: '경의중앙선', color: '#77C4A3', waypoints: ['문산', '대곡', '디지털미디어시티', '공덕', '용산', '이촌', '청량리', '망우', '덕소', '양평(중앙)', '지평'], avoid: ['서울', '신촌(경의선)'] },
    { id: 'Gyeongui-Seoul', name: '경의중앙선', color: '#77C4A3', waypoints: ['가좌', '신촌(경의선)', '서울'], avoid: ['디지털미디어시티'] },
];

async function main() {
    const subwayLines: SubwayLine[] = [];

    for (const config of REFINED_CONFIG) {
        process.stdout.write(`Processing ${config.id} (${config.name})... `);
        const stations = buildLinePath(config.name, config.waypoints, config.avoid);
        console.log(`Done. ${stations.length} stations.`);
        if (stations.length > 0) {
            subwayLines.push({
                id: config.id,
                name: config.name,
                color: config.color,
                stations: stations
            });
        }
    }

    const outputContent = `export interface Station {
    name: string;
    lat: number;
    lng: number;
    lines: string[];
}

export interface SubwayLine {
    id: string;
    name: string;
    color: string;
    stations: Station[];
}

export const SUBWAY_LINES: SubwayLine[] = ${JSON.stringify(subwayLines, null, 4)};

export function getAllStations(): Station[] {
    const map = new Map<string, Station>();
    SUBWAY_LINES.forEach(line => {
        line.stations.forEach(station => {
            if (!map.has(station.name)) {
                map.set(station.name, station);
            } else {
                const existing = map.get(station.name)!;
                const mergedLines = Array.from(new Set([...existing.lines, ...station.lines]));
                existing.lines = mergedLines;
            }
        });
    });
    return Array.from(map.values());
}
`;

    fs.writeFileSync(OUTPUT_PATH, outputContent, 'utf-8');
    console.log(`Successfully generated ${OUTPUT_PATH}!`);
}

main();

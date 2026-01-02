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

// --- DATA INJECTION START ---
// We import the existing file to harvest coordinates for newer stations not in capitalStations.json
// Note: We use dynamic require/read to avoid TS issues if possible, or just parse it loosely if we can't import.
// Since we are running via ts-node, we can try to require it. 
// BUT, the file likely has "export const", so we need to handle that.
// Simpler: Read the file as text and regex extract lat/lng for missing stations.
const oldFileContent = fs.readFileSync(OUTPUT_PATH, 'utf-8');
// Regex to find station objects: { "name": "Name", "lat": 1.2, "lng": 3.4 ... }
// We only care about names we KNOW are missing or extensions.

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

// 1. Harvest Lat/Lng from old file for extensions
// We specifically look for the extensions we know about.
const EXTENSION_STATIONS = [
    '연천', '청산',
    '진접', '오남', '별내별가람',
    '강일', '미사', '하남풍산', '하남시청', '하남검단산',
    '산곡', '석남',
    '별내', '다산', '동구릉', '장자호수공원', '암사역사공원', // Line 8
    '신논현', '논현', '신사' // Shinbundang extension users
];

// Simple regex parser for specific names
EXTENSION_STATIONS.forEach(name => {
    // Regex: name": "연천",\s*"lat":\s*([0-9.]+),\s*"lng":\s*([0-9.]+)
    const regex = new RegExp(`"name":\\s*"${name}",\\s*"lat":\\s*([0-9.]+),\\s*"lng":\\s*([0-9.]+)`, 'i');
    const match = oldFileContent.match(regex);
    if (match) {
        injectStation(name, parseFloat(match[1]), parseFloat(match[2]));
    }
});

// Inject GTX-A Stations (Approximate)
injectStation('성남', 37.3947, 127.1112); // Seongnam (GTX)
injectStation('동탄', 37.1994, 127.0965); // Dongtan (GTX)

// 2. Stitch Graph with Edges
addLinearEdges(['연천', '청산', '소요산']); // Line 1
addLinearEdges(['진접', '오남', '별내별가람', '당고개']); // Line 4
addLinearEdges(['상일동', '강일', '미사', '하남풍산', '하남시청', '하남검단산']); // Line 5
addLinearEdges(['부평구청', '산곡', '석남']); // Line 7
addLinearEdges(['암사', '암사역사공원', '장자호수공원', '동구릉', '다산', '별내']); // Line 8
addLinearEdges(['강남', '신논현', '논현', '신사']); // Shinbundang (Gangnam is existing)
addLinearEdges(['수서', '성남', '구성', '동탄']); // GTX-A

// --- DATA INJECTION END ---

// Helper: Navbar line name normalization
function normalizeLineName(name: string): string {
    return name.replace(/^0(\d)호선$/, '$1호선')
        .replace("경의선", "경의중앙선");
}

// Helper: BFS to find path between two stations
function findPath(startName: string, endName: string, avoidNames: string[] = []): string[] | null {
    if (!stationMap.has(startName) || !stationMap.has(endName)) return null;

    const queue: { name: string; path: string[] }[] = [{ name: startName, path: [startName] }];
    const visited = new Set<string>();
    visited.add(startName);

    // Add avoided stations to visited so we don't go there
    avoidNames.forEach(n => visited.add(n));

    while (queue.length > 0) {
        const { name, path } = queue.shift()!;
        if (name === endName) return path;

        const station = stationMap.get(name);
        if (!station) continue;

        for (const neighborName of station.around_stations) {
            if (!visited.has(neighborName) && stationMap.has(neighborName)) {
                visited.add(neighborName);
                queue.push({ name: neighborName, path: [...path, neighborName] });
            }
        }
    }
    return null;
}

// Multi-segment path builder (A -> B -> C -> D)
function buildLinePath(waypoints: string[], avoid: string[] = []): Station[] {
    const fullPathNames: string[] = [];

    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];

        const segment = findPath(start, end, avoid);
        if (!segment) {
            console.error(`Failed to find path segment: ${start} -> ${end}`);
            if (fullPathNames.length === 0) fullPathNames.push(start);
            fullPathNames.push(end);
            continue;
        }

        if (i > 0) {
            segment.shift();
        }
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

// Configuration for Subway Lines
const LINES_CONFIG = [
    { id: '1-Incheon', name: '1호선', color: '#0052A4', waypoints: ['연천', '소요산', '의정부', '청량리', '서울', '용산', '구로', '인천'], avoid: ['가산디지털단지'] },
    { id: '1-Sinchang', name: '1호선', color: '#0052A4', waypoints: ['구로', '수원', '서동탄'], avoid: ['구일'] },
    { id: '1-Cheonan', name: '1호선', color: '#0052A4', waypoints: ['병점', '천안', '신창'], avoid: [] },
    { id: '1-Gwangmyeong', name: '1호선', color: '#0052A4', waypoints: ['금천구청', '광명'], avoid: [] },

    { id: '2-Loop', name: '2호선', color: '#3CB44B', waypoints: ['시청', '을지로3가', '왕십리', '성수', '잠실', '강남', '사당', '신도림', '신촌', '충정로', '시청'], avoid: ['용답', '도림천'] },
    { id: '2-Seongsu', name: '2호선', color: '#3CB44B', waypoints: ['성수', '신설동'], avoid: ['뚝섬', '건대입구'] },
    { id: '2-Sinjeong', name: '2호선', color: '#3CB44B', waypoints: ['신도림', '까치산'], avoid: ['문래', '대림'] },

    { id: '3', name: '3호선', color: '#EF7C1C', waypoints: ['대화', '불광', '종로3가', '충무로', '고속터미널', '양재', '수서', '오금'], avoid: [] },

    { id: '4', name: '4호선', color: '#00A5DE', waypoints: ['진접', '당고개', '동대문', '서울', '사당', '금정', '오이도'], avoid: [] },

    { id: '5-Hanam', name: '5호선', color: '#996CAC', waypoints: ['방화', '여의도', '광화문', '왕십리', '군자', '강동', '하남검단산'], avoid: ['둔촌동'] },
    { id: '5-Macheon', name: '5호선', color: '#996CAC', waypoints: ['강동', '둔촌동', '마천'], avoid: ['길동'] },

    { id: '6', name: '6호선', color: '#CD7C2F', waypoints: ['응암', '독바위', '응암', '디지털미디어시티', '합정', '공덕', '삼각지', '이태원', '신당', '석계', '신내'], avoid: [] },

    { id: '7', name: '7호선', color: '#747F00', waypoints: ['장암', '노원', '상봉', '건대입구', '고속터미널', '대림', '온수', '부평구청', '석남'], avoid: [] },

    { id: '8', name: '8호선', color: '#E6186C', waypoints: ['별내', '구리', '암사', '천호', '잠실', '가락시장', '복정', '모란'], avoid: [] },

    { id: '9', name: '9호선', color: '#BDB092', waypoints: ['개화', '김포공항', '당산', '여의도', '노량진', '동작', '고속터미널', '신논현', '종합운동장', '중앙보훈병원'], avoid: [] },

    { id: 'SuinBundang', name: '수인분당선', color: '#F5A200', waypoints: ['인천', '오이도', '수원', '죽전', '정자', '모란', '수서', '선릉', '왕십리', '청량리'], avoid: [] },

    { id: 'Arex', name: '공항철도', color: '#0090D2', waypoints: ['인천공항2터미널', '김포공항', '디지털미디어시티', '홍대입구', '서울'], avoid: [] },

    { id: 'Gyeongchun', name: '경춘선', color: '#175C30', waypoints: ['청량리', '상봉', '망우', '평내호평', '가평', '춘천'], avoid: [] },

    { id: 'Shinbundang', name: '신분당선', color: '#D4003B', waypoints: ['신사', '강남', '양재', '판교', '정자', '광교'], avoid: [] },

    { id: 'UiSinseol', name: '우이신설선', color: '#B0CE18', waypoints: ['북한산우이', '성신여대입구', '신설동'], avoid: [] },
    // { id: 'Sillim', name: '신림선', color: '#6789CA', waypoints: ['샛강', '대방', '보라매', '신림', '관악산'], avoid: [] },
    { id: 'GTX-A', name: 'GTX-A', color: '#742542', waypoints: ['수서', '성남', '구성', '동탄'], avoid: [] },
];

const REFINED_CONFIG = [
    ...LINES_CONFIG,
    { id: 'Gyeongui-Main', name: '경의중앙선', color: '#77C4A3', waypoints: ['문산', '대곡', '디지털미디어시티', '공덕', '용산', '이촌', '청량리', '망우', '덕소', '양평', '지평'], avoid: ['서울', '신촌(경의선)'] },
    { id: 'Gyeongui-Seoul', name: '경의중앙선', color: '#77C4A3', waypoints: ['가좌', '신촌(경의선)', '서울'], avoid: ['디지털미디어시티'] },
];

async function main() {
    const subwayLines: SubwayLine[] = [];

    for (const config of REFINED_CONFIG) {
        console.log(`Processing ${config.id} (${config.name})...`);
        const stations = buildLinePath(config.waypoints, config.avoid);
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
    console.log(`Successfully generated ${OUTPUT_PATH} with ${subwayLines.length} lines.`);
}

main();

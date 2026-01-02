import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(__dirname, '../src/data/capitalStations.json');
const OUTPUT_PATH = path.join(__dirname, '../src/data/subway-lines.ts');

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

const LINE_MAPPING: Record<string, { id: string; name: string; color: string }> = {
    "01호선": { id: "1", name: "1호선", color: "#0052A4" },
    "02호선": { id: "2", name: "2호선", color: "#3CB44B" },
    "03호선": { id: "3", name: "3호선", color: "#EF7C1C" },
    "04호선": { id: "4", name: "4호선", color: "#00A5DE" },
    "05호선": { id: "5", name: "5호선", color: "#996CAC" },
    "06호선": { id: "6", name: "6호선", color: "#CD7C2F" },
    "07호선": { id: "7", name: "7호선", color: "#747F00" },
    "08호선": { id: "8", name: "8호선", color: "#E6186C" },
    "09호선": { id: "9", name: "9호선", color: "#BDB092" },
    "신분당선": { id: "신분당", name: "신분당선", color: "#D4003B" },
    // "경의선": { id: "K", name: "경의중앙선", color: "#77C4A3" },
    // "중앙선": { id: "K", name: "경의중앙선", color: "#77C4A3" },
    // "공항철도": { id: "A", name: "공항철도", color: "#0090D2" },
};

function processData() {
    const jsonContent = fs.readFileSync(DATA_PATH, 'utf-8').replace(/^\uFEFF/, '');
    const rawData: RawStation[] = JSON.parse(jsonContent);
    const finalLines: SubwayLine[] = [];

    // Group stations by our target lines
    const stationsByLineId: Record<string, RawStation[]> = {};

    rawData.forEach(station => {
        station.lines.forEach(lineName => {
            const mapped = LINE_MAPPING[lineName];
            if (mapped) {
                if (!stationsByLineId[mapped.id]) {
                    stationsByLineId[mapped.id] = [];
                }
                stationsByLineId[mapped.id].push(station);
            }
        });
    });

    // Special handling for Line 1 branching (keeping it simple for now: distinct sets if possible, or just one big list sorted smartly?)
    // The current app separates Line 1 into Main, Incheon, Gwangmyeong.
    // Replicating that exactly from just raw adjacency is hard without a preset list.
    // For this update, I will try to sort them as best as possible. 
    // If the graph is branched, a simple sort might jump around.

    // STRATEGY: 
    // 1. Build a graph for the line.
    // 2. Find the longest path (Main line).
    // 3. Identify branches.
    // OR: Just produce one single line object for each ID, but if it has branches, maybe we can keep them in one list for now?
    // No, if I put branches in one list [A, B, C, D, B, E], the drawing code might draw a line from D -> B -> E. That is actually correct for visual connectivity!
    // As long as the list order represents a valid traversal or set of traversals.
    // Ideally: [Start ... BranchPoint ... End1, BranchPoint ... End2]
    // SVG Polyline: If we have jump, we need <path> with M command.
    // current map implementation likely draws a polyline of the `stations` array.
    // If the array is [A, B, C, B, D], it draws A-B-C-B-D. This retraces B-C-B which is fine, or A-B-C, then B-D.
    // So a Depth First Traversal (DFS) from a terminal node should work to cover the tree.

    Object.keys(stationsByLineId).forEach(lineId => {
        const lineStations = stationsByLineId[lineId];
        const lineInfo = Object.values(LINE_MAPPING).find(l => l.id === lineId)!;

        // Build adjacency map for this specific line
        const adjacency = new Map<string, string[]>(); // Name -> Neighbors (on this line)
        const stationMap = new Map<string, RawStation>();

        lineStations.forEach(s => {
            stationMap.set(s.name, s);
            const lineNeighbors = s.around_stations.filter(n => lineStations.some(ls => ls.name === n));
            adjacency.set(s.name, lineNeighbors);
        });

        // DFS Traversal to order stations
        // 1. Find a start node (degree 1 usually, or just any for loops)
        // For Line 2 (Loop), any node is fine.
        // For Line 1 (Tree), a leaf node is best.

        const visited = new Set<string>();
        const orderedStations: Station[] = [];

        // Find leaves (degree 1)
        let startNodeName = lineStations[0].name;
        const leaves = lineStations.filter(s => {
            const neighbors = adjacency.get(s.name) || [];
            return neighbors.length === 1;
        });

        if (leaves.length > 0) {
            // Pick a specific start if known (e.g. Soyosan for Line 1)
            const preferredStarts = ["소요산", "방화", "응암", "장암", "암사", "개화", "신사"]; // heuristic
            const bestStart = leaves.find(l => preferredStarts.includes(l.name));
            startNodeName = bestStart ? bestStart.name : leaves[0].name;
        }

        // DFS
        function dfs(currentName: string) {
            visited.add(currentName);
            const raw = stationMap.get(currentName)!;

            // Map our line IDs to the station's lines list (convert "01호선" -> "1")
            const stationLines = raw.lines
                .map(l => LINE_MAPPING[l]?.id)
                .filter(Boolean) as string[];

            orderedStations.push({
                name: raw.name,
                lat: raw.latitude,
                lng: raw.longitude,
                lines: stationLines
            });

            const neighbors = adjacency.get(currentName) || [];
            neighbors.forEach(n => {
                if (!visited.has(n)) {
                    dfs(n);
                    // For branches: after finishing a branch, we effectively "return" to the node.
                    // If we want the line to be continuous in drawing A-B-C-B-D:
                    // We should add 'currentName' again if we are going to visit another child?
                    // The current renderer probably just connects points in order.
                    // If we do A -> B -> C (end), then we backtrace.
                    // If we want the line to appear connected, we might need to re-add the parent 
                    // only if there are more children to visit.
                }
            });

            // Backtracking logic for visual continuity:
            // If we are at a junction and just returned from a child, 
            // and we have more unvisited children, we should add 'current' again 
            // so the line draws back to the junction before going to the next branch.
            // BUT: The recursion structure above visits a child fully, then comes back here.
            // We need to inject 'current' into the list between children visits.
        }

        // Modified DFS for visual continuity
        function continuityDfs(currentName: string) {
            visited.add(currentName);
            const raw = stationMap.get(currentName)!;
            // Simplified lines mapping
            const stationLines = raw.lines.map(l => LINE_MAPPING[l]?.id || l).filter(id => Object.values(LINE_MAPPING).some(m => m.id === id));


            const addToOutput = () => {
                orderedStations.push({
                    name: raw.name,
                    lat: raw.latitude,
                    lng: raw.longitude,
                    lines: stationLines
                });
            };

            addToOutput();

            const neighbors = adjacency.get(currentName) || [];
            const unvisitedNeighbors = neighbors.filter(n => !visited.has(n));

            for (let i = 0; i < unvisitedNeighbors.length; i++) {
                continuityDfs(unvisitedNeighbors[i]);
                // If there are more neighbors to visit after this one, we must come back to current
                if (i < unvisitedNeighbors.length - 1) {
                    addToOutput();
                }
            }
        }

        continuityDfs(startNodeName);

        // Handle disconnected components? (e.g. if graph is broken in data)
        // Check if any stations missed
        const missed = lineStations.filter(s => !visited.has(s.name));
        if (missed.length > 0) {
            console.warn(`Line ${lineId} has disconnected stations: ${missed.map(s => s.name).join(', ')}`);
            // Start DFS from the first missed one
            missed.forEach(s => {
                if (!visited.has(s.name)) {
                    // Add a null or break? Or just jump?
                    // Just adding it will draw a straight line from last point, which is ugly but better than missing.
                    continuityDfs(s.name);
                }
            });
        }

        finalLines.push({
            id: lineId,
            name: lineInfo.name,
            color: lineInfo.color,
            stations: orderedStations
        });
    });

    // Generate File Content
    const fileContent = `// Seoul Metropolitan Subway Complete Station Data
// Generated by scripts/update-subway-data.ts

export interface Station {
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

export const SUBWAY_LINES: SubwayLine[] = ${JSON.stringify(finalLines, null, 4)};

// Get all unique stations (for markers)
export const getAllStations = (): Station[] => {
    const stationMap = new Map<string, Station>();
    SUBWAY_LINES.forEach((line) => {
        line.stations.forEach((station) => {
            // Use lat/lng as key to deduplicate identical locations (transfers)
            const key = \`\${station.lat.toFixed(4)}-\${station.lng.toFixed(4)}\`;
            if (!stationMap.has(key)) {
                stationMap.set(key, { ...station });
            } else {
                const existing = stationMap.get(key)!;
                existing.lines = [...new Set([...existing.lines, ...station.lines])];
            }
        });
    });
    return Array.from(stationMap.values());
};
`;

    fs.writeFileSync(OUTPUT_PATH, fileContent);
    console.log(`Successfully wrote updated subway data to ${OUTPUT_PATH}`);
}

processData();

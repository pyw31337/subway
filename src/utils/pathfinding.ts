import { SUBWAY_LINES, Station } from "@/data/subway-lines";

// Interface for graph node
interface GraphNode {
    id: string; // Station name (unique enough? assuming unique names or formatted)
    connections: { nodeId: string; weight: number; lineId: string }[];
}

// Helper to build graph from subway lines
export const buildGraph = (): Map<string, GraphNode> => {
    const graph = new Map<string, GraphNode>();

    // Helper to get or create node
    const getOrCreateNode = (name: string): GraphNode => {
        if (!graph.has(name)) {
            graph.set(name, { id: name, connections: [] });
        }
        return graph.get(name)!;
    };

    SUBWAY_LINES.forEach((line) => {
        const stations = line.stations;
        for (let i = 0; i < stations.length; i++) {
            const current = stations[i];
            const currentNode = getOrCreateNode(current.name);

            // Connect to next station
            if (i < stations.length - 1) {
                const next = stations[i + 1];
                const nextNode = getOrCreateNode(next.name);

                // Add edge (undirected)
                // Weight is roughly 2 minutes per station for now
                // Ideally use actual distance, but simple graph is fine.
                currentNode.connections.push({ nodeId: next.name, weight: 2, lineId: line.id });
                nextNode.connections.push({ nodeId: current.name, weight: 2, lineId: line.id });
            }
        }
    });

    return graph;
};

export interface PathResult {
    path: string[]; // List of station names
    totalWeight: number;
    transferCount: number;
}

export const findShortestPath = (startName: string, endName: string): PathResult | null => {
    const graph = buildGraph();

    // Priority Queue implementation (simplified as simple array sort)
    const pq: { nodeId: string; weight: number; path: string[]; lines: string[] }[] = [];
    const visited = new Set<string>();

    pq.push({ nodeId: startName, weight: 0, path: [startName], lines: [] });

    while (pq.length > 0) {
        // Sort by weight (min-heap simulation)
        pq.sort((a, b) => a.weight - b.weight);
        const { nodeId, weight, path, lines } = pq.shift()!;

        if (nodeId === endName) {
            // Calculate transfers
            let transfers = 0;
            for (let i = 0; i < lines.length - 1; i++) {
                if (lines[i] !== lines[i + 1]) transfers++;
            }
            return { path, totalWeight: weight, transferCount: transfers };
        }

        if (visited.has(nodeId)) continue;
        visited.add(nodeId);

        const node = graph.get(nodeId);
        if (!node) continue;

        for (const conn of node.connections) {
            if (!visited.has(conn.nodeId)) {
                // Transfer penalty logic could be added here to weight
                // For now, raw shortest path
                pq.push({
                    nodeId: conn.nodeId,
                    weight: weight + conn.weight,
                    path: [...path, conn.nodeId],
                    lines: [...lines, conn.lineId]
                });
            }
        }
    }

    return null;
};

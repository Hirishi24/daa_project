export interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
}

export interface GraphState {
  nodes: Node[];
  edges: Edge[];
  directed: boolean;
}

export interface VisualizerStep {
  currentNodeId: string | null;
  visitedNodeIds: string[];
  relaxedEdgeIds: string[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  queueState: { id: string; val: number }[]; // For Dijkstra Priority Queue
  iteration: number;                          // For Bellman-Ford
  explanation: string;
  activeLine: number;                         // Highlight code line
}

export interface AlgorithmStats {
  shortestPath: string[];
  totalDistance: number;
  visitedNodesCount: number;
  executionTimeMs: number;
  relaxationsCount: number;
  hasNegativeCycle: boolean;
}

export interface ComparisonStats {
  dijkstra: AlgorithmStats & { operations: number };
  bellmanFord: AlgorithmStats & { operations: number };
  winner: 'dijkstra' | 'bellman-ford' | 'tie' | null;
}

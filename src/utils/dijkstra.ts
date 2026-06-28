import type { Node, Edge, VisualizerStep, AlgorithmStats } from '../types/graph';

// Min Heap implementation for Priority Queue
export class MinHeap {
  private heap: { id: string; val: number }[] = [];

  constructor() {}

  public insert(id: string, val: number) {
    this.heap.push({ id, val });
    this.bubbleUp(this.heap.length - 1);
  }

  public extractMin(): { id: string; val: number } | null {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const end = this.heap.pop();
    if (this.heap.length > 0 && end) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return min;
  }

  public decreaseKey(id: string, newVal: number) {
    const idx = this.heap.findIndex(item => item.id === id);
    if (idx !== -1) {
      this.heap[idx].val = newVal;
      this.bubbleUp(idx);
    } else {
      this.insert(id, newVal);
    }
  }

  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  public toArray() {
    return [...this.heap].sort((a, b) => a.val - b.val);
  }

  private bubbleUp(idx: number) {
    const element = this.heap[idx];
    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      const parent = this.heap[parentIdx];
      if (element.val >= parent.val) break;
      this.heap[parentIdx] = element;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
  }

  private sinkDown(idx: number) {
    const length = this.heap.length;
    const element = this.heap[idx];
    while (true) {
      const leftChildIdx = 2 * idx + 1;
      const rightChildIdx = 2 * idx + 2;
      let leftChild, rightChild;
      let swap = null;

      if (leftChildIdx < length) {
        leftChild = this.heap[leftChildIdx];
        if (leftChild.val < element.val) {
          swap = leftChildIdx;
        }
      }

      if (rightChildIdx < length) {
        rightChild = this.heap[rightChildIdx];
        if (
          (swap === null && rightChild.val < element.val) ||
          (swap !== null && leftChild && rightChild.val < leftChild.val)
        ) {
          swap = rightChildIdx;
        }
      }

      if (swap === null) break;
      this.heap[idx] = this.heap[swap];
      this.heap[swap] = element;
      idx = swap;
    }
  }
}

export function runDijkstra(
  nodes: Node[],
  edges: Edge[],
  sourceId: string,
  targetId: string,
  directed: boolean
): { steps: VisualizerStep[]; stats: AlgorithmStats } {
  const steps: VisualizerStep[] = [];
  const startTime = performance.now();

  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const visitedNodeIds = new Set<string>();
  const heap = new MinHeap();

  let operationsCount = 0;
  let relaxationsCount = 0;

  // Step 1: Initializing
  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  distances[sourceId] = 0;
  heap.insert(sourceId, 0);

  steps.push({
    currentNodeId: null,
    visitedNodeIds: [],
    relaxedEdgeIds: [],
    distances: { ...distances },
    previous: { ...previous },
    queueState: heap.toArray(),
    iteration: 0,
    explanation: `Initialized distances: set ${nodes.find(n => n.id === sourceId)?.label || sourceId} to 0, all other nodes to ∞. Added source to priority queue.`,
    activeLine: 1, // Line number matching pseudocode: initialization
  });

  const hasNegativeWeights = edges.some(e => e.weight < 0);

  while (!heap.isEmpty()) {
    operationsCount++;
    const minNode = heap.extractMin();
    if (!minNode) break;

    const u = minNode.id;
    const uNodeName = nodes.find(n => n.id === u)?.label || u;

    // If we've already settled this node, skip
    if (visitedNodeIds.has(u)) {
      continue;
    }

    // Set as current node
    steps.push({
      currentNodeId: u,
      visitedNodeIds: Array.from(visitedNodeIds),
      relaxedEdgeIds: [],
      distances: { ...distances },
      previous: { ...previous },
      queueState: heap.toArray(),
      iteration: 0,
      explanation: `Extracted node ${uNodeName} with current shortest distance ${distances[u]} from the priority queue.`,
      activeLine: 9,
    });

    visitedNodeIds.add(u);

    // Get neighbors of u
    const outgoingEdges = edges.filter(e => {
      if (directed) {
        return e.source === u;
      } else {
        return e.source === u || e.target === u;
      }
    });

    for (const edge of outgoingEdges) {
      operationsCount++;
      const v = edge.source === u ? edge.target : edge.source;
      if (visitedNodeIds.has(v)) continue;

      const vNodeName = nodes.find(n => n.id === v)?.label || v;
      const weight = edge.weight;
      const alt = distances[u] + weight;

      // Animate edge lookup/relaxation attempt
      steps.push({
        currentNodeId: u,
        visitedNodeIds: Array.from(visitedNodeIds),
        relaxedEdgeIds: [edge.id],
        distances: { ...distances },
        previous: { ...previous },
        queueState: heap.toArray(),
        iteration: 0,
        explanation: `Checking edge from ${uNodeName} to ${vNodeName} (weight: ${weight}). Calculated alternative distance: ${distances[u]} + ${weight} = ${alt}.`,
        activeLine: 12,
      });

      if (alt < distances[v]) {
        relaxationsCount++;
        distances[v] = alt;
        previous[v] = u;
        heap.decreaseKey(v, alt);

        steps.push({
          currentNodeId: u,
          visitedNodeIds: Array.from(visitedNodeIds),
          relaxedEdgeIds: [edge.id],
          distances: { ...distances },
          previous: { ...previous },
          queueState: heap.toArray(),
          iteration: 0,
          explanation: `Relaxation successful! Found a shorter path to ${vNodeName}: new distance is ${alt}. Updated parent pointer and priority queue.`,
          activeLine: 13,
        });
      } else {
        steps.push({
          currentNodeId: u,
          visitedNodeIds: Array.from(visitedNodeIds),
          relaxedEdgeIds: [edge.id],
          distances: { ...distances },
          previous: { ...previous },
          queueState: heap.toArray(),
          iteration: 0,
          explanation: `No relaxation. Calculated distance (${alt}) is not shorter than existing distance (${distances[v]}).`,
          activeLine: 12,
        });
      }
    }

    // Node is fully processed
    steps.push({
      currentNodeId: null,
      visitedNodeIds: Array.from(visitedNodeIds),
      relaxedEdgeIds: [],
      distances: { ...distances },
      previous: { ...previous },
      queueState: heap.toArray(),
      iteration: 0,
      explanation: `Finished exploring all outgoing edges of node ${uNodeName}. It is now fully settled.`,
      activeLine: 8,
    });

    // Shortest path found early optimization if u === targetId
    if (u === targetId) {
      steps.push({
        currentNodeId: null,
        visitedNodeIds: Array.from(visitedNodeIds),
        relaxedEdgeIds: [],
        distances: { ...distances },
        previous: { ...previous },
        queueState: heap.toArray(),
        iteration: 0,
        explanation: `Target node ${nodes.find(n => n.id === targetId)?.label || targetId} reached. Ending search.`,
        activeLine: 8,
      });
      break;
    }
  }

  // Construct shortest path
  const path: string[] = [];
  let curr: string | null = targetId;
  if (distances[targetId] !== Infinity) {
    while (curr !== null) {
      path.unshift(curr);
      curr = previous[curr];
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  // If there are negative weights, warn the user
  const warnText = hasNegativeWeights
    ? ' WARNING: Graph contains negative weight edges. Dijkstra might yield incorrect results since it assumes non-negative edges.'
    : '';

  steps.push({
    currentNodeId: null,
    visitedNodeIds: Array.from(visitedNodeIds),
    relaxedEdgeIds: [],
    distances: { ...distances },
    previous: { ...previous },
    queueState: [],
    iteration: 0,
    explanation: path.length > 0
      ? `Algorithm finished! Shortest path to ${nodes.find(n => n.id === targetId)?.label || targetId} is found with total distance ${distances[targetId]}.${warnText}`
      : `Algorithm finished. Destination node is unreachable from the source.${warnText}`,
    activeLine: 17, // End of function
  });

  return {
    steps,
    stats: {
      shortestPath: path,
      totalDistance: distances[targetId] === Infinity ? -1 : distances[targetId],
      visitedNodesCount: visitedNodeIds.size,
      executionTimeMs,
      relaxationsCount,
      hasNegativeCycle: false,
    },
  };
}

export const DIJKSTRA_PSEUDOCODE = [
  'function Dijkstra(Graph, source):',
  '  let dist be a map of vertex distances, initialized to ∞',
  '  let prev be a map of parent nodes, initialized to null',
  '  dist[source] = 0',
  '  let PQ be a Min-Priority Queue, inserting source with priority 0',
  '  while PQ is not empty:',
  '    u = PQ.extractMin()',
  '    for each neighbor v of u:',
  '      alt = dist[u] + weight(u, v)',
  '      if alt < dist[v]:',
  '        dist[v] = alt',
  '        prev[v] = u',
  '        PQ.decreaseKey(v, alt)',
  '  return dist, prev'
];

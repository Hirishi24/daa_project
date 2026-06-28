import type { Node, Edge, VisualizerStep, AlgorithmStats } from '../types/graph';

export function runBellmanFord(
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

  let operationsCount = 0;
  let relaxationsCount = 0;
  let hasNegativeCycle = false;

  // Step 1: Initializing
  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
  });
  distances[sourceId] = 0;
  visitedNodeIds.add(sourceId);

  steps.push({
    currentNodeId: null,
    visitedNodeIds: Array.from(visitedNodeIds),
    relaxedEdgeIds: [],
    distances: { ...distances },
    previous: { ...previous },
    queueState: [],
    iteration: 0,
    explanation: `Initialized distances: set ${nodes.find(n => n.id === sourceId)?.label || sourceId} to 0, all other nodes to ∞.`,
    activeLine: 1,
  });

  const numVertices = nodes.length;

  // Step 2: Relax edges repeatedly V-1 times
  for (let i = 1; i <= numVertices - 1; i++) {
    let relaxedInThisIteration = false;

    steps.push({
      currentNodeId: null,
      visitedNodeIds: Array.from(visitedNodeIds),
      relaxedEdgeIds: [],
      distances: { ...distances },
      previous: { ...previous },
      queueState: [],
      iteration: i,
      explanation: `Starting iteration ${i} of ${numVertices - 1}. We will check all edges for potential relaxations.`,
      activeLine: 6,
    });

    for (const edge of edges) {
      operationsCount++;

      // In undirected graph, check both directions.
      // In directed graph, check source -> target.
      const directions = directed
        ? [{ u: edge.source, v: edge.target, edgeId: edge.id, isForward: true }]
        : [
            { u: edge.source, v: edge.target, edgeId: edge.id, isForward: true },
            { u: edge.target, v: edge.source, edgeId: edge.id, isForward: false },
          ];

      for (const dir of directions) {
        const { u, v, edgeId } = dir;
        const uNodeName = nodes.find(n => n.id === u)?.label || u;
        const vNodeName = nodes.find(n => n.id === v)?.label || v;

        // Skip if source node is unreachable
        if (distances[u] === Infinity) {
          continue;
        }

        visitedNodeIds.add(u);
        visitedNodeIds.add(v);

        const alt = distances[u] + edge.weight;

        steps.push({
          currentNodeId: u,
          visitedNodeIds: Array.from(visitedNodeIds),
          relaxedEdgeIds: [edgeId],
          distances: { ...distances },
          previous: { ...previous },
          queueState: [],
          iteration: i,
          explanation: `[Iter ${i}] Checking edge from ${uNodeName} to ${vNodeName} (weight: ${edge.weight}). Alternative distance: ${distances[u]} + ${edge.weight} = ${alt}.`,
          activeLine: 7,
        });

        if (alt < distances[v]) {
          distances[v] = alt;
          previous[v] = u;
          relaxationsCount++;
          relaxedInThisIteration = true;

          steps.push({
            currentNodeId: v,
            visitedNodeIds: Array.from(visitedNodeIds),
            relaxedEdgeIds: [edgeId],
            distances: { ...distances },
            previous: { ...previous },
            queueState: [],
            iteration: i,
            explanation: `[Iter ${i}] Relaxation successful! Found shorter path to ${vNodeName} with distance ${alt}.`,
            activeLine: 8,
          });
        }
      }
    }

    // Optimization: If no relaxations occurred in this pass, the algorithm has converged early.
    if (!relaxedInThisIteration) {
      steps.push({
        currentNodeId: null,
        visitedNodeIds: Array.from(visitedNodeIds),
        relaxedEdgeIds: [],
        distances: { ...distances },
        previous: { ...previous },
        queueState: [],
        iteration: i,
        explanation: `No edges relaxed in iteration ${i}. The shortest paths have converged early. Skipping remaining iterations.`,
        activeLine: 6,
      });
      break;
    }
  }

  // Step 3: Check for negative-weight cycles
  steps.push({
    currentNodeId: null,
    visitedNodeIds: Array.from(visitedNodeIds),
    relaxedEdgeIds: [],
    distances: { ...distances },
    previous: { ...previous },
    queueState: [],
    iteration: numVertices,
    explanation: 'Performing final pass over edges to check for negative-weight cycles.',
    activeLine: 11,
  });

  for (const edge of edges) {
    operationsCount++;
    const directions = directed
      ? [{ u: edge.source, v: edge.target, edgeId: edge.id }]
      : [
          { u: edge.source, v: edge.target, edgeId: edge.id },
          { u: edge.target, v: edge.source, edgeId: edge.id },
        ];

    for (const dir of directions) {
      const { u, v, edgeId } = dir;
      if (distances[u] !== Infinity && distances[u] + edge.weight < distances[v]) {
        hasNegativeCycle = true;
        const uName = nodes.find(n => n.id === u)?.label || u;
        const vName = nodes.find(n => n.id === v)?.label || v;

        steps.push({
          currentNodeId: u,
          visitedNodeIds: Array.from(visitedNodeIds),
          relaxedEdgeIds: [edgeId],
          distances: { ...distances },
          previous: { ...previous },
          queueState: [],
          iteration: numVertices,
          explanation: `Negative-weight cycle detected! Edge from ${uName} to ${vName} can be relaxed indefinitely (${distances[u]} + ${edge.weight} < ${distances[v]}).`,
          activeLine: 12,
        });
        break;
      }
    }
    if (hasNegativeCycle) break;
  }

  // Construct shortest path
  const path: string[] = [];
  let curr: string | null = targetId;
  if (!hasNegativeCycle && distances[targetId] !== Infinity) {
    while (curr !== null) {
      path.unshift(curr);
      curr = previous[curr];
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(3));

  steps.push({
    currentNodeId: null,
    visitedNodeIds: Array.from(visitedNodeIds),
    relaxedEdgeIds: [],
    distances: { ...distances },
    previous: { ...previous },
    queueState: [],
    iteration: numVertices,
    explanation: hasNegativeCycle
      ? 'Algorithm finished. Graph contains a negative-weight cycle reachable from the source. Shortest path is undefined.'
      : path.length > 0
      ? `Algorithm finished! Shortest path to ${nodes.find(n => n.id === targetId)?.label || targetId} is found with total distance ${distances[targetId]}.`
      : 'Algorithm finished. Destination node is unreachable from source.',
    activeLine: 14,
  });

  return {
    steps,
    stats: {
      shortestPath: path,
      totalDistance: distances[targetId] === Infinity || hasNegativeCycle ? -1 : distances[targetId],
      visitedNodesCount: visitedNodeIds.size,
      executionTimeMs,
      relaxationsCount,
      hasNegativeCycle,
    },
  };
}

export const BELLMAN_FORD_PSEUDOCODE = [
  'function BellmanFord(Graph, source):',
  '  let dist be a map of vertex distances, initialized to ∞',
  '  let prev be a map of parent nodes, initialized to null',
  '  dist[source] = 0',
  '  repeat |V| - 1 times:',
  '    for each edge (u, v) in Graph.Edges:',
  '      if dist[u] + weight(u, v) < dist[v]:',
  '        dist[v] = dist[u] + weight(u, v)',
  '        prev[v] = u',
  '  for each edge (u, v) in Graph.Edges:',
  '    if dist[u] + weight(u, v) < dist[v]:',
  '      error "Graph contains a negative-weight cycle"',
  '  return dist, prev'
];

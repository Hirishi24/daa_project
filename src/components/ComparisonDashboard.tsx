import React from 'react';
import type { AlgorithmStats, Node } from '../types/graph';
import { Trophy, Zap, AlertTriangle, Cpu, CheckCircle } from 'lucide-react';

interface ComparisonDashboardProps {
  nodes: Node[];
  dijkstraStats: AlgorithmStats | null;
  bellmanFordStats: AlgorithmStats | null;
  hasNegativeWeights: boolean;
}

export const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({
  nodes,
  dijkstraStats,
  bellmanFordStats,
  hasNegativeWeights,
}) => {
  if (!dijkstraStats || !bellmanFordStats) {
    return (
      <div className="w-full glass p-8 rounded-3xl border border-white/20 dark:border-slate-800/60 shadow-xl flex flex-col items-center justify-center text-center">
        <Cpu size={32} className="text-slate-400 dark:text-slate-500 mb-2 animate-bounce" />
        <h4 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Comparison Data Uninitialized</h4>
        <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mt-1">
          Set source and destination nodes, then run the visualizer to compare Dijkstra's and Bellman-Ford's performance side-by-side on this graph.
        </p>
      </div>
    );
  }

  // Calculate operations estimates
  const dOps = dijkstraStats.visitedNodesCount * Math.log2(nodes.length || 1) + dijkstraStats.relaxationsCount;
  const bfOps = (nodes.length - 1) * dijkstraStats.relaxationsCount + nodes.length; // rough relaxation loop estimate

  const dijkstraOps = Math.round(dOps) + dijkstraStats.visitedNodesCount;
  const bellmanFordOps = Math.round(bfOps) + dijkstraStats.visitedNodesCount;

  // Calculate memory estimates (arbitrary bytes based on data structures)
  // Dijkstra: PQ (V elements * 24B) + DistMap (V * 32B) + PrevMap (V * 32B)
  const dMem = nodes.length * 88;
  // Bellman-Ford: DistMap (V * 32B) + PrevMap (V * 32B)
  const bfMem = nodes.length * 64;

  // Determine winner
  let winner: 'dijkstra' | 'bellman-ford' | 'tie' = 'tie';
  let winnerReason = '';

  if (bellmanFordStats.hasNegativeCycle) {
    winner = 'bellman-ford';
    winnerReason = 'Bellman-Ford is the winner because the graph contains a negative-weight cycle. Bellman-Ford successfully detected it and halted, whereas Dijkstra does not support negative cycles.';
  } else if (hasNegativeWeights) {
    winner = 'bellman-ford';
    winnerReason = 'Bellman-Ford is the winner. Although Dijkstra is faster, it can yield incorrect results on graphs with negative weights. Bellman-Ford guarantees correctness here.';
  } else if (dijkstraStats.totalDistance !== bellmanFordStats.totalDistance) {
    // Dijkstra might have failed if there were negative edges (even without cycle)
    winner = 'bellman-ford';
    winnerReason = 'Bellman-Ford is the winner. Dijkstra produced an incorrect path due to negative edge weights.';
  } else {
    // Both correct, speed decides
    if (dijkstraStats.executionTimeMs < bellmanFordStats.executionTimeMs) {
      winner = 'dijkstra';
      winnerReason = 'Dijkstra is the winner! It executed faster than Bellman-Ford and requires fewer operations on graphs with positive weights.';
    } else if (dijkstraStats.executionTimeMs > bellmanFordStats.executionTimeMs) {
      winner = 'bellman-ford';
      winnerReason = 'Bellman-Ford is the winner on speed for this specific run.';
    } else {
      winner = 'dijkstra'; // Dijkstra has lower theoretical complexity
      winnerReason = 'Both completed in similar time. Dijkstra wins on theoretical efficiency (fewer operations needed).';
    }
  }

  const formatPath = (path: string[]) => {
    if (path.length === 0) return 'Unreachable';
    return path.map(id => nodes.find(n => n.id === id)?.label || id).join(' → ');
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* WINNER BADGE CARD */}
      <div className={`glass p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row items-center gap-6 ${
        winner === 'dijkstra' 
          ? 'border-indigo-500/25 bg-indigo-500/5' 
          : 'border-emerald-500/25 bg-emerald-500/5'
      }`}>
        <div className={`p-4 rounded-2xl flex items-center justify-center ${
          winner === 'dijkstra' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'
        }`}>
          <Trophy size={28} />
        </div>
        <div className="flex-1 flex flex-col gap-1 text-center md:text-left">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Performance Analysis
          </span>
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex flex-wrap items-center justify-center md:justify-start gap-2">
            Winner: 
            <span className={winner === 'dijkstra' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}>
              {winner === 'dijkstra' ? "Dijkstra's Algorithm" : 'Bellman-Ford Algorithm'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
            {winnerReason}
          </p>
        </div>
      </div>

      {/* COMPARISON METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* DIJKSTRA STATS */}
        <div className="glass p-6 rounded-3xl border border-white/20 dark:border-slate-800/60 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Dijkstra's Algorithm
            </h3>
            {winner === 'dijkstra' && (
              <span className="bg-indigo-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                <Zap size={10} fill="white" /> Speed King
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {/* Metric Rows */}
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Path Found:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {formatPath(dijkstraStats.shortestPath)}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Total Distance:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                {dijkstraStats.totalDistance === -1 ? '∞' : dijkstraStats.totalDistance}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Execution Time:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {dijkstraStats.executionTimeMs} ms
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Node Visits:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {dijkstraStats.visitedNodesCount} nodes
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Edge Relaxations:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {dijkstraStats.relaxationsCount} operations
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Estimated Heap ops:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {dijkstraOps} operations
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Est. Memory Footprint:</span>
              <span className="font-mono text-slate-800 dark:text-slate-100">
                ~ {dMem} bytes
              </span>
            </div>
          </div>
        </div>

        {/* BELLMAN-FORD STATS */}
        <div className="glass p-6 rounded-3xl border border-white/20 dark:border-slate-800/60 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Bellman-Ford Algorithm
            </h3>
            {winner === 'bellman-ford' && (
              <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                <CheckCircle size={10} fill="white" /> Safety Winner
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {/* Metric Rows */}
            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Path Found:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {bellmanFordStats.hasNegativeCycle ? (
                  <span className="text-rose-500 flex items-center gap-1">
                    <AlertTriangle size={12} /> Undefined (Cycle)
                  </span>
                ) : (
                  formatPath(bellmanFordStats.shortestPath)
                )}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Total Distance:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">
                {bellmanFordStats.totalDistance === -1 ? '∞' : bellmanFordStats.totalDistance}
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Execution Time:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {bellmanFordStats.executionTimeMs} ms
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Node Visits:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {bellmanFordStats.visitedNodesCount} nodes
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Edge Relaxations:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {bellmanFordStats.relaxationsCount} operations
              </span>
            </div>

            <div className="flex justify-between border-b border-slate-100 dark:border-slate-800/40 py-2">
              <span className="text-slate-500">Estimated Loop checks:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {bellmanFordOps} operations
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Est. Memory Footprint:</span>
              <span className="font-mono text-slate-800 dark:text-slate-100">
                ~ {bfMem} bytes
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* PERFORMANCE VISUAL CHARTS */}
      <div className="glass p-6 rounded-3xl border border-white/20 dark:border-slate-800/60 shadow-xl flex flex-col gap-6">
        <h4 className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Efficiency Comparisons
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chart 1: Execution Time comparison */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Execution Speed (lower is better)</span>
            
            {/* Dijkstra Speed Bar */}
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between">
                <span>Dijkstra's Algorithm</span>
                <span className="font-bold">{dijkstraStats.executionTimeMs} ms</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(5, Math.min(100, (dijkstraStats.executionTimeMs / (dijkstraStats.executionTimeMs + bellmanFordStats.executionTimeMs || 1)) * 100))}%`
                  }}
                />
              </div>
            </div>

            {/* Bellman-Ford Speed Bar */}
            <div className="flex flex-col gap-1 text-[11px] mt-2">
              <div className="flex justify-between">
                <span>Bellman-Ford Algorithm</span>
                <span className="font-bold">{bellmanFordStats.executionTimeMs} ms</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(5, Math.min(100, (bellmanFordStats.executionTimeMs / (dijkstraStats.executionTimeMs + bellmanFordStats.executionTimeMs || 1)) * 100))}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Chart 2: Operations Count Comparison */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Operational Overhead (lower is better)</span>

            {/* Dijkstra Ops Bar */}
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between">
                <span>Dijkstra's Heap Operations</span>
                <span className="font-bold">{dijkstraOps} ops</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(5, Math.min(100, (dijkstraOps / (dijkstraOps + bellmanFordOps || 1)) * 100))}%`
                  }}
                />
              </div>
            </div>

            {/* Bellman-Ford Ops Bar */}
            <div className="flex flex-col gap-1 text-[11px] mt-2">
              <div className="flex justify-between">
                <span>Bellman-Ford Edge Checks</span>
                <span className="font-bold">{bellmanFordOps} ops</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(5, Math.min(100, (bellmanFordOps / (dijkstraOps + bellmanFordOps || 1)) * 100))}%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

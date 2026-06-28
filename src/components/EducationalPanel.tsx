import type { Node, VisualizerStep } from '../types/graph';
import { DIJKSTRA_PSEUDOCODE } from '../utils/dijkstra';
import { BELLMAN_FORD_PSEUDOCODE } from '../utils/bellmanFord';
import { Info, Code, GraduationCap, Table } from 'lucide-react';

interface EducationalPanelProps {
  algorithm: 'dijkstra' | 'bellman-ford';
  currentStep: VisualizerStep | null;
  nodes: Node[];
}

export const EducationalPanel: React.FC<EducationalPanelProps> = ({
  algorithm,
  currentStep,
  nodes,
}) => {
  const pseudocode = algorithm === 'dijkstra' ? DIJKSTRA_PSEUDOCODE : BELLMAN_FORD_PSEUDOCODE;
  const activeLine = currentStep ? currentStep.activeLine : -1;

  // Complexity Details
  const complexities = {
    dijkstra: {
      time: 'O((V + E) log V)',
      timeDesc: 'Using Min-Heap: V extractions (log V each) and E edge updates (log V decreaseKey each).',
      space: 'O(V + E)',
      spaceDesc: 'Storing the adjacency list of vertices and edges, plus V entries in the min-priority queue.',
    },
    'bellman-ford': {
      time: 'O(V × E)',
      timeDesc: 'Relaxes all E edges in each of the V-1 outer loop passes. Performs 1 additional cycle check pass.',
      space: 'O(V)',
      spaceDesc: 'Storing only the distance map and predecessor pointers for each of the V vertices.',
    },
  };

  const selectedComplexity = complexities[algorithm];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* LEFT COLUMN: Pseudocode and Live Explanation */}
      <div className="flex flex-col gap-4 glass p-6 rounded-3xl border border-white/20 dark:border-slate-800/60 shadow-xl">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <Code size={18} />
          <h3 className="text-sm font-extrabold uppercase tracking-wider">Algorithm Pseudocode</h3>
        </div>

        {/* Code Block with line highlights */}
        <div className="w-full bg-slate-950 text-slate-100 rounded-2xl p-4 font-mono text-[11px] overflow-x-auto border border-slate-900 shadow-inner">
          {pseudocode.map((line, idx) => {
            const lineNum = idx + 1;
            const isActive = lineNum === activeLine;
            return (
              <div
                key={idx}
                className={`flex w-full py-0.5 px-2 rounded transition-colors duration-200 ${
                  isActive
                    ? 'bg-amber-500/25 border-l-4 border-amber-500 text-amber-200 font-extrabold'
                    : 'border-l-4 border-transparent text-slate-400 dark:text-slate-400'
                }`}
              >
                <span className="w-6 text-right select-none opacity-40 mr-4">{lineNum}</span>
                <span className="whitespace-pre">{line}</span>
              </div>
            );
          })}
        </div>

        {/* Step-by-Step explanation banner */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-1.5 text-amber-500">
            <GraduationCap size={16} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Step Action Details</span>
          </div>
          <div className="bg-amber-500/10 dark:bg-amber-500/5 text-slate-700 dark:text-slate-300 text-xs leading-relaxed border border-amber-500/20 p-4 rounded-2xl shadow-sm">
            {currentStep ? currentStep.explanation : 'Visualizer is idle. Select nodes and press "Run Algorithm" to see explanation step-by-step.'}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Live Distances & Complexities */}
      <div className="flex flex-col gap-6">
        {/* Live Distance Table */}
        <div className="flex flex-col gap-3 glass p-6 rounded-3xl border border-white/20 dark:border-slate-800/60 shadow-xl flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Table size={18} />
              <h3 className="text-sm font-extrabold uppercase tracking-wider">Live Distance Table</h3>
            </div>
            {currentStep && algorithm === 'dijkstra' && currentStep.queueState.length > 0 && (
              <span className="text-[9px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                PQ size: {currentStep.queueState.length}
              </span>
            )}
            {currentStep && algorithm === 'bellman-ford' && currentStep.iteration > 0 && (
              <span className="text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                Iteration: {currentStep.iteration}
              </span>
            )}
          </div>

          <div className="overflow-hidden border border-slate-100 dark:border-slate-800/60 rounded-2xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800/60 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">Node</th>
                  <th className="py-2.5 px-4">Shortest Distance</th>
                  <th className="py-2.5 px-4">Predecessor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {nodes.map(node => {
                  const distVal = currentStep ? currentStep.distances[node.id] : Infinity;
                  const prevId = currentStep ? currentStep.previous[node.id] : null;
                  const prevNode = nodes.find(n => n.id === prevId);
                  
                  const isCurrent = currentStep?.currentNodeId === node.id;
                  const isVisited = currentStep?.visitedNodeIds.includes(node.id);

                  let rowBg = '';
                  if (isCurrent) rowBg = 'bg-amber-500/5 text-amber-800 dark:text-amber-400 font-bold';
                  else if (isVisited) rowBg = 'bg-indigo-500/5 text-indigo-800 dark:text-indigo-400';

                  return (
                    <tr key={node.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${rowBg}`}>
                      <td className="py-2.5 px-4 flex items-center gap-1.5 font-semibold">
                        <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[7px] font-bold">
                          {node.label}
                        </span>
                        Node {node.label}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold">
                        {distVal === Infinity ? '∞ (Infinity)' : distVal}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-500 dark:text-slate-400">
                        {prevNode ? `Node ${prevNode.label}` : 'None'}
                      </td>
                    </tr>
                  );
                })}
                {nodes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-400 dark:text-slate-500 italic">
                      Add nodes to the graph canvas to view the live table.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Complexity Analysis Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time Complexity Card */}
          <div className="glass p-5 rounded-3xl border border-white/20 dark:border-slate-800/60 shadow-md">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
              <Info size={14} />
              <h4 className="text-[10px] uppercase font-bold tracking-wider">Time Complexity</h4>
            </div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{selectedComplexity.time}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-1">{selectedComplexity.timeDesc}</p>
          </div>

          {/* Space Complexity Card */}
          <div className="glass p-5 rounded-3xl border border-white/20 dark:border-slate-800/60 shadow-md">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 mb-1">
              <Info size={14} />
              <h4 className="text-[10px] uppercase font-bold tracking-wider">Space Complexity</h4>
            </div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{selectedComplexity.space}</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal mt-1">{selectedComplexity.spaceDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

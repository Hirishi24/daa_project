import React from 'react';
import { Activity, Radio, Network, HelpCircle, Layers } from 'lucide-react';

interface StatsBannerProps {
  totalNodes: number;
  totalEdges: number;
  directed: boolean;
  algorithm: 'dijkstra' | 'bellman-ford';
  status: 'idle' | 'visualizing' | 'paused' | 'completed' | 'error';
  errorMessage: string | null;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  totalNodes,
  totalEdges,
  directed,
  algorithm,
  status,
  errorMessage,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'idle':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
            Idle
          </span>
        );
      case 'visualizing':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 animate-pulse">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-ping"></span>
            Running
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
            Paused
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
            Finished
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40" title={errorMessage || 'Error'}>
            Negative Cycle
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
      {/* Total Nodes */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-2xl glass border border-white/20 dark:border-slate-800/60 shadow-sm">
        <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/15">
          <Network size={20} />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Nodes</p>
          <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{totalNodes}</h4>
        </div>
      </div>

      {/* Total Edges */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-2xl glass border border-white/20 dark:border-slate-800/60 shadow-sm">
        <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/15">
          <Layers size={20} />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Edges</p>
          <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{totalEdges}</h4>
        </div>
      </div>

      {/* Graph Type */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-2xl glass border border-white/20 dark:border-slate-800/60 shadow-sm">
        <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/15">
          <Radio size={20} />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Graph Type</p>
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
            {directed ? 'Directed' : 'Undirected'}
          </h4>
        </div>
      </div>

      {/* Selected Algorithm */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-2xl glass border border-white/20 dark:border-slate-800/60 shadow-sm">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/15">
          <Activity size={20} />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Algorithm</p>
          <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
            {algorithm === 'dijkstra' ? 'Dijkstra' : 'Bellman-Ford'}
          </h4>
        </div>
      </div>

      {/* Execution Status */}
      <div className="col-span-2 md:col-span-1 flex items-center gap-4 px-4 py-3 rounded-2xl glass border border-white/20 dark:border-slate-800/60 shadow-sm">
        <div className="p-2.5 rounded-xl bg-slate-500/10 text-slate-500 border border-slate-500/15">
          <HelpCircle size={20} />
        </div>
        <div className="flex flex-col gap-1 items-start">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">Status</p>
          {getStatusBadge()}
        </div>
      </div>
    </div>
  );
};

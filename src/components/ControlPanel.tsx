import React from 'react';
import type { Node } from '../types/graph';
import { 
  Play, Pause, RotateCcw, ArrowRight, ArrowLeft, 
  Trash2, Sparkles, Volume2, VolumeX, BarChart2,
  FileDown, FileUp, ShieldAlert, GitFork
} from 'lucide-react';
import { playClick } from '../utils/audio';

interface ControlPanelProps {
  nodes: Node[];
  directed: boolean;
  setDirected: (val: boolean) => void;
  algorithm: 'dijkstra' | 'bellman-ford';
  setAlgorithm: (val: 'dijkstra' | 'bellman-ford') => void;
  sourceNodeId: string | null;
  setSourceNodeId: (id: string | null) => void;
  targetNodeId: string | null;
  setTargetNodeId: (id: string | null) => void;
  
  // Execution Control States
  status: 'idle' | 'visualizing' | 'paused' | 'completed' | 'error';
  onRun: () => void;
  onPause: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  
  // Speed and Sound
  animationSpeed: number; // ms delay
  setAnimationSpeed: (speed: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  
  // Graph Modifiers
  onClear: () => void;
  onGenerateRandom: (nodeCount: number, edgeCount: number) => void;
  onLoadPreset: (presetName: 'positive' | 'negative' | 'cycle' | 'directed' | 'undirected') => void;
  
  // Comparison Mode
  comparisonMode: boolean;
  setComparisonMode: (val: boolean) => void;
  
  // Import/Export File Dialogs
  onSaveJSON: () => void;
  onLoadJSON: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  nodes,
  directed,
  setDirected,
  algorithm,
  setAlgorithm,
  sourceNodeId,
  setSourceNodeId,
  targetNodeId,
  setTargetNodeId,
  
  status,
  onRun,
  onPause,
  onStepForward,
  onStepBackward,
  onReset,
  
  animationSpeed,
  setAnimationSpeed,
  soundEnabled,
  setSoundEnabled,
  
  onClear,
  onGenerateRandom,
  onLoadPreset,
  
  comparisonMode,
  setComparisonMode,
  
  onSaveJSON,
  onLoadJSON,
  onExportPNG,
  onExportPDF,
}) => {
  const isVisualizing = status === 'visualizing';
  const isIdle = status === 'idle';

  return (
    <div className="flex flex-col gap-6 w-full glass p-6 rounded-3xl border border-white/20 dark:border-slate-800/60 shadow-xl">
      {/* SECTION 1: Algorithm & Mode Selection */}
      <div className="flex flex-col gap-3">
        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
          Visualizer Configuration
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
            <button
              disabled={isVisualizing}
              onClick={() => {
                setComparisonMode(false);
                playClick();
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                !comparisonMode
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              } disabled:opacity-50`}
            >
              Single Algorithm
            </button>
            <button
              disabled={isVisualizing}
              onClick={() => {
                setComparisonMode(true);
                playClick();
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                comparisonMode
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              } disabled:opacity-50`}
            >
              Comparison Mode
            </button>
          </div>

          {/* Algorithm selector (if not comparison mode) */}
          {!comparisonMode ? (
            <select
              disabled={isVisualizing}
              value={algorithm}
              onChange={(e) => {
                setAlgorithm(e.target.value as 'dijkstra' | 'bellman-ford');
                playClick();
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
            >
              <option value="dijkstra">Dijkstra's Algorithm (Min-Heap)</option>
              <option value="bellman-ford">Bellman-Ford Algorithm (Relaxation)</option>
            </select>
          ) : (
            <div className="flex items-center justify-center border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold px-3 py-2 rounded-xl">
              <BarChart2 size={14} className="mr-1.5" /> Dijkstra vs Bellman-Ford
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Graph Setup Controls */}
      <div className="flex flex-col gap-4">
        {/* Source & Target Dropdowns */}
        <div className="grid grid-cols-2 gap-3">
          {/* Source selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              Source Node (S)
            </label>
            <select
              disabled={isVisualizing}
              value={sourceNodeId || ''}
              onChange={(e) => {
                setSourceNodeId(e.target.value || null);
                playClick();
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
            >
              <option value="">Select source...</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>Node {n.label}</option>
              ))}
            </select>
          </div>

          {/* Target selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
              Target Node (T)
            </label>
            <select
              disabled={isVisualizing}
              value={targetNodeId || ''}
              onChange={(e) => {
                setTargetNodeId(e.target.value || null);
                playClick();
              }}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
            >
              <option value="">Select target...</option>
              {nodes.map(n => (
                <option key={n.id} value={n.id}>Node {n.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Graph Settings */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
            Graph Settings
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              disabled={isVisualizing}
              onClick={() => {
                setDirected(!directed);
                playClick();
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 border rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                directed
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              <GitFork size={13} />
              {directed ? 'Directed' : 'Undirected'}
            </button>

            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                playClick();
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-3 border rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shadow-sm'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
              }`}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
              {soundEnabled ? 'Audio On' : 'Muted'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: Visualizer Execution Control Bar */}
      <div className="flex flex-col gap-4 border-t border-slate-200/50 dark:border-slate-800/60 pt-6">
        {/* Playback Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Run / Pause */}
          {status === 'visualizing' ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white font-extrabold text-xs shadow-md hover:bg-amber-600 active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <Pause size={14} fill="white" /> Pause
            </button>
          ) : (
            <button
              disabled={nodes.length < 2 || !sourceNodeId || !targetNodeId}
              onClick={onRun}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs shadow-md hover:bg-indigo-700 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <Play size={14} fill="white" /> Run Algorithm
            </button>
          )}

          {/* Step Backward */}
          <button
            disabled={isVisualizing || isIdle}
            onClick={onStepBackward}
            className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Step backward (Left Arrow)"
          >
            <ArrowLeft size={15} />
          </button>

          {/* Step Forward */}
          <button
            disabled={isVisualizing || status === 'completed' || status === 'error' || nodes.length < 2 || !sourceNodeId || !targetNodeId}
            onClick={onStepForward}
            className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer"
            title="Step forward (Right Arrow)"
          >
            <ArrowRight size={15} />
          </button>

          {/* Reset */}
          <button
            disabled={isIdle}
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Reset visualizer (R)"
          >
            <RotateCcw size={14} />
            <span className="text-xs font-bold">Reset</span>
          </button>
        </div>

        {/* Speed Slider */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>Animation Delay</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{animationSpeed}ms</span>
          </div>
          <input
            type="range"
            min="50"
            max="2000"
            step="50"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            className="w-full accent-indigo-600 dark:accent-indigo-400 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* SECTION 4: Presets, Generators & Exporters */}
      <div className="flex flex-col gap-4 border-t border-slate-200/50 dark:border-slate-800/60 pt-6">
        {/* Presets */}
        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Presets</span>
          <div className="grid grid-cols-3 gap-2">
            <button
              disabled={isVisualizing}
              onClick={() => onLoadPreset('positive')}
              className="py-1.5 px-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 text-center cursor-pointer"
            >
              Positive
            </button>
            <button
              disabled={isVisualizing}
              onClick={() => onLoadPreset('negative')}
              className="py-1.5 px-1 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors disabled:opacity-50 text-center cursor-pointer"
            >
              Negative
            </button>
            <button
              disabled={isVisualizing}
              onClick={() => onLoadPreset('cycle')}
              className="py-1.5 px-1 text-[10px] font-bold rounded-lg border border-rose-500/10 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 text-center cursor-pointer"
            >
              <ShieldAlert size={10} />
              Cycle
            </button>
          </div>
        </div>

        {/* Generate / Clear */}
        <div className="grid grid-cols-2 gap-2">
          <button
            disabled={isVisualizing}
            onClick={() => onGenerateRandom(6, 9)}
            className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles size={13} /> Random Graph
          </button>
          <button
            disabled={isVisualizing || nodes.length === 0}
            onClick={onClear}
            className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-xl text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Trash2 size={13} /> Clear Graph
          </button>
        </div>

        {/* File Exporters */}
        <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-800/60 pt-4 gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={onSaveJSON}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              title="Save Graph JSON"
            >
              <FileDown size={14} />
            </button>
            <button
              disabled={isVisualizing}
              onClick={onLoadJSON}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-500 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors disabled:opacity-50 cursor-pointer"
              title="Load Graph JSON"
            >
              <FileUp size={14} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onExportPNG}
              className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-indigo-500 hover:border-indigo-500/30 transition-all uppercase hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              title="Export Graph to Image"
            >
              PNG
            </button>
            <button
              onClick={onExportPDF}
              className="px-3 py-1.5 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-indigo-500 hover:border-indigo-500/30 transition-all uppercase hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
              title="Download PDF Report"
            >
              PDF Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

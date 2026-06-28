import { useState, useEffect, useRef } from 'react';
import type { Node, Edge, VisualizerStep, AlgorithmStats } from './types/graph';
import { StatsBanner } from './components/StatsBanner';
import { ControlPanel } from './components/ControlPanel';
import { GraphCanvas } from './components/GraphCanvas';
import { EducationalPanel } from './components/EducationalPanel';
import { ComparisonDashboard } from './components/ComparisonDashboard';
import { runDijkstra } from './utils/dijkstra';
import { runBellmanFord } from './utils/bellmanFord';
import { 
  setSoundEnabled, playNodeVisit, playRelaxation, 
  playSuccess, playFailure, playCycleWarning, playClick 
} from './utils/audio';
import { 
  exportGraphAsJSON, importGraphFromJSON, 
  exportGraphAsPNG, exportExecutionReportPDF 
} from './utils/exporters';
import { 
  ShieldQuestion, HelpCircle, X, Sparkles, 
  Award, Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

const PRESETS = {
  positive: {
    nodes: [
      { id: 'n1', label: 'A', x: 100, y: 250 },
      { id: 'n2', label: 'B', x: 250, y: 130 },
      { id: 'n3', label: 'C', x: 250, y: 370 },
      { id: 'n4', label: 'D', x: 450, y: 130 },
      { id: 'n5', label: 'E', x: 450, y: 370 },
      { id: 'n6', label: 'F', x: 600, y: 250 },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', weight: 4 },
      { id: 'e2', source: 'n1', target: 'n3', weight: 2 },
      { id: 'e3', source: 'n2', target: 'n3', weight: 1 },
      { id: 'e4', source: 'n2', target: 'n4', weight: 5 },
      { id: 'e5', source: 'n3', target: 'n4', weight: 8 },
      { id: 'e6', source: 'n3', target: 'n5', weight: 10 },
      { id: 'e7', source: 'n4', target: 'n5', weight: 2 },
      { id: 'e8', source: 'n4', target: 'n6', weight: 6 },
      { id: 'e9', source: 'n5', target: 'n6', weight: 3 },
    ],
    directed: false,
    source: 'n1',
    target: 'n6'
  },
  negative: {
    nodes: [
      { id: 'n1', label: 'A', x: 120, y: 250 },
      { id: 'n2', label: 'B', x: 320, y: 140 },
      { id: 'n3', label: 'C', x: 320, y: 360 },
      { id: 'n4', label: 'D', x: 520, y: 250 },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', weight: 4 },
      { id: 'e2', source: 'n1', target: 'n3', weight: 3 },
      { id: 'e3', source: 'n2', target: 'n3', weight: -2 },
      { id: 'e4', source: 'n2', target: 'n4', weight: 4 },
      { id: 'e5', source: 'n3', target: 'n4', weight: 1 },
    ],
    directed: true,
    source: 'n1',
    target: 'n4'
  },
  cycle: {
    nodes: [
      { id: 'n1', label: 'A', x: 120, y: 250 },
      { id: 'n2', label: 'B', x: 320, y: 140 },
      { id: 'n3', label: 'C', x: 320, y: 360 },
      { id: 'n4', label: 'D', x: 520, y: 250 },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', weight: 4 },
      { id: 'e2', source: 'n2', target: 'n3', weight: -2 },
      { id: 'e3', source: 'n3', target: 'n2', weight: -1 }, // B->C->B is -3 cycle
      { id: 'e4', source: 'n2', target: 'n4', weight: 3 },
      { id: 'e5', source: 'n3', target: 'n4', weight: 2 },
    ],
    directed: true,
    source: 'n1',
    target: 'n4'
  },
  directed: {
    nodes: [
      { id: 'n1', label: 'A', x: 150, y: 250 },
      { id: 'n2', label: 'B', x: 320, y: 150 },
      { id: 'n3', label: 'C', x: 320, y: 350 },
      { id: 'n4', label: 'D', x: 500, y: 250 },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', weight: 2 },
      { id: 'e2', source: 'n2', target: 'n4', weight: 5 },
      { id: 'e3', source: 'n1', target: 'n3', weight: 4 },
      { id: 'e4', source: 'n4', target: 'n3', weight: 1 },
    ],
    directed: true,
    source: 'n1',
    target: 'n4'
  },
  undirected: {
    nodes: [
      { id: 'n1', label: 'A', x: 150, y: 250 },
      { id: 'n2', label: 'B', x: 320, y: 150 },
      { id: 'n3', label: 'C', x: 320, y: 350 },
      { id: 'n4', label: 'D', x: 500, y: 250 },
    ],
    edges: [
      { id: 'e1', source: 'n1', target: 'n2', weight: 3 },
      { id: 'e2', source: 'n1', target: 'n3', weight: 6 },
      { id: 'e3', source: 'n2', target: 'n3', weight: 2 },
      { id: 'e4', source: 'n2', target: 'n4', weight: 7 },
      { id: 'e5', source: 'n3', target: 'n4', weight: 1 },
    ],
    directed: false,
    source: 'n1',
    target: 'n4'
  }
};

function App() {
  // Graph structure states
  const [nodes, setNodes] = useState<Node[]>(PRESETS.positive.nodes);
  const [edges, setEdges] = useState<Edge[]>(PRESETS.positive.edges);
  const [directed, setDirected] = useState<boolean>(PRESETS.positive.directed);
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(PRESETS.positive.source);
  const [targetNodeId, setTargetNodeId] = useState<string | null>(PRESETS.positive.target);

  // Visualization Control States
  const [algorithm, setAlgorithm] = useState<'dijkstra' | 'bellman-ford'>('dijkstra');
  const [status, setStatus] = useState<'idle' | 'visualizing' | 'paused' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [animationSpeed, setAnimationSpeed] = useState<number>(600); // ms delay
  const [sound, setSound] = useState<boolean>(true);
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);

  // Step Tracker
  const [steps, setSteps] = useState<VisualizerStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [shortestPath, setShortestPath] = useState<string[]>([]);
  
  // Stats Records
  const [dijkstraStats, setDijkstraStats] = useState<AlgorithmStats | null>(null);
  const [bellmanFordStats, setBellmanFordStats] = useState<AlgorithmStats | null>(null);

  // Modals Toggles
  const [showTutorial, setShowTutorial] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dijkstraStatsRef = useRef<AlgorithmStats | null>(null);
  const bellmanFordStatsRef = useRef<AlgorithmStats | null>(null);

  // Set initial theme (permanently forced to Dark Mode)
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    const tutorialCompleted = localStorage.getItem('tutorialCompleted');
    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  // Automatically reset when graph topologies or run targets change
  useEffect(() => {
    handleReset();
  }, [algorithm, sourceNodeId, targetNodeId, directed, nodes.length, edges.length]);


  const handleSoundToggle = (val: boolean) => {
    setSound(val);
    setSoundEnabled(val);
  };

  // Preset loader
  const handleLoadPreset = (name: 'positive' | 'negative' | 'cycle' | 'directed' | 'undirected') => {
    const preset = PRESETS[name];
    if (preset) {
      handleReset();
      setNodes(preset.nodes);
      setEdges(preset.edges);
      setDirected(preset.directed);
      setSourceNodeId(preset.source);
      setTargetNodeId(preset.target);
      playClick();
    }
  };

  // Generate random graph
  const handleGenerateRandom = (nodeCount: number = 6, edgeCount: number = 9) => {
    handleReset();
    playClick();
    
    const nodeLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const canvasWidth = 650;
    const canvasHeight = 400;
    const newNodes: Node[] = [];
    
    // Distribute nodes evenly to avoid clustering
    for (let i = 0; i < nodeCount; i++) {
      let x, y, tooClose;
      let attempts = 0;
      do {
        tooClose = false;
        x = Math.round(80 + Math.random() * (canvasWidth - 160));
        y = Math.round(80 + Math.random() * (canvasHeight - 160));
        attempts++;
        
        // Ensure distance is at least 90px
        for (const n of newNodes) {
          const dx = n.x - x;
          const dy = n.y - y;
          if (Math.sqrt(dx * dx + dy * dy) < 90) {
            tooClose = true;
            break;
          }
        }
      } while (tooClose && attempts < 100);

      newNodes.push({
        id: crypto.randomUUID(),
        label: nodeLabels[i] || `N${i}`,
        x,
        y
      });
    }

    const newEdges: Edge[] = [];
    const possibleEdges: { s: number; t: number }[] = [];
    
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        possibleEdges.push({ s: i, t: j });
      }
    }

    // Shuffle connections
    for (let i = possibleEdges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [possibleEdges[i], possibleEdges[j]] = [possibleEdges[j], possibleEdges[i]];
    }

    // Connect node sequence to guarantee connectivity
    for (let i = 0; i < nodeCount - 1; i++) {
      newEdges.push({
        id: crypto.randomUUID(),
        source: newNodes[i].id,
        target: newNodes[i + 1].id,
        weight: Math.floor(1 + Math.random() * 9)
      });
    }

    // Add extra random edges up to target count
    let idx = 0;
    while (newEdges.length < edgeCount && idx < possibleEdges.length) {
      const { s, t } = possibleEdges[idx];
      const sourceId = newNodes[s].id;
      const targetId = newNodes[t].id;
      
      const exists = newEdges.some(e => e.source === sourceId && e.target === targetId);
      if (!exists) {
        newEdges.push({
          id: crypto.randomUUID(),
          source: sourceId,
          target: targetId,
          weight: Math.floor(1 + Math.random() * 9)
        });
      }
      idx++;
    }

    setNodes(newNodes);
    setEdges(newEdges);
    setSourceNodeId(newNodes[0].id);
    setTargetNodeId(newNodes[nodeCount - 1].id);
  };

  const handleClear = () => {
    handleReset();
    setNodes([]);
    setEdges([]);
    setSourceNodeId(null);
    setTargetNodeId(null);
    playClick();
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStatus('idle');
    setErrorMessage(null);
    setCurrentStepIndex(-1);
    setSteps([]);
    setShortestPath([]);
    setDijkstraStats(null);
    setBellmanFordStats(null);
    dijkstraStatsRef.current = null;
    bellmanFordStatsRef.current = null;
  };

  // Compile algorithm execution steps
  const compileSteps = () => {
    if (!sourceNodeId || !targetNodeId) return false;
    
    // Run Dijkstra
    const dRes = runDijkstra(nodes, edges, sourceNodeId, targetNodeId, directed);
    dijkstraStatsRef.current = dRes.stats;
    setDijkstraStats(dRes.stats);
    
    // Run Bellman-Ford
    const bfRes = runBellmanFord(nodes, edges, sourceNodeId, targetNodeId, directed);
    bellmanFordStatsRef.current = bfRes.stats;
    setBellmanFordStats(bfRes.stats);

    const activeRes = algorithm === 'dijkstra' ? dRes : bfRes;
    setSteps(activeRes.steps);
    setCurrentStepIndex(0);
    return true;
  };

  const handleRun = () => {
    playClick();
    if (nodes.length < 2 || !sourceNodeId || !targetNodeId) return;

    if (status === 'idle' || status === 'completed' || status === 'error') {
      setShortestPath([]);
      setErrorMessage(null);
      const compiled = compileSteps();
      if (!compiled) return;
      setStatus('visualizing');
    } else if (status === 'paused') {
      setStatus('visualizing');
    }
  };

  const handlePause = () => {
    playClick();
    setStatus('paused');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Single step forward controls
  const handleStepForward = () => {
    if (status === 'idle') {
      compileSteps();
      setStatus('paused');
      return;
    }
    
    if (currentStepIndex < steps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      playStepAudio(steps[nextIndex]);

      if (nextIndex === steps.length - 1) {
        finalizeVisualization();
      }
    }
  };

  // Single step backward controls
  const handleStepBackward = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      playStepAudio(steps[prevIndex]);
      setStatus('paused');
    }
  };

  // Handle step audio triggers
  const playStepAudio = (step: VisualizerStep) => {
    if (!sound) return;
    
    if (step.explanation.toLowerCase().includes('negative-weight cycle')) {
      playCycleWarning();
    } else if (step.explanation.toLowerCase().includes('relaxation successful')) {
      playRelaxation();
    } else if (step.explanation.toLowerCase().includes('extracted node')) {
      playNodeVisit();
    }
  };

  // Visualizer completion triggers
  const finalizeVisualization = () => {
    const activeStats = algorithm === 'dijkstra' ? dijkstraStatsRef.current : bellmanFordStatsRef.current;
    
    if (activeStats?.hasNegativeCycle) {
      setStatus('error');
      setErrorMessage('Negative-weight cycle detected.');
      playCycleWarning();
    } else {
      setStatus('completed');
      if (activeStats && activeStats.shortestPath.length > 0) {
        setShortestPath(activeStats.shortestPath);
        playSuccess();
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#3b82f6', '#8b5cf6']
        });
      } else {
        playFailure();
      }
    }
  };

  // Interval timer looping for visualizations
  useEffect(() => {
    if (status === 'visualizing') {
      timerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          const next = prev + 1;
          if (next >= steps.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            finalizeVisualization();
            return prev;
          }
          playStepAudio(steps[next]);
          return next;
        });
      }, animationSpeed);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, steps, animationSpeed, algorithm, dijkstraStats, bellmanFordStats, sound]);

  // Keyboard Shortcuts Hook
  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      // Don't capture inputs
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;

      switch(e.key.toLowerCase()) {
        case ' ': // Space: play / pause
          e.preventDefault();
          if (status === 'visualizing') handlePause();
          else handleRun();
          break;
        case 'arrowright': // Right Arrow: step forward
          e.preventDefault();
          handleStepForward();
          break;
        case 'arrowleft': // Left Arrow: step backward
          e.preventDefault();
          handleStepBackward();
          break;
        case 'r': // R: Reset
          handleReset();
          break;
        case 'c': // C: Clear
          handleClear();
          break;
      }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [status, currentStepIndex, steps, nodes, edges, sourceNodeId, targetNodeId]);

  // Exporter Actions
  const handleSaveJSON = () => {
    playClick();
    exportGraphAsJSON(nodes, edges, directed);
  };

  const handleLoadJSON = () => {
    playClick();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const parsed = await importGraphFromJSON(file);
        handleReset();
        setNodes(parsed.nodes);
        setEdges(parsed.edges);
        setDirected(parsed.directed);
        
        if (parsed.nodes.length > 0) {
          setSourceNodeId(parsed.nodes[0].id);
          setTargetNodeId(parsed.nodes[parsed.nodes.length - 1].id);
        }
      } catch (err: any) {
        alert(err.message || 'Error loading JSON');
      }
    }
  };

  const handleExportPNG = () => {
    playClick();
    const svg = document.querySelector('svg');
    exportGraphAsPNG(svg);
  };

  const handleExportPDF = () => {
    playClick();
    // Force a compilation to fetch correct stats in case they are missing
    let currentDStats = dijkstraStats;
    let currentBStats = bellmanFordStats;
    if (!currentDStats || !currentBStats) {
      const d = runDijkstra(nodes, edges, sourceNodeId || '', targetNodeId || '', directed);
      const b = runBellmanFord(nodes, edges, sourceNodeId || '', targetNodeId || '', directed);
      currentDStats = d.stats;
      currentBStats = b.stats;
    }
    exportExecutionReportPDF(nodes, edges, directed, sourceNodeId, targetNodeId, currentDStats, currentBStats, algorithm);
  };

  const handleTutorialComplete = () => {
    playClick();
    setShowTutorial(false);
    localStorage.setItem('tutorialCompleted', 'true');
  };

  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : null;
  const hasNegativeWeights = edges.some(e => e.weight < 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 bg-grid transition-colors duration-300 relative pb-16">
      {/* Hidden file selector */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Floating Ambient Glowing Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none ambient-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none ambient-glow" />

      {/* HEADER SECTION */}
      <header className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white border border-indigo-400/20">
            <Zap size={20} fill="white" className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight m-0 leading-none">Shortest Path Visualizer</h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">DAA Coursework Interactive Tool</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tutorial Trigger */}
          <button
            onClick={() => {
              playClick();
              setShowTutorial(true);
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            title="Open Tutorial"
          >
            <HelpCircle size={16} />
          </button>

        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full max-w-7xl mx-auto px-4 md:px-8 mt-8 flex flex-col gap-6 relative z-10">
        {/* Stats banner */}
        <StatsBanner
          totalNodes={nodes.length}
          totalEdges={edges.length}
          directed={directed}
          algorithm={algorithm}
          status={status}
          errorMessage={errorMessage}
        />

        {/* Warning messages if negative weight or cycle present */}
        {hasNegativeWeights && algorithm === 'dijkstra' && (
          <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs">
            <ShieldQuestion size={18} className="shrink-0" />
            <p className="font-semibold">
              Warning: Graph contains negative edge weights. Dijkstra's algorithm might return incorrect shortest paths. Switch to Bellman-Ford or click "Negative cycle" preset to analyze.
            </p>
          </div>
        )}

        {/* Dynamic Panel grid: Canvas + Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Canvas editor takes 2/3 cols on desktop */}
          <div className="lg:col-span-2 flex flex-col">
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              directed={directed}
              sourceNodeId={sourceNodeId}
              targetNodeId={targetNodeId}
              currentStep={currentStep}
              shortestPath={shortestPath}
              setNodes={setNodes}
              setEdges={setEdges}
              setSourceNodeId={setSourceNodeId}
              setTargetNodeId={setTargetNodeId}
              isVisualizing={status === 'visualizing'}
            />
          </div>

          {/* Controls Panel takes 1/3 col */}
          <div className="flex flex-col">
            <ControlPanel
              nodes={nodes}
              directed={directed}
              setDirected={setDirected}
              algorithm={algorithm}
              setAlgorithm={setAlgorithm}
              sourceNodeId={sourceNodeId}
              setSourceNodeId={setSourceNodeId}
              targetNodeId={targetNodeId}
              setTargetNodeId={setTargetNodeId}
              
              status={status}
              onRun={handleRun}
              onPause={handlePause}
              onStepForward={handleStepForward}
              onStepBackward={handleStepBackward}
              onReset={handleReset}
              
              animationSpeed={animationSpeed}
              setAnimationSpeed={setAnimationSpeed}
              soundEnabled={sound}
              setSoundEnabled={handleSoundToggle}
              
              onClear={handleClear}
              onGenerateRandom={handleGenerateRandom}
              onLoadPreset={handleLoadPreset}
              
              comparisonMode={comparisonMode}
              setComparisonMode={setComparisonMode}
              
              onSaveJSON={handleSaveJSON}
              onLoadJSON={handleLoadJSON}
              onExportPNG={handleExportPNG}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>

        {/* Bottom Educational or Comparison Details Panel */}
        {!comparisonMode ? (
          <EducationalPanel
            algorithm={algorithm}
            currentStep={currentStep}
            nodes={nodes}
          />
        ) : (
          <ComparisonDashboard
            nodes={nodes}
            dijkstraStats={dijkstraStats}
            bellmanFordStats={bellmanFordStats}
            hasNegativeWeights={hasNegativeWeights}
          />
        )}
        {/* Footer Credit */}
        <footer className="mt-8 border-t border-slate-200/50 dark:border-slate-800/60 pt-6 pb-2 text-center text-xs text-slate-400 dark:text-slate-500 font-bold select-none relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2024 Shortest Path Visualizer. All rights reserved.</p>
          <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Developed by <strong className="font-extrabold text-indigo-700 dark:text-indigo-300">Harsha</strong>, <strong className="font-extrabold text-indigo-700 dark:text-indigo-300">Devi</strong>, and <strong className="font-extrabold text-indigo-700 dark:text-indigo-300">Kevin</strong></span>
          </div>
        </footer>
      </main>

      {/* INSTRUCTIVE TUTORIAL DIALOG MODAL */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-xl glass rounded-3xl border border-white/20 dark:border-slate-800/80 shadow-2xl p-6 relative overflow-hidden flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal glow */}
            <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[60px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Sparkles size={20} className="animate-spin" />
                <h3 className="text-base font-extrabold uppercase tracking-wider">Interactive Tutorial</h3>
              </div>
              <button
                onClick={handleTutorialComplete}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content List */}
            <div className="flex flex-col gap-4 relative z-10 max-h-[380px] overflow-y-auto pr-2 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                Welcome to the **Shortest Path Visualizer**! This educational workbench lets you explore and compare Dijkstra's and Bellman–Ford's algorithms side-by-side. Here is a quick guide to get started:
              </p>

              {/* Steps */}
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3 bg-white/40 dark:bg-slate-900/30 p-3 rounded-2xl border border-white/10">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Add & Arrange Nodes</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Click empty space on the grid to create nodes (labeled A, B, C...). Grab and drag nodes to arrange them.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/40 dark:bg-slate-900/30 p-3 rounded-2xl border border-white/10">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Connect Weighted Edges</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Hold <kbd className="border px-1 rounded text-[9px] font-bold">Ctrl</kbd> (or Shift) and drag from one node to another to draw an edge. Double-click edge weights to edit them inline.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/40 dark:bg-slate-900/30 p-3 rounded-2xl border border-white/10">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Choose Source & Target</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Select a node on the canvas and click "Set Source" or "Set Target" from the top-right floating bar (or use selectors in the controls panel).</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-white/40 dark:bg-slate-900/30 p-3 rounded-2xl border border-white/10">
                  <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0">4</span>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Visualize & Compare</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Toggle "Comparison Mode" to run both algorithms simultaneously. Use play controls or Keyboard Shortcuts (Space to play, arrow keys to step).</p>
                  </div>
                </div>
              </div>

              {/* Shortcut Table */}
              <div className="flex flex-col gap-1 border-t border-slate-200 dark:border-slate-800 pt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400">Keyboard Shortcuts</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                  <div><kbd className="border px-1.5 py-0.5 rounded font-bold mr-1">Space</kbd> Play / Pause</div>
                  <div><kbd className="border px-1.5 py-0.5 rounded font-bold mr-1">R</kbd> Reset trace</div>
                  <div><kbd className="border px-1.5 py-0.5 rounded font-bold mr-1">➔</kbd> Step Forward</div>
                  <div><kbd className="border px-1.5 py-0.5 rounded font-bold mr-1">C</kbd> Clear canvas</div>
                  <div><kbd className="border px-1.5 py-0.5 rounded font-bold mr-1">Backspace / Del</kbd> Delete node</div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-4 relative z-10">
              <button
                onClick={handleTutorialComplete}
                className="flex items-center gap-1 text-xs font-bold text-white px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
              >
                <Award size={14} /> Let's Get Started!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

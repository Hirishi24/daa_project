import React, { useState, useRef, useEffect } from 'react';
import type { Node, Edge, VisualizerStep } from '../types/graph';
import { Trash2, Play, X, HelpCircle } from 'lucide-react';
import { playClick } from '../utils/audio';

interface GraphCanvasProps {
  nodes: Node[];
  edges: Edge[];
  directed: boolean;
  sourceNodeId: string | null;
  targetNodeId: string | null;
  currentStep: VisualizerStep | null;
  shortestPath: string[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  setSourceNodeId: (id: string | null) => void;
  setTargetNodeId: (id: string | null) => void;
  isVisualizing: boolean;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  directed,
  sourceNodeId,
  targetNodeId,
  currentStep,
  shortestPath,
  setNodes,
  setEdges,
  setSourceNodeId,
  setTargetNodeId,
  isVisualizing,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  
  // Dragging state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Edge drawing state
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Node editing state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Overlay shortcut guide state
  const [showShortcuts, setShowShortcuts] = useState<boolean>(true);

  // Inline edge weight editing
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [editingWeightValue, setEditingWeightValue] = useState<string>('1');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Interaction flags to prevent click bubbling from creating nodes
  const wasConnectingRef = useRef<boolean>(false);
  const wasDraggingRef = useRef<boolean>(false);

  const NODE_RADIUS = 24;

  useEffect(() => {
    if (editingEdgeId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingEdgeId]);

  // Handle canvas click - create node
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isVisualizing) return;
    if (wasConnectingRef.current || wasDraggingRef.current) {
      wasConnectingRef.current = false;
      wasDraggingRef.current = false;
      return;
    }
    if (svgRef.current) {
      // Don't add node if clicking a node/edge directly
      const target = e.target as SVGElement;
      if (target.closest('.graph-node') || target.closest('.graph-edge') || target.closest('.edge-weight-container') || editingEdgeId) {
        return;
      }

      playClick();
      const rect = svgRef.current.getBoundingClientRect();
      const x = Number((e.clientX - rect.left).toFixed(1));
      const y = Number((e.clientY - rect.top).toFixed(1));

      // Generate label based on existing nodes (A, B, C...)
      const nodeLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let nextLabel = '';
      if (nodes.length < nodeLabels.length) {
        nextLabel = nodeLabels[nodes.length];
      } else {
        nextLabel = `N${nodes.length}`;
      }

      const newNode: Node = {
        id: crypto.randomUUID(),
        label: nextLabel,
        x,
        y,
      };

      setNodes(prev => [...prev, newNode]);

      // Set source node automatically if it's the first node
      if (nodes.length === 0) {
        setSourceNodeId(newNode.id);
      } else if (nodes.length === 1) {
        setTargetNodeId(newNode.id);
      }
    }
  };

  // Node mouse down - start drag or connect
  const handleNodeMouseDown = (e: React.MouseEvent, node: Node) => {
    if (isVisualizing) return;
    e.stopPropagation();
    
    // Connect mode (using Ctrl key or Alt key)
    if (e.ctrlKey || e.shiftKey) {
      setConnectingSourceId(node.id);
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    } else {
      // Drag mode
      setDraggingNodeId(node.id);
      setDragOffset({
        x: node.x - e.clientX,
        y: node.y - e.clientY,
      });
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
    }
    playClick();
  };

  // Global mouse move - drag node or connect edge
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isVisualizing) return;
    if (draggingNodeId) {
      setNodes(prev =>
        prev.map(node =>
          node.id === draggingNodeId
            ? {
                ...node,
                x: Math.max(NODE_RADIUS, Math.min(e.clientX + dragOffset.x, (svgRef.current?.clientWidth || 800) - NODE_RADIUS)),
                y: Math.max(NODE_RADIUS, Math.min(e.clientY + dragOffset.y, (svgRef.current?.clientHeight || 500) - NODE_RADIUS)),
              }
            : node
        )
      );
    } else if (connectingSourceId && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  // Global mouse up - end drag or connect
  const handleMouseUp = (e: React.MouseEvent) => {
    if (isVisualizing) return;
    if (draggingNodeId) {
      setDraggingNodeId(null);
      wasDraggingRef.current = true;
      setTimeout(() => { wasDraggingRef.current = false; }, 50);
    } else if (connectingSourceId) {
      // Check if mouse is over another node
      const target = e.target as SVGElement;
      const targetNodeEl = target.closest('.graph-node');
      
      if (targetNodeEl) {
        const targetNodeId = targetNodeEl.getAttribute('data-node-id');
        if (targetNodeId && targetNodeId !== connectingSourceId) {
          // Check if edge already exists
          const edgeExists = edges.some(edge => 
            (edge.source === connectingSourceId && edge.target === targetNodeId) ||
            (!directed && edge.source === targetNodeId && edge.target === connectingSourceId)
          );

          if (!edgeExists) {
            const newEdge: Edge = {
              id: crypto.randomUUID(),
              source: connectingSourceId,
              target: targetNodeId,
              weight: 1, // Default weight
            };
            setEdges(prev => [...prev, newEdge]);
            playClick();
          }
        }
      }
      setConnectingSourceId(null);
      wasConnectingRef.current = true;
      setTimeout(() => { wasConnectingRef.current = false; }, 50);
    }
  };

  // Handle deleting nodes & edges
  const deleteSelected = () => {
    if (isVisualizing) return;
    if (selectedNodeId) {
      // Remove node
      setNodes(prev => prev.filter(n => n.id !== selectedNodeId));
      // Remove connected edges
      setEdges(prev => prev.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
      // Reset source/target if they were deleted
      if (sourceNodeId === selectedNodeId) setSourceNodeId(null);
      if (targetNodeId === selectedNodeId) setTargetNodeId(null);
      setSelectedNodeId(null);
      playClick();
    } else if (selectedEdgeId) {
      setEdges(prev => prev.filter(e => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
      playClick();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Skip if typing in the inline editor
        if (document.activeElement?.tagName === 'INPUT') return;
        deleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, selectedEdgeId, sourceNodeId, targetNodeId, edges, nodes, isVisualizing]);

  // Edit weight handlers
  const startEditingWeight = (e: React.MouseEvent, edge: Edge) => {
    if (isVisualizing) return;
    e.stopPropagation();
    setEditingEdgeId(edge.id);
    setEditingWeightValue(edge.weight.toString());
  };

  const saveEdgeWeight = () => {
    if (!editingEdgeId) return;
    const value = parseInt(editingWeightValue, 10);
    const validWeight = isNaN(value) ? 1 : value;
    
    setEdges(prev =>
      prev.map(e => (e.id === editingEdgeId ? { ...e, weight: validWeight } : e))
    );
    setEditingEdgeId(null);
    playClick();
  };

  // Render edge line
  const renderEdge = (edge: Edge) => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return null;

    // Geometric edge offsets
    const dx = targetNode.x - sourceNode.x;
    const dy = targetNode.y - sourceNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance === 0) return null;

    // Calculate line coordinates starting from node boundaries
    const startX = sourceNode.x + (dx / distance) * NODE_RADIUS;
    const startY = sourceNode.y + (dy / distance) * NODE_RADIUS;
    const endX = targetNode.x - (dx / distance) * (NODE_RADIUS + (directed ? 6 : 2));
    const endY = targetNode.y - (dy / distance) * (NODE_RADIUS + (directed ? 6 : 2));

    // Midpoint for weight label
    const midX = (sourceNode.x + targetNode.x) / 2;
    const midY = (sourceNode.y + targetNode.y) / 2;

    // Calculate perpendicular offset for curved multi-edges or standard offset
    const offset = 14;
    const angle = Math.atan2(dy, dx);
    const labelX = midX - offset * Math.sin(angle);
    const labelY = midY + offset * Math.cos(angle);

    // Highlighting classes based on visualization steps
    let strokeColor = 'stroke-slate-300 dark:stroke-slate-700';
    let strokeWidth = 'stroke-[2.5]';
    let isPath = false;

    // Check if this edge is in the current relaxed list
    const isRelaxing = currentStep?.relaxedEdgeIds.includes(edge.id);

    // Check if edge is in the final shortest path
    if (shortestPath.length > 1) {
      for (let i = 0; i < shortestPath.length - 1; i++) {
        const u = shortestPath[i];
        const v = shortestPath[i + 1];
        if (
          (edge.source === u && edge.target === v) ||
          (!directed && ((edge.source === u && edge.target === v) || (edge.source === v && edge.target === u)))
        ) {
          isPath = true;
          break;
        }
      }
    }

    if (isRelaxing) {
      strokeColor = 'stroke-amber-500 dark:stroke-amber-400';
      strokeWidth = 'stroke-[3.5]';
    } else if (isPath) {
      strokeColor = 'stroke-emerald-500 dark:stroke-emerald-400';
      strokeWidth = 'stroke-[3.5]';
    } else if (selectedEdgeId === edge.id) {
      strokeColor = 'stroke-indigo-500 dark:stroke-indigo-400';
      strokeWidth = 'stroke-[3]';
    }

    const markerId = isRelaxing
      ? 'arrow-relaxing'
      : isPath
      ? 'arrow-path'
      : selectedEdgeId === edge.id
      ? 'arrow-selected'
      : 'arrow-default';

    return (
      <g key={edge.id} className="graph-edge group cursor-pointer" onClick={(e) => {
        if (isVisualizing) return;
        e.stopPropagation();
        setSelectedEdgeId(edge.id);
        setSelectedNodeId(null);
      }}>
        {/* Invisible wider interaction line */}
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          className="stroke-transparent stroke-[12] cursor-pointer"
        />
        
        {/* Render visible line */}
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          className={`transition-all duration-300 ${strokeColor} ${strokeWidth}`}
          markerEnd={directed ? `url(#${markerId})` : undefined}
        />

        {/* Edge weight background & text */}
        <g className="edge-weight-container" onDoubleClick={(e) => startEditingWeight(e, edge)}>
          <circle
            cx={labelX}
            cy={labelY}
            r="12"
            className="fill-white/80 dark:fill-slate-900/80 stroke-slate-200 dark:stroke-slate-800 stroke-[1] drop-shadow-sm group-hover:scale-110 transition-transform duration-200"
          />
          <text
            x={labelX}
            y={labelY + 4}
            textAnchor="middle"
            className="text-[10px] font-bold fill-slate-700 dark:fill-slate-300 select-none"
          >
            {edge.weight}
          </text>
        </g>

        {/* Inline editor absolute position proxy */}
        {editingEdgeId === edge.id && (
          <foreignObject x={labelX - 25} y={labelY - 14} width="50" height="28">
            <input
              ref={inputRef}
              type="text"
              value={editingWeightValue}
              onChange={(e) => setEditingWeightValue(e.target.value)}
              onBlur={saveEdgeWeight}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdgeWeight();
                if (e.key === 'Escape') setEditingEdgeId(null);
              }}
              className="w-full h-full text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-800 border border-indigo-500 rounded shadow-lg focus:outline-none"
            />
          </foreignObject>
        )}
      </g>
    );
  };

  return (
    <div className="relative w-full h-[500px] rounded-2xl glass overflow-hidden border border-white/20 dark:border-slate-800/60 shadow-inner">
      {/* Action shortcuts help top-left */}
      {showShortcuts ? (
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-1 text-[11px] text-slate-500 dark:text-slate-400 select-none bg-slate-50/80 dark:bg-slate-900/80 px-3.5 py-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-md max-w-[280px]">
          <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/60 pb-1.5 mb-1.5 font-bold text-slate-600 dark:text-slate-300">
            <span>Shortcuts Guide</span>
            <button
              onClick={() => setShowShortcuts(false)}
              className="p-0.5 rounded hover:bg-slate-200/50 dark:hover:bg-slate-850 cursor-pointer"
            >
              <X size={12} />
            </button>
          </div>
          <div>🖱️ Click grid to add Node</div>
          <div>🔗 <kbd className="font-bold border px-1 rounded text-[9px]">Ctrl</kbd> + drag to connect</div>
          <div>🤏 Drag node to move</div>
          <div>🏷️ Double-click weight to edit</div>
          <div>🗑️ Select + <kbd className="font-bold border px-1 rounded text-[9px]">Del</kbd> to remove</div>
        </div>
      ) : (
        <button
          onClick={() => setShowShortcuts(true)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/80 px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-sm hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
        >
          <HelpCircle size={12} /> Shortcuts Guide
        </button>
      )}

      {/* Editor floating toolbar top-right */}
      {!isVisualizing && (selectedNodeId || selectedEdgeId) && (
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {selectedNodeId && (
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setSourceNodeId(selectedNodeId);
                  playClick();
                }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
                  sourceNodeId === selectedNodeId
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Set as starting node"
              >
                Set Source
              </button>
              <button
                onClick={() => {
                  setTargetNodeId(selectedNodeId);
                  playClick();
                }}
                className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all duration-200 ${
                  targetNodeId === selectedNodeId
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title="Set as destination node"
              >
                Set Target
              </button>
            </div>
          )}
          <button
            onClick={deleteSelected}
            className="flex items-center justify-center p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 transition-colors duration-200"
            title="Delete selection"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair bg-grid"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          {/* Arrow markers for directed edges */}
          <marker id="arrow-default" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" className="fill-slate-300 dark:fill-slate-700" />
          </marker>
          <marker id="arrow-selected" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" className="fill-indigo-500 dark:fill-indigo-400" />
          </marker>
          <marker id="arrow-relaxing" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" className="fill-amber-500 dark:fill-amber-400" />
          </marker>
          <marker id="arrow-path" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 9 5 L 0 8.5 z" className="fill-emerald-500 dark:fill-emerald-400" />
          </marker>
        </defs>

        {/* 1. Render Edges */}
        <g>{edges.map(edge => renderEdge(edge))}</g>

        {/* 2. Render Temporary connecting line */}
        {connectingSourceId && (() => {
          const sourceNode = nodes.find(n => n.id === connectingSourceId);
          if (!sourceNode) return null;
          return (
            <line
              x1={sourceNode.x}
              y1={sourceNode.y}
              x2={mousePos.x}
              y2={mousePos.y}
              className="stroke-indigo-400 stroke-[2] stroke-dasharray-[4,4] pointer-events-none"
            />
          );
        })()}

        {/* 3. Render Nodes */}
        <g>
          {nodes.map(node => {
            const isSource = sourceNodeId === node.id;
            const isTarget = targetNodeId === node.id;
            const isCurrent = currentStep?.currentNodeId === node.id;
            const isVisited = currentStep?.visitedNodeIds.includes(node.id);
            const isPath = shortestPath.includes(node.id);
            const isSelected = selectedNodeId === node.id;

            // Determine colors and borders based on state
            let bgFill = 'fill-white dark:fill-slate-900';
            let strokeColor = 'stroke-slate-300 dark:stroke-slate-700';
            let strokeWidth = 'stroke-[2]';
            let ringGlow = null;

            if (isCurrent) {
              bgFill = 'fill-amber-500/20 dark:fill-amber-500/30';
              strokeColor = 'stroke-amber-500';
              strokeWidth = 'stroke-[3]';
              ringGlow = <circle cx={node.x} cy={node.y} r={NODE_RADIUS + 6} className="fill-transparent stroke-amber-500/40 stroke-[1.5] node-glow-pulse pointer-events-none" />;
            } else if (isPath) {
              bgFill = 'fill-emerald-500 dark:fill-emerald-600';
              strokeColor = 'stroke-emerald-300 dark:stroke-emerald-400';
              strokeWidth = 'stroke-[2.5]';
            } else if (isVisited) {
              bgFill = 'fill-indigo-500/20 dark:fill-indigo-900/30';
              strokeColor = 'stroke-indigo-500 dark:stroke-indigo-400';
              strokeWidth = 'stroke-[2]';
            } else if (isSource) {
              bgFill = 'fill-amber-500 dark:fill-amber-600';
              strokeColor = 'stroke-amber-300 dark:stroke-amber-400';
              strokeWidth = 'stroke-[2.5]';
            } else if (isTarget) {
              bgFill = 'fill-emerald-500 dark:fill-emerald-600';
              strokeColor = 'stroke-emerald-300 dark:stroke-emerald-400';
              strokeWidth = 'stroke-[2.5]';
            } else if (isSelected) {
              strokeColor = 'stroke-indigo-500 dark:stroke-indigo-400';
              strokeWidth = 'stroke-[3.5]';
            }

            return (
              <g
                key={node.id}
                data-node-id={node.id}
                className="graph-node cursor-grab active:cursor-grabbing group"
                onMouseDown={(e) => handleNodeMouseDown(e, node)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                  setSelectedEdgeId(null);
                }}
              >
                {ringGlow}
                {/* Node outer drop shadow / highlight ring */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  className={`transition-all duration-300 ${bgFill} ${strokeColor} ${strokeWidth} shadow-sm group-hover:stroke-[3.5] dark:group-hover:stroke-indigo-400 group-hover:stroke-indigo-500`}
                />
                
                {/* Node Label Text */}
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className={`text-xs font-extrabold select-none pointer-events-none transition-colors duration-300 ${
                    isPath || (isSource && !isCurrent) || (isTarget && !isCurrent)
                      ? 'fill-white'
                      : 'fill-slate-800 dark:fill-slate-100'
                  }`}
                >
                  {node.label}
                </text>

                {/* Node badges (S for Source, T for Target) */}
                {(isSource || isTarget) && (
                  <g className="pointer-events-none">
                    <circle
                      cx={node.x + NODE_RADIUS - 6}
                      cy={node.y - NODE_RADIUS + 6}
                      r="7"
                      className={`${isSource ? 'fill-amber-500' : 'fill-emerald-500'} stroke-white dark:stroke-slate-900 stroke-[1.5]`}
                    />
                    <text
                      x={node.x + NODE_RADIUS - 6}
                      y={node.y - NODE_RADIUS + 9}
                      textAnchor="middle"
                      className="text-[8px] font-black fill-white select-none"
                    >
                      {isSource ? 'S' : 'T'}
                    </text>
                  </g>
                )}

                {/* Current node tooltip */}
                {isCurrent && (
                  <foreignObject
                    x={node.x - 30}
                    y={node.y - NODE_RADIUS - 22}
                    width="60"
                    height="20"
                    className="pointer-events-none overflow-visible"
                  >
                    <div className="bg-amber-500 text-[9px] font-extrabold text-white text-center rounded px-1 py-0.5 shadow-md uppercase tracking-wider">
                      Current
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Empty canvas hint when no nodes exist */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 mb-4 animate-pulse">
            <Play size={24} className="ml-1" />
          </div>
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Your Canvas is Empty</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center max-w-xs mt-1">
            Click anywhere on the canvas grid above to add nodes and start designing your graph.
          </p>
        </div>
      )}
    </div>
  );
};

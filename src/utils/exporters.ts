import type { Node, Edge, AlgorithmStats } from '../types/graph';
import { jsPDF } from 'jspdf';

// 1. Export graph as JSON
export function exportGraphAsJSON(nodes: Node[], edges: Edge[], directed: boolean) {
  const data = JSON.stringify({ nodes, edges, directed }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `shortest-path-graph-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 2. Import graph from JSON
export function importGraphFromJSON(file: File): Promise<{ nodes: Node[]; edges: Edge[]; directed: boolean }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          resolve({
            nodes: data.nodes,
            edges: data.edges,
            directed: typeof data.directed === 'boolean' ? data.directed : false
          });
        } else {
          reject(new Error('Invalid JSON structure: missing nodes or edges array.'));
        }
      } catch (err) {
        reject(new Error('Failed to parse JSON file.'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error.'));
    reader.readAsText(file);
  });
}

// 3. Export SVG canvas to PNG
export function exportGraphAsPNG(svgElement: SVGSVGElement | null) {
  if (!svgElement) return;

  const svgString = new XMLSerializer().serializeToString(svgElement);
  // Ensure styles and fonts are parsed correctly by wrapping
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const image = new Image();

  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = svgElement.getBoundingClientRect().width * 2; // high-res
    canvas.height = svgElement.getBoundingClientRect().height * 2;
    const context = canvas.getContext('2d');

    if (context) {
      context.scale(2, 2);
      // Theme detection
      const isDark = document.documentElement.classList.contains('dark');
      
      // Draw background
      context.fillStyle = isDark ? '#0f172a' : '#f8fafc';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      context.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)';
      context.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < canvas.width; x += gridSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
        context.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
        context.stroke();
      }

      context.drawImage(image, 0, 0, svgElement.getBoundingClientRect().width, svgElement.getBoundingClientRect().height);
      
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = 'graph-visualization.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    URL.revokeObjectURL(url);
  };
  
  image.src = url;
}

// 4. Download PDF Execution Report
export function exportExecutionReportPDF(
  nodes: Node[],
  edges: Edge[],
  directed: boolean,
  sourceId: string | null,
  targetId: string | null,
  dijkstraStats: AlgorithmStats | null,
  bellmanFordStats: AlgorithmStats | null,
  activeAlgorithm: 'dijkstra' | 'bellman-ford'
) {
  const doc = new jsPDF();
  const sourceNode = nodes.find(n => n.id === sourceId);
  const targetNode = nodes.find(n => n.id === targetId);

  // Cover Style Header
  doc.setFillColor(15, 23, 42); // slate-900 background
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('SHORTEST PATH VISUALIZER REPORT', 14, 25);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

  // SECTION 1: Graph Summary
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Graph Topology Summary', 14, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`* Total Vertices (Nodes): ${nodes.length}`, 18, 70);
  doc.text(`* Total Directed Edges: ${edges.length} (${directed ? 'Directed' : 'Undirected'} Graph)`, 18, 76);
  doc.text(`* Path Query: Node [${sourceNode?.label || 'None'}] to Node [${targetNode?.label || 'None'}]`, 18, 82);
  doc.text(`* Active Algorithm Mode: ${activeAlgorithm === 'dijkstra' ? "Dijkstra's (Min-Heap)" : 'Bellman-Ford (Relaxation)'}`, 18, 88);

  // Edges Details Table
  doc.setFont('helvetica', 'bold');
  doc.text('Graph Edge List:', 14, 94);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let edgeY = 102;
  
  edges.slice(0, 8).forEach((edge, idx) => {
    const sName = nodes.find(n => n.id === edge.source)?.label || edge.source;
    const tName = nodes.find(n => n.id === edge.target)?.label || edge.target;
    doc.text(`  Edge ${idx + 1}:  Node ${sName}  ${directed ? '→' : '—'}  Node ${tName}  (Weight: ${edge.weight})`, 18, edgeY);
    edgeY += 6;
  });
  if (edges.length > 8) {
    doc.text(`  ... and ${edges.length - 8} more edges.`, 18, edgeY);
    edgeY += 6;
  }

  // SECTION 2: Algorithm Performance Results
  const statsY = edgeY + 12;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Computational Results', 14, statsY);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const formatPath = (path: string[]) => {
    if (path.length === 0) return 'Unreachable';
    return path.map(id => nodes.find(n => n.id === id)?.label || id).join(' -> ');
  };

  if (dijkstraStats) {
    doc.setFont('helvetica', 'bold');
    doc.text("Dijkstra's Algorithm Output:", 14, statsY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`* Path Found: ${formatPath(dijkstraStats.shortestPath)}`, 18, statsY + 16);
    doc.text(`* Total Distance: ${dijkstraStats.totalDistance === -1 ? 'Infinity' : dijkstraStats.totalDistance}`, 18, statsY + 22);
    doc.text(`* Execution Speed: ${dijkstraStats.executionTimeMs} ms`, 18, statsY + 28);
    doc.text(`* Edge Relaxations: ${dijkstraStats.relaxationsCount} operations`, 18, statsY + 34);
  }

  if (bellmanFordStats) {
    const bfStartY = statsY + 46;
    doc.setFont('helvetica', 'bold');
    doc.text('Bellman-Ford Algorithm Output:', 14, bfStartY);
    doc.setFont('helvetica', 'normal');
    if (bellmanFordStats.hasNegativeCycle) {
      doc.setTextColor(225, 29, 72); // Rose-600
      doc.text('* Path Found: UNDEFINED (Negative-Weight Cycle Detected!)', 18, bfStartY + 6);
      doc.setTextColor(15, 23, 42);
    } else {
      doc.text(`* Path Found: ${formatPath(bellmanFordStats.shortestPath)}`, 18, bfStartY + 6);
    }
    doc.text(`* Total Distance: ${bellmanFordStats.totalDistance === -1 ? 'Infinity' : bellmanFordStats.totalDistance}`, 18, bfStartY + 12);
    doc.text(`* Execution Speed: ${bellmanFordStats.executionTimeMs} ms`, 18, bfStartY + 18);
    doc.text(`* Edge Relaxations: ${bellmanFordStats.relaxationsCount} operations`, 18, bfStartY + 24);
  }

  // Footer Branding
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated using Shortest Path Visualizer Dashboard. Designed for DAA Coursework.', 14, 285);

  doc.save(`shortest-path-report-${new Date().toISOString().slice(0,10)}.pdf`);
}

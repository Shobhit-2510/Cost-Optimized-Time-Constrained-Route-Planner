"use client";

import { useCallback, useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

const NODE_WIDTH = 110;
const NODE_HEIGHT = 38;

function getNodeStyle(id, selectedSource, selectedDest, solutionPath, visitedNodes) {
  const onPath = solutionPath.includes(id);
  const isSource = id === selectedSource;
  const isDest = id === selectedDest;
  const isVisited = visitedNodes?.includes(id);

  if (isSource)
    return {
      background: "#064e3b",
      color: "#ecfdf5",
      border: "1.5px solid #10b981",
      borderRadius: 6,
      boxShadow: "0 0 12px rgba(16, 185, 129, 0.2)",
    };
  if (isDest)
    return {
      background: "#1e3a8a",
      color: "#eff6ff",
      border: "1.5px solid #3b82f6",
      borderRadius: 6,
      boxShadow: "0 0 12px rgba(59, 130, 246, 0.2)",
    };
  if (onPath)
    return {
      background: "#2e1065",
      color: "#faf5ff",
      border: "1.5px solid #8b5cf6",
      borderRadius: 6,
    };
  if (isVisited)
    return {
      background: "#18181b",
      color: "#a1a1aa",
      border: "1px solid #3f3f46",
      borderRadius: 6,
    };
  return {
    background: "#111114",
    color: "#d4d4d8",
    border: "1px solid #27272a",
    borderRadius: 6,
  };
}

export default function GraphView({
  nodes: cityNodes = [],
  edges: edgeList = [],
  solutionPath = [],
  selectedSource = null,
  selectedDest = null,
  visitedNodes = [],
  onNodeClick,
}) {
  const rfNodes = useMemo(() => {
    if (!cityNodes.length) return [];

    const lats = cityNodes.map((n) => n.lat);
    const lngs = cityNodes.map((n) => n.lng);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);

    const count = cityNodes.length;
    const CANVAS_W = Math.max(1200, Math.round(Math.sqrt(count) * 160));
    const CANVAS_H = Math.max(650, Math.round(Math.sqrt(count) * 120));

    return cityNodes.map((node) => ({
      id: String(node.id),
      data: {
        label: (
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium leading-tight">{node.name}</span>
            <span className="text-[9px] font-mono opacity-60">₹{node.fee}</span>
          </div>
        ),
      },
      position: {
        x: ((node.lng - minLng) / (maxLng - minLng || 1)) * CANVAS_W,
        y: (1 - (node.lat - minLat) / (maxLat - minLat || 1)) * CANVAS_H,
      },
      style: getNodeStyle(node.id, selectedSource, selectedDest, solutionPath, visitedNodes),
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }));
  }, [cityNodes, selectedSource, selectedDest, solutionPath, visitedNodes]);

  const rfEdges = useMemo(() => {
    if (!edgeList.length) return [];
    return edgeList.map(([u, v, t], idx) => {
      const onPath =
        solutionPath.length >= 2 &&
        solutionPath.some(
          (n, i) =>
            i < solutionPath.length - 1 &&
            ((solutionPath[i] === u && solutionPath[i + 1] === v) ||
              (solutionPath[i] === v && solutionPath[i + 1] === u))
        );

      const color = onPath ? "#3b82f6" : "#27272a";

      return {
        id: `e${idx}-${u}-${v}`,
        source: String(u),
        target: String(v),
        label: `${Math.round((t / 60) * 10) / 10}h`,
        labelStyle: { fontSize: 9, fill: "#71717a", fontFamily: "monospace" },
        labelBgStyle: { fill: "#111114", fillOpacity: 0.9 },
        style: { stroke: color, strokeWidth: onPath ? 2.5 : 1, opacity: onPath ? 1 : 0.5 },
        markerEnd: { type: MarkerType.Arrow, color },
        animated: onPath,
      };
    });
  }, [edgeList, solutionPath]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(rfNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => setFlowNodes(rfNodes), [rfNodes, setFlowNodes]);
  useEffect(() => setFlowEdges(rfEdges), [rfEdges, setFlowEdges]);

  const handleNodeClick = useCallback(
    (_, node) => {
      onNodeClick && onNodeClick(Number(node.id));
    },
    [onNodeClick]
  );

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-[#232328]" style={{ minHeight: 400 }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1a1a20" gap={20} size={1} />
        <Controls
          style={{
            background: "#121215",
            border: "1px solid #27272a",
            borderRadius: 6,
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const id = Number(n.id);
            if (id === selectedSource) return "#10b981";
            if (id === selectedDest) return "#3b82f6";
            if (solutionPath.includes(id)) return "#8b5cf6";
            return "#27272a";
          }}
          style={{ background: "#111114", border: "1px solid #27272a", borderRadius: 6 }}
          maskColor="rgba(9, 9, 11, 0.6)"
        />
      </ReactFlow>
    </div>
  );
}

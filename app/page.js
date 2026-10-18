"use client";

import { useState, useCallback, useEffect, lazy, Suspense } from "react";
import { NATIONAL_HIGHWAY_NODES, NATIONAL_HIGHWAY_EDGES, DEFAULT_NATIONAL_PASSING_FEES } from "@/app/lib/nationalHighways";
import { Tabs, Spinner, Badge } from "@/app/components/ui";
import RouteControls from "@/app/components/RouteControls";
import ResultPanel from "@/app/components/ResultPanel";
import AIPanel from "@/app/components/AIPanel";
import {
  Navigation,
  Map as MapIcon,
  Sparkles,
  Database,
  Info,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";

// Lazy load heavy components
const MapView = lazy(() => import("@/app/components/MapView"));

const PANEL_TABS = [
  { id: "ai", label: "Intelligence", icon: Sparkles },
  { id: "edges", label: "Network Matrix", icon: Database },
];

export default function Home() {
  // Graph state
  const [nodes, setNodes] = useState(NATIONAL_HIGHWAY_NODES);
  const [dbEdges, setDbEdges] = useState([]);
  const [displayEdges, setDisplayEdges] = useState(NATIONAL_HIGHWAY_EDGES);

  // Route state
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDest, setSelectedDest] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [currentAlgo, setCurrentAlgo] = useState("dijkstra");

  // UI state
  const [activePanel, setActivePanel] = useState("ai");
  const [notification, setNotification] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState("intelligence");

  useEffect(() => {
    fetchEdges();
  }, []);

  async function fetchEdges() {
    try {
      // 1. Fetch Highway Edges
      const res = await fetch("/api/edgeCollection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setDbEdges(data);
        const mapped = data.map((e) => [
          Number(e.source_node),
          Number(e.destination_node),
          Number(e.time),
          e.transport_type || "road",
        ]);
        setDisplayEdges(mapped);
      }

      // 2. Fetch Nodes
      const nodeRes = await fetch("/api/nodeCollection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const nodeData = await nodeRes.json();
      if (Array.isArray(nodeData) && nodeData.length > 0) {
        setNodes(nodeData);
      }
    } catch (err) {
      console.error("Failed to load network topology:", err);
    }
  }

  function showNotification(msg, type = "success") {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }

  // Solve route
  const handleSolve = useCallback(
    async ({
      algorithm = "dijkstra",
      optimizeFor = "time",
      maxTime = 99999,
      maxCost = 99999,
      sourceId,
      destId,
    } = {}) => {
      const src = sourceId !== undefined && sourceId !== null ? Number(sourceId) : selectedSource;
      const dst = destId !== undefined && destId !== null ? Number(destId) : selectedDest;

      if (src === null || dst === null || src === undefined || dst === undefined) {
        showNotification("Specify both origin and destination vertices", "error");
        return;
      }
      if (src === dst) {
        showNotification("Origin and destination must be distinct", "error");
        return;
      }

      setIsLoading(true);
      setLoadError("");
      setResult(null);
      setCurrentAlgo(algorithm);

      try {
        const res = await fetch("/api/solve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: src,
            destId: dst,
            optimizeFor,
            maxTime,
            maxCost,
            algorithm,
            nodes,
            passingFees: DEFAULT_NATIONAL_PASSING_FEES,
          }),
        });

        const data = await res.json();

        if (data.error) {
          setLoadError(data.error);
          showNotification(data.error, "error");
          return;
        }

        setResult({ ...data, maxTime });

        if (data.cost === -1) {
          showNotification("No feasible path found within the time limit", "warning");
        } else {
          showNotification(
            `Solution computed: ₹${data.cost} across ${data.pathNames?.length} nodes`,
            "success"
          );
        }
      } catch (err) {
        setLoadError(err.message);
        showNotification("Routing calculation failed", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedSource, selectedDest, nodes]
  );

  // Add edge
  const handleAddEdge = useCallback(async (edgeData) => {
    try {
      const res = await fetch("/api/addEdge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edgeData),
      });
      const data = await res.json();
      if (data.success) {
        await fetchEdges();
        showNotification(data.message);
      } else {
        showNotification(data.message, "warning");
      }
      return data;
    } catch {
      showNotification("Failed to add edge", "error");
      return { message: "Error" };
    }
  }, []);

  // Delete edge
  const handleDeleteEdge = useCallback(async (edgeData) => {
    try {
      const res = await fetch("/api/deleteEdge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(edgeData),
      });
      const data = await res.json();
      if (data.success) {
        await fetchEdges();
        showNotification(data.message);
      } else {
        showNotification(data.message, "warning");
      }
      return data;
    } catch {
      showNotification("Failed to delete edge", "error");
      return { message: "Error" };
    }
  }, []);

  // Load preset dataset into DB
  const handleLoadPreset = useCallback(async () => {
    setIsLoading(true);
    showNotification("Synchronizing highway network topology...", "info");
    try {
      const res = await fetch("/api/loadPreset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchEdges();
        showNotification(data.message, "success");
      } else {
        showNotification(data.error || "Failed to load preset", "error");
      }
    } catch {
      showNotification("Failed to load preset", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle AI route extraction and auto-solve
  const handleAIRoute = useCallback(
    (parsed) => {
      const src = parsed.sourceId !== undefined && parsed.sourceId !== null ? Number(parsed.sourceId) : null;
      const dst = parsed.destId !== undefined && parsed.destId !== null ? Number(parsed.destId) : null;

      if (src !== null) setSelectedSource(src);
      if (dst !== null) setSelectedDest(dst);

      showNotification(`Identified: ${parsed.sourceName} → ${parsed.destName}`, "info");

      if (src !== null && dst !== null && src !== dst) {
        handleSolve({
          sourceId: src,
          destId: dst,
          algorithm: parsed.algorithm || (parsed.optimizeFor === "cost" ? "dijkstra" : "astar"),
          optimizeFor: parsed.optimizeFor || "cost",
          maxTime: parsed.maxTime || 99999,
          maxCost: parsed.maxCost || 99999,
        });
      }
    },
    [handleSolve]
  );


  // Node click handler
  const handleNodeClick = useCallback(
    (nodeId) => {
      if (selectedSource === null) {
        setSelectedSource(nodeId);
        showNotification(`Origin set: ${nodes[nodeId]?.name}`, "info");
      } else if (selectedDest === null && nodeId !== selectedSource) {
        setSelectedDest(nodeId);
        showNotification(`Destination set: ${nodes[nodeId]?.name}`, "info");
      } else {
        setSelectedSource(nodeId);
        setSelectedDest(null);
        showNotification(`Origin set: ${nodes[nodeId]?.name}`, "info");
      }
    },
    [selectedSource, selectedDest, nodes]
  );

  const solutionPath = result?.path || [];

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-neutral-100 font-sans selection:bg-neutral-800 selection:text-white">
      {/* Classic Navbar */}
      <header className="min-h-13 border-b border-[#232328] bg-[#0f0f12] px-3 sm:px-5 py-2 flex items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-7 w-7 rounded bg-[#1c1c22] border border-[#2e2e38] flex items-center justify-center text-neutral-200">
            <Navigation className="h-4 w-4" />
          </div>
          <div className="flex items-baseline gap-2.5 min-w-0">
            <h1 className="text-sm font-semibold tracking-tight text-neutral-100 truncate">
              Smart Route Planner
            </h1>
            <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">
              Transit Topology & Multi-Criteria Optimization
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="indigo" className="hidden sm:inline-flex">Gemini 3.8</Badge>
          <Badge variant="default" className="hidden md:inline-flex">Leaflet Engine</Badge>
          <Badge variant="default" className="hidden lg:inline-flex">Atlas Cluster</Badge>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="lg:hidden p-1.5 rounded text-neutral-300 hover:bg-[#25252b] hover:text-white"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed top-[52px] right-3 z-50 w-56 rounded-md border border-[#2b2b34] bg-[#121216] p-1.5 shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setMobileSection("find-route");
              setMobileMenuOpen(false);
            }}
            className="w-full rounded px-3 py-2 text-left text-xs text-neutral-300 hover:bg-[#202026]"
          >
            Find Route
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePanel("edges");
              setMobileSection("network-matrix");
              setMobileMenuOpen(false);
            }}
            className="w-full rounded px-3 py-2 text-left text-xs text-neutral-300 hover:bg-[#202026]"
          >
            Network Matrix
          </button>
          <button
            type="button"
            onClick={() => {
              setMobileSection("network-data");
              setMobileMenuOpen(false);
            }}
            className="w-full rounded px-3 py-2 text-left text-xs text-neutral-300 hover:bg-[#202026]"
          >
            Network Data
          </button>
        </div>
      )}

      {mobileSection === "network-matrix" && (
        <div className="lg:hidden p-3.5 border-b border-[#232328] bg-[#0e0e11]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Active Topology Matrix
              </span>
              <Badge variant="default">{dbEdges.length} records</Badge>
            </div>
            {dbEdges.length === 0 ? (
              <div className="text-center py-8 text-neutral-400 text-xs">
                <Database className="h-6 w-6 mx-auto mb-2 opacity-40" />
                <p>Database collection empty</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                {dbEdges.map((edge, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[#141418] border border-[#222228] text-xs"
                  >
                    <span className="text-neutral-300 truncate">
                      {nodes[edge.source_node]?.name || `Node ${edge.source_node}`} →{" "}
                      {nodes[edge.destination_node]?.name || `Node ${edge.destination_node}`}
                    </span>
                    <span className="text-neutral-400 shrink-0">{edge.time}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed top-16 right-5 z-50 px-3.5 py-2 rounded-md shadow-lg text-xs font-medium border flex items-center gap-2 animate-fade-in ${
            notification.type === "error"
              ? "bg-red-950/90 border-red-800 text-red-200"
              : notification.type === "warning"
              ? "bg-amber-950/90 border-amber-800 text-amber-200"
              : notification.type === "info"
              ? "bg-[#181820] border-[#31313e] text-neutral-200"
              : "bg-emerald-950/90 border-emerald-800 text-emerald-200"
          }`}
        >
          {notification.type === "error" && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
          {notification.type === "warning" && <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />}
          {notification.type === "info" && <Info className="h-3.5 w-3.5 text-blue-400" />}
          {notification.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* 3-Panel Main Layout */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-visible lg:overflow-hidden lg:h-[calc(100vh-52px)]">
        {/* Left Sidebar: Controls */}
        <aside className="w-full lg:w-76 shrink-0 border-b lg:border-b-0 lg:border-r border-[#232328] bg-[#0e0e11] flex flex-col overflow-visible lg:overflow-y-auto">
          <div className="p-3.5 flex-1">
            <RouteControls
              nodes={nodes}
              onSolve={handleSolve}
              onAddEdge={handleAddEdge}
              onDeleteEdge={handleDeleteEdge}
              onRefreshData={fetchEdges}
              isLoading={isLoading}
              selectedSource={selectedSource}
              selectedDest={selectedDest}
              onSourceChange={setSelectedSource}
              onDestChange={setSelectedDest}
              mobileSection={mobileSection}
              mobileIntelligence={
                <AIPanel
                  onRouteExtracted={handleAIRoute}
                  routeResult={result}
                  nodes={nodes}
                />
              }
            />
          </div>

          <div className="p-3.5 border-t border-[#1d1d23]">
            <div className="rounded bg-[#141418] border border-[#232328] p-2.5 flex items-start gap-2 text-[11px] text-neutral-400 leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 text-neutral-400 mt-0.5" />
              <span>
                Click any district hub on the map to toggle origin and destination.
              </span>
            </div>
          </div>
        </aside>

        {/* Center Canvas: Geographic Highway Map */}
        <main className="w-full lg:flex-1 min-w-0 min-h-[460px] flex flex-col overflow-visible lg:overflow-hidden bg-[#0a0a0d]">
          {/* Map Header Bar */}
          <div className="px-3 sm:px-4 py-2.5 border-b border-[#232328] bg-[#0e0e11]/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MapIcon className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
                Geographic Highway Route Map
              </span>
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono text-neutral-400 text-right shrink-0">
              {nodes.length} Districts • {displayEdges.length} Highway Segments
            </div>
          </div>

          {/* Interactive Map Canvas */}
          <div className="h-[52vh] min-h-[320px] max-h-[620px] lg:h-auto lg:flex-1 p-2 sm:p-3 overflow-hidden">
            <Suspense
              fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner size="md" />
                    <span className="text-xs text-neutral-400 font-mono">Initializing projection...</span>
                  </div>
                </div>
              }
            >
              <MapView
                nodes={nodes}
                edges={displayEdges}
                solutionPath={solutionPath}
                selectedSource={selectedSource}
                selectedDest={selectedDest}
                onNodeClick={handleNodeClick}
              />
            </Suspense>
          </div>

          {/* Result Output Bar */}
          {(result || isLoading) && (
            <div className="border-t border-[#232328] p-3 sm:p-3.5 bg-[#0e0e11] max-h-96 lg:max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center gap-2.5 text-xs text-neutral-400 font-mono py-2">
                  <Spinner size="sm" />
                  <span>Computing shortest path under constraints ({currentAlgo})...</span>
                </div>
              ) : (
                <ResultPanel result={result} nodes={nodes} />
              )}
            </div>
          )}
        </main>

        {/* Right Panel: Intelligence & Network Matrix */}
        <aside className="hidden lg:flex w-full lg:w-80 shrink-0 min-h-[380px] lg:min-h-0 border-t lg:border-t-0 lg:border-l border-[#232328] bg-[#0e0e11] flex-col overflow-hidden">
          <div className="p-2.5 border-b border-[#232328]">
            <Tabs tabs={PANEL_TABS} active={activePanel} onChange={setActivePanel} />
          </div>

          <div className="flex-1 overflow-y-auto p-3.5">
            {activePanel === "ai" && (
              <AIPanel
                onRouteExtracted={handleAIRoute}
                routeResult={result}
                nodes={nodes}
              />
            )}

            {activePanel === "edges" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Active Topology Matrix
                  </span>
                  <Badge variant="default">{dbEdges.length} records</Badge>
                </div>

                {dbEdges.length === 0 ? (
                  <div className="text-center py-10 text-neutral-400 text-xs space-y-1">
                    <Database className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-neutral-400">Database collection empty</p>
                    <p className="text-[11px] text-neutral-400">Use &quot;Fetch Latest Network from MongoDB&quot; or upload CSV to seed data.</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[580px] overflow-y-auto pr-1">
                    {dbEdges.map((edge, i) => {
                      const srcName = nodes[edge.source_node]?.name || `Node ${edge.source_node}`;
                      const dstName = nodes[edge.destination_node]?.name || `Node ${edge.destination_node}`;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded bg-[#141418] border border-[#222228] text-xs font-mono"
                        >
                          <span className="text-neutral-300 font-sans text-[11px]">
                            {srcName} → {dstName}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-neutral-400 text-[11px]">{edge.time}m</span>
                            <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#1c1c22] border border-[#2b2b34] text-neutral-400">
                              {edge.transport_type || "ROAD"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

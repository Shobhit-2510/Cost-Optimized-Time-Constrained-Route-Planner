"use client";

import { useState, useMemo, useRef } from "react";
import { Button, Input, Select, Textarea, Badge } from "./ui";
import { NATIONAL_HIGHWAY_NODES } from "@/app/lib/nationalHighways";
import {
  Compass,
  Network,
  Plus,
  Trash2,
  Database,
  Car,
  Train,
  Plane,
  Bus,
  Clock,
  IndianRupee,
  UploadCloud,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Search,
} from "lucide-react";

const ALGORITHMS = [
  { value: "dijkstra", label: "Dijkstra", desc: "Shortest path under priority objective" },
  { value: "astar", label: "A* Search", desc: "Heuristic fastest path with spatial guidance" },
  { value: "bellmanford", label: "Bellman-Ford", desc: "Iterative relaxation across all segments" },
  { value: "floydwarshall", label: "Floyd-Warshall", desc: "All-pairs shortest path matrix" },
];

const TRANSPORT_TYPES = [
  { value: "road", label: "Road", icon: Car },
  { value: "train", label: "Train", icon: Train },
  { value: "flight", label: "Flight", icon: Plane },
  { value: "bus", label: "Bus", icon: Bus },
];

export default function RouteControls({
  nodes = NATIONAL_HIGHWAY_NODES,
  onSolve,
  onAddEdge,
  onDeleteEdge,
  onRefreshData,
  onBulkCSVUpload,
  isLoading = false,
  selectedSource,
  selectedDest,
  onSourceChange,
  onDestChange,
}) {
  const [optimizeFor, setOptimizeFor] = useState("time");
  const [algorithm, setAlgorithm] = useState("dijkstra");
  const [maxTimeH, setMaxTimeH] = useState(48);
  const [maxCostRupees, setMaxCostRupees] = useState(1500);
  const [transportType, setTransportType] = useState("road");
  const [edgeSrc, setEdgeSrc] = useState("");
  const [edgeDest, setEdgeDest] = useState("");
  const [edgeTime, setEdgeTime] = useState("");
  const [edgeMsg, setEdgeMsg] = useState("");
  const [section, setSection] = useState("route"); // "route" | "graph"
  const [topologySubTab, setTopologySubTab] = useState("bulk"); // "bulk" | "manual"

  // CSV Ingestion State
  const [csvType, setCsvType] = useState("edges"); // "edges" | "nodes"
  const [csvMode, setCsvMode] = useState("append"); // "append" | "replace"
  const [csvContent, setCsvContent] = useState("");
  const [csvStatus, setCsvStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [districtFilter, setDistrictFilter] = useState("");

  // Filter nodes by query if provided
  const filteredNodes = useMemo(() => {
    if (!districtFilter.trim()) return nodes;
    const q = districtFilter.toLowerCase().trim();
    return nodes.filter(
      (n) =>
        (n.name && n.name.toLowerCase().includes(q)) ||
        (n.state && n.state.toLowerCase().includes(q))
    );
  }, [nodes, districtFilter]);

  // Group nodes by state for clean hierarchical dropdown
  const groupedNodes = useMemo(() => {
    return filteredNodes.reduce((acc, node) => {
      const st = node.state || "National Interchanges";
      if (!acc[st]) acc[st] = [];
      acc[st].push(node);
      return acc;
    }, {});
  }, [filteredNodes]);

  async function handleSolve() {
    onSolve &&
      onSolve({
        algorithm,
        optimizeFor,
        maxTime: maxTimeH * 60,
        maxCost: maxCostRupees,
      });
  }

  async function handleAddEdge() {
    if (!edgeSrc || !edgeDest || !edgeTime) {
      setEdgeMsg("Please fill all fields");
      return;
    }
    setEdgeMsg("");
    const result = await onAddEdge({
      source_node: Number(edgeSrc),
      destination_node: Number(edgeDest),
      time: Number(edgeTime),
      transport_type: transportType,
    });
    setEdgeMsg(result?.message || "Edge updated");
  }

  async function handleDeleteEdge() {
    if (!edgeSrc || !edgeDest) {
      setEdgeMsg("Select source and destination");
      return;
    }
    setEdgeMsg("");
    const result = await onDeleteEdge({
      source_node: Number(edgeSrc),
      destination_node: Number(edgeDest),
    });
    setEdgeMsg(result?.message || "Edge deleted");
  }

  // Handle CSV file selection
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvContent(event.target?.result || "");
      setCsvStatus({ type: "info", text: `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)` });
    };
    reader.readAsText(file);
  }

  // Download All-India CSV templates or full datasets
  function downloadSampleTemplate(fullDataset = false) {
    if (fullDataset) {
      const url =
        csvType === "nodes"
          ? "/templates/india_all_districts_732.csv"
          : "/templates/india_all_highways_2113.csv";
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", url.split("/").pop());
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    let content = "";
    let filename = "";

    if (csvType === "nodes") {
      content = "id,name,state,lat,lng,fee\n100,Varanasi Junction,Uttar Pradesh,25.3176,82.9739,120\n101,Gorakhpur Hub,Uttar Pradesh,26.7606,83.3732,95\n102,Patna Central,Bihar,25.5941,85.1376,110";
      filename = "nodes_district_template.csv";
    } else {
      content = "source_node,destination_node,time,highway_ref,transport_type\n0,1,270,NH-48,road\n0,2,200,Yamuna-Exp,road\n1,45,540,NH-48,road\n45,56,420,NE-1,road";
      filename = "edges_highways_template.csv";
    }

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Submit CSV for bulk ingestion
  async function handleBulkUpload() {
    if (!csvContent.trim()) {
      setCsvStatus({ type: "error", text: "Please select a CSV file or paste content." });
      return;
    }

    setIsUploading(true);
    setCsvStatus({ type: "info", text: "Streaming batch to MongoDB..." });

    try {
      const res = await fetch("/api/uploadCSV", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: csvType,
          csvContent,
          mode: csvMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCsvStatus({ type: "success", text: data.message });
        setCsvContent("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        onRefreshData && onRefreshData();
      } else {
        setCsvStatus({ type: "error", text: data.error || "Upload failed" });
      }
    } catch {
      setCsvStatus({ type: "error", text: "Network error during ingestion." });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Navigation Mode Selector */}
      <div className="grid grid-cols-2 p-1 bg-[#141418] border border-[#232328] rounded-md">
        <button
          onClick={() => setSection("route")}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-all ${
            section === "route"
              ? "bg-[#25252b] text-neutral-100 shadow-sm border border-[#35353d]"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Compass className="h-3.5 w-3.5" />
          <span>Planner</span>
        </button>
        <button
          onClick={() => setSection("graph")}
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded transition-all ${
            section === "graph"
              ? "bg-[#25252b] text-neutral-100 shadow-sm border border-[#35353d]"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Database className="h-3.5 w-3.5" />
          <span>Network Data</span>
        </button>
      </div>

      {/* ── PLANNER VIEW (USER-FACING) ─────────────────────────────────── */}
      {section === "route" && (
        <div className="space-y-4">
          <div className="space-y-3">
            {/* Quick District Search Filter */}
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#141418] border border-[#232328] rounded-md focus-within:border-blue-500/50 transition-colors">
                <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                <input
                  type="text"
                  placeholder={`Search ${nodes.length} districts across India...`}
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="w-full bg-transparent text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
                />
                {districtFilter && (
                  <button
                    type="button"
                    onClick={() => setDistrictFilter("")}
                    className="text-[11px] text-neutral-400 hover:text-neutral-200 px-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <Select
              label="Origin City / District"
              value={selectedSource ?? ""}
              onChange={(e) => onSourceChange(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">Select origin hub...</option>
              {Object.entries(groupedNodes).map(([state, cityList]) => (
                <optgroup key={state} label={state} className="bg-[#141418] text-neutral-400 font-semibold">
                  {cityList.map((n) => (
                    <option key={n.id} value={n.id} className="text-neutral-100 font-normal">
                      {n.name} (Toll: ₹{n.fee})
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>

            <Select
              label="Destination City / Interchange"
              value={selectedDest ?? ""}
              onChange={(e) => onDestChange(e.target.value === "" ? null : Number(e.target.value))}
            >
              <option value="">Select destination hub...</option>
              {Object.entries(groupedNodes).map(([state, cityList]) => (
                <optgroup key={state} label={state} className="bg-[#141418] text-neutral-400 font-semibold">
                  {cityList.map((n) => (
                    <option key={n.id} value={n.id} className="text-neutral-100 font-normal">
                      {n.name} (Toll: ₹{n.fee})
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </div>

          {/* Explicit Optimization Objective Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              Optimize For
            </label>
            <div className="grid grid-cols-2 p-1 bg-[#141418] border border-[#232328] rounded-md gap-1">
              <button
                type="button"
                onClick={() => setOptimizeFor("time")}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded transition-all ${
                  optimizeFor === "time"
                    ? "bg-[#22222a] text-blue-300 font-semibold shadow-sm border border-blue-900/60"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-[#18181e]"
                }`}
              >
                <Clock className="h-3.5 w-3.5 text-blue-400" />
                <span>Fastest Time</span>
              </button>
              <button
                type="button"
                onClick={() => setOptimizeFor("cost")}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded transition-all ${
                  optimizeFor === "cost"
                    ? "bg-[#22222a] text-emerald-300 font-semibold shadow-sm border border-emerald-900/60"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-[#18181e]"
                }`}
              >
                <IndianRupee className="h-3.5 w-3.5 text-emerald-400" />
                <span>Lowest Toll</span>
              </button>
            </div>
          </div>

          {/* Dynamic Constraint Input */}
          {optimizeFor === "cost" ? (
            <Input
              label="Travel Time Ceiling (Hours)"
              type="number"
              min={1}
              max={168}
              value={maxTimeH}
              onChange={(e) => setMaxTimeH(Number(e.target.value))}
            />
          ) : (
            <Input
              label="Toll Expenditure Ceiling (₹)"
              type="number"
              min={0}
              max={10000}
              step={50}
              value={maxCostRupees}
              onChange={(e) => setMaxCostRupees(Number(e.target.value))}
            />
          )}

          {/* Algorithm Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              Routing Algorithm
            </label>
            <div className="space-y-1.5">
              {ALGORITHMS.map((algo) => {
                const isSelected = algorithm === algo.value;
                return (
                  <button
                    key={algo.value}
                    onClick={() => setAlgorithm(algo.value)}
                    className={`w-full flex flex-col text-left px-3 py-2 rounded-md border transition-all ${
                      isSelected
                        ? "bg-[#1e1e24] border-neutral-500 text-neutral-100"
                        : "bg-[#141418] border-[#24242a] text-neutral-400 hover:bg-[#18181e] hover:border-neutral-700"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold">{algo.label}</span>
                      {isSelected && (
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span className="text-[11px] text-neutral-400 mt-0.5">{algo.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequent Corridors */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              Frequent Corridors
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Delhi ↔ Mumbai", src: 0, dst: 56 },
                { label: "Srinagar ↔ Kanyakumari", src: 10, dst: 81 },
                { label: "Porbandar ↔ Siliguri", src: 49, dst: 30 },
                { label: "Kolkata ↔ Chennai", src: 28, dst: 76 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => {
                    onSourceChange(preset.src);
                    onDestChange(preset.dst);
                  }}
                  className="px-2.5 py-1.5 text-[11px] rounded bg-[#16161a] hover:bg-[#202026] text-neutral-300 hover:text-white border border-[#27272e] hover:border-neutral-600 transition-colors text-left truncate"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons: Compute + User-Facing Refresh Button */}
          <div className="pt-2 space-y-2">
            <Button
              onClick={handleSolve}
              loading={isLoading}
              variant="primary"
              className="w-full py-2.5 text-xs font-semibold"
              disabled={selectedSource === null || selectedDest === null}
            >
              <Compass className="h-3.5 w-3.5 mr-1" />
              Compute {optimizeFor === "time" ? "Fastest Route" : "Cheapest Route"}
            </Button>

            {/* Pure extraction button for users: no DB wipes */}
            <Button
              variant="secondary"
              onClick={() => onRefreshData && onRefreshData()}
              className="w-full text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1 text-neutral-400" />
              Fetch Latest Network from MongoDB
            </Button>
          </div>
        </div>
      )}

      {/* ── TOPOLOGY VIEW (ADMIN / DATA INGESTION) ────────────────────────── */}
      {section === "graph" && (
        <div className="space-y-3.5">
          {/* Sub-tab: Bulk CSV Ingest vs Manual Segment */}
          <div className="grid grid-cols-2 p-1 bg-[#141418] border border-[#232328] rounded-md gap-1">
            <button
              onClick={() => setTopologySubTab("bulk")}
              className={`py-1 text-xs rounded transition-all font-medium ${
                topologySubTab === "bulk"
                  ? "bg-[#25252b] text-neutral-100 border border-[#35353d]"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Bulk CSV Ingest
            </button>
            <button
              onClick={() => setTopologySubTab("manual")}
              className={`py-1 text-xs rounded transition-all font-medium ${
                topologySubTab === "manual"
                  ? "bg-[#25252b] text-neutral-100 border border-[#35353d]"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              Single Segment
            </button>
          </div>

          {/* ── BULK CSV INGESTION ── */}
          {topologySubTab === "bulk" && (
            <div className="space-y-3 animate-fade-in">
              <div className="rounded bg-[#141418] border border-[#232328] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
                    Target Collection
                  </span>
                </div>

                {/* Target Type: Nodes vs Edges */}
                <div className="grid grid-cols-2 gap-1 p-0.5 bg-[#18181e] rounded border border-[#26262e]">
                  <button
                    type="button"
                    onClick={() => setCsvType("edges")}
                    className={`py-1.5 text-[11px] rounded transition-all font-medium ${
                      csvType === "edges"
                        ? "bg-[#262630] text-blue-300 border border-blue-900/60"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    Highway Corridors (Edges)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCsvType("nodes")}
                    className={`py-1.5 text-[11px] rounded transition-all font-medium ${
                      csvType === "nodes"
                        ? "bg-[#262630] text-emerald-300 border border-emerald-900/60"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    District Hubs (Nodes)
                  </button>
                </div>

                {/* Ingestion Mode: Append vs Replace */}
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">
                    Mode
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setCsvMode("append")}
                      className={`py-1 text-[11px] rounded border transition-all ${
                        csvMode === "append"
                          ? "bg-[#22222a] border-neutral-500 text-neutral-100"
                          : "bg-[#141418] border-[#25252b] text-neutral-400 hover:bg-[#18181e]"
                      }`}
                    >
                      Append / Upsert
                    </button>
                    <button
                      type="button"
                      onClick={() => setCsvMode("replace")}
                      className={`py-1 text-[11px] rounded border transition-all ${
                        csvMode === "replace"
                          ? "bg-red-950/40 border-red-800 text-red-300"
                          : "bg-[#141418] border-[#25252b] text-neutral-400 hover:bg-[#18181e]"
                      }`}
                    >
                      Overwrite Entire
                    </button>
                  </div>
                </div>
              </div>

              {/* File Input & Sample Template */}
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-file-input"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 text-xs"
                >
                  <UploadCloud className="h-3.5 w-3.5 mr-1" />
                  Select .CSV File
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSampleTemplate(false)}
                  className="text-xs"
                  title="Download sample CSV format"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Sample
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSampleTemplate(true)}
                  className="text-xs text-blue-400 border-blue-900/60 hover:bg-blue-950/30"
                  title="Download full 732 districts / 2113 highways All-India dataset"
                >
                  <Download className="h-3.5 w-3.5 mr-1" />
                  Full All-India CSV
                </Button>
              </div>

              {/* Paste Textarea */}
              <Textarea
                label="Or Paste CSV Data Directly"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder={
                  csvType === "edges"
                    ? "source_node,destination_node,time,highway_ref,transport_type\n0,1,270,NH-48,road\n0,2,200,Yamuna-Exp,road"
                    : "id,name,state,lat,lng,fee\n100,Varanasi Hub,Uttar Pradesh,25.31,82.97,120"
                }
                rows={4}
              />

              {/* Ingest Button */}
              <Button
                onClick={handleBulkUpload}
                loading={isUploading}
                disabled={!csvContent.trim()}
                variant="primary"
                className="w-full py-2 text-xs font-semibold"
              >
                <UploadCloud className="h-3.5 w-3.5 mr-1" />
                Ingest Dataset to MongoDB
              </Button>

              {/* Ingestion Status Notice */}
              {csvStatus && (
                <div
                  className={`text-[11px] p-2.5 rounded border leading-relaxed ${
                    csvStatus.type === "error"
                      ? "bg-red-950/40 border-red-800 text-red-300"
                      : csvStatus.type === "success"
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                      : "bg-[#181820] border-[#2c2c36] text-neutral-300"
                  }`}
                >
                  {csvStatus.text}
                </div>
              )}
            </div>
          )}

          {/* ── MANUAL SEGMENT ── */}
          {topologySubTab === "manual" && (
            <div className="space-y-3 animate-fade-in">
              <Select
                label="Origin Node"
                value={edgeSrc}
                onChange={(e) => setEdgeSrc(e.target.value)}
              >
                <option value="">Select origin...</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.name} ({n.state})</option>
                ))}
              </Select>

              <Select
                label="Target Node"
                value={edgeDest}
                onChange={(e) => setEdgeDest(e.target.value)}
              >
                <option value="">Select target...</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>{n.name} ({n.state})</option>
                ))}
              </Select>

              <Input
                label="Segment Travel Time (Minutes)"
                type="number"
                min={1}
                value={edgeTime}
                onChange={(e) => setEdgeTime(e.target.value)}
                placeholder="e.g. 240"
              />

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                  Transit Mode
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {TRANSPORT_TYPES.map((t) => {
                    const Icon = t.icon;
                    const isSelected = transportType === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setTransportType(t.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border transition-colors ${
                          isSelected
                            ? "bg-[#22222a] border-neutral-500 text-neutral-100"
                            : "bg-[#141418] border-[#25252b] text-neutral-400 hover:bg-[#18181e]"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleAddEdge} variant="secondary" className="flex-1">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Segment
                </Button>
                <Button onClick={handleDeleteEdge} variant="danger" className="flex-1">
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete
                </Button>
              </div>

              {edgeMsg && (
                <div className="text-[11px] px-3 py-2 rounded bg-[#16161a] border border-[#27272e] text-neutral-300">
                  {edgeMsg}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

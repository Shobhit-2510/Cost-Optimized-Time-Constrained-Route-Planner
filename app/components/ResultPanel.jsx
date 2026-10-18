"use client";

import { Badge, StatCard } from "./ui";
import { CheckCircle2, AlertCircle, IndianRupee, Clock, Milestone, Cpu, ArrowRight } from "lucide-react";

const ALGORITHM_DESCRIPTIONS = {
  dijkstra: { name: "Dijkstra", color: "indigo", desc: "Shortest path under priority objective" },
  astar: { name: "A* Search", color: "warning", desc: "Heuristic-guided spatial search" },
  bellmanford: { name: "Bellman-Ford", color: "success", desc: "Iterative relaxation" },
  floydwarshall: { name: "Floyd-Warshall", color: "danger", desc: "All-pairs shortest path matrix" },
};

export default function ResultPanel({ result, nodes = [] }) {
  if (!result) return null;

  const { cost, totalTime, path, pathNames, algorithm, optimizeFor, executionTime, nodeCount, edgeCount } = result;
  const algo = ALGORITHM_DESCRIPTIONS[algorithm] || { name: algorithm, color: "default" };

  if (cost === -1 || !path || path.length === 0) {
    return (
      <div className="rounded-lg bg-red-950/20 border border-red-900/60 p-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-xs font-semibold text-red-300 uppercase tracking-wider">No Feasible Route</h3>
            <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
              No continuous path exists between the selected nodes within the specified {optimizeFor === "time" ? "toll expenditure ceiling" : "travel time budget"}. Increase the constraint or toggle the optimization objective.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hours = totalTime !== undefined && totalTime !== -1 ? Math.floor(totalTime / 60) : 0;
  const minutes = totalTime !== undefined && totalTime !== -1 ? totalTime % 60 : 0;
  const timeFormatted = totalTime !== undefined && totalTime !== -1
    ? (hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}` : `${minutes}m`)
    : "N/A";

  return (
    <div className="space-y-3.5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
            Route Solution Found
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant={optimizeFor === "time" ? "indigo" : "success"}>
            {optimizeFor === "time" ? "Fastest Transit Priority" : "Lowest Toll Priority"}
          </Badge>
          <Badge variant={algo.color}>{algo.name}</Badge>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <StatCard
          icon={IndianRupee}
          label="Toll Expenditure"
          value={`₹${cost}`}
          sub={optimizeFor === "cost" ? "Target metric (Minimized)" : "Calculated toll"}
        />
        <StatCard
          icon={Clock}
          label="Estimated Transit"
          value={timeFormatted}
          sub={optimizeFor === "time" ? "Target metric (Minimized)" : `${totalTime} minutes`}
        />
        <StatCard
          icon={Milestone}
          label="Waypoints"
          value={path.length}
          sub={`${Math.max(0, path.length - 2)} intermediate`}
        />
        <StatCard
          icon={Cpu}
          label="Compute Time"
          value={`${executionTime}ms`}
          sub={`${nodeCount} vertices / ${edgeCount} edges`}
        />
      </div>

      {/* Path Breadcrumb */}
      <div className="rounded-lg bg-[#141418] border border-[#232328] p-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
            Segment Trajectory
          </span>
          <span className="text-[11px] font-mono text-neutral-400">
            {pathNames[0]} → {pathNames[pathNames.length - 1]}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {pathNames.map((name, i) => {
            const isOrigin = i === 0;
            const isDestination = i === pathNames.length - 1;
            return (
              <span key={i} className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border ${
                    isOrigin
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                      : isDestination
                      ? "bg-blue-950/40 border-blue-800 text-blue-300"
                      : "bg-[#1c1c21] border-[#292930] text-neutral-300"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isOrigin ? "bg-emerald-400" : isDestination ? "bg-blue-400" : "bg-neutral-500"
                    }`}
                  />
                  {name}
                </span>
                {!isDestination && (
                  <ArrowRight className="h-3 w-3 text-neutral-600" />
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

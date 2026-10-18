"use client";

import { useState, useEffect, useRef } from "react";
import { Button, Badge } from "./ui";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Search,
  Zap,
  Activity,
  Layers,
} from "lucide-react";

export default function AlgorithmVisualizer({
  steps = [],
  nodes = [],
  algorithm = "dijkstra",
  onStepChange,
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(400); // ms per step
  const intervalRef = useRef(null);

  useEffect(() => {
    setCurrentStep(0);
    setPlaying(false);
  }, [steps]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(intervalRef.current);
  }, [playing, speed, steps.length]);

  useEffect(() => {
    onStepChange && onStepChange(currentStep, steps[currentStep]);
  }, [currentStep, onStepChange, steps]);

  const step = steps[currentStep];
  const getNodeName = (id) => nodes[id]?.name || `Node ${id}`;

  const visitedSoFar = steps
    .slice(0, currentStep + 1)
    .filter((s) => s.type === "visit")
    .map((s) => s.node);

  const relaxedEdgesSoFar = steps
    .slice(0, currentStep + 1)
    .filter((s) => s.type === "relax");

  return (
    <div className="flex flex-col gap-3.5 h-full">
      {/* Header & Speed Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="indigo">{algorithm.toUpperCase()}</Badge>
          <span className="text-[11px] font-mono text-neutral-400">
            {steps.length ? `${currentStep + 1} / ${steps.length}` : "0 / 0"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {[800, 400, 150, 40].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-1.5 py-0.5 text-[10px] font-mono rounded transition-colors ${
                speed === s
                  ? "bg-neutral-200 text-neutral-900 font-semibold"
                  : "bg-[#18181e] text-neutral-400 hover:bg-[#22222a]"
              }`}
            >
              {s === 800 ? "0.5x" : s === 400 ? "1x" : s === 150 ? "2.5x" : "10x"}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full h-1 bg-[#1a1a20] rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-150 rounded-full"
          style={{ width: `${steps.length ? ((currentStep + 1) / steps.length) * 100 : 0}%` }}
        />
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setCurrentStep(0)}
          disabled={!steps.length}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setCurrentStep((p) => Math.max(0, p - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <Button
          variant={playing ? "danger" : "primary"}
          size="xs"
          onClick={() => setPlaying((p) => !p)}
          disabled={!steps.length}
          className="flex-1"
        >
          {playing ? (
            <>
              <Pause className="h-3 w-3 mr-1" /> Pause
            </>
          ) : (
            <>
              <Play className="h-3 w-3 mr-1" /> Play
            </>
          )}
        </Button>
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setCurrentStep((p) => Math.min(steps.length - 1, p + 1))}
          disabled={currentStep >= steps.length - 1}
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {/* Active Step Status */}
      {step ? (
        <div className="rounded-lg bg-[#141418] border border-[#232328] p-3 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200">
              {step.type === "visit" ? (
                <Search className="h-3.5 w-3.5 text-blue-400" />
              ) : (
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
              )}
              <span className="capitalize">{step.type === "visit" ? "Node Evaluation" : "Edge Relaxation"}</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">Step {currentStep + 1}</span>
          </div>

          {step.type === "visit" && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-0.5 border-b border-[#1c1c22]">
                <span className="text-neutral-400">Current Vertex</span>
                <span className="text-neutral-100 font-medium">{getNodeName(step.node)}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#1c1c22]">
                <span className="text-neutral-400">Cumulative Cost</span>
                <span className="text-neutral-200 font-mono">₹{step.currCost}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-neutral-400">Elapsed Time</span>
                <span className="text-neutral-200 font-mono">{step.currTime} min</span>
              </div>

              {step.queue?.length > 0 && (
                <div className="pt-2 border-t border-[#1c1c22]">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-1">
                    Priority Queue ({step.queue.length})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {step.queue.slice(0, 5).map((q, i) => (
                      <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 bg-[#1b1b22] border border-[#272730] rounded text-neutral-300">
                        {getNodeName(q.node)}: ₹{q.cost}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step.type === "relax" && (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-0.5 border-b border-[#1c1c22]">
                <span className="text-neutral-400">Edge Traversed</span>
                <span className="text-neutral-100 font-medium">
                  {getNodeName(step.from)} → {getNodeName(step.to)}
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-[#1c1c22]">
                <span className="text-neutral-400">Updated Cost</span>
                <span className="text-emerald-400 font-mono">₹{step.newCost}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-neutral-400">Updated Time</span>
                <span className="text-blue-400 font-mono">{step.newTime} min</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-[#141418] border border-[#232328] p-4 text-center text-xs text-neutral-400">
          Compute a route to inspect the step-by-step state machine.
        </div>
      )}

      {/* Execution Counters */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded bg-[#141418] border border-[#232328]">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-0.5">
            Evaluated
          </span>
          <span className="text-base font-semibold font-mono text-neutral-100">
            {visitedSoFar.length} nodes
          </span>
        </div>
        <div className="p-2.5 rounded bg-[#141418] border border-[#232328]">
          <span className="text-[10px] uppercase tracking-wider text-neutral-400 block mb-0.5">
            Relaxations
          </span>
          <span className="text-base font-semibold font-mono text-neutral-100">
            {relaxedEdgesSoFar.length} edges
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Button, Textarea, Badge } from "./ui";
import { Sparkles, CornerDownLeft, MessageSquare, AlertTriangle, ArrowRight } from "lucide-react";

const EXAMPLE_QUERIES = [
  "Cheapest route from Delhi to Mumbai",
  "Fastest corridor from Amritsar to Chennai under 40 hours",
  "Route from Kolkata to Bangalore with minimal toll",
  "Path from Jaipur to Hyderabad within 24 hours",
];

export default function AIPanel({
  onRouteExtracted,
  routeResult,
  nodes = [],
  isLoading = false,
}) {
  const [query, setQuery] = useState("");
  const [parsing, setParsing] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const textareaRef = useRef(null);

  async function handleParse() {
    if (!query.trim()) return;
    setParsing(true);
    setError("");
    setParseResult(null);

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, nodes }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setParseResult(data);
      onRouteExtracted && onRouteExtracted(data);
    } catch {
      setError("Failed to query Gemini API. Verify your API credentials in .env.");
    } finally {
      setParsing(false);
    }
  }

  async function handleExplain() {
    if (!routeResult) return;
    setExplaining(true);
    setExplanation("");

    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: routeResult.path,
          pathNames: routeResult.pathNames,
          cost: routeResult.cost,
          algorithm: routeResult.algorithm,
          maxTime: routeResult.maxTime,
          nodes,
          edgeCount: routeResult.edgeCount,
        }),
      });
      const data = await res.json();
      setExplanation(data.explanation || data.error);
    } catch {
      setExplanation("Unable to generate analysis at this time.");
    } finally {
      setExplaining(false);
    }
  }

  function handleExample(eq) {
    setQuery(eq);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Query Input Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Natural Language Query</span>
          </div>
          <Badge variant="indigo">Gemini 3.8 Flash</Badge>
        </div>

        <Textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Find the most cost-effective path from Delhi to Mumbai under 24 hours..."
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleParse();
          }}
        />

        <div className="flex items-center gap-2">
          <Button
            onClick={handleParse}
            loading={parsing}
            disabled={!query.trim()}
            variant="primary"
            className="flex-1"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Extract Parameters
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => setQuery("")}
            disabled={!query}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Suggested Queries */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
          Sample Prompts
        </span>
        <div className="space-y-1">
          {EXAMPLE_QUERIES.map((eq) => (
            <button
              key={eq}
              onClick={() => handleExample(eq)}
              className="w-full text-left text-xs px-2.5 py-1.5 rounded bg-[#151519] hover:bg-[#1d1d23] text-neutral-400 hover:text-neutral-200 border border-[#24242a] hover:border-neutral-700 transition-colors truncate block"
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-950/20 border border-red-900/60 p-3 text-xs text-red-300 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Structured Extraction Result */}
      {parseResult && (
        <div className="rounded-lg bg-[#141418] border border-[#232328] p-3.5 space-y-2.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Parsed Intent
            </span>
            <Badge variant="default">{parseResult.confidence} confidence</Badge>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between py-0.5 border-b border-[#1f1f24]">
              <span className="text-neutral-400">Origin</span>
              <span className="text-neutral-100 font-medium">{parseResult.sourceName}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#1f1f24]">
              <span className="text-neutral-400">Destination</span>
              <span className="text-neutral-100 font-medium">{parseResult.destName}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-[#1f1f24]">
              <span className="text-neutral-400">Time Limit</span>
              <span className="text-neutral-200 font-mono">
                {parseResult.maxTime === 9999 ? "Unlimited" : `${parseResult.maxTime} min (${(parseResult.maxTime / 60).toFixed(1)}h)`}
              </span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-neutral-400">Selected Algorithm</span>
              <span className="text-blue-400 font-mono capitalize">{parseResult.algorithm}</span>
            </div>
          </div>

          {parseResult.explanation && (
            <p className="text-[11px] text-neutral-400 pt-1.5 border-t border-[#1f1f24] leading-relaxed">
              {parseResult.explanation}
            </p>
          )}
        </div>
      )}

      {/* Route Explainer */}
      {routeResult && (
        <div className="space-y-2.5 pt-2 border-t border-[#202026]">
          <div className="flex items-center justify-between">
            <span className="hidden lg:inline text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Intelligence Brief
            </span>
          </div>

          <Button
            variant="secondary"
            onClick={handleExplain}
            loading={explaining}
            disabled={!routeResult?.path?.length}
            className="w-full text-xs"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Generate Strategic Breakdown
          </Button>

          {explanation && (
            <div className="rounded-lg bg-[#141418] border border-[#232328] p-3 text-xs text-neutral-300 leading-relaxed animate-fade-in">
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

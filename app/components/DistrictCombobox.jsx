"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown, Check, MapPin } from "lucide-react";

export default function DistrictCombobox({
  label,
  value,
  onChange,
  nodes = [],
  placeholder = "Search district by name or state...",
  accentColor = "emerald", // "emerald" for Origin, "blue" for Destination
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find currently selected node
  const selectedNode = useMemo(() => {
    if (value === null || value === undefined || value === "") return null;
    return nodes.find((n) => Number(n.id) === Number(value)) || null;
  }, [value, nodes]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter nodes matching query
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) {
      return nodes.slice(0, 40); // default top items for snappy rendering
    }
    const q = searchQuery.toLowerCase().trim();
    const matches = nodes.filter(
      (n) =>
        (n.name && n.name.toLowerCase().includes(q)) ||
        (n.state && n.state.toLowerCase().includes(q))
    );
    return matches.slice(0, 50); // limit to 50 results
  }, [nodes, searchQuery]);

  function handleSelect(nodeId) {
    onChange && onChange(nodeId);
    setIsOpen(false);
    setSearchQuery("");
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange && onChange(null);
    setSearchQuery("");
    inputRef.current?.focus();
  }

  const isEmerald = accentColor === "emerald";
  const focusBorderClass = isEmerald ? "focus-within:border-emerald-500/60" : "focus-within:border-blue-500/60";
  const ringDotClass = isEmerald ? "bg-emerald-400" : "bg-blue-400";
  const badgeBorderClass = isEmerald ? "border-emerald-800/80 text-emerald-300 bg-emerald-950/40" : "border-blue-800/80 text-blue-300 bg-blue-950/40";

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium text-neutral-300 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${ringDotClass}`} />
            {label}
          </label>
          {selectedNode && (
            <span className="text-[10px] text-neutral-400 font-mono">
              ID: {selectedNode.id}
            </span>
          )}
        </div>
      )}

      {/* Input / Display Bar */}
      <div
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
        className={`flex items-center justify-between px-2.5 py-1.5 bg-[#141418] border border-[#232328] rounded-md transition-all cursor-text ${focusBorderClass} ${
          isOpen ? "ring-1 " + (isEmerald ? "ring-emerald-500/20 border-emerald-500/60" : "ring-blue-500/20 border-blue-500/60") : ""
        }`}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Search className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={selectedNode ? `${selectedNode.name} (${selectedNode.state})` : placeholder}
              className="w-full bg-transparent text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none"
              autoFocus
            />
          ) : (
            <div className="flex-1 min-w-0 truncate text-xs">
              {selectedNode ? (
                <span className="font-medium text-neutral-100 flex items-center gap-1.5 truncate">
                  <span className="truncate">{selectedNode.name}</span>
                  <span className="text-[10px] text-neutral-400 font-sans truncate">
                    • {selectedNode.state}
                  </span>
                </span>
              ) : (
                <span className="text-neutral-500">{placeholder}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1.5">
          {selectedNode && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-[#1f1f26] transition-colors"
              title="Clear selection"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            className="p-1 text-neutral-400"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Floating Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[#121216] border border-[#26262e] rounded-md shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-[#1b1b22] animate-fade-in">
          {filteredNodes.length === 0 ? (
            <div className="px-3 py-4 text-center text-xs text-neutral-400">
              No matching districts found for &quot;{searchQuery}&quot;
            </div>
          ) : (
            <>
              <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-neutral-400 bg-[#0e0e12] sticky top-0 z-10 flex justify-between">
                <span>Matching Districts</span>
                <span>{filteredNodes.length} shown</span>
              </div>
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => handleSelect(node.id)}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer text-xs transition-colors ${
                      isSelected
                        ? "bg-[#1c1c24] text-neutral-100 font-medium"
                        : "hover:bg-[#181820] text-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className={`h-3.5 w-3.5 shrink-0 ${isSelected ? (isEmerald ? "text-emerald-400" : "text-blue-400") : "text-neutral-400"}`} />
                      <div className="flex flex-col min-w-0">
                        <span className="truncate font-medium text-neutral-100">
                          {node.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 truncate">
                          {node.state}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#181820] border border-[#272732] text-neutral-300">
                        ₹{node.fee}
                      </span>
                      {isSelected && (
                        <Check className={`h-3.5 w-3.5 ${isEmerald ? "text-emerald-400" : "text-blue-400"}`} />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}


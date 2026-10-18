"use client";

import { useEffect, useRef } from "react";
import { NATIONAL_HIGHWAY_NODES, NATIONAL_HIGHWAY_EDGES } from "@/app/lib/nationalHighways";

const TRANSPORT_COLORS = {
  road: "#3b82f6",     // cobalt
  train: "#10b981",    // emerald
  flight: "#f59e0b",   // amber
  bus: "#8b5cf6",      // violet
};

export default function MapView({
  edges = [],
  nodes = NATIONAL_HIGHWAY_NODES,
  solutionPath = [],
  selectedSource = null,
  selectedDest = null,
  onNodeClick,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersRef = useRef({ nodes: [], edges: [], path: [] });

  useEffect(() => {
    if (typeof window === "undefined") return;

    import("leaflet").then((L) => {
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapInstanceRef.current && mapRef.current) {
        const map = L.map(mapRef.current, {
          center: [22.5, 78.5],
          zoom: 5,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      renderMapElements(L);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layers on data change
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    import("leaflet").then((L) => {
      renderMapElements(L);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, nodes, solutionPath, selectedSource, selectedDest]);

  function renderMapElements(L) {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing layers
    layersRef.current.nodes.forEach((l) => map.removeLayer(l));
    layersRef.current.edges.forEach((l) => map.removeLayer(l));
    layersRef.current.path.forEach((l) => map.removeLayer(l));
    layersRef.current = { nodes: [], edges: [], path: [] };

    const edgesToDraw = edges.length > 0 ? edges : NATIONAL_HIGHWAY_EDGES;

    // Draw background highway edges
    edgesToDraw.forEach(([u, v, t, transport = "road"]) => {
      const nodeA = nodes[u];
      const nodeB = nodes[v];
      if (!nodeA || !nodeB) return;

      const color = TRANSPORT_COLORS[transport] || "#3b82f6";
      const line = L.polyline(
        [[nodeA.lat, nodeA.lng], [nodeB.lat, nodeB.lng]],
        {
          color,
          weight: 1,
          opacity: 0.2,
          dashArray: transport === "flight" ? "4,6" : transport === "train" ? "6,4" : null,
        }
      ).addTo(map);

      line.bindTooltip(
        `<div class="text-[11px] font-sans"><b>${nodeA.name} — ${nodeB.name}</b><br/><span class="text-neutral-400">${Math.round((t / 60) * 10) / 10}h travel</span></div>`,
        { sticky: true }
      );

      layersRef.current.edges.push(line);
    });

    // Draw optimal solution path with clean glow
    if (solutionPath.length >= 2) {
      const pathCoords = solutionPath.map((id) => [nodes[id].lat, nodes[id].lng]);

      const pathGlow = L.polyline(pathCoords, {
        color: "#60a5fa",
        weight: 6,
        opacity: 0.25,
      }).addTo(map);

      const pathLine = L.polyline(pathCoords, {
        color: "#2563eb",
        weight: 3.5,
        opacity: 0.95,
      }).addTo(map);

      layersRef.current.path.push(pathLine, pathGlow);
      map.fitBounds(L.latLngBounds(pathCoords), { padding: [40, 40] });
    }

    // Draw city node markers
    nodes.forEach((node, idx) => {
      const isSource = idx === selectedSource;
      const isDest = idx === selectedDest;
      const isOnPath = solutionPath.includes(idx);

      let fillColor = "#27272a";
      let strokeColor = "#3f3f46";
      let radius = 3.5;
      let weight = 1;

      if (isSource) {
        fillColor = "#10b981";
        strokeColor = "#ffffff";
        radius = 8;
        weight = 2;
      } else if (isDest) {
        fillColor = "#3b82f6";
        strokeColor = "#ffffff";
        radius = 8;
        weight = 2;
      } else if (isOnPath) {
        fillColor = "#818cf8";
        strokeColor = "#ffffff";
        radius = 6.5;
        weight = 1.5;
      }

      const marker = L.circleMarker([node.lat, node.lng], {
        radius,
        fillColor,
        color: strokeColor,
        weight,
        opacity: 1,
        fillOpacity: 1,
      }).addTo(map);

      const roleBadge = isSource
        ? "<span class='text-[10px] uppercase font-semibold text-emerald-400 ml-1'>ORIGIN</span>"
        : isDest
        ? "<span class='text-[10px] uppercase font-semibold text-blue-400 ml-1'>DESTINATION</span>"
        : "";

      marker.bindTooltip(
        `<div class="text-[11px] font-sans"><b>${node.name}</b>${roleBadge}<br/><span class="text-neutral-400 font-mono">Toll: ₹${node.fee}</span></div>`,
        { sticky: true }
      );

      marker.on("click", () => onNodeClick && onNodeClick(idx));
      layersRef.current.nodes.push(marker);
    });
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-lg overflow-hidden border border-[#232328]"
      style={{ minHeight: 400 }}
    />
  );
}

/**
 * algorithms.js
 * Dual-objective graph algorithms: supports optimizing for either
 * 1) "time" (Fastest route, minimizing travel hours)
 * 2) "cost" (Cheapest route, minimizing toll expense)
 * 
 * All return { cost, totalTime, path, steps, optimizeFor }
 */

import Heap from "heap";

// ─── Dijkstra (Flexible Optimization: Time or Cost) ───────────────────────────
export function dijkstraSolver(
  nodeCount,
  edges,
  passingFees,
  {
    optimizeFor = "cost", // "time" | "cost"
    maxTime = 99999,
    maxCost = 99999,
    sourceId = 0,
    destId = nodeCount - 1,
  } = {}
) {
  if (sourceId === destId) {
    return {
      cost: passingFees[sourceId] || 0,
      totalTime: 0,
      path: [sourceId],
      steps: [{ type: "visit", node: sourceId, currCost: passingFees[sourceId] || 0, currTime: 0 }],
      optimizeFor,
    };
  }

  const adj = buildAdj(nodeCount, edges);
  const steps = [];

  // Heap comparator based on optimization objective
  const pq = new Heap((a, b) => {
    if (optimizeFor === "time") {
      // Primary: time ascending, Secondary: cost ascending
      if (a[1] !== b[1]) return a[1] - b[1];
      return a[0] - b[0];
    } else {
      // Primary: cost ascending, Secondary: time ascending
      if (a[0] !== b[0]) return a[0] - b[0];
      return a[1] - b[1];
    }
  });

  const startCost = passingFees[sourceId] || 0;
  pq.push([startCost, 0, sourceId, [sourceId]]); // [cost, time, node, path]

  // Pruning table: minimum secondary metric seen for node
  const bestSecondary = Array(nodeCount).fill(Infinity);

  while (!pq.empty()) {
    const [currCost, currTime, node, path] = pq.pop();

    steps.push({
      type: "visit",
      node,
      currCost,
      currTime,
      queue: pq.nodes.slice(0, 8).map((n) => ({ node: n[2], cost: n[0], time: n[1] })),
    });

    if (node === destId) {
      return { cost: currCost, totalTime: currTime, path, steps, optimizeFor };
    }

    if (optimizeFor === "time") {
      if (currCost > maxCost || currCost >= bestSecondary[node]) continue;
      bestSecondary[node] = currCost;
    } else {
      if (currTime > maxTime || currTime >= bestSecondary[node]) continue;
      bestSecondary[node] = currTime;
    }

    for (const [next, travelTime] of adj[node]) {
      const newTime = currTime + travelTime;
      const newCost = currCost + (passingFees[next] || 0);

      const withinBudget = optimizeFor === "time" ? newCost <= maxCost : newTime <= maxTime;

      if (withinBudget) {
        pq.push([newCost, newTime, next, [...path, next]]);
        steps.push({
          type: "relax",
          from: node,
          to: next,
          newCost,
          newTime,
        });
      }
    }
  }

  return { cost: -1, totalTime: -1, path: [], steps, optimizeFor };
}

// ─── A* Search (Heuristic-guided Fastest or Lowest-Cost Path) ───────────────────
export function aStar(
  nodeCount,
  edges,
  nodeCoords,
  passingFees,
  {
    optimizeFor = "time",
    maxTime = 99999,
    maxCost = 99999,
    sourceId = 0,
    destId = nodeCount - 1,
  } = {}
) {
  if (sourceId === destId) {
    return {
      cost: passingFees[sourceId] || 0,
      totalTime: 0,
      path: [sourceId],
      steps: [{ type: "visit", node: sourceId, currCost: passingFees[sourceId] || 0, currTime: 0 }],
      optimizeFor,
    };
  }

  const adj = buildAdj(nodeCount, edges);
  const steps = [];

  const hTime = (u) => {
    if (!nodeCoords || !nodeCoords[u] || !nodeCoords[destId]) return 0;
    const distKm = haversine(nodeCoords[u], nodeCoords[destId]);
    return distKm / 1.5; // ~90 km/h minimum travel time in minutes
  };

  const pq = new Heap((a, b) => a[0] - b[0]);
  const bestSeen = Array(nodeCount).fill(Infinity);

  const startCost = passingFees[sourceId] || 0;
  const initialF = optimizeFor === "time" ? hTime(sourceId) : startCost;
  pq.push([initialF, 0, startCost, sourceId, [sourceId]]); // [f, g(time), cost, node, path]
  bestSeen[sourceId] = 0;

  while (!pq.empty()) {
    const [f, currTime, currCost, node, path] = pq.pop();

    steps.push({
      type: "visit",
      node,
      currCost,
      currTime,
      queue: pq.nodes.slice(0, 8).map((n) => ({ node: n[3], cost: n[2], time: n[1] })),
    });

    if (node === destId) {
      return { cost: currCost, totalTime: currTime, path, steps, optimizeFor };
    }

    if (optimizeFor === "time") {
      if (currTime > bestSeen[node] || currCost > maxCost) continue;
      bestSeen[node] = currTime;
    } else {
      if (currCost > bestSeen[node] || currTime > maxTime) continue;
      bestSeen[node] = currCost;
    }

    for (const [next, travelTime] of adj[node]) {
      const newTime = currTime + travelTime;
      const newCost = currCost + (passingFees[next] || 0);

      const withinBudget = optimizeFor === "time" ? newCost <= maxCost : newTime <= maxTime;

      if (withinBudget) {
        const nextScore = optimizeFor === "time" ? newTime : newCost;
        if (nextScore < bestSeen[next]) {
          const newF = optimizeFor === "time" ? newTime + hTime(next) : newCost;
          pq.push([newF, newTime, newCost, next, [...path, next]]);
          steps.push({
            type: "relax",
            from: node,
            to: next,
            newCost,
            newTime,
          });
        }
      }
    }
  }

  return { cost: -1, totalTime: -1, path: [], steps, optimizeFor };
}

// ─── Bellman-Ford ─────────────────────────────────────────────────────────────
export function bellmanFord(
  nodeCount,
  edges,
  passingFees,
  {
    optimizeFor = "cost",
    maxTime = 99999,
    maxCost = 99999,
    sourceId = 0,
    destId = nodeCount - 1,
  } = {}
) {
  if (sourceId === destId) {
    return {
      cost: passingFees[sourceId] || 0,
      totalTime: 0,
      path: [sourceId],
      steps: [{ type: "visit", node: sourceId, currCost: passingFees[sourceId] || 0, currTime: 0 }],
      optimizeFor,
    };
  }

  const time = Array(nodeCount).fill(Infinity);
  const cost = Array(nodeCount).fill(Infinity);
  const prev = Array(nodeCount).fill(-1);
  const steps = [];

  time[sourceId] = 0;
  cost[sourceId] = passingFees[sourceId] || 0;

  const allEdges = [];
  for (const [u, v, t] of edges) {
    allEdges.push([u, v, t]);
    allEdges.push([v, u, t]);
  }

  for (let i = 0; i < nodeCount - 1; i++) {
    let updated = false;
    for (const [u, v, t] of allEdges) {
      if (time[u] !== Infinity) {
        const newTime = time[u] + t;
        const newCost = cost[u] + (passingFees[v] || 0);

        const withinBudget = optimizeFor === "time" ? newCost <= maxCost : newTime <= maxTime;

        if (withinBudget) {
          const isBetter =
            optimizeFor === "time"
              ? newTime < time[v] || (newTime === time[v] && newCost < cost[v])
              : newCost < cost[v] || (newCost === cost[v] && newTime < time[v]);

          if (isBetter) {
            time[v] = newTime;
            cost[v] = newCost;
            prev[v] = u;
            updated = true;
            steps.push({
              type: "relax",
              from: u,
              to: v,
              newCost,
              newTime,
              iteration: i,
            });
          }
        }
      }
    }
    if (!updated) break;
  }

  if (time[destId] === Infinity || cost[destId] === Infinity) {
    return { cost: -1, totalTime: -1, path: [], steps, optimizeFor };
  }

  const path = buildPath(prev, sourceId, destId);
  return { cost: cost[destId], totalTime: time[destId], path, steps, optimizeFor };
}

// ─── Floyd-Warshall ──────────────────────────────────────────────────────────
export function floydWarshall(
  nodeCount,
  edges,
  passingFees,
  {
    optimizeFor = "time",
    maxTime = 99999,
    maxCost = 99999,
    sourceId = 0,
    destId = nodeCount - 1,
  } = {}
) {
  if (sourceId === destId) {
    return {
      cost: passingFees[sourceId] || 0,
      totalTime: 0,
      path: [sourceId],
      steps: [],
      optimizeFor,
    };
  }

  const INF = Infinity;
  const dist = Array.from({ length: nodeCount }, () => Array(nodeCount).fill(INF));
  const next = Array.from({ length: nodeCount }, () => Array(nodeCount).fill(-1));
  const steps = [];

  for (let i = 0; i < nodeCount; i++) dist[i][i] = 0;

  for (const [u, v, t] of edges) {
    const weight = optimizeFor === "time" ? t : (passingFees[v] || 0);
    if (weight < dist[u][v]) {
      dist[u][v] = weight;
      dist[v][u] = optimizeFor === "time" ? t : (passingFees[u] || 0);
      next[u][v] = v;
      next[v][u] = u;
    }
  }

  for (let k = 0; k < nodeCount; k++) {
    for (let i = 0; i < nodeCount; i++) {
      for (let j = 0; j < nodeCount; j++) {
        if (dist[i][k] + dist[k][j] < dist[i][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
          next[i][j] = next[i][k];
          if (steps.length < 40) {
            steps.push({ type: "relax", via: k, from: i, to: j, newScore: dist[i][j] });
          }
        }
      }
    }
  }

  if (dist[sourceId][destId] === INF) {
    return { cost: -1, totalTime: -1, path: [], steps, optimizeFor };
  }

  // Reconstruct path
  const path = [sourceId];
  let cur = sourceId;
  while (cur !== destId) {
    cur = next[cur][destId];
    if (cur === -1 || cur === undefined) {
      return { cost: -1, totalTime: -1, path: [], steps, optimizeFor };
    }
    path.push(cur);
    if (path.length > nodeCount) break;
  }

  // Compute exact path cost and time
  const adj = buildAdj(nodeCount, edges);
  let computedTime = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const edge = adj[u]?.find(([to]) => to === v);
    if (edge) computedTime += edge[1];
  }
  const pathCost = path.reduce((sum, id) => sum + (passingFees[id] || 0), 0);

  const withinBudget = optimizeFor === "time" ? pathCost <= maxCost : computedTime <= maxTime;
  if (!withinBudget) {
    return { cost: -1, totalTime: -1, path: [], steps, optimizeFor };
  }

  return {
    cost: pathCost,
    totalTime: computedTime,
    path,
    steps,
    optimizeFor,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildAdj(nodeCount, edges) {
  const adj = Array.from({ length: nodeCount }, () => []);
  for (const [u, v, t] of edges) {
    if (u < nodeCount && v < nodeCount) {
      adj[u].push([v, t]);
      adj[v].push([u, t]);
    }
  }
  return adj;
}

function buildPath(prev, sourceId, destId) {
  const path = [];
  let cur = destId;
  const visited = new Set();
  while (cur !== -1 && !visited.has(cur)) {
    visited.add(cur);
    path.unshift(cur);
    if (cur === sourceId) break;
    cur = prev[cur];
  }
  return path[0] === sourceId ? path : [];
}

function haversine(a, b) {
  if (!a || !b) return 0;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

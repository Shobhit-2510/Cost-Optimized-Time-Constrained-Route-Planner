/**
 * /api/solve/route.js
 * Unified route-solving endpoint with dual-objective optimization.
 * Accepts: { sourceId, destId, optimizeFor, maxTime, maxCost, algorithm, nodes, passingFees }
 * Returns: { cost, totalTime, path, pathNames, steps, algorithm, optimizeFor, executionTime }
 */

import { dijkstraSolver, aStar, bellmanFord, floydWarshall } from "@/app/lib/algorithms";
import { NATIONAL_HIGHWAY_EDGES, NATIONAL_HIGHWAY_NODES, DEFAULT_NATIONAL_PASSING_FEES } from "@/app/lib/nationalHighways";
import clientPromise from "@/app/lib/mongodb";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
};

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      sourceId = 0,
      destId,
      optimizeFor = "time", // "time" (Fastest) | "cost" (Cheapest)
      maxTime = 99999,
      maxCost = 99999,
      algorithm = "dijkstra",
      nodes: requestNodes,
      passingFees = [],
    } = body;

    let edgeList = [];
    let activeNodes = Array.isArray(requestNodes) && requestNodes.length > 0 ? requestNodes : [];

    // 1. Attempt to load from MongoDB
    try {
      const db = await getDb();
      if (activeNodes.length === 0) {
        const rawNodes = await db.collection("Nodes Collection").find({}).toArray();
        if (rawNodes && rawNodes.length > 0) {
          activeNodes = rawNodes.map(({ _id, node_id, ...rest }) => ({
            id: node_id,
            ...rest,
          }));
        }
      }

      const rawEdges = await db.collection("Edges Collection").find({}).toArray();
      if (rawEdges && rawEdges.length > 0) {
        edgeList = rawEdges.map((e) => [
          Number(e.source_node),
          Number(e.destination_node),
          Number(e.time),
        ]);
      }
    } catch (dbErr) {
      console.warn("[/api/solve] MongoDB fetch error:", dbErr.message);
    }

    // 2. Fallbacks if DB is empty
    if (activeNodes.length === 0) {
      activeNodes = NATIONAL_HIGHWAY_NODES;
    }
    if (edgeList.length === 0) {
      edgeList = NATIONAL_HIGHWAY_EDGES;
    }

    const fees =
      passingFees.length > 0
        ? passingFees
        : activeNodes.map((n) => n.fee) || DEFAULT_NATIONAL_PASSING_FEES;
    const nodeCount = Math.max(
      activeNodes.length,
      ...edgeList.flatMap(([u, v]) => [u, v]),
      0
    ) + 1;

    const src = Number(sourceId);
    const dst = destId !== undefined ? Number(destId) : nodeCount - 1;
    const nodeCoords = activeNodes.map((n) => ({ lat: n.lat, lng: n.lng }));

    const solverOpts = {
      optimizeFor,
      maxTime: Number(maxTime) || 99999,
      maxCost: Number(maxCost) || 99999,
      sourceId: src,
      destId: dst,
    };

    const start = Date.now();
    let result;

    switch (algorithm) {
      case "astar":
        result = aStar(nodeCount, edgeList, nodeCoords, fees, solverOpts);
        break;
      case "bellmanford":
        result = bellmanFord(nodeCount, edgeList, fees, solverOpts);
        break;
      case "floydwarshall":
        result = floydWarshall(nodeCount, edgeList, fees, solverOpts);
        break;
      default:
        result = dijkstraSolver(nodeCount, edgeList, fees, solverOpts);
    }

    const executionTime = Date.now() - start;

    // Remap path indices to node names
    const pathNames = result.path.map((id) => (activeNodes[id] ? activeNodes[id].name : `Node ${id}`));

    return Response.json({
      ...result,
      sourceId: src,
      destId: dst,
      pathNames,
      algorithm,
      optimizeFor,
      executionTime,
      nodeCount: activeNodes.length || nodeCount,
      edgeCount: edgeList.length,
    });
  } catch (err) {
    console.error("[/api/solve]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

"use server";

import clientPromise from "@/app/lib/mongodb";
import Heap from "heap";
const client = await clientPromise;
const db_name = process.env.MONGODB_DB; // name of database imported from .env2
const db = client.db(db_name); // object of database

function minCost(maxTime, edges, passingFees) {
  const n = passingFees.length;

  // Build adjacency list
  const adj = Array.from({ length: n }, () => []);
  for (const [u, v, t] of edges) {
    adj[u].push([v, t]);
    adj[v].push([u, t]);
  }
  console.log(adj);
  // Initialize cost and time arrays
  const cost = Array(n).fill(Infinity);
  const time = Array(n).fill(Infinity);
  time[0] = 0;

  // Min-heap based on cost: [costSoFar, timeSoFar, currentNode]
  const pq = new Heap((a, b) => a[0] - b[0]);
  pq.push([passingFees[0], 0, 0]);

  while (!pq.empty()) {
    const [currCost, currTime, node] = pq.pop();
    console.log(pq.nodes);
    if (node === n - 1) return currCost;

    for (const [next, travelTime] of adj[node]) {
      const newTime = currTime + travelTime;
      const newCost = currCost + passingFees[next];

      if (
        newTime <= maxTime &&
        (newCost < cost[next] || newTime < time[next])
      ) {
        cost[next] = newCost;
        time[next] = newTime;
        pq.push([newCost, newTime, next]);
      }
    }
  }

  return -1; // If not reachable
}

export async function POST(request) {
  let rawEdges = await db.collection("Edges Collection").find({}).toArray();

  const edgeList = rawEdges.map((edge) => [
    Number(edge.source_node),
    Number(edge.destination_node),
    Number(edge.time),
  ]);

  console.log(edgeList);
  const passingFees = [5, 1, 2, 20, 20, 3];
  const cost = minCost(50, edgeList, passingFees);
  return Response.json(cost);
}

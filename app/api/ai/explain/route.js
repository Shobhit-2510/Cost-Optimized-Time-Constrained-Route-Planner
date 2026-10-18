/**
 * /api/ai/explain/route.js
 * Generates a human-readable explanation of why a route is optimal.
 * Input:  { path, pathNames, cost, algorithm, maxTime, nodes }
 * Output: { explanation: string }
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request) {
  try {
    const { path, pathNames, cost, algorithm, maxTime, nodes, edgeCount } = await request.json();

    if (!pathNames?.length) {
      return Response.json({ explanation: "No route found within the given constraints." });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

    const algNames = {
      dijkstra: "Dijkstra's Algorithm (minimum cost with time limit)",
      astar: "A* Algorithm (heuristic-guided fastest path)",
      bellmanford: "Bellman-Ford Algorithm",
      floydwarshall: "Floyd-Warshall Algorithm (all-pairs shortest path)",
    };

    const routeStr = pathNames.join(" → ");
    const stopsCount = pathNames.length - 2;
    const algName = algNames[algorithm] || algorithm;

    const prompt = `You are an expert route planning assistant for Indian travel.

A route was computed using ${algName}.

Route details:
- Path: ${routeStr}
- Total toll/passing fee cost: ₹${cost}
- Time limit: ${maxTime === 9999 ? "No limit" : `${maxTime} minutes (${(maxTime / 60).toFixed(1)} hours)`}
- Intermediate stops: ${stopsCount}
- Graph has ${edgeCount} connections

Write a friendly, informative 3-4 sentence explanation of:
1. Why this is the optimal route (cost/time tradeoff)
2. Any notable features of the route (e.g., passes through major hubs)
3. A practical travel tip

Keep it conversational and useful for a traveller. Mention actual city names.`;

    const result = await model.generateContent(prompt);
    return Response.json({ explanation: result.response.text().trim() });
  } catch (err) {
    console.error("[/api/ai/explain]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}


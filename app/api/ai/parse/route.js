/**
 * /api/ai/parse/route.js
 * Parses natural language route queries using Gemini API for All-India Highway Network.
 * Input:  { query: "cheapest route from Srinagar to Kanyakumari" }
 * Output: { sourceId, destId, maxTime, algorithm, confidence, explanation }
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NATIONAL_HIGHWAY_NODES } from "@/app/lib/nationalHighways";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const CITY_LIST = NATIONAL_HIGHWAY_NODES.map((c) => `${c.id}: ${c.name} (${c.state})`).join(", ");

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query?.trim()) {
      return Response.json({ error: "Empty query" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

    const prompt = `You are an Indian National Highway route planning assistant. 
Available hubs across India (id: name (state)): ${CITY_LIST}

User query: "${query}"

Extract the route planning parameters from this query. Respond with ONLY valid JSON, no markdown formatting:
{
  "sourceId": <number: hub id of origin, or 0 if unclear>,
  "destId": <number: hub id of destination, or 56 (Mumbai) if unclear>,
  "maxTime": <number: max travel time in minutes, or 9999 if no limit specified>,
  "algorithm": <"dijkstra" | "astar" | "bellmanford" | "floydwarshall">,
  "confidence": <"high" | "medium" | "low">,
  "sourceName": <string: origin city name>,
  "destName": <string: destination city name>,
  "explanation": <string: concise 1-sentence note of what was interpreted>
}

Rules:
- Convert hours or days to minutes (e.g., "8 hours" -> 480, "2 days" -> 2880)
- If user requests "fastest" or "quickest", use "astar"
- If user requests "cheapest" or "lowest toll", use "dijkstra"
- If city/town is not in list, pick the nearest major interchange in that state and mark confidence "medium"`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const jsonText = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonText);

    return Response.json(parsed);
  } catch (err) {
    console.error("[/api/ai/parse]", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

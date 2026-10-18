/**
 * /api/ai/parse/route.js
 * Parses natural language route queries using Gemini 3.8 Flash for All-India Highway Network.
 * Robustly resolves origin and destination names against active MongoDB / district dataset.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NATIONAL_HIGHWAY_NODES } from "@/app/lib/nationalHighways";
import clientPromise from "@/app/lib/mongodb";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
};

// Common Indian city name aliases and historical names
const ALIASES = {
  delhi: "central delhi",
  "new delhi": "new delhi",
  mumbai: "mumbai",
  bombay: "mumbai",
  bangalore: "bengaluru urban",
  bengaluru: "bengaluru urban",
  calcutta: "kolkata",
  kolkata: "kolkata",
  madras: "chennai",
  chennai: "chennai",
  gurgaon: "gurugram",
  gurugram: "gurugram",
  banaras: "varanasi",
  kashi: "varanasi",
  varanasi: "varanasi",
  cochin: "kochi",
  kochi: "ernakulam",
  ernakulam: "ernakulam",
  trivandrum: "thiruvananthapuram",
  kanyakumari: "kanniyakumari",
  poona: "pune",
  pune: "pune",
  vizag: "visakhapatnam",
  baroda: "vadodara",
  ahmedabad: "ahmedabad",
  ahmadabad: "ahmedabad",
};

function findBestNodeMatch(queryName, nodes) {
  if (!queryName || !nodes?.length) return null;
  const raw = queryName.toLowerCase().trim();
  const target = (ALIASES[raw] || raw).toLowerCase().trim();

  // 1. Exact match on normalized alias or name
  let match = nodes.find((n) => n.name && n.name.toLowerCase() === target);
  if (match) return match;

  // 2. Starts with / name contains target
  match = nodes.find((n) => n.name && n.name.toLowerCase().startsWith(target));
  if (match) return match;

  match = nodes.find((n) => n.name && n.name.toLowerCase().includes(target));
  if (match) return match;

  // 3. Target contains node name
  match = nodes.find((n) => n.name && target.includes(n.name.toLowerCase()));
  if (match) return match;

  // 4. Match against State (e.g. "Goa" -> North/South Goa)
  match = nodes.find((n) => n.state && n.state.toLowerCase().includes(target));
  if (match) return match;

  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { query, nodes: requestNodes } = body;

    if (!query?.trim()) {
      return Response.json({ error: "Empty query" }, { status: 400 });
    }

    // 1. Load active nodes
    let activeNodes = Array.isArray(requestNodes) && requestNodes.length > 0 ? requestNodes : [];
    if (activeNodes.length === 0) {
      try {
        const db = await getDb();
        const raw = await db.collection("Nodes Collection").find({}).toArray();
        if (raw && raw.length > 0) {
          activeNodes = raw.map(({ _id, node_id, ...rest }) => ({
            id: node_id,
            ...rest,
          }));
        }
      } catch (dbErr) {
        console.warn("[/api/ai/parse] DB fetch fallback:", dbErr.message);
      }
    }
    if (activeNodes.length === 0) {
      activeNodes = NATIONAL_HIGHWAY_NODES;
    }

    // 2. Prompt Gemini for semantic entity extraction
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

    const prompt = `You are an Indian National Highway route planning assistant.
Analyze this user query: "${query}"

Extract the route planning parameters. Respond with ONLY valid JSON, no markdown formatting:
{
  "sourceName": <string: origin city/district/state, e.g. "Delhi">,
  "destName": <string: destination city/district/state, e.g. "Mumbai">,
  "optimizeFor": <"cost" | "time">,
  "maxTime": <number: travel time budget ceiling in minutes, or 99999 if unspecified>,
  "maxCost": <number: toll budget ceiling in rupees, or 99999 if unspecified>,
  "algorithm": <"dijkstra" | "astar" | "bellmanford" | "floydwarshall">,
  "confidence": <"high" | "medium" | "low">,
  "explanation": <string: concise 1-sentence note of what was interpreted>
}

Rules:
- If user requests "cheapest", "cheaper", "lowest toll", "minimal toll", "low cost", or "budget", set optimizeFor="cost" and algorithm="dijkstra"
- If user requests "fastest", "quickest", or "shortest time", set optimizeFor="time" and algorithm="astar"
- If user provides a time budget (e.g. "under 24 hours" -> 1440, "within 2 days" -> 2880), set maxTime in minutes
- If user provides a toll budget (e.g. "under ₹1000" -> 1000), set maxCost in rupees
- Default optimizeFor to "time" if no preference is expressed`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Strip markdown code fences if present
    const jsonText = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonText);

    // 3. Resolve exact node IDs from the active nodes dataset
    const srcNode = findBestNodeMatch(parsed.sourceName, activeNodes);
    const dstNode = findBestNodeMatch(parsed.destName, activeNodes);

    const sourceId = srcNode ? srcNode.id : (parsed.sourceId ?? 0);
    const destId = dstNode ? dstNode.id : (parsed.destId ?? 1);
    const resolvedSourceName = srcNode ? `${srcNode.name} (${srcNode.state})` : (parsed.sourceName || "Origin");
    const resolvedDestName = dstNode ? `${dstNode.name} (${dstNode.state})` : (parsed.destName || "Destination");

    // Enforce objective from query keywords as a secondary safeguard
    const qLower = query.toLowerCase();
    let finalOptimizeFor = parsed.optimizeFor || "time";
    if (qLower.includes("cheap") || qLower.includes("toll") || qLower.includes("cost") || qLower.includes("rupee") || qLower.includes("econom")) {
      finalOptimizeFor = "cost";
    }

    return Response.json({
      ...parsed,
      sourceId,
      destId,
      sourceName: resolvedSourceName,
      destName: resolvedDestName,
      optimizeFor: finalOptimizeFor,
      algorithm: parsed.algorithm || (finalOptimizeFor === "cost" ? "dijkstra" : "astar"),
      maxTime: parsed.maxTime || 99999,
      maxCost: parsed.maxCost || 99999,
    });
  } catch (err) {
    console.warn("[/api/ai/parse] Gemini API warning, attempting heuristic fallback:", err.message);

    try {
      const qLower = query.toLowerCase();
      let extractedSource = "";
      let extractedDest = "";

      const matchBetween = qLower.match(
        /(?:from|between)\s+([a-zA-Z\s]+?)\s+(?:to|and)\s+([a-zA-Z\s]+?)(?:$|\s+(?:under|within|with|in|using|for|at))/
      );

      if (matchBetween) {
        extractedSource = matchBetween[1].trim();
        extractedDest = matchBetween[2].trim();
      }

      const isCheapest =
        qLower.includes("cheap") ||
        qLower.includes("toll") ||
        qLower.includes("cost") ||
        qLower.includes("budget") ||
        qLower.includes("rupee");

      // Extract numerical time/cost constraints if present
      let maxTime = 99999;
      const timeMatch = qLower.match(/(\d+)\s*(?:hours|hrs|hr|h)\b/);
      if (timeMatch) maxTime = Number(timeMatch[1]) * 60;
      const dayMatch = qLower.match(/(\d+)\s*(?:days|day|d)\b/);
      if (dayMatch) maxTime = Number(dayMatch[1]) * 24 * 60;

      let maxCost = 99999;
      const costMatch = qLower.match(/(?:under|below|max|budget|within)?\s*(?:rs\.?|₹|inr)?\s*(\d+)\s*(?:rupees|rs|inr)?/);
      if (costMatch && !timeMatch && !dayMatch) {
        const val = Number(costMatch[1]);
        if (val > 50 && val < 50000) maxCost = val;
      }

      // Load active nodes for fallback resolution
      let fallbackNodes = Array.isArray(requestNodes) && requestNodes.length > 0 ? requestNodes : [];
      if (fallbackNodes.length === 0) {
        fallbackNodes = NATIONAL_HIGHWAY_NODES;
      }

      const srcNode = findBestNodeMatch(extractedSource, fallbackNodes);
      const dstNode = findBestNodeMatch(extractedDest, fallbackNodes);

      if (srcNode && dstNode) {
        const optimizeFor = isCheapest ? "cost" : "time";
        const algorithm = isCheapest ? "dijkstra" : "astar";
        return Response.json({
          sourceId: srcNode.id,
          destId: dstNode.id,
          sourceName: `${srcNode.name} (${srcNode.state})`,
          destName: `${dstNode.name} (${dstNode.state})`,
          optimizeFor,
          algorithm,
          maxTime,
          maxCost,
          confidence: "medium",
          explanation: `Routing from ${srcNode.name} to ${dstNode.name} (${optimizeFor === "cost" ? "Lowest Toll Objective" : "Fastest Transit Objective"}).`,
        });
      }
    } catch (fallbackErr) {
      console.error("[/api/ai/parse] Heuristic fallback error:", fallbackErr.message);
    }

    return Response.json({ error: err.message }, { status: 500 });
  }
}

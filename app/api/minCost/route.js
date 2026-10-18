import clientPromise from "@/app/lib/mongodb";
import { dijkstraMinCost } from "@/app/lib/algorithms";

/**
 * Legacy minCost endpoint — kept for backward compatibility.
 * Prefer /api/solve for new usage.
 */
const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
};

export async function POST(request) {
  try {
    const db = await getDb();
    const rawEdges = await db.collection("Edges Collection").find({}).toArray();

    const edgeList = rawEdges.map((e) => [
      Number(e.source_node),
      Number(e.destination_node),
      Number(e.time),
    ]);

    const passingFees = [5, 1, 2, 20, 20, 3];
    const { cost } = dijkstraMinCost(passingFees.length, edgeList, passingFees, 50);

    return Response.json({ cost, note: "Use /api/solve for full features" });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

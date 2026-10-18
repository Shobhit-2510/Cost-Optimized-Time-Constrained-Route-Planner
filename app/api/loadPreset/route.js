import clientPromise from "@/app/lib/mongodb";
import { NATIONAL_HIGHWAY_NODES, NATIONAL_HIGHWAY_EDGES } from "@/app/lib/nationalHighways";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
};

export async function POST() {
  try {
    const db = await getDb();
    const edgesCollection = db.collection("Edges Collection");
    const nodesCollection = db.collection("Nodes Collection");

    // 1. Reset and load Nodes Collection
    await nodesCollection.deleteMany({});
    const nodeDocs = NATIONAL_HIGHWAY_NODES.map((n) => ({
      node_id: n.id,
      name: n.name,
      state: n.state,
      lat: n.lat,
      lng: n.lng,
      fee: n.fee,
    }));
    await nodesCollection.insertMany(nodeDocs);

    // 2. Reset and load Edges Collection
    await edgesCollection.deleteMany({});
    const edgeDocs = NATIONAL_HIGHWAY_EDGES.map(([u, v, t, ref]) => ({
      source_node: u,
      destination_node: v,
      time: t,
      highway_ref: ref || "NH",
      transport_type: "road",
    }));
    const edgeResult = await edgesCollection.insertMany(edgeDocs);

    return Response.json({
      success: true,
      message: `Successfully synchronized ${nodeDocs.length} junctions and ${edgeResult.insertedCount} National Highway corridors into MongoDB.`,
      nodeCount: nodeDocs.length,
      edgeCount: edgeResult.insertedCount,
      storageApproxKB: 12,
    });
  } catch (err) {
    console.error("[/api/loadPreset]", err);
    return Response.json({ error: err.message, success: false }, { status: 500 });
  }
}

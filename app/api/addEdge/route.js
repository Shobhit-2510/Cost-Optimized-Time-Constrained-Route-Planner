import clientPromise from "@/app/lib/mongodb";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
};

export async function POST(request) {
  try {
    const db = await getDb();
    const edge = await request.json();

    // Validate input
    const { source_node, destination_node, time, transport_type = "road" } = edge;
    if (source_node === undefined || destination_node === undefined || time === undefined) {
      return Response.json({ error: "Missing fields: source_node, destination_node, time" }, { status: 400 });
    }

    const doc = { source_node: Number(source_node), destination_node: Number(destination_node), time: Number(time), transport_type };

    const existing = await db.collection("Edges Collection").findOne({
      source_node: doc.source_node,
      destination_node: doc.destination_node,
    });

    if (existing) {
      return Response.json({ message: "Edge already exists in graph.", success: false });
    }

    await db.collection("Edges Collection").insertOne(doc);
    return Response.json({ message: "Edge added successfully.", success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import clientPromise from "@/app/lib/mongodb";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
};

export async function POST(request) {
  try {
    const db = await getDb();
    const { source_node, destination_node } = await request.json();

    if (source_node === undefined || destination_node === undefined) {
      return Response.json({ error: "Missing source_node or destination_node" }, { status: 400 });
    }

    const result = await db.collection("Edges Collection").deleteOne({
      source_node: Number(source_node),
      destination_node: Number(destination_node),
    });

    if (result.deletedCount > 0) {
      return Response.json({ message: "Edge deleted successfully.", success: true });
    }
    return Response.json({ message: "Edge not found.", success: false });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

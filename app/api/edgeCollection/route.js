import clientPromise from "@/app/lib/mongodb";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
};

export async function POST(request) {
  try {
    const db = await getDb();
    const edges = await db.collection("Edges Collection").find({}).toArray();
    // Remove MongoDB _id for clean JSON response
    const clean = edges.map(({ _id, ...rest }) => rest);
    return Response.json(clean);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

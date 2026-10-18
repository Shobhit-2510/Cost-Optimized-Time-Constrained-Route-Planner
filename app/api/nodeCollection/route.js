import clientPromise from "@/app/lib/mongodb";
import { NATIONAL_HIGHWAY_NODES } from "@/app/lib/nationalHighways";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
};

export async function POST() {
  try {
    const db = await getDb();
    const nodes = await db.collection("Nodes Collection").find({}).toArray();

    if (nodes && nodes.length > 0) {
      const clean = nodes.map(({ _id, node_id, ...rest }) => ({
        id: node_id,
        ...rest,
      }));
      return Response.json(clean);
    }

    // Fallback to static national highway nodes if collection is empty
    return Response.json(NATIONAL_HIGHWAY_NODES);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}


"use server";

import clientPromise from "@/app/lib/mongodb";
const client = await clientPromise;
const db_name = process.env.MONGODB_DB; // name of database imported from .env2
const db = client.db(db_name); // object of database

export async function POST(request) {
  const edge = await request.json();
  let result = await db.collection("Edges Collection").deleteOne(edge);
  if (result.deletedCount > 0) result = "Successfully deleted edge from graph.";
  else result = "Edge not found in graph.";
  return Response.json(result);
}

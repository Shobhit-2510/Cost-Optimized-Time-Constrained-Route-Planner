"use server";

import clientPromise from "@/app/lib/mongodb";
const client = await clientPromise;
const db_name = process.env.MONGODB_DB; // name of database imported from .env2
const db = client.db(db_name); // object of database

export async function POST(request) {
  const edge = await request.json();
  const same_edges_array = await db
    .collection("Edges Collection")
    .find(edge)
    .toArray();
  let result = "Edge already in graph.";
  if (same_edges_array.length === 0) {
    result = await db.collection("Edges Collection").insertOne(edge);
    if(result.acknowledged)
        result = "Successfully added edge in graph."
  }
  return Response.json(result);
}

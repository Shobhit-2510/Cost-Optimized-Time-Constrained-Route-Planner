"use server";

import clientPromise from "@/app/lib/mongodb";
const client = await clientPromise;
const db_name = process.env.MONGODB_DB; // name of database imported from .env2
const db = client.db(db_name); // object of database

export async function POST(request) {
  let result = await db.collection("Edges Collection").find({}).toArray();
  console.log(result)
  return Response.json(result);
}

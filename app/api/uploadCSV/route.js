/**
 * /api/uploadCSV/route.js
 * High-performance bulk CSV ingestion endpoint for Nodes and Edges.
 * Handles thousands of rows in seconds using MongoDB bulk operations.
 * Accepts: { type: "nodes" | "edges", csvContent: string, mode: "append" | "replace" }
 */

import clientPromise from "@/app/lib/mongodb";

const getDb = async () => {
  const client = await clientPromise;
  return client.db(process.env.MONGODB_DB);
};

// Robust CSV parser handling quotes, commas, and multi-line values
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ""));
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split on commas not inside quotes
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"' || char === "'") {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ""));

    if (values.length === headers.length) {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = values[idx];
      });
      records.push(obj);
    }
  }

  return records;
}

export async function POST(request) {
  const startTime = Date.now();
  try {
    const { type = "edges", csvContent, mode = "append" } = await request.json();

    if (!csvContent || typeof csvContent !== "string") {
      return Response.json({ error: "Missing or invalid csvContent string", success: false }, { status: 400 });
    }

    const rows = parseCSV(csvContent);
    if (rows.length === 0) {
      return Response.json({ error: "No valid rows found in CSV. Ensure valid headers and content.", success: false }, { status: 400 });
    }

    const db = await getDb();

    if (type === "nodes") {
      const collection = db.collection("Nodes Collection");
      if (mode === "replace") {
        await collection.deleteMany({});
      }

      // Map rows to standard schema
      const nodeDocs = rows.map((r, idx) => {
        const id = Number(r.id !== undefined ? r.id : r.node_id ?? idx);
        const name = r.name || r.city || r.district || `Node ${id}`;
        const state = r.state || "India";
        const lat = parseFloat(r.lat || r.latitude || 0);
        const lng = parseFloat(r.lng || r.lon || r.longitude || 0);
        const fee = parseFloat(r.fee || r.toll || 0);

        return { node_id: id, name, state, lat, lng, fee };
      });

      // Filter out invalid lat/lng
      const validDocs = nodeDocs.filter((n) => !isNaN(n.lat) && !isNaN(n.lng));

      if (validDocs.length === 0) {
        return Response.json({ error: "No nodes with valid lat/lng found", success: false }, { status: 400 });
      }

      // Bulk write with upserts
      const ops = validDocs.map((doc) => ({
        updateOne: {
          filter: { node_id: doc.node_id },
          update: { $set: doc },
          upsert: true,
        },
      }));

      const res = await collection.bulkWrite(ops, { ordered: false });
      const elapsed = Date.now() - startTime;

      return Response.json({
        success: true,
        message: `Successfully processed ${validDocs.length} nodes in ${elapsed}ms.`,
        processedCount: validDocs.length,
        upsertedCount: res.upsertedCount,
        modifiedCount: res.modifiedCount,
        elapsedMs: elapsed,
      });
    } else {
      // Process Edges
      const collection = db.collection("Edges Collection");
      if (mode === "replace") {
        await collection.deleteMany({});
      }

      const edgeDocs = rows.map((r) => {
        const source_node = Number(r.source_node ?? r.source ?? r.u ?? r.from);
        const destination_node = Number(r.destination_node ?? r.dest ?? r.destination ?? r.v ?? r.to);
        const time = Number(r.time ?? r.duration ?? r.minutes ?? 60);
        const highway_ref = r.highway_ref || r.ref || r.nh || "NH";
        const transport_type = r.transport_type || r.mode || "road";

        return { source_node, destination_node, time, highway_ref, transport_type };
      });

      const validEdges = edgeDocs.filter(
        (e) => !isNaN(e.source_node) && !isNaN(e.destination_node) && !isNaN(e.time)
      );

      if (validEdges.length === 0) {
        return Response.json({ error: "No edges with valid source, destination, and time found", success: false }, { status: 400 });
      }

      // Bulk write with upserts based on (source, destination)
      const ops = validEdges.map((doc) => ({
        updateOne: {
          filter: { source_node: doc.source_node, destination_node: doc.destination_node },
          update: { $set: doc },
          upsert: true,
        },
      }));

      const res = await collection.bulkWrite(ops, { ordered: false });
      const elapsed = Date.now() - startTime;

      return Response.json({
        success: true,
        message: `Successfully processed ${validEdges.length} highway segments in ${elapsed}ms.`,
        processedCount: validEdges.length,
        upsertedCount: res.upsertedCount,
        modifiedCount: res.modifiedCount,
        elapsedMs: elapsed,
      });
    }
  } catch (err) {
    console.error("[/api/uploadCSV]", err);
    return Response.json({ error: err.message, success: false }, { status: 500 });
  }
}


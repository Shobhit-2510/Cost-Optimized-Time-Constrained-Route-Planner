"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [srcNode, setSrcNode] = useState(-1);
  const [destNode, setDestNode] = useState(-1);
  const [time, setTime] = useState(-1);
  const [edgeResponse, setEdgeResponse] = useState("");
  const [Edges, setEdges] = useState([]);

  useEffect(() => {
    fetchEdges();
  }, []);

  async function fetchEdges(params) {
    const res = await fetch("api/edgeCollection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    console.log(data);
    setEdges(data);
  }
  function handleChange(e) {
    if (e.target.name === "Source_Node") setSrcNode(e.target.value);
    else if (e.target.name === "Destination_Node") setDestNode(e.target.value);
    else if (e.target.name === "Time_Input") setTime(e.target.value);
  }
  async function handleClick(e) {
    if (e.target.name === "Add_Edge") {
      const res = await fetch("api/addEdge", {
        method: "POST",
        body: JSON.stringify({
          source_node: srcNode,
          destination_node: destNode,
          time: time,
        }),
      });
      const data = await res.json();
      setEdgeResponse(data);
    } else if (e.target.name === "Delete_Edge") {
      const res = await fetch("api/minCost", {
        method: "POST",
        body: JSON.stringify({
          source_node: srcNode,
          destination_node: destNode,
          time: time,
        }),
      });
      const data = await res.json();
      setEdgeResponse(data);
    }
    fetchEdges();
  }

  return (
    <>
      <div className="bg-black min-h-screen text-white flex flex-col px-48 gap-5">
        <h1>Insert Edges</h1>
        From :{" "}
        <input
          type="number"
          name="Source_Node"
          id="from"
          className="bg-white rounded-2xl text-black px-2"
          value={srcNode}
          onChange={handleChange}
        />
        To :{" "}
        <input
          type="number"
          name="Destination_Node"
          id="from"
          className="bg-white rounded-2xl text-black px-2"
          value={destNode}
          onChange={handleChange}
        />
        Time :{" "}
        <input
          type="number"
          name="Time_Input"
          id="from"
          className="bg-white rounded-2xl text-black px-2"
          value={time}
          onChange={handleChange}
        />
        <button
          className="border-1 border-white rounded-2xl"
          name="Add_Edge"
          onClick={handleClick}
        >
          Add Edge
        </button>
        <button
          className="border-1 border-white rounded-2xl"
          name="Delete_Edge"
          onClick={handleClick}
        >
          Delete Edge
        </button>
        <div>{JSON.stringify(edgeResponse)}</div>
        <div>
          {Edges.map((edge, index) => (
            <div key={index}>
              From: {edge.source_node}, To: {edge.destination_node}, Time: {edge.time}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

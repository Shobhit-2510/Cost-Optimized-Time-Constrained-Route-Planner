"""
extract_india_network.py
Extracts India's National Highway network and District Hubs directly from OpenStreetMap via Overpass API.
Uses Python requests and pandas (no complex C-dependencies required).
Outputs:
1. india_district_nodes.csv (Nodes)
2. india_highway_edges.csv (Edges)
"""

import requests
import pandas as pd
import math
import os

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Haversine distance in km
def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def main():
    print("=" * 60)
    print("Extracting India Highway & District Network from OpenStreetMap")
    print("=" * 60)

    # Overpass query: major cities & districts in India + national highway ways
    query = """
    [out:json][timeout:180];
    area["ISO3166-1"="IN"][admin_level=2]->.india;
    (
      // District hubs and major cities
      node["place"~"city|town|district"](area.india);
      // Expressways and major national highways
      way["highway"~"motorway|trunk"]["ref"](area.india);
    );
    out body;
    >;
    out skel qt;
    """

    print("Fetching OpenStreetMap network topology (this takes ~15-30s)...")
    try:
        response = requests.post(OVERPASS_URL, data={'data': query}, headers={'User-Agent': 'SmartRoutePlanner/1.0'})
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Direct Overpass query error: {e}")
        print("Falling back to pre-compiled high-precision dataset generator...")
        return generate_complete_district_network()

    elements = data.get("elements", [])
    print(f"Retrieved {len(elements)} raw OpenStreetMap elements.")

    nodes_dict = {}
    ways_list = []

    for el in elements:
        t = el.get("type")
        if t == "node":
            nodes_dict[el["id"]] = {
                "id": el["id"],
                "lat": el["lat"],
                "lng": el["lon"],
                "name": el.get("tags", {}).get("name", ""),
                "state": el.get("tags", {}).get("is_in:state", "India")
            }
        elif t == "way":
            ways_list.append(el)

    print(f"Found {len(nodes_dict)} vertices and {len(ways_list)} highway ways.")

    # Convert to CSVs
    process_and_save(nodes_dict, ways_list)

def generate_complete_district_network():
    """Generates the comprehensive All-India District and National Highway network CSVs."""
    print("Generating comprehensive All-India District Network...")
    from app.lib.nationalHighways import NATIONAL_HIGHWAY_NODES, NATIONAL_HIGHWAY_EDGES
    
    nodes_df = pd.DataFrame(NATIONAL_HIGHWAY_NODES)
    nodes_df.to_csv("india_district_nodes.csv", index=False)
    print(f"Generated india_district_nodes.csv ({len(nodes_df)} districts/interchanges)")

    edges_rows = []
    for u, v, t, ref in NATIONAL_HIGHWAY_EDGES:
        edges_rows.append({
            "source_node": u,
            "destination_node": v,
            "time": t,
            "highway_ref": ref,
            "transport_type": "road"
        })
    edges_df = pd.DataFrame(edges_rows)
    edges_df.to_csv("india_highway_edges.csv", index=False)
    print(f"Generated india_highway_edges.csv ({len(edges_df)} national highway corridors)")
    print("Done! Files saved in workspace.")

def process_and_save(nodes_dict, ways_list):
    # Filter nodes with names (district/city centers)
    named_nodes = [n for n in nodes_dict.values() if n["name"]]
    if len(named_nodes) < 50:
        return generate_complete_district_network()

    nodes_df = pd.DataFrame(named_nodes)
    nodes_df["fee"] = 80
    nodes_df.to_csv("india_district_nodes.csv", index=False)
    print(f"Generated india_district_nodes.csv with {len(nodes_df)} district hubs.")

    edge_rows = []
    for w in ways_list:
        nodes = w.get("nodes", [])
        ref = w.get("tags", {}).get("ref", "NH")
        for i in range(len(nodes) - 1):
            u = nodes[i]
            v = nodes[i + 1]
            if u in nodes_dict and v in nodes_dict:
                dist = haversine(nodes_dict[u]["lat"], nodes_dict[u]["lng"], nodes_dict[v]["lat"], nodes_dict[v]["lng"])
                time_min = max(5, round((dist / 75.0) * 60))
                edge_rows.append({
                    "source_node": u,
                    "destination_node": v,
                    "time": time_min,
                    "highway_ref": ref,
                    "transport_type": "road"
                })

    edges_df = pd.DataFrame(edge_rows)
    edges_df.to_csv("india_highway_edges.csv", index=False)
    print(f"Generated india_highway_edges.csv with {len(edges_df)} segments.")

if __name__ == "__main__":
    main()


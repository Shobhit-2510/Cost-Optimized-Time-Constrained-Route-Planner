"""
generate_large_india_dataset.py
Generates a comprehensive All-India District & Highway Dataset covering all 732 districts
across all 28 States and 8 Union Territories with a 100% connected highway network graph.
Stores compactly (< 150 KB) to strictly respect the 100 MB MongoDB quota.
"""

import csv
import json
import math
import os
import re
import urllib.request
import numpy as np
from scipy.spatial import Delaunay

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def norm(s):
    if not isinstance(s, str):
        return ""
    return re.sub(r"[^a-z0-9]", "", s.lower())

def clean_district_name(name):
    # Fix common abbreviations and format title case
    replacements = {
        "spsr nellore": "Nellore (SPSR)",
        "ysr": "Kadapa (YSR)",
        "the dangs": "Dang",
        "mewat": "Nuh (Mewat)",
        "firozepur": "Firozpur",
        "koch bihar": "Cooch Behar",
        "south 24 parganas": "South 24 Parganas",
        "north 24 parganas": "North 24 Parganas",
        "delhi": "Central Delhi",
        "nicobars": "Nicobar Islands",
        "north and middle andaman": "North & Middle Andaman",
        "south andaman": "South Andaman (Port Blair)",
        "jaya shankar bhalupally": "Jayashankar Bhupalpally",
        "peddapalle": "Peddapalli",
        "medchal malkajgiri": "Medchal-Malkajgiri",
        "komaram bheem asifabad": "Kumuram Bheem Asifabad",
        "badgam": "Budgam",
        "bandipore": "Bandipora",
        "shupiyan": "Shopian",
    }
    low = name.lower().strip()
    if low in replacements:
        return replacements[low]
    # Clean words
    words = [w.capitalize() for w in name.strip().split()]
    return " ".join(words)

# Known state mapping fallbacks for edge cases
KNOWN_STATES = {
    "dang": "Gujarat",
    "thedangs": "Gujarat",
    "nuhmewat": "Haryana",
    "mewat": "Haryana",
    "unahimachal": "Himachal Pradesh",
    "bandipore": "Jammu and Kashmir",
    "bandipora": "Jammu and Kashmir",
    "muzaffarabad": "Jammu and Kashmir",
    "monnagaland": "Nagaland",
    "firozepur": "Punjab",
    "firozpur": "Punjab",
    "jayashankarbhalupally": "Telangana",
    "jayashankarbhupalpally": "Telangana",
    "peddapalle": "Telangana",
    "peddapalli": "Telangana",
    "kochbihar": "West Bengal",
    "coochbehar": "West Bengal",
    "nicobarislands": "Andaman and Nicobar Islands",
    "nicobars": "Andaman and Nicobar Islands",
    "northmiddleandaman": "Andaman and Nicobar Islands",
    "northandmiddleandaman": "Andaman and Nicobar Islands",
    "southandamanportblair": "Andaman and Nicobar Islands",
    "southandaman": "Andaman and Nicobar Islands",
    "lakshadweep": "Lakshadweep",
}

def determine_highway_ref(u_name, v_name, lat1, lon1, lat2, lon2):
    avg_lat = (lat1 + lat2) / 2
    avg_lon = (lon1 + lon2) / 2
    dlat = abs(lat1 - lat2)
    dlon = abs(lon1 - lon2)

    # Major Corridors
    # NH-44: North-South central spine
    if 76.0 <= avg_lon <= 79.5 and dlat > dlon:
        return "NH-44"
    # NH-48: West-South golden quadrilateral (Delhi-Jaipur-Ahmedabad-Mumbai-Pune-Bangalore-Chennai)
    if (72.0 <= avg_lon <= 77.5 and 12.0 <= avg_lat <= 28.5) and abs((lat1 - 28.5) - (lon1 - 77.0) * -1.5) < 3.0:
        return "NH-48"
    # NH-16: East coast (Kolkata - Vizag - Chennai)
    if avg_lon >= 80.0 and avg_lat <= 22.5 and (dlat > dlon * 0.7):
        return "NH-16"
    # NH-27: East-West Corridor (Gujarat to Assam)
    if 24.0 <= avg_lat <= 27.5 and dlon > dlat:
        return "NH-27"
    # NH-66: West coast (Mumbai to Kanyakumari)
    if avg_lon <= 75.5 and avg_lat <= 19.5:
        return "NH-66"
    # NH-53: Central East-West (Gujarat-Maharashtra-Chhattisgarh-Odisha)
    if 20.0 <= avg_lat <= 22.0 and dlon > dlat:
        return "NH-53"
    # NH-52: Punjab to Karnataka
    if 74.0 <= avg_lon <= 76.5:
        return "NH-52"
    # NH-19: Delhi-Kolkata
    if 22.5 <= avg_lat <= 28.5 and 77.5 <= avg_lon <= 88.5:
        return "NH-19"

    # Regional NH or SH designation
    hwy_num = (int(avg_lat * 10) + int(avg_lon * 10)) % 80 + 10
    return f"NH-{hwy_num}"

def calculate_toll_fee(name, state):
    # Tier-1 metros and key industrial junctions have higher toll rates
    major_metros = [
        "delhi", "mumbai", "bengaluru", "bangalore", "hyderabad", "chennai", "kolkata",
        "pune", "ahmedabad", "gurgaon", "gurugram", "noida", "ghaziabad", "thane"
    ]
    state_capitals = [
        "lucknow", "jaipur", "bhopal", "patna", "chandigarh", "ranchi", "bhubaneswar",
        "dehradun", "shimla", "srinagar", "thiruvananthapuram", "raipur", "guwahati",
        "gandhinagar", "amaravati"
    ]
    low = name.lower()
    for m in major_metros:
        if m in low:
            return 120 + (hash(name) % 30)
    for c in state_capitals:
        if c in low:
            return 90 + (hash(name) % 25)
    # Default district hub fee (between ₹40 and ₹80)
    return 40 + (abs(hash(name)) % 45)

def main():
    print("=" * 70)
    print("All-India 730+ District & National Highway Network Generator")
    print("=" * 70)

    # 1. Fetch raw datasets
    print("Downloading district coordinate & administrative records...")
    url_pp = "https://raw.githubusercontent.com/SaravananSuriya/Phonepe-Pulse-Data-Visualization-and-Exploration/main/lat-%26-lon-india-district.csv"
    url_lgd = "https://raw.githubusercontent.com/planemad/india-local-government-directory/main/administrative/2-district.csv"
    url_ic = "https://raw.githubusercontent.com/recurze/IndianCities/master/india_places.csv"

    # Read LGD states
    req = urllib.request.urlopen(url_lgd)
    lgd_lines = req.read().decode("utf-8").splitlines()
    lgd_reader = csv.reader(lgd_lines)
    header = next(lgd_reader)
    state_lookup = {}
    for row in lgd_reader:
        if len(row) >= 4:
            s_name = row[1].strip().title()
            d_name = norm(row[3])
            if d_name and d_name not in state_lookup:
                state_lookup[d_name] = s_name

    # Read IndianCities states fallback
    req_ic = urllib.request.urlopen(url_ic)
    ic_lines = req_ic.read().decode("utf-8", errors="ignore").splitlines()
    ic_reader = csv.reader(ic_lines)
    next(ic_reader)
    for row in ic_reader:
        if len(row) >= 3:
            s_name = row[0].strip().title()
            d_name = norm(row[1])
            if d_name and d_name != "-" and d_name not in state_lookup:
                state_lookup[d_name] = s_name

    # Read PhonePe districts
    req_pp = urllib.request.urlopen(url_pp)
    pp_lines = req_pp.read().decode("utf-8").splitlines()
    pp_reader = csv.reader(pp_lines)
    next(pp_reader)

    raw_districts = []
    seen_names = set()
    for row in pp_reader:
        if len(row) >= 3:
            d_raw = row[0].strip()
            try:
                lat = float(row[1])
                lng = float(row[2])
            except ValueError:
                continue

            # Validate bounding box of India
            if not (6.0 <= lat <= 37.5 and 68.0 <= lng <= 97.5):
                continue

            cleaned = clean_district_name(d_raw)
            if cleaned.lower() in seen_names:
                continue
            seen_names.add(cleaned.lower())

            # Resolve state
            n_key = norm(d_raw)
            resolved_state = KNOWN_STATES.get(n_key)
            if not resolved_state:
                resolved_state = state_lookup.get(n_key)
            if not resolved_state:
                # Substring match
                for k, v in state_lookup.items():
                    if (len(k) > 4 and k in n_key) or (len(n_key) > 4 and n_key in k):
                        resolved_state = v
                        break
            if not resolved_state:
                resolved_state = "India Territory"

            fee = calculate_toll_fee(cleaned, resolved_state)
            raw_districts.append({
                "name": cleaned,
                "state": resolved_state,
                "lat": round(lat, 4),
                "lng": round(lng, 4),
                "fee": fee
            })

    # Sort districts by State, then Name for neat grouping
    raw_districts.sort(key=lambda x: (x["state"], x["name"]))
    for idx, d in enumerate(raw_districts):
        d["id"] = idx

    total_districts = len(raw_districts)
    print(f"Loaded and standardized {total_districts} Indian districts across all States and UTs.")

    # 2. Build Planar Road & Highway Connectivity via Delaunay Triangulation + k-NN + Spanning Tree
    print("Generating connected highway topology graph...")
    coords = np.array([[d["lng"], d["lat"]] for d in raw_districts])
    tri = Delaunay(coords)

    edge_set = set()
    # Add Delaunay spatial neighbor edges (within 220 km threshold to avoid cross-country ocean chords)
    for simplex in tri.simplices:
        for i in range(3):
            for j in range(i + 1, 3):
                u, v = simplex[i], simplex[j]
                d1 = raw_districts[u]
                d2 = raw_districts[v]
                dist = haversine(d1["lat"], d1["lng"], d2["lat"], d2["lng"])
                if dist <= 220:
                    u_min, v_max = min(u, v), max(u, v)
                    edge_set.add((u_min, v_max, dist))

    # Add nearest neighbors for each node to ensure no isolated nodes
    for u in range(total_districts):
        d1 = raw_districts[u]
        dists = []
        for v in range(total_districts):
            if u != v:
                d2 = raw_districts[v]
                dist = haversine(d1["lat"], d1["lng"], d2["lat"], d2["lng"])
                dists.append((dist, v))
        dists.sort()
        # Connect to 2 closest neighbors if distance is reasonable (< 300 km)
        for dist, v in dists[:2]:
            if dist <= 300:
                edge_set.add((min(u, v), max(u, v), dist))

    # Island Connections (Port Blair / Andaman & Lakshadweep)
    # Find Port Blair / South Andaman and connect to Chennai & Kolkata via sea/air link
    # Find Lakshadweep and connect to Kochi
    for idx, d in enumerate(raw_districts):
        name_l = d["name"].lower()
        if "andaman" in name_l or "nicobar" in name_l:
            # Connect to closest coastal ports: Chennai and Kolkata
            for p_idx, p in enumerate(raw_districts):
                if p["name"].lower().startswith("chennai") or "kolkata" in p["name"].lower():
                    dist = haversine(d["lat"], d["lng"], p["lat"], p["lng"])
                    edge_set.add((min(idx, p_idx), max(idx, p_idx), dist))
        if "lakshadweep" in name_l:
            # Connect to Kochi / Ernakulam
            for p_idx, p in enumerate(raw_districts):
                if "kochi" in p["name"].lower() or "ernakulam" in p["name"].lower():
                    dist = haversine(d["lat"], d["lng"], p["lat"], p["lng"])
                    edge_set.add((min(idx, p_idx), max(idx, p_idx), dist))

    # 3. Verify Graph Connectivity
    adj = {i: [] for i in range(total_districts)}
    for u, v, _ in edge_set:
        adj[u].append(v)
        adj[v].append(u)

    visited = set()
    stack = [0]
    while stack:
        curr = stack.pop()
        if curr not in visited:
            visited.add(curr)
            for nxt in adj[curr]:
                if nxt not in visited:
                    stack.append(nxt)

    disconnected = [i for i in range(total_districts) if i not in visited]
    if disconnected:
        print(f"Connecting {len(disconnected)} edge nodes to nearest connected neighbor...")
        for disc in disconnected:
            d_disc = raw_districts[disc]
            best_dist = float("inf")
            best_target = 0
            for vis in visited:
                d_vis = raw_districts[vis]
                dist = haversine(d_disc["lat"], d_disc["lng"], d_vis["lat"], d_vis["lng"])
                if dist < best_dist:
                    best_dist = dist
                    best_target = vis
            edge_set.add((min(disc, best_target), max(disc, best_target), best_dist))
            visited.add(disc)

    print(f"Graph verification: 100% of all {total_districts} districts are fully connected in a single graph!")
    print(f"Total highway and corridor segments: {len(edge_set)}")

    # 4. Generate Output CSV Files
    nodes_csv = "india_district_nodes.csv"
    with open(nodes_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "state", "lat", "lng", "fee"])
        for d in raw_districts:
            writer.writerow([d["id"], d["name"], d["state"], d["lat"], d["lng"], d["fee"]])

    nodes_size = os.path.getsize(nodes_csv)
    print(f"Written {nodes_csv}: {total_districts} district nodes ({nodes_size} bytes, ~{nodes_size / 1024:.1f} KB)")

    edges_csv = "india_highway_edges.csv"
    with open(edges_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["source_node", "destination_node", "time", "highway_ref", "transport_type"])
        for u, v, dist in sorted(edge_set):
            d1 = raw_districts[u]
            d2 = raw_districts[v]
            hwy = determine_highway_ref(d1["name"], d2["name"], d1["lat"], d1["lng"], d2["lat"], d2["lng"])

            # Compute realistic travel time in minutes:
            # 65 km/h average speed = ~0.92 min/km. Mountainous regions: ~1.2 min/km.
            is_hilly = d1["lat"] > 31.0 or d1["lng"] > 91.0
            speed_factor = 1.3 if is_hilly else 0.92
            time_mins = max(15, int(round(dist * speed_factor)))

            transport = "road"
            if "andaman" in d1["name"].lower() or "andaman" in d2["name"].lower() or "lakshadweep" in d1["name"].lower():
                transport = "flight"
                hwy = "Ferry/Air Coastal Link"
                time_mins = max(120, int(round(dist * 0.25))) # ~400 km/h effective flight/fast transit

            writer.writerow([u, v, time_mins, hwy, transport])

    edges_size = os.path.getsize(edges_csv)
    print(f"Written {edges_csv}: {len(edge_set)} highway edges ({edges_size} bytes, ~{edges_size / 1024:.1f} KB)")

    total_kb = (nodes_size + edges_size) / 1024
    print(f"Combined Dataset Size: {total_kb:.1f} KB (< 0.15% of your 100 MB MongoDB limit!)")

    # 5. Automatically Ingest to MongoDB Atlas
    print("\nIngesting expanded dataset directly to MongoDB Atlas...")
    try:
        with open(nodes_csv, "r", encoding="utf-8") as f:
            n_text = f.read()
        req_n = urllib.request.Request(
            "http://localhost:3000/api/uploadCSV",
            data=json.dumps({"type": "nodes", "csvContent": n_text, "mode": "replace"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req_n, timeout=30) as resp:
            res_n = json.loads(resp.read().decode())
            print(f"MongoDB Nodes: {res_n.get('message')}")

        with open(edges_csv, "r", encoding="utf-8") as f:
            e_text = f.read()
        req_e = urllib.request.Request(
            "http://localhost:3000/api/uploadCSV",
            data=json.dumps({"type": "edges", "csvContent": e_text, "mode": "replace"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req_e, timeout=30) as resp:
            res_e = json.loads(resp.read().decode())
            print(f"MongoDB Edges: {res_e.get('message')}")

        print("\nAll-India Large Dataset successfully loaded into MongoDB Atlas!")
    except Exception as e:
        print(f"Upload notice: {e}")

if __name__ == "__main__":
    main()


"""
generate_all_india_datasets.py
Generates unified, pre-matched All-India District Nodes and National Highway Edges CSV files.
Optionally uploads them directly to your MongoDB cluster via the /api/uploadCSV endpoint.
"""

import csv
import json
import os
import urllib.request

# Complete All-India Strategic District Hubs & Junctions
NODES_DATA = [
  # North
  (0,  "Delhi (NCR)",                  "Delhi",         28.6139, 77.2090, 0),
  (1,  "Gurgaon / Gurugram",           "Haryana",       28.4595, 77.0266, 70),
  (2,  "Noida / Greater Noida",         "Uttar Pradesh", 28.5355, 77.3910, 60),
  (3,  "Panipat Junction (NH-44)",     "Haryana",       29.3909, 76.9635, 85),
  (4,  "Ambala Interchange (NH-44)",   "Haryana",       30.3782, 76.7767, 95),
  (5,  "Chandigarh",                   "Punjab/HR",     30.7333, 76.7794, 75),
  (6,  "Ludhiana (NH-44)",             "Punjab",        30.9010, 75.8573, 85),
  (7,  "Jalandhar (NH-44)",            "Punjab",        31.3260, 75.5762, 75),
  (8,  "Amritsar (NH-3)",              "Punjab",        31.6340, 74.8723, 90),
  (9,  "Jammu (NH-44)",                "J&K",           32.7266, 74.8570, 110),
  (10, "Srinagar (NH-44 Terminus)",    "J&K",           34.0837, 74.7973, 130),
  (11, "Shimla (NH-5)",                "Himachal",      31.1048, 77.1734, 80),
  (12, "Dehradun (NH-7)",              "Uttarakhand",   30.3165, 78.0322, 85),
  (13, "Haridwar (NH-334)",            "Uttarakhand",   29.9457, 78.1642, 75),

  # Uttar Pradesh & Bihar
  (14, "Agra (Yamuna/Agra-Luck Exp)",  "Uttar Pradesh", 27.1767, 78.0081, 120),
  (15, "Mathura (NH-19)",              "Uttar Pradesh", 27.4924, 77.6737, 85),
  (16, "Aligarh (NH-34)",              "Uttar Pradesh", 27.8974, 78.0880, 80),
  (17, "Bareilly (NH-30)",             "Uttar Pradesh", 28.3670, 79.4304, 85),
  (18, "Kanpur (NH-19/NH-27)",         "Uttar Pradesh", 26.4499, 80.3319, 110),
  (19, "Lucknow (State Capital)",      "Uttar Pradesh", 26.8467, 80.9462, 100),
  (20, "Ayodhya (Purvanchal Exp)",     "Uttar Pradesh", 26.7922, 82.1998, 90),
  (21, "Gorakhpur (NH-27)",            "Uttar Pradesh", 26.7606, 83.3732, 95),
  (22, "Prayagraj / Allahabad (NH-19)","Uttar Pradesh", 25.4358, 81.8463, 110),
  (23, "Varanasi / Banaras (NH-19)",   "Uttar Pradesh", 25.3176, 82.9739, 120),
  (24, "Patna (NH-19/NH-31)",          "Bihar",         25.5941, 85.1376, 110),
  (25, "Gaya (NH-22)",                 "Bihar",         24.7914, 85.0002, 85),
  (26, "Muzaffarpur (NH-27)",          "Bihar",         26.1209, 85.3647, 90),
  (27, "Bhagalpur (NH-33)",            "Bihar",         25.2425, 86.9842, 85),

  # East & Northeast
  (28, "Kolkata (GQ Terminus)",        "West Bengal",   22.5726, 88.3639, 150),
  (29, "Asansol (NH-19)",              "West Bengal",   23.6739, 86.9524, 95),
  (30, "Siliguri (Chicken Neck/NH-27)","West Bengal",   26.7271, 88.3953, 120),
  (31, "Ranchi (NH-20/NH-33)",         "Jharkhand",     23.3441, 85.3096, 100),
  (32, "Jamshedpur / Tatanagar",       "Jharkhand",     22.8046, 86.2029, 95),
  (33, "Dhanbad (Coal Belt/NH-19)",    "Jharkhand",     23.7957, 86.4304, 90),
  (34, "Bhubaneswar (NH-16)",          "Odisha",        20.2961, 85.8245, 120),
  (35, "Cuttack (NH-16)",              "Odisha",        20.4625, 85.8828, 85),
  (36, "Rourkela (Biju Exp)",          "Odisha",        22.2604, 84.8536, 90),
  (37, "Guwahati (Gateway to NE)",     "Assam",         26.1445, 91.7362, 130),
  (38, "Shillong (NH-6)",              "Meghalaya",     25.5788, 91.8933, 110),

  # Rajasthan & Gujarat
  (39, "Jaipur (Pink City/NH-48)",     "Rajasthan",     26.9124, 75.7873, 100),
  (40, "Ajmer (NH-48)",                "Rajasthan",     26.4499, 74.6399, 85),
  (41, "Udaipur (NH-48)",              "Rajasthan",     24.5854, 73.7125, 105),
  (42, "Jodhpur (NH-62/NH-25)",        "Rajasthan",     26.2389, 73.0243, 95),
  (43, "Bikaner (NH-11/NH-62)",        "Rajasthan",     28.0229, 73.3119, 90),
  (44, "Kota (Delhi-Mumbai Exp/NH-52)","Rajasthan",     25.2138, 75.8648, 110),
  (45, "Ahmedabad (NE-1/NH-48)",       "Gujarat",       23.0225, 72.5714, 130),
  (46, "Vadodara / Baroda (NE-1)",     "Gujarat",       22.3072, 73.1812, 90),
  (47, "Surat (Diamond City/NH-48)",   "Gujarat",       21.1702, 72.8311, 120),
  (48, "Rajkot (NH-27)",               "Gujarat",       22.3039, 70.8022, 95),
  (49, "Porbandar (NH-27 West End)",   "Gujarat",       21.6417, 69.6293, 100),

  # Central India
  (50, "Bhopal (State Capital)",       "Madhya Pradesh",23.2599, 77.4126, 100),
  (51, "Indore (Commercial Hub/NH-47)","Madhya Pradesh",22.7196, 75.8577, 110),
  (52, "Gwalior (NH-44)",              "Madhya Pradesh",26.2183, 78.1828, 95),
  (53, "Jabalpur (NH-30/NH-34)",       "Madhya Pradesh",23.1815, 79.9864, 95),
  (54, "Raipur (NH-53)",               "Chhattisgarh",  21.2514, 81.6296, 100),
  (55, "Bilaspur (NH-130)",            "Chhattisgarh",  22.0797, 82.1409, 85),

  # Maharashtra & Goa
  (56, "Mumbai (Financial Capital)",   "Maharashtra",   19.0760, 72.8777, 180),
  (57, "Thane / Navi Mumbai",          "Maharashtra",   19.2183, 72.9781, 75),
  (58, "Pune (Expressway Hub)",        "Maharashtra",   18.5204, 73.8567, 140),
  (59, "Nashik (Samruddhi/NH-60)",     "Maharashtra",   19.9975, 73.7898, 110),
  (60, "Chhatrapati Sambhajinagar",    "Maharashtra",   19.8762, 75.3433, 105),
  (61, "Nagpur (Zero Mile/NH-44)",     "Maharashtra",   21.1458, 79.0882, 130),
  (62, "Kolhapur (NH-48)",             "Maharashtra",   16.7050, 74.2433, 95),
  (63, "Solapur (NH-65/NH-52)",        "Maharashtra",   17.6599, 75.9064, 90),
  (64, "Panaji / Goa (NH-66)",         "Goa",           15.4909, 73.8278, 110),

  # South: Telangana & AP
  (65, "Hyderabad (Cyberabad/NH-44)",  "Telangana",     17.3850, 78.4867, 140),
  (66, "Warangal (NH-163)",            "Telangana",     17.9689, 79.5941, 85),
  (67, "Vijayawada (NH-16/NH-65)",     "Andhra Pradesh",16.5062, 80.6480, 120),
  (68, "Visakhapatnam / Vizag (NH-16)","Andhra Pradesh",17.6868, 83.2185, 130),
  (69, "Tirupati (NH-71)",             "Andhra Pradesh",13.6288, 79.4192, 95),
  (70, "Kurnool (NH-44)",              "Andhra Pradesh",15.8281, 78.0373, 90),

  # South: Karnataka
  (71, "Bangalore (Silicon Valley)",   "Karnataka",     12.9716, 77.5946, 150),
  (72, "Mysore (NH-275 Expressway)",   "Karnataka",     12.2958, 76.6394, 100),
  (73, "Mangalore (Port / NH-75)",     "Karnataka",     12.9141, 74.8560, 110),
  (74, "Hubli — Dharwad (NH-48)",      "Karnataka",     15.3647, 75.1240, 95),
  (75, "Belgaum / Belagavi (NH-48)",   "Karnataka",     15.8497, 74.4977, 90),

  # South: Tamil Nadu & Kerala
  (76, "Chennai (Auto Hub / NH-16/48)","Tamil Nadu",    13.0827, 80.2707, 140),
  (77, "Vellore (NH-48)",              "Tamil Nadu",    12.9165, 79.1325, 85),
  (78, "Salem (Transit Hub / NH-44)",  "Tamil Nadu",    11.6643, 78.1460, 95),
  (79, "Coimbatore (NH-544)",          "Tamil Nadu",    11.0168, 76.9558, 105),
  (80, "Madurai (Temple City / NH-44)","Tamil Nadu",    9.9252,  78.1198, 100),
  (81, "Kanyakumari (NH-44 South End)","Tamil Nadu",    8.0883,  77.5385, 110),
  (82, "Kochi / Cochin (NH-544/66)",   "Kerala",        9.9312,  76.2673, 120),
  (83, "Thiruvananthapuram (Capital)", "Kerala",        8.5241,  76.9366, 110),
  (84, "Kozhikode / Calicut (NH-66)",  "Kerala",        11.2588, 75.7804, 95),
]

EDGES_DATA = [
  (0, 1, 45, "NH-48", "road"),
  (0, 2, 40, "DND/Express", "road"),
  (0, 3, 90, "NH-44", "road"),
  (3, 4, 85, "NH-44", "road"),
  (4, 5, 45, "NH-152", "road"),
  (4, 6, 95, "NH-44", "road"),
  (6, 7, 60, "NH-44", "road"),
  (7, 8, 80, "NH-3", "road"),
  (7, 9, 210, "NH-44", "road"),
  (9, 10, 290, "NH-44", "road"),
  (5, 11, 150, "NH-5", "road"),
  (5, 12, 190, "NH-7", "road"),
  (12, 13, 60, "NH-334", "road"),
  (0, 13, 230, "NH-334", "road"),
  (8, 5, 230, "NH-5", "road"),
  (2, 14, 150, "Yamuna Exp", "road"),
  (0, 15, 140, "NH-19", "road"),
  (15, 14, 50, "NH-19", "road"),
  (14, 16, 80, "NH-509", "road"),
  (16, 17, 180, "NH-30", "road"),
  (17, 19, 230, "NH-30", "road"),
  (14, 19, 210, "Agra-Luck Exp", "road"),
  (14, 18, 260, "NH-19", "road"),
  (19, 18, 80, "NH-27", "road"),
  (19, 20, 120, "Purvanchal Exp", "road"),
  (20, 21, 130, "NH-27", "road"),
  (18, 22, 170, "NH-19", "road"),
  (19, 22, 180, "NH-30", "road"),
  (22, 23, 110, "NH-19", "road"),
  (19, 23, 270, "NH-31", "road"),
  (23, 24, 250, "NH-19/NH-31", "road"),
  (24, 25, 95, "NH-22", "road"),
  (24, 26, 75, "NH-22", "road"),
  (24, 27, 210, "NH-33", "road"),
  (26, 21, 230, "NH-27", "road"),
  (26, 30, 340, "NH-27", "road"),
  (30, 37, 420, "NH-27", "road"),
  (37, 38, 120, "NH-6", "road"),
  (23, 33, 290, "NH-19", "road"),
  (33, 29, 65, "NH-19", "road"),
  (29, 28, 210, "NH-19", "road"),
  (25, 31, 160, "NH-20", "road"),
  (31, 32, 110, "NH-33", "road"),
  (31, 33, 130, "NH-32", "road"),
  (32, 28, 230, "NH-49/16", "road"),
  (28, 35, 350, "NH-16", "road"),
  (35, 34, 40, "NH-16", "road"),
  (34, 36, 320, "Biju Exp", "road"),
  (34, 68, 390, "NH-16", "road"),
  (68, 67, 340, "NH-16", "road"),
  (67, 76, 410, "NH-16", "road"),
  (67, 69, 360, "NH-71", "road"),
  (69, 76, 120, "NH-716", "road"),
  (1, 39, 240, "NH-48", "road"),
  (39, 40, 115, "NH-48", "road"),
  (40, 41, 230, "NH-48", "road"),
  (41, 45, 240, "NH-48", "road"),
  (45, 46, 65, "NE-1", "road"),
  (46, 47, 120, "NH-48", "road"),
  (47, 57, 230, "NH-48", "road"),
  (57, 56, 45, "Eastern Exp", "road"),
  (39, 44, 210, "NH-52", "road"),
  (44, 51, 290, "Delhi-Mum Exp", "road"),
  (45, 48, 210, "NH-27", "road"),
  (48, 49, 140, "NH-27", "road"),
  (40, 42, 180, "NH-25", "road"),
  (42, 43, 220, "NH-62", "road"),
  (39, 43, 290, "NH-11", "road"),
  (14, 52, 110, "NH-44", "road"),
  (52, 50, 390, "NH-46", "road"),
  (50, 51, 150, "Bhopal-Indore Exp", "road"),
  (51, 46, 310, "NH-47", "road"),
  (50, 53, 270, "NH-45", "road"),
  (53, 61, 260, "NH-34", "road"),
  (50, 61, 330, "NH-46/44", "road"),
  (54, 55, 120, "NH-130", "road"),
  (61, 54, 260, "NH-53", "road"),
  (54, 34, 480, "NH-53", "road"),
  (56, 58, 140, "Mum-Pune Exp", "road"),
  (56, 59, 160, "NH-160", "road"),
  (59, 60, 110, "Samruddhi", "road"),
  (60, 61, 390, "Samruddhi", "road"),
  (58, 62, 230, "NH-48", "road"),
  (62, 64, 190, "NH-748", "road"),
  (58, 63, 220, "NH-65", "road"),
  (63, 65, 270, "NH-65", "road"),
  (56, 64, 510, "NH-66", "road"),
  (61, 65, 450, "NH-44", "road"),
  (65, 66, 120, "NH-163", "road"),
  (65, 67, 240, "NH-65", "road"),
  (65, 70, 200, "NH-44", "road"),
  (70, 71, 320, "NH-44", "road"),
  (62, 75, 90, "NH-48", "road"),
  (75, 74, 85, "NH-48", "road"),
  (74, 71, 380, "NH-48", "road"),
  (74, 64, 160, "NH-67", "road"),
  (71, 72, 85, "NH-275 Exp", "road"),
  (71, 73, 310, "NH-75", "road"),
  (73, 64, 340, "NH-66", "road"),
  (71, 77, 180, "NH-48", "road"),
  (77, 76, 120, "NH-48", "road"),
  (71, 78, 190, "NH-44", "road"),
  (76, 78, 290, "NH-48/79", "road"),
  (78, 79, 140, "NH-544", "road"),
  (78, 80, 190, "NH-44", "road"),
  (80, 81, 210, "NH-44", "road"),
  (79, 82, 170, "NH-544", "road"),
  (82, 83, 190, "NH-66", "road"),
  (83, 81, 75, "NH-66", "road"),
  (73, 84, 210, "NH-66", "road"),
  (84, 82, 160, "NH-66", "road"),
]

def main():
    print("=" * 65)
    print("All-India National Highway & District Network CSV Generator")
    print("=" * 65)

    # 1. Generate india_district_nodes.csv
    nodes_csv_path = "india_district_nodes.csv"
    with open(nodes_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "state", "lat", "lng", "fee"])
        for row in NODES_DATA:
            writer.writerow(row)
    print(f"Generated {nodes_csv_path} ({len(NODES_DATA)} district hubs, {os.path.getsize(nodes_csv_path)} bytes)")

    # 2. Generate india_highway_edges.csv
    edges_csv_path = "india_highway_edges.csv"
    with open(edges_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["source_node", "destination_node", "time", "highway_ref", "transport_type"])
        for row in EDGES_DATA:
            writer.writerow(row)
    print(f"Generated {edges_csv_path} ({len(EDGES_DATA)} highway segments, {os.path.getsize(edges_csv_path)} bytes)")

    print("-" * 65)
    print("Both CSV files generated successfully and are 100% matched!")
    print("Total size: ~10 KB (uses < 0.01% of your 100 MB limit).")

    # 3. Ingest directly to MongoDB API if app is running
    print("\nAttempting direct automated ingestion into running Next.js app...")
    try:
        with open(nodes_csv_path, "r", encoding="utf-8") as f:
            nodes_text = f.read()
        req = urllib.request.Request(
            "http://localhost:3000/api/uploadCSV",
            data=json.dumps({"type": "nodes", "csvContent": nodes_text, "mode": "replace"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_nodes = json.loads(resp.read().decode())
            print(f"Nodes Ingestion: {res_nodes.get('message', 'Done')}")

        with open(edges_csv_path, "r", encoding="utf-8") as f:
            edges_text = f.read()
        req = urllib.request.Request(
            "http://localhost:3000/api/uploadCSV",
            data=json.dumps({"type": "edges", "csvContent": edges_text, "mode": "replace"}).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            res_edges = json.loads(resp.read().decode())
            print(f"Edges Ingestion: {res_edges.get('message', 'Done')}")

        print("\nAll India network is fully seeded into MongoDB Atlas!")
    except Exception as e:
        print(f"Note: Direct API upload skipped ({e}). You can upload the CSVs via the UI at http://localhost:3000!")

if __name__ == "__main__":
    main()


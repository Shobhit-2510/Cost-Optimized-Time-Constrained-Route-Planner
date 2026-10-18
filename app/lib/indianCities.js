/**
 * indianCities.js
 * Predefined dataset: major Indian cities as graph nodes + highway edges.
 * Coordinates are real lat/lng for Leaflet map placement.
 * Edge weights are realistic highway travel times in minutes (~60-80 km/h average).
 * passingFees are approximate toll costs in INR (₹).
 */

export const INDIAN_CITIES_NODES = [
  { id: 0,  name: "Delhi",       lat: 28.6139, lng: 77.2090, fee: 0   },
  { id: 1,  name: "Jaipur",      lat: 26.9124, lng: 75.7873, fee: 80  },
  { id: 2,  name: "Agra",        lat: 27.1767, lng: 78.0081, fee: 60  },
  { id: 3,  name: "Lucknow",     lat: 26.8467, lng: 80.9462, fee: 90  },
  { id: 4,  name: "Kanpur",      lat: 26.4499, lng: 80.3319, fee: 70  },
  { id: 5,  name: "Varanasi",    lat: 25.3176, lng: 82.9739, fee: 100 },
  { id: 6,  name: "Patna",       lat: 25.5941, lng: 85.1376, fee: 80  },
  { id: 7,  name: "Kolkata",     lat: 22.5726, lng: 88.3639, fee: 120 },
  { id: 8,  name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, fee: 90  },
  { id: 9,  name: "Chennai",     lat: 13.0827, lng: 80.2707, fee: 110 },
  { id: 10, name: "Bangalore",  lat: 12.9716, lng: 77.5946, fee: 150 },
  { id: 11, name: "Hyderabad",  lat: 17.3850, lng: 78.4867, fee: 130 },
  { id: 12, name: "Mumbai",     lat: 19.0760, lng: 72.8777, fee: 200 },
  { id: 13, name: "Pune",       lat: 18.5204, lng: 73.8567, fee: 160 },
  { id: 14, name: "Ahmedabad",  lat: 23.0225, lng: 72.5714, fee: 140 },
  { id: 15, name: "Surat",      lat: 21.1702, lng: 72.8311, fee: 120 },
  { id: 16, name: "Nagpur",     lat: 21.1458, lng: 79.0882, fee: 110 },
  { id: 17, name: "Indore",     lat: 22.7196, lng: 75.8577, fee: 100 },
  { id: 18, name: "Bhopal",     lat: 23.2599, lng: 77.4126, fee: 90  },
  { id: 19, name: "Amritsar",   lat: 31.6340, lng: 74.8723, fee: 70  },
  { id: 20, name: "Chandigarh", lat: 30.7333, lng: 76.7794, fee: 60  },
];

/**
 * Edges: [source_id, destination_id, time_in_minutes]
 * Undirected major highway corridors.
 */
export const INDIAN_CITIES_EDGES = [
  // North corridors
  [0, 1, 270],   // Delhi ↔ Jaipur (NH-48, ~270 min)
  [0, 2, 200],   // Delhi ↔ Agra (Yamuna Expressway, ~200 min)
  [0, 20, 270],  // Delhi ↔ Chandigarh (NH-44, ~270 min)
  [0, 19, 450],  // Delhi ↔ Amritsar (NH-44, ~450 min)
  [19, 20, 210], // Amritsar ↔ Chandigarh (~210 min)

  // Central-East (UP, Bihar, WB)
  [2, 3, 220],   // Agra ↔ Lucknow (Agra-Lucknow Expressway, ~220 min)
  [2, 4, 180],   // Agra ↔ Kanpur (~180 min)
  [3, 4, 90],    // Lucknow ↔ Kanpur (~90 min)
  [3, 5, 270],   // Lucknow ↔ Varanasi (~270 min)
  [4, 5, 240],   // Kanpur ↔ Varanasi (~240 min)
  [5, 6, 260],   // Varanasi ↔ Patna (~260 min)
  [6, 7, 540],   // Patna ↔ Kolkata (NH-19, ~540 min)
  [7, 8, 360],   // Kolkata ↔ Bhubaneswar (NH-16, ~360 min)
  [8, 9, 900],   // Bhubaneswar ↔ Chennai (NH-16, ~900 min)

  // South corridors
  [9, 10, 330],  // Chennai ↔ Bangalore (NH-48, ~330 min)
  [9, 11, 540],  // Chennai ↔ Hyderabad (NH-16/NH-65, ~540 min)
  [10, 11, 510], // Bangalore ↔ Hyderabad (NH-44, ~510 min)
  [10, 13, 660], // Bangalore ↔ Pune (NH-48, ~660 min)
  [11, 16, 450], // Hyderabad ↔ Nagpur (NH-44, ~450 min)

  // West corridors
  [12, 13, 150], // Mumbai ↔ Pune (Mumbai-Pune Expressway, ~150 min)
  [12, 15, 270], // Mumbai ↔ Surat (NH-48, ~270 min)
  [15, 14, 240], // Surat ↔ Ahmedabad (NH-48, ~240 min)
  [1, 14, 540],  // Jaipur ↔ Ahmedabad (NH-48, ~540 min)
  [13, 16, 600], // Pune ↔ Nagpur (Samruddhi Mahamarg, ~600 min)

  // Central corridors
  [14, 17, 300], // Ahmedabad ↔ Indore (NH-47, ~300 min)
  [17, 18, 150], // Indore ↔ Bhopal (~150 min)
  [18, 1, 360],  // Bhopal ↔ Jaipur (~360 min)
  [18, 16, 300], // Bhopal ↔ Nagpur (~300 min)
  [18, 4, 390],  // Bhopal ↔ Kanpur (~390 min)
  [16, 5, 540],  // Nagpur ↔ Varanasi (~540 min)
];

export const DEFAULT_PASSING_FEES = INDIAN_CITIES_NODES.map((n) => n.fee);

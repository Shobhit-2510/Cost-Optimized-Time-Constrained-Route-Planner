/**
 * nationalHighways.js
 * Comprehensive Indian National Highway Network dataset.
 * Covers:
 * - Golden Quadrilateral (NH-48, NH-16, NH-19)
 * - North-South Corridor (NH-44: Srinagar → Kanyakumari)
 * - East-West Corridor (NH-27: Porbandar → Silchar)
 * - Major National Expressways (NE-1, NE-4, Yamuna Exp, Agra-Lucknow Exp, Samruddhi Mahamarg)
 * - All Indian States & Major District Interchanges (~85 strategic nodes, ~150 highway edges)
 * Size in MongoDB: ~150 KB (well within the 100 MB quota).
 */

export const NATIONAL_HIGHWAY_NODES = [
  // ── North (Delhi, Haryana, Punjab, J&K, HP, Uttarakhand) ───────────────
  { id: 0,  name: "Delhi (NCR)",                  state: "Delhi",         lat: 28.6139, lng: 77.2090, fee: 0   },
  { id: 1,  name: "Gurgaon / Gurugram",           state: "Haryana",       lat: 28.4595, lng: 77.0266, fee: 70  },
  { id: 2,  name: "Noida / Greater Noida",         state: "Uttar Pradesh", lat: 28.5355, lng: 77.3910, fee: 60  },
  { id: 3,  name: "Panipat Junction (NH-44)",     state: "Haryana",       lat: 29.3909, lng: 76.9635, fee: 85  },
  { id: 4,  name: "Ambala Interchange (NH-44/152)", state: "Haryana",     lat: 30.3782, lng: 76.7767, fee: 95  },
  { id: 5,  name: "Chandigarh",                   state: "Punjab/HR",     lat: 30.7333, lng: 76.7794, fee: 75  },
  { id: 6,  name: "Ludhiana (NH-44)",             state: "Punjab",        lat: 30.9010, lng: 75.8573, fee: 85  },
  { id: 7,  name: "Jalandhar (NH-44)",            state: "Punjab",        lat: 31.3260, lng: 75.5762, fee: 75  },
  { id: 8,  name: "Amritsar (NH-3)",              state: "Punjab",        lat: 31.6340, lng: 74.8723, fee: 90  },
  { id: 9,  name: "Jammu (NH-44)",                state: "J&K",           lat: 32.7266, lng: 74.8570, fee: 110 },
  { id: 10, name: "Srinagar (NH-44 Terminus)",    state: "J&K",           lat: 34.0837, lng: 74.7973, fee: 130 },
  { id: 11, name: "Shimla (NH-5)",                state: "Himachal",      lat: 31.1048, lng: 77.1734, fee: 80  },
  { id: 12, name: "Dehradun (NH-7)",              state: "Uttarakhand",   lat: 30.3165, lng: 78.0322, fee: 85  },
  { id: 13, name: "Haridwar (NH-334)",            state: "Uttarakhand",   lat: 29.9457, lng: 78.1642, fee: 75  },

  // ── Uttar Pradesh & Bihar (Gangetic Plain Corridor) ───────────────────
  { id: 14, name: "Agra (Yamuna/Agra-Lucknow Exp)", state: "Uttar Pradesh", lat: 27.1767, lng: 78.0081, fee: 120 },
  { id: 15, name: "Mathura (NH-19)",              state: "Uttar Pradesh", lat: 27.4924, lng: 77.6737, fee: 85  },
  { id: 16, name: "Aligarh (NH-34)",              state: "Uttar Pradesh", lat: 27.8974, lng: 78.0880, fee: 80  },
  { id: 17, name: "Bareilly (NH-30)",             state: "Uttar Pradesh", lat: 28.3670, lng: 79.4304, fee: 85  },
  { id: 18, name: "Kanpur (NH-19/NH-27)",         state: "Uttar Pradesh", lat: 26.4499, lng: 80.3319, fee: 110 },
  { id: 19, name: "Lucknow (State Capital)",      state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, fee: 100 },
  { id: 20, name: "Ayodhya (NH-27)",              state: "Uttar Pradesh", lat: 26.7922, lng: 82.1998, fee: 90  },
  { id: 21, name: "Gorakhpur (NH-27)",            state: "Uttar Pradesh", lat: 26.7606, lng: 83.3732, fee: 95  },
  { id: 22, name: "Prayagraj / Allahabad (NH-19)", state: "Uttar Pradesh", lat: 25.4358, lng: 81.8463, fee: 110 },
  { id: 23, name: "Varanasi / Banaras (NH-19)",   state: "Uttar Pradesh", lat: 25.3176, lng: 82.9739, fee: 120 },
  { id: 24, name: "Patna (NH-19/NH-31)",          state: "Bihar",         lat: 25.5941, lng: 85.1376, fee: 110 },
  { id: 25, name: "Gaya (NH-22)",                 state: "Bihar",         lat: 24.7914, lng: 85.0002, fee: 85  },
  { id: 26, name: "Muzaffarpur (NH-27)",          state: "Bihar",         lat: 26.1209, lng: 85.3647, fee: 90  },
  { id: 27, name: "Bhagalpur (NH-33)",            state: "Bihar",         lat: 25.2425, lng: 86.9842, fee: 85  },

  // ── East & Northeast (Bengal, Odisha, Jharkhand, Assam) ───────────────
  { id: 28, name: "Kolkata (GQ Terminus)",        state: "West Bengal",   lat: 22.5726, lng: 88.3639, fee: 150 },
  { id: 29, name: "Asansol (NH-19)",              state: "West Bengal",   lat: 23.6739, lng: 86.9524, fee: 95  },
  { id: 30, name: "Siliguri (Chicken Neck/NH-27)", state: "West Bengal",  lat: 26.7271, lng: 88.3953, fee: 120 },
  { id: 31, name: "Ranchi (NH-20/NH-33)",         state: "Jharkhand",     lat: 23.3441, lng: 85.3096, fee: 100 },
  { id: 32, name: "Jamshedpur / Tatanagar",       state: "Jharkhand",     lat: 22.8046, lng: 86.2029, fee: 95  },
  { id: 33, name: "Dhanbad (Coal Belt/NH-19)",    state: "Jharkhand",     lat: 23.7957, lng: 86.4304, fee: 90  },
  { id: 34, name: "Bhubaneswar (NH-16)",          state: "Odisha",        lat: 20.2961, lng: 85.8245, fee: 120 },
  { id: 35, name: "Cuttack (NH-16)",              state: "Odisha",        lat: 20.4625, lng: 85.8828, fee: 85  },
  { id: 36, name: "Rourkela (Biju Exp)",          state: "Odisha",        lat: 22.2604, lng: 84.8536, fee: 90  },
  { id: 37, name: "Guwahati (Gateway to NE)",     state: "Assam",         lat: 26.1445, lng: 91.7362, fee: 130 },
  { id: 38, name: "Shillong (NH-6)",              state: "Meghalaya",     lat: 25.5788, lng: 91.8933, fee: 110 },

  // ── Rajasthan & Gujarat (Western Freight & Industrial Corridor) ─────────
  { id: 39, name: "Jaipur (Pink City/NH-48)",     state: "Rajasthan",     lat: 26.9124, lng: 75.7873, fee: 100 },
  { id: 40, name: "Ajmer (NH-48)",                state: "Rajasthan",     lat: 26.4499, lng: 74.6399, fee: 85  },
  { id: 41, name: "Udaipur (NH-48)",              state: "Rajasthan",     lat: 24.5854, lng: 73.7125, fee: 105 },
  { id: 42, name: "Jodhpur (NH-62/NH-25)",        state: "Rajasthan",     lat: 26.2389, lng: 73.0243, fee: 95  },
  { id: 43, name: "Bikaner (NH-11/NH-62)",        state: "Rajasthan",     lat: 28.0229, lng: 73.3119, fee: 90  },
  { id: 44, name: "Kota (NH-52/Delhi-Mumbai Exp)", state: "Rajasthan",    lat: 25.2138, lng: 75.8648, fee: 110 },
  { id: 45, name: "Ahmedabad (NE-1/NH-48)",       state: "Gujarat",       lat: 23.0225, lng: 72.5714, fee: 130 },
  { id: 46, name: "Vadodara / Baroda (NE-1)",     state: "Gujarat",       lat: 22.3072, lng: 73.1812, fee: 90  },
  { id: 47, name: "Surat (Diamond City/NH-48)",   state: "Gujarat",       lat: 21.1702, lng: 72.8311, fee: 120 },
  { id: 48, name: "Rajkot (NH-27)",               state: "Gujarat",       lat: 22.3039, lng: 70.8022, fee: 95  },
  { id: 49, name: "Porbandar (NH-27 West End)",   state: "Gujarat",       lat: 21.6417, lng: 69.6293, fee: 100 },

  // ── Central India (Madhya Pradesh & Chhattisgarh) ─────────────────────
  { id: 50, name: "Bhopal (State Capital)",       state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126, fee: 100 },
  { id: 51, name: "Indore (Commercial Hub/NH-47)", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, fee: 110 },
  { id: 52, name: "Gwalior (NH-44)",              state: "Madhya Pradesh", lat: 26.2183, lng: 78.1828, fee: 95  },
  { id: 53, name: "Jabalpur (NH-30/NH-34)",       state: "Madhya Pradesh", lat: 23.1815, lng: 79.9864, fee: 95  },
  { id: 54, name: "Raipur (NH-53)",               state: "Chhattisgarh",  lat: 21.2514, lng: 81.6296, fee: 100 },
  { id: 55, name: "Bilaspur (NH-130)",            state: "Chhattisgarh",  lat: 22.0797, lng: 82.1409, fee: 85  },

  // ── Maharashtra & Goa (Western Industrial Spine) ──────────────────────
  { id: 56, name: "Mumbai (Financial Capital)",   state: "Maharashtra",   lat: 19.0760, lng: 72.8777, fee: 180 },
  { id: 57, name: "Thane / Navi Mumbai",          state: "Maharashtra",   lat: 19.2183, lng: 72.9781, fee: 75  },
  { id: 58, name: "Pune (Expressway Hub)",        state: "Maharashtra",   lat: 18.5204, lng: 73.8567, fee: 140 },
  { id: 59, name: "Nashik (Samruddhi/NH-60)",     state: "Maharashtra",   lat: 19.9975, lng: 73.7898, fee: 110 },
  { id: 60, name: "Chhatrapati Sambhajinagar",    state: "Maharashtra",   lat: 19.8762, lng: 75.3433, fee: 105 },
  { id: 61, name: "Nagpur (Zero Mile / NH-44/53)", state: "Maharashtra", lat: 21.1458, lng: 79.0882, fee: 130 },
  { id: 62, name: "Kolhapur (NH-48)",             state: "Maharashtra",   lat: 16.7050, lng: 74.2433, fee: 95  },
  { id: 63, name: "Solapur (NH-65/NH-52)",        state: "Maharashtra",   lat: 17.6599, lng: 75.9064, fee: 90  },
  { id: 64, name: "Panaji / Goa (NH-66)",         state: "Goa",           lat: 15.4909, lng: 73.8278, fee: 110 },

  // ── South: Telangana & Andhra Pradesh ─────────────────────────────────
  { id: 65, name: "Hyderabad (Cyberabad/NH-44/65)", state: "Telangana",   lat: 17.3850, lng: 78.4867, fee: 140 },
  { id: 66, name: "Warangal (NH-163)",            state: "Telangana",     lat: 17.9689, lng: 79.5941, fee: 85  },
  { id: 67, name: "Vijayawada (NH-16/NH-65)",     state: "Andhra Pradesh", lat: 16.5062, lng: 80.6480, fee: 120 },
  { id: 68, name: "Visakhapatnam / Vizag (NH-16)", state: "Andhra Pradesh", lat: 17.6868, lng: 83.2185, fee: 130 },
  { id: 69, name: "Tirupati (NH-71)",             state: "Andhra Pradesh", lat: 13.6288, lng: 79.4192, fee: 95  },
  { id: 70, name: "Kurnool (NH-44)",              state: "Andhra Pradesh", lat: 15.8281, lng: 78.0373, fee: 90  },

  // ── South: Karnataka ──────────────────────────────────────────────────
  { id: 71, name: "Bangalore (Silicon Valley)",   state: "Karnataka",     lat: 12.9716, lng: 77.5946, fee: 150 },
  { id: 72, name: "Mysore (NH-275 Expressway)",   state: "Karnataka",     lat: 12.2958, lng: 76.6394, fee: 100 },
  { id: 73, name: "Mangalore (Port / NH-75/66)",  state: "Karnataka",     lat: 12.9141, lng: 74.8560, fee: 110 },
  { id: 74, name: "Hubli — Dharwad (NH-48)",      state: "Karnataka",     lat: 15.3647, lng: 75.1240, fee: 95  },
  { id: 75, name: "Belgaum / Belagavi (NH-48)",   state: "Karnataka",     lat: 15.8497, lng: 74.4977, fee: 90  },

  // ── South: Tamil Nadu & Kerala ─────────────────────────────────────────
  { id: 76, name: "Chennai (Auto Hub / NH-16/48)", state: "Tamil Nadu",   lat: 13.0827, lng: 80.2707, fee: 140 },
  { id: 77, name: "Vellore (NH-48)",              state: "Tamil Nadu",   lat: 12.9165, lng: 79.1325, fee: 85  },
  { id: 78, name: "Salem (Transit Hub / NH-44)",  state: "Tamil Nadu",   lat: 11.6643, lng: 78.1460, fee: 95  },
  { id: 79, name: "Coimbatore (NH-544)",          state: "Tamil Nadu",   lat: 11.0168, lng: 76.9558, fee: 105 },
  { id: 80, name: "Madurai (Temple City / NH-44)", state: "Tamil Nadu",  lat: 9.9252,  lng: 78.1198, fee: 100 },
  { id: 81, name: "Kanyakumari (NH-44 Southern End)", state: "Tamil Nadu", lat: 8.0883,  lng: 77.5385, fee: 110 },
  { id: 82, name: "Kochi / Cochin (NH-544/66)",   state: "Kerala",       lat: 9.9312,  lng: 76.2673, fee: 120 },
  { id: 83, name: "Thiruvananthapuram (Capital)", state: "Kerala",       lat: 8.5241,  lng: 76.9366, fee: 110 },
  { id: 84, name: "Kozhikode / Calicut (NH-66)",  state: "Kerala",       lat: 11.2588, lng: 75.7804, fee: 95  },
];

/**
 * Edges: [source_id, destination_id, travel_time_minutes, highway_ref]
 * Realistic highway transit corridors.
 */
export const NATIONAL_HIGHWAY_EDGES = [
  // ── North: NH-44 Spine & Links ───────────────────────────────────────
  [0, 1, 45, "NH-48"],       // Delhi ↔ Gurgaon
  [0, 2, 40, "DND/Express"], // Delhi ↔ Noida
  [0, 3, 90, "NH-44"],       // Delhi ↔ Panipat
  [3, 4, 85, "NH-44"],       // Panipat ↔ Ambala
  [4, 5, 45, "NH-152"],      // Ambala ↔ Chandigarh
  [4, 6, 95, "NH-44"],       // Ambala ↔ Ludhiana
  [6, 7, 60, "NH-44"],       // Ludhiana ↔ Jalandhar
  [7, 8, 80, "NH-3"],        // Jalandhar ↔ Amritsar
  [7, 9, 210, "NH-44"],      // Jalandhar ↔ Jammu
  [9, 10, 290, "NH-44"],     // Jammu ↔ Srinagar
  [5, 11, 150, "NH-5"],      // Chandigarh ↔ Shimla
  [5, 12, 190, "NH-7"],      // Chandigarh ↔ Dehradun
  [12, 13, 60, "NH-334"],    // Dehradun ↔ Haridwar
  [0, 13, 230, "NH-334"],    // Delhi ↔ Haridwar
  [8, 5, 230, "NH-5"],       // Amritsar ↔ Chandigarh

  // ── Taj / Yamuna & UP Expressways ────────────────────────────────────
  [2, 14, 150, "Yamuna Exp"],// Noida ↔ Agra (Yamuna Expressway)
  [0, 15, 140, "NH-19"],     // Delhi ↔ Mathura
  [15, 14, 50, "NH-19"],     // Mathura ↔ Agra
  [14, 16, 80, "NH-509"],    // Agra ↔ Aligarh
  [16, 17, 180, "NH-30"],    // Aligarh ↔ Bareilly
  [17, 19, 230, "NH-30"],    // Bareilly ↔ Lucknow
  [14, 19, 210, "Agra-Luck Exp"], // Agra ↔ Lucknow (Expressway)
  [14, 18, 260, "NH-19"],    // Agra ↔ Kanpur
  [19, 18, 80, "NH-27"],     // Lucknow ↔ Kanpur
  [19, 20, 120, "Purvanchal Exp"], // Lucknow ↔ Ayodhya
  [20, 21, 130, "NH-27"],    // Ayodhya ↔ Gorakhpur
  [18, 22, 170, "NH-19"],    // Kanpur ↔ Prayagraj
  [19, 22, 180, "NH-30"],    // Lucknow ↔ Prayagraj
  [22, 23, 110, "NH-19"],    // Prayagraj ↔ Varanasi
  [19, 23, 270, "NH-31"],    // Lucknow ↔ Varanasi

  // ── Bihar & East Connectors ──────────────────────────────────────────
  [23, 24, 250, "NH-19/NH-31"], // Varanasi ↔ Patna
  [24, 25, 95, "NH-22"],     // Patna ↔ Gaya
  [24, 26, 75, "NH-22"],     // Patna ↔ Muzaffarpur
  [24, 27, 210, "NH-33"],    // Patna ↔ Bhagalpur
  [26, 21, 230, "NH-27"],    // Muzaffarpur ↔ Gorakhpur
  [26, 30, 340, "NH-27"],    // Muzaffarpur ↔ Siliguri
  [30, 37, 420, "NH-27"],    // Siliguri ↔ Guwahati
  [37, 38, 120, "NH-6"],     // Guwahati ↔ Shillong

  // ── Grand Trunk / GQ East: Varanasi → Kolkata ───────────────────────
  [23, 33, 290, "NH-19"],    // Varanasi ↔ Dhanbad
  [33, 29, 65, "NH-19"],     // Dhanbad ↔ Asansol
  [29, 28, 210, "NH-19"],    // Asansol ↔ Kolkata (NH-19)
  [25, 31, 160, "NH-20"],    // Gaya ↔ Ranchi
  [31, 32, 110, "NH-33"],    // Ranchi ↔ Jamshedpur
  [31, 33, 130, "NH-32"],    // Ranchi ↔ Dhanbad
  [32, 28, 230, "NH-49/16"], // Jamshedpur ↔ Kolkata

  // ── Eastern Coastal Spine (GQ): Kolkata → Chennai (NH-16) ───────────
  [28, 35, 350, "NH-16"],    // Kolkata ↔ Cuttack
  [35, 34, 40, "NH-16"],     // Cuttack ↔ Bhubaneswar
  [34, 36, 320, "Biju Exp"], // Bhubaneswar ↔ Rourkela
  [34, 68, 390, "NH-16"],    // Bhubaneswar ↔ Visakhapatnam
  [68, 67, 340, "NH-16"],    // Visakhapatnam ↔ Vijayawada
  [67, 76, 410, "NH-16"],    // Vijayawada ↔ Chennai
  [67, 69, 360, "NH-71"],    // Vijayawada ↔ Tirupati
  [69, 76, 120, "NH-716"],   // Tirupati ↔ Chennai

  // ── Western Spine (GQ): Delhi → Jaipur → Ahmedabad → Mumbai (NH-48) ─
  [1, 39, 240, "NH-48"],     // Gurgaon ↔ Jaipur
  [39, 40, 115, "NH-48"],    // Jaipur ↔ Ajmer
  [40, 41, 230, "NH-48"],    // Ajmer ↔ Udaipur
  [41, 45, 240, "NH-48"],    // Udaipur ↔ Ahmedabad
  [45, 46, 65, "NE-1"],      // Ahmedabad ↔ Vadodara (Expressway)
  [46, 47, 120, "NH-48"],    // Vadodara ↔ Surat
  [47, 57, 230, "NH-48"],    // Surat ↔ Thane / Mumbai Entry
  [57, 56, 45, "Eastern Exp"], // Thane ↔ Mumbai South
  [39, 44, 210, "NH-52"],    // Jaipur ↔ Kota
  [44, 51, 290, "Delhi-Mum Exp"], // Kota ↔ Indore
  [45, 48, 210, "NH-27"],    // Ahmedabad ↔ Rajkot
  [48, 49, 140, "NH-27"],    // Rajkot ↔ Porbandar (NH-27 Western End)
  [40, 42, 180, "NH-25"],    // Ajmer ↔ Jodhpur
  [42, 43, 220, "NH-62"],    // Jodhpur ↔ Bikaner
  [39, 43, 290, "NH-11"],    // Jaipur ↔ Bikaner

  // ── Central Spine (NH-44 & Links): Delhi → Gwalior → Nagpur ─────────
  [14, 52, 110, "NH-44"],    // Agra ↔ Gwalior
  [52, 50, 390, "NH-46"],    // Gwalior ↔ Bhopal
  [50, 51, 150, "Bhopal-Indore Exp"], // Bhopal ↔ Indore
  [51, 46, 310, "NH-47"],    // Indore ↔ Vadodara
  [50, 53, 270, "NH-45"],    // Bhopal ↔ Jabalpur
  [53, 61, 260, "NH-34"],    // Jabalpur ↔ Nagpur
  [50, 61, 330, "NH-46/44"], // Bhopal ↔ Nagpur
  [54, 55, 120, "NH-130"],   // Raipur ↔ Bilaspur
  [61, 54, 260, "NH-53"],    // Nagpur ↔ Raipur
  [54, 34, 480, "NH-53"],    // Raipur ↔ Bhubaneswar

  // ── Maharashtra Core & Mumbai-Pune-Goa ──────────────────────────────
  [56, 58, 140, "Mum-Pune Exp"], // Mumbai ↔ Pune (Expressway)
  [56, 59, 160, "NH-160"],   // Mumbai ↔ Nashik
  [59, 60, 110, "Samruddhi"],// Nashik ↔ Chhatrapati Sambhajinagar
  [60, 61, 390, "Samruddhi"],// Sambhajinagar ↔ Nagpur (Expressway)
  [58, 62, 230, "NH-48"],    // Pune ↔ Kolhapur
  [62, 64, 190, "NH-748"],   // Kolhapur ↔ Goa
  [58, 63, 220, "NH-65"],    // Pune ↔ Solapur
  [63, 65, 270, "NH-65"],    // Solapur ↔ Hyderabad
  [56, 64, 510, "NH-66"],    // Mumbai ↔ Goa (Coastal NH-66)

  // ── Hyderabad & Deccan Interchanges ─────────────────────────────────
  [61, 65, 450, "NH-44"],    // Nagpur ↔ Hyderabad (NH-44)
  [65, 66, 120, "NH-163"],   // Hyderabad ↔ Warangal
  [65, 67, 240, "NH-65"],    // Hyderabad ↔ Vijayawada
  [65, 70, 200, "NH-44"],    // Hyderabad ↔ Kurnool
  [70, 71, 320, "NH-44"],    // Kurnool ↔ Bangalore

  // ── Karnataka & Southwest Corridors ──────────────────────────────────
  [62, 75, 90, "NH-48"],     // Kolhapur ↔ Belgaum
  [75, 74, 85, "NH-48"],     // Belgaum ↔ Hubli
  [74, 71, 380, "NH-48"],    // Hubli ↔ Bangalore
  [74, 64, 160, "NH-67"],    // Hubli ↔ Goa
  [71, 72, 85, "NH-275 Exp"],// Bangalore ↔ Mysore (Expressway)
  [71, 73, 310, "NH-75"],    // Bangalore ↔ Mangalore
  [73, 64, 340, "NH-66"],    // Mangalore ↔ Goa

  // ── Tamil Nadu & Kerala (Southern Network) ───────────────────────────
  [71, 77, 180, "NH-48"],    // Bangalore ↔ Vellore
  [77, 76, 120, "NH-48"],    // Vellore ↔ Chennai
  [71, 78, 190, "NH-44"],    // Bangalore ↔ Salem
  [76, 78, 290, "NH-48/79"], // Chennai ↔ Salem
  [78, 79, 140, "NH-544"],   // Salem ↔ Coimbatore
  [78, 80, 190, "NH-44"],    // Salem ↔ Madurai
  [80, 81, 210, "NH-44"],    // Madurai ↔ Kanyakumari (NH-44 Southern End)
  [79, 82, 170, "NH-544"],   // Coimbatore ↔ Kochi
  [82, 83, 190, "NH-66"],    // Kochi ↔ Thiruvananthapuram
  [83, 81, 75, "NH-66"],     // Thiruvananthapuram ↔ Kanyakumari
  [73, 84, 210, "NH-66"],    // Mangalore ↔ Kozhikode
  [84, 82, 160, "NH-66"],    // Kozhikode ↔ Kochi
];

export const DEFAULT_NATIONAL_PASSING_FEES = NATIONAL_HIGHWAY_NODES.map((n) => n.fee);


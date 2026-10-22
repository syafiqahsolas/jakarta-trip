/**
 * LILY POND TRAVEL HUB - TRANSIT_DATA.JS
 * Master Station Database (City -> Category -> Hub Status) & Proximity Engine
 */

const stationDatabase = {
  jakarta: [
    // --- KRL Commuterline ---
    { name: "Duren Kalibata", lat: -6.2552012, lng: 106.8551672, category: "KRL Commuterline", isHub: false },
    { name: "Cawang", lat: -6.2425517, lng: 106.8586903, category: "KRL Commuterline", isHub: true },
    { name: "Tebet", lat: -6.2263977, lng: 106.8584389, category: "KRL Commuterline", isHub: false },
    { name: "Manggarai", lat: -6.2101704, lng: 106.849935, category: "KRL Commuterline", isHub: true },
    { name: "Tanah Abang", lat: -6.1857127, lng: 106.8108938, category: "KRL Commuterline", isHub: true },
    { name: "Jakarta Kota", lat: -6.1375828, lng: 106.8146203, category: "KRL Commuterline", isHub: true },
    { name: "Gambir", lat: -6.1766553, lng: 106.8306473, category: "KRL Commuterline", isHub: false },
    
    // --- MRT Jakarta ---
    { name: "Bundaran HI Bank Jakarta", lat: -6.1918644, lng: 106.8230084, category: "MRT Jakarta", isHub: false },
    { name: "Dukuh Atas BNI", lat: -6.2007957, lng: 106.8227788, category: "MRT Jakarta", isHub: true },
    { name: "Setiabudi Astra", lat: -6.20883842, lng: 106.8214423, category: "MRT Jakarta", isHub: false },
    { name: "Blok M BCA", lat: -6.24443301, lng: 106.7980848, category: "MRT Jakarta", isHub: false },

    // --- LRT Jabodebek ---
    { name: "Halim", lat: -6.2456352, lng: 106.8844875, category: "LRT Jabodebek", isHub: true },
    { name: "Cikoko", lat: -6.2434846, lng: 106.8570718, category: "LRT Jabodebek", isHub: false },
    { name: "ASEAN Headquarters", lat: -6.2387737, lng: 106.7984457, category: "LRT Jabodebek", isHub: false },

    // --- LRT Jakarta ---
    { name: "Pegangsaan Dua", lat: -6.1572135, lng: 106.9142091, category: "LRT Jakarta", isHub: false },
    { name: "Velodrome", lat: -6.1921316, lng: 106.8911771, category: "LRT Jakarta", isHub: false }
  ],
  bandung: [
    // --- Intercity & Local Train ---
    { name: "Bandung Station", lat: -6.9147, lng: 107.6098, category: "Intercity / Local Train", isHub: true },
    { name: "Kiaracondong Station", lat: -6.9211, lng: 107.6412, category: "Intercity / Local Train", isHub: false }
  ]
};

// --- PROXIMITY CALCULATOR ENGINE ---
function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function findNearestStation(lat, lng, city = "jakarta") {
  const stations = stationDatabase[city] || stationDatabase.jakarta;
  if (!stations || stations.length === 0 || !lat || !lng) return "Near Hotel Area";

  let minDistance = Infinity;
  let nearestStation = null;

  stations.forEach(st => {
    const dist = calculateDistanceInKm(lat, lng, st.lat, st.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestStation = st;
    }
  });

  const approxWalkMins = Math.round((minDistance * 1000) / 80); // ~80m per min walk speed
  return nearestStation ? `${nearestStation.name} (${approxWalkMins > 0 ? approxWalkMins + ' min walk' : 'Nearby'})` : "Near Hotel Area";
}

/**
 * LILY POND TRAVEL HUB - TRANSIT_DATA.JS
 * Multi-City Master Database for Hotels and Train/Transit Stations
 */

const stationDatabase = {
  jakarta: [
    { name: "Duren Kalibata", lat: -6.2552012, lng: 106.8551672, category: "KRL Commuterline", isHub: false },
    { name: "Cawang", lat: -6.2425517, lng: 106.8586903, category: "KRL Commuterline", isHub: true },
    { name: "Tebet", lat: -6.2263977, lng: 106.8584389, category: "KRL Commuterline", isHub: false },
    { name: "Buaran", lat: -6.2156064, lng: 106.92316, category: "KRL Commuterline", isHub: false },
    { name: "Kramat", lat: -6.1936203, lng: 106.8565119, category: "KRL Commuterline", isHub: false },
    { name: "Pesing", lat: -6.1612525, lng: 106.7719077, category: "KRL Commuterline", isHub: false },
    { name: "ASEAN Headquarters", lat: -6.2387737, lng: 106.7984457, category: "LRT Jabodebek", isHub: false },
    { name: "Jatinegara", lat: -6.2149252, lng: 106.8703394, category: "KRL Commuterline", isHub: true },
    { name: "Gondangdia", lat: -6.1859109, lng: 106.8325657, category: "KRL Commuterline", isHub: false },
    { name: "Pondok Jati", lat: -6.2091242, lng: 106.8623419, category: "KRL Commuterline", isHub: false },
    { name: "Manggarai", lat: -6.2101704, lng: 106.849935, category: "KRL Commuterline", isHub: true },
    { name: "Cikini", lat: -6.1985052, lng: 106.8412799, category: "KRL Commuterline", isHub: false },
    { name: "Tanah Abang", lat: -6.1857127, lng: 106.8108938, category: "KRL Commuterline", isHub: true },
    { name: "Pasar Senen", lat: -6.1744233, lng: 106.8445744, category: "KRL Commuterline", isHub: false },
    { name: "Karet", lat: -6.2009538, lng: 106.8167704, category: "KRL Commuterline", isHub: false },
    { name: "Palmerah", lat: -6.2079197, lng: 106.7972321, category: "KRL Commuterline", isHub: false },
    { name: "Pasar Minggu Baru", lat: -6.262798, lng: 106.8517957, category: "KRL Commuterline", isHub: false },
    { name: "Juanda", lat: -6.1666746, lng: 106.8304609, category: "KRL Commuterline", isHub: false },
    { name: "Gambir", lat: -6.1766553, lng: 106.8306473, category: "KRL Commuterline", isHub: false },
    { name: "Kemayoran", lat: -6.1617033, lng: 106.8414012, category: "KRL Commuterline", isHub: false },
    { name: "Klender", lat: -6.2133188, lng: 106.8994133, category: "KRL Commuterline", isHub: false },
    { name: "Klender Baru", lat: -6.2176591, lng: 106.9401833, category: "KRL Commuterline", isHub: false },
    { name: "Kalideres", lat: -6.1659662, lng: 106.7037283, category: "KRL Commuterline", isHub: false },
    { name: "Taman Mini", lat: -6.2929088, lng: 106.8805584, category: "LRT Jabodebek", isHub: false },
    { name: "BNI City", lat: -6.2015938, lng: 106.8197174, category: "KRL Commuterline", isHub: false },
    { name: "Universitas Pancasila", lat: -6.3393452, lng: 106.834263, category: "KRL Commuterline", isHub: false },
    { name: "Gang Sentiong", lat: -6.1861531, lng: 106.8508709, category: "KRL Commuterline", isHub: false },
    { name: "Sawah Besar", lat: -6.1606672, lng: 106.8276549, category: "KRL Commuterline", isHub: false },
    { name: "Sudirman", lat: -6.2024081, lng: 106.8234493, category: "KRL Commuterline", isHub: true },
    { name: "Tanjung Barat", lat: -6.3080407, lng: 106.8389492, category: "KRL Commuterline", isHub: false },
    { name: "Angke", lat: -6.1447372, lng: 106.8007792, category: "KRL Commuterline", isHub: false },
    { name: "Rajawali", lat: -6.1450996, lng: 106.8368325, category: "KRL Commuterline", isHub: false },
    { name: "Duri", lat: -6.1552764, lng: 106.8012968, category: "KRL Commuterline", isHub: false },
    { name: "Mangga Besar", lat: -6.1498037, lng: 106.8269826, category: "KRL Commuterline", isHub: false },
    { name: "Pasar Minggu", lat: -6.2833322, lng: 106.8448558, category: "KRL Commuterline", isHub: false },
    { name: "Jayakarta", lat: -6.1412999, lng: 106.8231322, category: "KRL Commuterline", isHub: false },
    { name: "Lenteng Agung", lat: -6.3303079, lng: 106.8346791, category: "KRL Commuterline", isHub: false },
    { name: "Tanjung Priuk", lat: -6.1106914, lng: 106.8814984, category: "KRL Commuterline", isHub: false },
    { name: "Rawa Buaya", lat: -6.1627437, lng: 106.7227543, category: "KRL Commuterline", isHub: false },
    { name: "Jakarta Kota", lat: -6.1375828, lng: 106.8146203, category: "KRL Commuterline", isHub: true },
    { name: "Grogol", lat: -6.162035, lng: 106.7896101, category: "KRL Commuterline", isHub: false },
    { name: "Kebayoran", lat: -6.23723, lng: 106.7825345, category: "KRL Commuterline", isHub: false },
    { name: "Taman Kota", lat: -6.158627, lng: 106.7565728, category: "KRL Commuterline", isHub: false },
    { name: "Ancol", lat: -6.128115, lng: 106.8451374, category: "KRL Commuterline", isHub: false },
    { name: "Jakarta Gudang", lat: -6.133327, lng: 106.819373, category: "KRL Commuterline", isHub: false },
    { name: "Kampung Bandan", lat: -6.1327023, lng: 106.8284875, category: "KRL Commuterline", isHub: true },
    { name: "Jakarta International Stadium", lat: -6.1228211, lng: 106.8613596, category: "KRL Commuterline", isHub: false },
    { name: "Halim", lat: -6.2456352, lng: 106.8844875, category: "LRT Jabodebek", isHub: true },
    { name: "Boulevard Utara", lat: -6.1594366, lng: 106.9059815, category: "LRT Jakarta", isHub: false },
    { name: "Boulevard Selatan", lat: -6.1689933, lng: 106.9000145, category: "LRT Jakarta", isHub: false },
    { name: "Pulomas", lat: -6.1773105, lng: 106.8933929, category: "LRT Jakarta", isHub: false },
    { name: "Equestrian", lat: -6.1840567, lng: 106.8912789, category: "LRT Jakarta", isHub: false },
    { name: "Velodrome", lat: -6.1921316, lng: 106.8911771, category: "LRT Jakarta", isHub: false },
    { name: "Pegangsaan Dua", lat: -6.1572135, lng: 106.9142091, category: "LRT Jakarta", isHub: false },
    { name: "Bundaran HI Bank Jakarta", lat: -6.1918644, lng: 106.8230084, category: "MRT Jakarta", isHub: false },
    { name: "Dukuh Atas BNI", lat: -6.2007957, lng: 106.8227788, category: "MRT Jakarta", isHub: true },
    { name: "Setiabudi Astra", lat: -6.20883842, lng: 106.8214423, category: "MRT Jakarta", isHub: false },
    { name: "Bendungan Hilir", lat: -6.2150263, lng: 106.8179484, category: "MRT Jakarta", isHub: false },
    { name: "Istora Mandiri", lat: -6.22239, lng: 106.8086229, category: "MRT Jakarta", isHub: false },
    { name: "Senayan Mastercard", lat: -6.2267337, lng: 106.8024926, category: "MRT Jakarta", isHub: false },
    { name: "Blok M BCA", lat: -6.24443301, lng: 106.7980848, category: "MRT Jakarta", isHub: false },
    { name: "Blok A VISA", lat: -6.2557793, lng: 106.7971403, category: "MRT Jakarta", isHub: false },
    { name: "Haji Nawi", lat: -6.2666947, lng: 106.7973262, category: "MRT Jakarta", isHub: false },
    { name: "Cipete Raya TUKU", lat: -6.2783596, lng: 106.7973159, category: "MRT Jakarta", isHub: false },
    { name: "Fatmawati Indomaret", lat: -6.2924511, lng: 106.7924644, category: "MRT Jakarta", isHub: false },
    { name: "Lebak Bulus Bank Syariah Indonesia", lat: -6.2892744, lng: 106.7749355, category: "MRT Jakarta", isHub: false },
    { name: "Cikoko", lat: -6.2434846, lng: 106.8570718, category: "LRT Jabodebek", isHub: false },
    { name: "Pancoran", lat: -6.2421415, lng: 106.8385146, category: "LRT Jabodebek", isHub: false },
    { name: "Setiabudi", lat: -6.2093224, lng: 106.8302343, category: "LRT Jabodebek", isHub: false },
    { name: "Rasuna Said", lat: -6.2216089, lng: 106.8322373, category: "LRT Jabodebek", isHub: false },
    { name: "Kampung Rambutan", lat: -6.3095494, lng: 106.8843804, category: "LRT Jabodebek", isHub: false },
    { name: "Matraman", lat: -6.2125672, lng: 106.8597528, category: "KRL Commuterline", isHub: false },
    { name: "Kuningan", lat: -6.2287727, lng: 106.8332031, category: "LRT Jabodebek", isHub: false },
    { name: "Ciracas", lat: -6.3237693, lng: 106.8866433, category: "LRT Jabodebek", isHub: false },
    { name: "Dukuh Atas Bank Syariah Indonesia", lat: -6.204828, lng: 106.8255301, category: "LRT Jabodebek", isHub: true },
    { name: "Ciliwung", lat: -6.2434461, lng: 106.8639705, category: "LRT Jabodebek", isHub: false },
    { name: "Halim (LRT)", lat: -6.2458656, lng: 106.8872875, category: "LRT Jabodebek", isHub: true },
    { name: "Bojong Indah", lat: -6.1602142, lng: 106.7361338, category: "KRL Commuterline", isHub: false }
  ],
  bandung: [
    // Future Bandung stations can be populated right here!
    { name: "Bandung Station", lat: -6.9147, lng: 107.6098, category: "Intercity / Local Train", isHub: true }
  ]
};

const hotelDatabase = {
  jakarta: [
    { name: "Park Hyatt Jakarta", lat: -6.1845858, lng: 106.8313233, nearestStation: "Gondangdia" },
    { name: "Hotel Grand Sahid Jaya", lat: -6.210709476, lng: 106.8200146, nearestStation: "Setiabudi Astra (1 min walk)" }
  ],
  bandung: [
    // Future Bandung hotels can be populated right here!
  ]
};

// --- PROXIMITY & DISTANCE HELPER FUNCTIONS ---

function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
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

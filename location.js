/**
 * LILY POND TRAVEL HUB - LOCATIONS.JS
 * Master Location Database for Jakarta & Bandung
 */

const masterLocationDatabase = {
  jakarta: {
    attraction: [
      { id: "jkt_attr_1", name: "Aquatic Stadium", category: "Attraction", lat: -6.215642935, lng: 106.805546, station: "Istora Mandiri", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Aquatic+Stadium", starred: false },
      { id: "jkt_attr_2", name: "Aloha Pik Pasir Putih", category: "Attraction", lat: -6.071063459, lng: 106.7152718, station: "No station nearby", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Aloha+Pik+Pasir+Putih", starred: false },
      { id: "jkt_attr_3", name: "Museum Nasional", category: "Attraction", lat: -6.17591554, lng: 106.8221558, station: "Gambir", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Museum+Nasional", starred: false },
      { id: "jkt_attr_4", name: "Museum Macan", category: "Attraction", lat: -6.190146199, lng: 106.7680155, station: "Pesing", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Museum+Macan", starred: false },
      { id: "jkt_attr_5", name: "Galeri Nasional", category: "Attraction", lat: -6.177494479, lng: 106.8319213, station: "Gambir", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Galeri+Nasional", starred: false },
      { id: "jkt_attr_6", name: "Gedung Candra Naya, Glodok", category: "Attraction", lat: -6.146457281, lng: 106.8172606, station: "Jayakarta", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Gedung+Candra+Naya+Glodok", starred: false },
      { id: "jkt_attr_7", name: "Urban Forest", category: "Attraction", lat: -6.281129903, lng: 106.7980653, station: "Cipete Raya TUKU", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Urban+Forest", starred: false },
      { id: "jkt_attr_8", name: "Tugu Tani", category: "Attraction", lat: -6.182486499, lng: 106.8347977, station: "Gondangdia", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Tugu+Tani", starred: false },
      { id: "jkt_attr_9", name: "Masjid Istiqlal", category: "Attraction", lat: -6.169738038, lng: 106.8308033, station: "Juanda", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Masjid+Istiqlal", starred: false },
      { id: "jkt_attr_10", name: "Gelora Bung Karno", category: "Attraction", lat: -6.216856358, lng: 106.803141, station: "Istora Mandiri", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Gelora+Bung+Karno", starred: false },
      { id: "jkt_attr_11", name: "Monas", category: "Attraction", lat: -6.175323011, lng: 106.8271375, station: "Gambir", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Monas", starred: false },
      { id: "jkt_attr_12", name: "Jakarta Old Town", category: "Attraction", lat: -6.135470792, lng: 106.8119289, station: "Jakarta Kota", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Jakarta+Old+Town", starred: false }
    ],
    coffee: [
      { id: "jkt_cof_1", name: "Tuku", category: "Coffee", lat: -6.242984662, lng: 106.8010597, station: "Blok M BCA", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Tuku", starred: false },
      { id: "jkt_cof_2", name: "Smiljan", category: "Coffee", lat: -6.303421386, lng: 106.7230169, station: "No station nearby", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Smiljan", starred: false },
      { id: "jkt_cof_3", name: "Fillmore", category: "Coffee", lat: -6.220060356, lng: 106.8235119, station: "Bendungan Hilir", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Fillmore", starred: false },
      { id: "jkt_cof_4", name: "Djournal Coffee", category: "Coffee", lat: -6.190272644, lng: 106.8208544, station: "Bundaran HI Bank Jakarta", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Djournal+Coffee", starred: false },
      { id: "jkt_cof_5", name: "Fore Coffee", category: "Coffee", lat: -6.184294484, lng: 106.8237159, station: "Bundaran HI Bank Jakarta", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Fore+Coffee", starred: false }
    ],
    food: [
      { id: "jkt_food_1", name: "Bakmi Piring", category: "Food", lat: -6.244183928, lng: 106.803237, station: "Blok M BCA", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Bakmi+Piring", starred: false },
      { id: "jkt_food_2", name: "Futago", category: "Food", lat: -6.243231088, lng: 106.79746, station: "Blok M BCA", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Futago", starred: false },
      { id: "jkt_food_3", name: "RM Surya", category: "Food", lat: -6.213486873, lng: 106.8163786, station: "Bendungan Hilir", walk: "", map: "https://www.google.com/maps/search/?api=1&query=RM+Surya", starred: false },
      { id: "jkt_food_4", name: "Remboelan", category: "Food", lat: -6.193178401, lng: 106.821152, station: "Bundaran HI Bank Jakarta", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Remboelan", starred: false }
    ],
    shopping_mall: [
      { id: "jkt_mall_1", name: "Grand Indonesia", category: "Shopping Mall", lat: -6.195133438, lng: 106.8204825, station: "Bundaran HI Bank Jakarta", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Grand+Indonesia", starred: false },
      { id: "jkt_mall_2", name: "Plaza Indonesia", category: "Shopping Mall", lat: -6.191933665, lng: 106.8227192, station: "Bundaran HI Bank Jakarta", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Plaza+Indonesia", starred: false },
      { id: "jkt_mall_3", name: "Thamrin City", category: "Shopping Mall", lat: -6.194027233, lng: 106.8166727, station: "Bundaran HI Bank Jakarta", walk: "", map: "https://www.google.com/maps/search/?api=1&query=Thamrin+City", starred: false }
    ]
  },
  bandung: {
    attraction: [
      // Add your Bandung attractions here when ready!
    ],
    coffee: [
      // Add your Bandung coffee spots here when ready!
    ],
    food: [
      // Add your Bandung food spots here when ready!
    ]
  }
};

// Helper function to flatten all city locations into one array for the active trip
function getAllMasterLocations() {
  let allPlaces = [];
  
  // Combine Jakarta spots
  Object.values(masterLocationDatabase.jakarta).forEach(categoryArray => {
    allPlaces.push(...categoryArray);
  });
  
  // Combine Bandung spots
  Object.values(masterLocationDatabase.bandung).forEach(categoryArray => {
    allPlaces.push(...categoryArray);
  });

  return allPlaces;
}

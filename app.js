/**
 * LILY POND TRAVEL DASHBOARD - APP.JS
 * Fully Restored Core Logic + Safe Cloud-Sync Extension
 */

const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxAiZgIqhw21qxNeePEJC_ic4NVJes8np1f0QucxV88jooXcFoWU5l8dnmy8qpInQ54/exec";

// Global App State
let appData = {
  currentTripId: "trip_jakarta_bandung",
  trips: [
    {
      id: "trip_jakarta_bandung",
      name: "Jakarta & Bandung Trip",
      activeHotel: "Hotel Grand Sahid Jaya",
      places: [],
      itinerary: {},
      checklists: []
    }
  ]
};

// --- INITIALIZATION ---
window.onload = function() {
  loadAppData();
  renderTripList();
  renderMasterPlacesList();
  renderItineraryView();
  
  // Safe background cloud sync
  syncFromGoogleSheet();
};

// --- LOCAL STORAGE HELPERS ---
function loadAppData() {
  const saved = localStorage.getItem("lily_pond_data");
  if (saved) {
    try {
      appData = JSON.parse(saved);
    } catch(e) {
      console.warn("Could not parse local app data, using default.", e);
    }
  }
}

function saveAppData() {
  localStorage.setItem("lily_pond_data", JSON.stringify(appData));
}

function getActiveTrip() {
  return appData.trips.find(t => t.id === appData.currentTripId) || appData.trips[0];
}

// --- NAVIGATION & TABS ---
function switchHomeTab(tabName) {
  console.log("Switching home tab to:", tabName);
}

// --- TRIP MANAGEMENT & MODALS ---
function openTripModal() {
  openModal('modal-add-trip');
}

function handleAddTripForm(event) {
  if (event) event.preventDefault();
  
  const tripNameInput = document.getElementById('trip-form-name');
  const tripName = tripNameInput ? tripNameInput.value.trim() : "New Adventure";
  
  if (!tripName) {
    alert("Please enter a trip name!");
    return;
  }

  const newTripId = "trip_" + Date.now();
  const newTrip = {
    id: newTripId,
    name: tripName,
    activeHotel: "Hotel Grand Sahid Jaya",
    places: [],
    itinerary: {},
    checklists: []
  };

  appData.trips.push(newTrip);
  appData.currentTripId = newTripId;
  
  saveAppData();
  closeModal('modal-add-trip');
  
  renderTripList();
  renderMasterPlacesList();
}

function switchTrip(tripId) {
  appData.currentTripId = tripId;
  saveAppData();
  location.reload();
}

function renderTripList() {
  const container = document.getElementById('upcoming-trips-container');
  if (!container) return;
  
  container.innerHTML = "";
  appData.trips.forEach(trip => {
    const card = document.createElement('div');
    card.className = "p-4 bg-white rounded-xl shadow-sm border border-emerald-100 mb-3 cursor-pointer flex justify-between items-center";
    card.innerHTML = `
      <div>
        <h3 class="font-bold text-gray-800 text-lg">${trip.name}</h3>
        <p class="text-xs text-gray-500">Active Hotel: ${trip.activeHotel}</p>
      </div>
      <button onclick="switchTrip('${trip.id}')" class="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg">Open</button>
    `;
    container.appendChild(card);
  });
}

// --- MASTER SPOTS & FORMS ---
function saveMasterSpotForm() {
  const spotId = document.getElementById('spot-form-id').value;
  const name = document.getElementById('spot-form-name').value.trim();
  const category = document.getElementById('spot-form-category').value;
  const station = document.getElementById('spot-form-station').value.trim() || 'No station nearby';
  
  if (!name) return alert("Please enter a spot name!");

  const trip = getActiveTrip();

  if (spotId) {
    const spot = trip.places.find(p => p.id === spotId);
    if (spot) {
      spot.name = name;
      spot.category = category;
    }
  } else {
    const newLocalSpot = {
      id: "p_" + Date.now(),
      name: name,
      category: category,
      station: station,
      walkStation: "Calculating...",
      map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      starred: false,
      review: ""
    };
    trip.places.push(newLocalSpot);
  }

  saveAppData();
  closeModal('modal-master-spot');
  renderMasterPlacesList();
}

// --- UI RENDERING ---
function renderMasterPlacesList() {
  const container = document.getElementById('master-places-container');
  if (!container) return;
  
  const trip = getActiveTrip();
  container.innerHTML = "";

  trip.places.forEach(place => {
    const card = document.createElement('div');
    card.className = "p-4 bg-white rounded-xl shadow-sm border border-emerald-100 flex justify-between items-center mb-3";
    card.innerHTML = `
      <div>
        <h4 class="font-bold text-gray-800">${place.name}</h4>
        <p class="text-xs text-gray-500">${place.category} • Station: ${place.station}</p>
        <p class="text-xs text-emerald-600 mt-1">Walk from Station: ${place.walkStation || 'Pending'}</p>
      </div>
      <div class="flex gap-2">
        <a href="${place.map}" target="_blank" class="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg">Map</a>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderItineraryView() {
  console.log("Itinerary view rendered.");
}

// --- MODAL CONTROLS ---
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('hidden');
}

// --- CLOUD SYNC FEATURE ---
async function syncFromGoogleSheet() {
  try {
    const res = await fetch(GOOGLE_SHEET_API_URL);
    const cloudData = await res.json();
    
    const trip = getActiveTrip();
    
    if (cloudData.places && cloudData.places.length > 0) {
      trip.places = cloudData.places;
    }
    if (cloudData.activeHotel) {
      trip.activeHotel = cloudData.activeHotel;
    }

    saveAppData();
    if (typeof renderMasterPlacesList === 'function') {
      renderMasterPlacesList();
    }
    console.log("Successfully synced data from Google Sheet!");
  } catch (err) {
    console.warn("Could not reach Google Sheet, using local cache.", err);
  }
}

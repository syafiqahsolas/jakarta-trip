/**
 * LILY POND TRAVEL DASHBOARD - APP.JS
 * Hybrid Data Model: Local storage for checklists/private state, 
 * Google Sheets for shared master locations, active hotels, and itinerary.
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
window.onload = async function() {
  loadAppData();
  
  // Attempt to sync latest cloud data (places & active hotel) from Google Sheets
  await syncFromGoogleSheet();
  
  // Render initial UI views
  renderMasterPlacesList();
  renderItineraryView();
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

// --- CLOUD SYNC: FETCH FROM GOOGLE SHEETS ---
async function syncFromGoogleSheet() {
  try {
    const res = await fetch(GOOGLE_SHEET_API_URL);
    const cloudData = await res.json();
    
    const trip = getActiveTrip();
    
    // Update master places if fetched from cloud
    if (cloudData.places && cloudData.places.length > 0) {
      trip.places = cloudData.places;
    }
    
    // Update active hotel dynamically if provided by sheet
    if (cloudData.activeHotel) {
      trip.activeHotel = cloudData.activeHotel;
    }

    saveAppData();
    renderMasterPlacesList();
    console.log("Successfully synced places and hotel from Google Sheet!");
  } catch (err) {
    console.warn("Offline mode active: Using local device cache.", err);
  }
}

// --- CLOUD SYNC: SAVE NEW SPOT (POST TO GOOGLE SHEETS) ---
async function saveMasterSpotForm() {
  const spotId = document.getElementById('spot-form-id').value;
  const name = document.getElementById('spot-form-name').value.trim();
  const category = document.getElementById('spot-form-category').value;
  const station = document.getElementById('spot-form-station').value.trim() || 'No station nearby';
  
  if (!name) return alert("Please enter a spot name!");

  const trip = getActiveTrip();

  if (spotId) {
    // Edit existing local spot
    const spot = trip.places.find(p => p.id === spotId);
    if (spot) {
      spot.name = name;
      spot.category = category;
    }
  } else {
    // 1. Add new spot locally for immediate UI responsiveness
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

    // 2. Post to Google Sheet backend to sync across your phone and laptop
    try {
      await fetch(GOOGLE_SHEET_API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "ADD_SPOT",
          name: name,
          category: category,
          station: station
        })
      });
      console.log("New spot successfully sent to Google Sheet!");
    } catch (err) {
      console.warn("Could not sync to Google Sheet (saved locally only):", err);
    }
  }

  saveAppData();
  closeModal('modal-master-spot');
  renderMasterPlacesList();
}

// --- UI RENDERING PLACEHOLDERS ---
function renderMasterPlacesList() {
  const container = document.getElementById('master-places-container');
  if (!container) return; // Skip if element doesn't exist on current HTML page view
  
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
  // Renders daily timeline schedule views
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

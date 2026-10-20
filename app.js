/**
 * LILY POND TRAVEL HUB - APP.JS
 * Fully Synchronized Mobile & Desktop Backend + Bulk Unstar + Clean Summary
 */

const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxAiZgIqhw21qxNeePEJC_ic4NVJes8np1f0QucxV88jooXcFoWU5l8dnmy8qpInQ54/exec";

let appData = {
  currentTripId: "trip_jakarta_bandung",
  trips: [
    {
      id: "trip_jakarta_bandung",
      name: "Jakarta & Bandung",
      startDate: "2026-11-21",
      endDate: "2026-11-26",
      category: "Vacation",
      people: "5 Pax",
      budget: "RM 2,000 / pax",
      activeHotel: "Hotel Grand Sahid Jaya",
      hotelStation: "Setiabudi Astra",
      places: [],
      itinerary: [],
      checklists: { prep: [], packing: [] },
      expenses: []
    }
  ]
};

let activeTripId = "trip_jakarta_bandung";
let activeItineraryDay = 1;
let selectedWaddleCluster = "NEAR_HOTEL";
let editingItineraryIndex = null;
let editingPlaceId = null;

// --- INITIALIZATION ---
window.onload = async function() {
  loadAppData();
  renderUpcomingTripsList();
  renderAllTripsList();
  renderActiveTripDashboard();
  
  await syncFromGoogleSheet();
};

function loadAppData() {
  const saved = localStorage.getItem("lily_pond_cloud_data");
  if (saved) {
    try {
      appData = JSON.parse(saved);
      if (appData.currentTripId) activeTripId = appData.currentTripId;
    } catch(e) {}
  }
}

function saveAppData() {
  appData.currentTripId = activeTripId;
  localStorage.setItem("lily_pond_cloud_data", JSON.stringify(appData));
  pushToGoogleSheet();
}

async function pushToGoogleSheet() {
  if (!GOOGLE_SHEET_API_URL || GOOGLE_SHEET_API_URL.includes("YOUR_DEPLOYED")) return;
  try {
    await fetch(GOOGLE_SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appData)
    });
    console.log("Changes pushed to Google Sheet cloud.");
  } catch (err) {
    console.warn("Cloud push failed, saved locally.", err);
  }
}

async function syncFromGoogleSheet() {
  if (!GOOGLE_SHEET_API_URL || GOOGLE_SHEET_API_URL.includes("YOUR_DEPLOYED")) return;

  try {
    const res = await fetch(GOOGLE_SHEET_API_URL);
    const cloudData = await res.json();
    
    if (cloudData && cloudData.trips && cloudData.trips.length > 0) {
      appData = cloudData;
      if (cloudData.currentTripId) activeTripId = cloudData.currentTripId;
      
      localStorage.setItem("lily_pond_cloud_data", JSON.stringify(appData));
      renderUpcomingTripsList();
      renderAllTripsList();
      renderActiveTripDashboard();
      console.log("Synced latest cloud data & places!");
    }
  } catch (err) {
    console.warn("Using offline local cache.", err);
  }
}

function getActiveTrip() {
  let trip = appData.trips.find(t => t.id === activeTripId);
  if (!trip) {
    trip = appData.trips[0];
    if (trip) activeTripId = trip.id;
  }
  if (trip) {
    if (!trip.places) trip.places = [];
    if (!trip.itinerary) trip.itinerary = [];
    if (!trip.checklists) trip.checklists = { prep: [], packing: [] };
    if (!trip.expenses) trip.expenses = [];
  }
  return trip;
}

// --- NAVIGATION ---
function openHomePage(subTab = 'upcoming') {
  document.getElementById('section-home').classList.remove('hidden');
  document.getElementById('section-trip-dashboard').classList.add('hidden');
  switchHomeTab(subTab);
}

function switchHomeTab(tabName) {
  const upcomingView = document.getElementById('home-view-upcoming');
  const allView = document.getElementById('home-view-all');
  if (tabName === 'upcoming') {
    if (upcomingView) upcomingView.classList.remove('hidden');
    if (allView) allView.classList.add('hidden');
  } else {
    if (upcomingView) upcomingView.classList.add('hidden');
    if (allView) allView.classList.remove('hidden');
    renderAllTripsList();
  }
}

function switchDashboardPage(pageName) {
  const pages = ['summary', 'itinerary', 'waddle', 'master', 'checklists'];
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.classList.add('hidden');
    const navBtn = document.getElementById(`nav-${p}`);
    if (navBtn) navBtn.classList.remove('nav-tab-active');
  });

  const targetPage = document.getElementById(`page-${pageName}`);
  if (targetPage) targetPage.classList.remove('hidden');

  const activeNav = document.getElementById(`nav-${pageName}`);
  if (activeNav) activeNav.classList.add('nav-tab-active');

  if (pageName === 'summary') renderStarredLocationsSummary();
  if (pageName === 'itinerary') renderItinerary();
  if (pageName === 'master') renderMasterPlacesList();
  if (pageName === 'waddle') renderWaddleView();
  if (pageName === 'checklists') renderChecklistsAndExpenses();
}

function openTripDashboard(tripId) {
  activeTripId = tripId;
  saveAppData();
  document.getElementById('section-home').classList.add('hidden');
  document.getElementById('section-trip-dashboard').classList.remove('hidden');
  renderActiveTripDashboard();
  switchDashboardPage('summary');
}

// --- ACTIVE TRIP SUMMARY & MUST-VISITS (MAX 5 STRICTLY ON SUMMARY) ---
function renderActiveTripDashboard() {
  const trip = getActiveTrip();
  if (!trip) return;

  document.getElementById('sum-card-title').innerText = trip.name;
  document.getElementById('sum-card-dates').innerText = `${trip.startDate || 'TBD'} – ${trip.endDate || 'TBD'}`;
  document.getElementById('sum-card-category').innerText = trip.category || 'Vacation';
  document.getElementById('sum-card-people').innerText = trip.people || '1 Pax';
  document.getElementById('sum-card-budget').innerText = trip.budget || 'RM 0';

  const hotelTitle = document.getElementById('waddle-hotel-title');
  const hotelStation = document.getElementById('waddle-hotel-station');
  if (hotelTitle) hotelTitle.innerText = trip.activeHotel || 'Hotel Base Not Set';
  if (hotelStation) hotelStation.innerHTML = `<strong>Nearest Station:</strong> ${trip.hotelStation || 'Setiabudi Astra'}`;

  renderStarredLocationsSummary();
  renderMasterPlacesList();
  renderWaddleView();
}

function renderStarredLocationsSummary() {
  const trip = getActiveTrip();
  const container = document.getElementById('summary-starred-spots') || document.getElementById('summary-starred-container');
  if (!container) return;

  // Filter ONLY explicitly starred spots and strictly cap at 5 items
  const starred = (trip.places || []).filter(p => p.starred === true).slice(0, 5);
  container.innerHTML = "";

  if (starred.length === 0) {
    container.innerHTML = `<p class="col-span-2 text-xs text-stone-400 py-3 text-center">No starred locations yet. Tap the star ⭐ icon in Locations to feature up to 5 must-visits!</p>`;
    return;
  }

  starred.forEach(p => {
    const card = document.createElement('div');
    card.className = "lily-card p-3 flex justify-between items-center text-xs col-span-2 sm:col-span-1";
    card.innerHTML = `
      <div class="space-y-0.5">
        <h5 style="color: var(--pond-green);" class="font-bold text-xs truncate flex items-center gap-1">
          <span class="text-amber-400">★</span>
          <span>${p.name}</span>
        </h5>
        <p class="text-stone-500 text-[10px]">${p.category} • ${p.station || 'Near Hotel'}</p>
      </div>
      <a href="${p.map || '#'}" target="_blank" class="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex-shrink-0">Map ➔</a>
    `;
    container.appendChild(card);
  });
}

function toggleStarSpot(placeId) {
  const trip = getActiveTrip();
  const place = (trip.places || []).find(p => p.id === placeId);
  if (place) {
    place.starred = !place.starred;
    saveAppData();
    renderMasterPlacesList();
    renderWaddleView();
    renderStarredLocationsSummary();
  }
}

// BULK UNSTAR ALL LOCATIONS FUNCTION
function unstarAllLocations() {
  const trip = getActiveTrip();
  if (!trip || !trip.places) return;

  if (confirm("Are you sure you want to unstar all locations?")) {
    trip.places.forEach(p => p.starred = false);
    saveAppData();
    renderMasterPlacesList();
    renderWaddleView();
    renderStarredLocationsSummary();
  }
}

// --- MASTER LOCATIONS (WITH WORKING CATEGORY FILTER & EDIT MODAL) ---
function renderMasterPlacesList() {
  const container = document.getElementById('masterPlacesContainer');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const query = (document.getElementById('masterSearchInput')?.value || '').toLowerCase();
  const catFilter = document.getElementById('masterCategoryFilter')?.value || 'ALL';

  const filtered = (trip.places || []).filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query) || (p.station && p.station.toLowerCase().includes(query));
    
    const pCat = (p.category || '').toLowerCase();
    const filterCat = catFilter.toLowerCase();
    const matchesCat = filterCat === 'all' || pCat === filterCat || pCat.includes(filterCat);
    
    return matchesQuery && matchesCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No spots found matching filter.</p>`;
    return;
  }

  filtered.forEach(place => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs";
    card.innerHTML = `
      <div class="space-y-0.5">
        <div class="flex items-center space-x-2">
          <button onclick="toggleStarSpot('${place.id}')" class="focus:outline-none transition-transform active:scale-125">
            ${place.starred ? '<span class="text-amber-400 text-base">★</span>' : '<span class="text-stone-300 hover:text-amber-400 text-base">☆</span>'}
          </button>
          <h4 style="color: var(--pond-green);" class="font-bold text-sm">${place.name}</h4>
          <button onclick="openEditSpotModal('${place.id}')" class="text-stone-300 hover:text-stone-600 text-xs ms-1"><i class="fa-solid fa-pen"></i></button>
        </div>
        <p class="text-stone-500">${place.category || 'General'} • Station: <strong class="text-stone-700">${place.station || 'Auto-Assigned'}</strong></p>
        ${place.walk ? `<p class="text-[11px] text-emerald-700"><i class="fa-solid fa-person-walking me-1"></i>${place.walk}</p>` : ''}
      </div>
      <a href="${place.map || '#'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px]" style="background-color: var(--pond-bg); color: var(--pond-green);">
        <i class="fa-solid fa-location-dot me-1"></i>Map
      </a>
    `;
    container.appendChild(card);
  });
}

function openMasterSpotModal() {
  editingPlaceId = null;
  document.getElementById('spot-form-name').value = '';
  document.getElementById('spot-form-category').value = 'Attraction';
  openModal('modal-master-spot');
}

function openEditSpotModal(placeId) {
  const trip = getActiveTrip();
  const place = (trip.places || []).find(p => p.id === placeId);
  if (!place) return;

  editingPlaceId = placeId;
  document.getElementById('spot-form-name').value = place.name || '';
  document.getElementById('spot-form-category').value = place.category || 'Attraction';
  openModal('modal-master-spot');
}

function saveMasterSpotForm() {
  const name = document.getElementById('spot-form-name').value.trim();
  const category = document.getElementById('spot-form-category').value;

  if (!name) return alert("Please enter a spot name!");

  const trip = getActiveTrip();
  if (!trip.places) trip.places = [];

  if (editingPlaceId) {
    const place = trip.places.find(p => p.id === editingPlaceId);
    if (place) {
      place.name = name;
      place.category = category;
      place.map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
    }
  } else {
    trip.places.push({
      id: "p_" + Date.now(),
      name: name,
      category: category,
      station: "Near Hotel Area",
      map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      starred: false
    });
  }

  saveAppData();
  closeModal('modal-master-spot');
  renderMasterPlacesList();
  renderWaddleView();

  document.getElementById('spot-form-name').value = '';
}

// --- WADDLE WITH QUICK HUBS ---
function executeWaddleSearch() {
  renderWaddleView();
}

function renderWaddleView() {
  const container = document.getElementById('waddleSearchResults');
  const quickHubsContainer = document.getElementById('waddle-quick-hubs');
  if (!container) return;
  
  const trip = getActiveTrip();
  container.innerHTML = "";

  const hotelStation = (trip.hotelStation || 'Setiabudi Astra').toLowerCase();
  const places = trip.places || [];

  const stationSet = new Set();
  places.forEach(p => {
    if (p.station && p.station !== 'N/A' && p.station !== 'No station nearby') {
      stationSet.add(p.station);
    }
  });

  if (quickHubsContainer) {
    quickHubsContainer.innerHTML = "";
    
    const hotelChip = document.createElement('button');
    hotelChip.className = `px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedWaddleCluster === 'NEAR_HOTEL' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`;
    hotelChip.innerHTML = `<i class="fa-solid fa-hotel me-1"></i>Near Hotel`;
    hotelChip.onclick = () => { selectedWaddleCluster = 'NEAR_HOTEL'; renderWaddleView(); };
    quickHubsContainer.appendChild(hotelChip);

    const allChip = document.createElement('button');
    allChip.className = `px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedWaddleCluster === 'ALL' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`;
    allChip.innerText = `All Clusters`;
    allChip.onclick = () => { selectedWaddleCluster = 'ALL'; renderWaddleView(); };
    quickHubsContainer.appendChild(allChip);

    stationSet.forEach(stationName => {
      const chip = document.createElement('button');
      chip.className = `px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${selectedWaddleCluster === stationName ? 'bg-emerald-800 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`;
      chip.innerText = `🚆 ${stationName}`;
      chip.onclick = () => { selectedWaddleCluster = stationName; renderWaddleView(); };
      quickHubsContainer.appendChild(chip);
    });
  }

  const searchQuery = (document.getElementById('waddleSearchInput')?.value || '').toLowerCase();
  
  let filtered = places.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery) || (p.station && p.station.toLowerCase().includes(searchQuery)) || p.category.toLowerCase().includes(searchQuery);
    
    if (selectedWaddleCluster === 'NEAR_HOTEL') {
      const isHotelCluster = p.station && (p.station.toLowerCase().includes(hotelStation) || p.station.toLowerCase().includes("setiabudi") || p.station.toLowerCase().includes("bundaran hi"));

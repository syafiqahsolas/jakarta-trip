/**
 * LILY POND TRAVEL HUB - APP.JS
 * Fully Synchronized Cloud Backend + Local Checklists & Expenses
 */

const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzkZliNgixWuA0QqUNnyT7vdhSyZX4LfDZ_rTZLp_M/dev";

// Global Application State (Defaults if offline)
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
      hotelStation: "Setiabudi Astra (1 min walk)",
      places: []
    }
  ]
};

let activeTripId = "trip_jakarta_bandung";

// --- INITIALIZATION ---
window.onload = async function() {
  loadAppData();
  renderUpcomingTripsList();
  renderAllTripsList();
  renderActiveTripDashboard();
  
  // Fetch latest updates from Google Sheet on startup
  await syncFromGoogleSheet();
};

// --- STORAGE & CLOUD SYNC ---
function loadAppData() {
  const saved = localStorage.getItem("lily_pond_cloud_data");
  if (saved) {
    try {
      appData = JSON.parse(saved);
      if (appData.currentTripId) activeTripId = appData.currentTripId;
    } catch(e) {
      console.warn("Could not parse local cache.", e);
    }
  }
}

function saveAppData() {
  appData.currentTripId = activeTripId;
  localStorage.setItem("lily_pond_cloud_data", JSON.stringify(appData));
  
  // Automatically push modifications to the Google Sheet cloud backend
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
      appData.trips = cloudData.trips;
      if (cloudData.currentTripId) activeTripId = cloudData.currentTripId;
      saveAppData();
      
      renderUpcomingTripsList();
      renderAllTripsList();
      renderActiveTripDashboard();
      console.log("Successfully synced all trips from Google Sheet!");
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
  return trip;
}

// --- NAVIGATION & TABS ---
function openHomePage(subTab = 'upcoming') {
  document.getElementById('section-home').classList.remove('hidden');
  document.getElementById('section-trip-dashboard').classList.add('hidden');
  switchHomeTab(subTab);
  syncFromGoogleSheet();
}

function switchHomeTab(tabName) {
  const upcomingView = document.getElementById('home-view-upcoming');
  const allView = document.getElementById('home-view-all');
  const tabUpcomingBtn = document.getElementById('home-tab-upcoming');
  const tabAllBtn = document.getElementById('home-tab-all');

  if (tabName === 'upcoming') {
    if (upcomingView) upcomingView.classList.remove('hidden');
    if (allView) allView.classList.add('hidden');
    if (tabUpcomingBtn) tabUpcomingBtn.classList.add('text-stone-800');
    if (tabAllBtn) tabAllBtn.classList.remove('text-stone-800');
  } else {
    if (upcomingView) upcomingView.classList.add('hidden');
    if (allView) allView.classList.remove('hidden');
    if (tabAllBtn) tabAllBtn.classList.add('text-stone-800');
    if (tabUpcomingBtn) tabUpcomingBtn.classList.remove('text-stone-800');
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

  if (pageName === 'master') renderMasterPlacesList();
  if (pageName === 'waddle') renderWaddleView();
}

function openTripDashboard(tripId) {
  activeTripId = tripId;
  saveAppData();
  document.getElementById('section-home').classList.add('hidden');
  document.getElementById('section-trip-dashboard').classList.remove('hidden');
  renderActiveTripDashboard();
  switchDashboardPage('summary');
}

// --- TRIP CREATION & EDITING ---
function openTripModal(tripIdToEdit = null) {
  const modal = document.getElementById('modal-trip');
  const titleEl = document.getElementById('modal-trip-title');
  
  if (tripIdToEdit) {
    const trip = appData.trips.find(t => t.id === tripIdToEdit);
    if (trip) {
      if (titleEl) titleEl.innerText = "Edit Trip";
      document.getElementById('trip-form-id').value = trip.id;
      document.getElementById('trip-form-title').value = trip.name || '';
      document.getElementById('trip-form-start-date').value = trip.startDate || '';
      document.getElementById('trip-form-end-date').value = trip.endDate || '';
      document.getElementById('trip-form-category').value = trip.category || 'Vacation';
      document.getElementById('trip-form-people').value = trip.people || '';
      document.getElementById('trip-form-budget').value = trip.budget || '';
      document.getElementById('trip-form-hotel').value = trip.activeHotel || '';
    }
  } else {
    if (titleEl) titleEl.innerText = "Add New Trip";
    document.getElementById('trip-form-id').value = '';
    document.getElementById('trip-form-title').value = '';
    document.getElementById('trip-form-start-date').value = '';
    document.getElementById('trip-form-end-date').value = '';
    document.getElementById('trip-form-people').value = '';
    document.getElementById('trip-form-budget').value = '';
    document.getElementById('trip-form-hotel').value = '';
  }
  
  openModal('modal-trip');
}

function saveTripForm() {
  const id = document.getElementById('trip-form-id').value;
  const title = document.getElementById('trip-form-title').value.trim();
  const startDate = document.getElementById('trip-form-start-date').value;
  const endDate = document.getElementById('trip-form-end-date').value;
  const category = document.getElementById('trip-form-category').value;
  const people = document.getElementById('trip-form-people').value.trim();
  const budget = document.getElementById('trip-form-budget').value.trim();
  const hotel = document.getElementById('trip-form-hotel').value.trim();

  if (!title) {
    alert("Please enter a Trip Destination Name!");
    return;
  }

  if (id) {
    const trip = appData.trips.find(t => t.id === id);
    if (trip) {
      trip.name = title;
      trip.startDate = startDate;
      trip.endDate = endDate;
      trip.category = category;
      trip.people = people;
      trip.budget = budget;
      if (hotel) trip.activeHotel = hotel;
    }
  } else {
    const newTripId = "trip_" + Date.now();
    const newTrip = {
      id: newTripId,
      name: title,
      startDate: startDate || "TBD",
      endDate: endDate || "TBD",
      category: category || "Vacation",
      people: people || "1 Pax",
      budget: budget || "RM 0",
      activeHotel: hotel || "Not Selected",
      hotelStation: "",
      places: []
    };
    appData.trips.push(newTrip);
    activeTripId = newTripId;
  }

  saveAppData();
  closeModal('modal-trip');
  renderUpcomingTripsList();
  renderAllTripsList();
  openTripDashboard(activeTripId);
}

// --- RENDER LISTS & DASHBOARD ---
function renderUpcomingTripsList() {
  const container = document.getElementById('upcoming-trips-list');
  if (!container) return;
  container.innerHTML = "";

  appData.trips.forEach(trip => {
    const card = document.createElement('div');
    card.className = "lily-card p-4 space-y-2 cursor-pointer";
    card.onclick = () => openTripDashboard(trip.id);
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <span class="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full" style="background-color: var(--sage-green);">${trip.category || 'Trip'}</span>
        <span class="text-xs text-stone-400"><i class="fa-solid fa-calendar-days me-1"></i>${trip.startDate || ''} - ${trip.endDate || ''}</span>
      </div>
      <h3 style="color: var(--pond-green);" class="font-bold text-lg leading-tight">${trip.name}</h3>
      <div class="flex justify-between text-xs text-stone-500 pt-1">
        <span><i class="fa-solid fa-hotel me-1"></i>${trip.activeHotel || 'No hotel set'}</span>
        <span class="font-semibold" style="color: var(--pond-green);">${trip.budget || ''}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderAllTripsList() {
  const container = document.getElementById('all-trips-list');
  if (!container) return;
  container.innerHTML = "";

  const query = (document.getElementById('tripSearchInput')?.value || '').toLowerCase();
  const categoryFilter = document.getElementById('tripCategoryFilter')?.value || 'ALL';

  const filtered = appData.trips.filter(t => {
    const matchesQuery = t.name.toLowerCase().includes(query);
    const matchesCat = categoryFilter === 'ALL' || t.category === categoryFilter;
    return matchesQuery && matchesCat;
  });

  filtered.forEach(trip => {
    const card = document.createElement('div');
    card.className = "lily-card p-4 flex justify-between items-center cursor-pointer";
    card.onclick = () => openTripDashboard(trip.id);
    card.innerHTML = `
      <div>
        <h4 style="color: var(--pond-green);" class="font-bold text-base">${trip.name}</h4>
        <p class="text-xs text-stone-400">${trip.category} • ${trip.startDate || 'TBD'}</p>
      </div>
      <button class="text-xs px-3 py-1.5 rounded-xl font-semibold text-white" style="background-color: var(--pond-green);">Open ➔</button>
    `;
    container.appendChild(card);
  });
}

function renderActiveTripDashboard() {
  const trip = getActiveTrip();
  if (!trip) return;

  const titleEl = document.getElementById('sum-card-title');
  const datesEl = document.getElementById('sum-card-dates');
  const catEl = document.getElementById('sum-card-category');
  const peopleEl = document.getElementById('sum-card-people');
  const budgetEl = document.getElementById('sum-card-budget');

  if (titleEl) titleEl.innerText = trip.name;
  if (datesEl) datesEl.innerText = `${trip.startDate || 'TBD'} – ${trip.endDate || 'TBD'}`;
  if (catEl) catEl.innerText = trip.category || 'Vacation';
  if (peopleEl) peopleEl.innerText = trip.people || '1 Pax';
  if (budgetEl) budgetEl.innerText = trip.budget || 'RM 0';

  const hotelTitle = document.getElementById('waddle-hotel-title');
  const hotelStation = document.getElementById('waddle-hotel-station');
  if (hotelTitle) hotelTitle.innerText = trip.activeHotel || 'Hotel Base Not Set';
  if (hotelStation) hotelStation.innerHTML = `<strong>Nearest Station:</strong> ${trip.hotelStation || 'Calculating...'}`;

  renderMasterPlacesList();
}

// --- MASTER PLACES ---
function renderMasterPlacesList() {
  const container = document.getElementById('masterPlacesContainer');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  if (!trip.places || trip.places.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-4">No locations added yet for this trip.</p>`;
    return;
  }

  trip.places.forEach(place => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs";
    card.innerHTML = `
      <div>
        <h4 style="color: var(--pond-green);" class="font-bold text-sm">${place.name}</h4>
        <p class="text-stone-500">${place.category || 'General'} • Station: ${place.station || 'N/A'}</p>
      </div>
      <a href="${place.map || '#'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px]" style="background-color: var(--pond-bg); color: var(--pond-green);">Map</a>
    `;
    container.appendChild(card);
  });
}

function openMasterSpotModal() {
  openModal('modal-master-spot');
}

function saveMasterSpotForm() {
  const name = document.getElementById('spot-form-name').value.trim();
  const category = document.getElementById('spot-form-category').value;
  const station = document.getElementById('spot-form-station').value.trim();

  if (!name) return alert("Please enter a spot name!");

  const trip = getActiveTrip();
  if (!trip.places) trip.places = [];

  trip.places.push({
    id: "p_" + Date.now(),
    name: name,
    category: category,
    station: station || "Main Station",
    map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`
  });

  saveAppData();
  closeModal('modal-master-spot');
  renderMasterPlacesList();
}

function renderWaddleView() {}

// --- MODAL UTILITIES ---
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

/**
 * LILY POND TRAVEL HUB - APP.JS
 * Direct Google Sheet Tab Parser for Locations, Stations, and Hotels
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
      itinerary: [
        { day: 1, title: "Arrival & Check-in", time: "14:00", location: "Hotel Grand Sahid Jaya", notes: "Unpack and relax." }
      ],
      checklists: { prep: [], packing: [] },
      expenses: []
    }
  ]
};

let activeTripId = "trip_jakarta_bandung";
let activeItineraryDay = 1;

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
}

async function syncFromGoogleSheet() {
  if (!GOOGLE_SHEET_API_URL || GOOGLE_SHEET_API_URL.includes("YOUR_DEPLOYED")) return;

  try {
    const res = await fetch(GOOGLE_SHEET_API_URL);
    const cloudData = await res.json();
    
    if (cloudData && cloudData.trips && cloudData.trips.length > 0) {
      const activeTrip = getActiveTrip();
      // Pull places directly from Excel Master Log
      activeTrip.places = cloudData.trips[0].places || [];
      
      saveAppData();
      renderActiveTripDashboard();
      console.log("Synced places directly from Excel tabs!");
    }
  } catch (err) {
    console.warn("Using local cache.", err);
  }
}

function getActiveTrip() {
  let trip = appData.trips.find(t => t.id === activeTripId);
  if (!trip) trip = appData.trips[0];
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
    upcomingView.classList.remove('hidden');
    allView.classList.add('hidden');
  } else {
    upcomingView.classList.add('hidden');
    allView.classList.remove('hidden');
    renderAllTripsList();
  }
}

function switchDashboardPage(pageName) {
  const pages = ['summary', 'itinerary', 'waddle', 'master', 'checklists'];
  pages.forEach(p => {
    document.getElementById(`page-${p}`).classList.add('hidden');
    const navBtn = document.getElementById(`nav-${p}`);
    if (navBtn) navBtn.classList.remove('nav-tab-active');
  });

  document.getElementById(`page-${pageName}`).classList.remove('hidden');
  document.getElementById(`nav-${pageName}`).classList.add('nav-tab-active');

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

// --- RENDER DASHBOARD ---
function renderActiveTripDashboard() {
  const trip = getActiveTrip();
  if (!trip) return;

  document.getElementById('sum-card-title').innerText = trip.name;
  document.getElementById('sum-card-dates').innerText = `${trip.startDate || 'TBD'} – ${trip.endDate || 'TBD'}`;
  document.getElementById('sum-card-category').innerText = trip.category || 'Vacation';
  document.getElementById('sum-card-people').innerText = trip.people || '1 Pax';
  document.getElementById('sum-card-budget').innerText = trip.budget || 'RM 0';

  document.getElementById('waddle-hotel-title').innerText = trip.activeHotel || 'Hotel Grand Sahid Jaya';
  document.getElementById('waddle-hotel-station').innerHTML = `<strong>Nearest Station:</strong> ${trip.hotelStation || 'Setiabudi Astra'} (Base Cluster)`;

  renderMasterPlacesList();
  renderWaddleView();
}

// --- MASTER LOCATIONS DATABASE ---
function renderMasterPlacesList() {
  const container = document.getElementById('masterPlacesContainer');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const query = (document.getElementById('masterSearchInput')?.value || '').toLowerCase();
  const catFilter = document.getElementById('masterCategoryFilter')?.value || 'ALL';

  const filtered = (trip.places || []).filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query) || (p.station && p.station.toLowerCase().includes(query));
    const matchesCat = catFilter === 'ALL' || p.category === catFilter;
    return matchesQuery && matchesCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No locations found from Excel.</p>`;
    return;
  }

  filtered.forEach(place => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs";
    card.innerHTML = `
      <div>
        <h4 style="color: var(--pond-green);" class="font-bold text-sm">${place.name}</h4>
        <p class="text-stone-500">${place.category} • Station: <strong class="text-stone-700">${place.station}</strong></p>
        ${place.walk ? `<p class="text-[11px] text-emerald-700 mt-0.5"><i class="fa-solid fa-person-walking me-1"></i>${place.walk}</p>` : ''}
      </div>
      <a href="${place.map}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px]" style="background-color: var(--pond-bg); color: var(--pond-green);">
        <i class="fa-solid fa-location-dot me-1"></i>Map
      </a>
    `;
    container.appendChild(card);
  });
}

// --- WADDLE VIEW (HOTEL & TRAIN CLUSTER FOCUS) ---
function renderWaddleView() {
  const container = document.getElementById('waddleSearchResults');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const query = (document.getElementById('waddleSearchInput')?.value || '').toLowerCase();
  
  // Prioritize places near the hotel station or matching search
  const filtered = (trip.places || []).filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query) || p.station.toLowerCase().includes(query);
    return matchesQuery;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No nearby waddle spots found.</p>`;
    return;
  }

  filtered.forEach(p => {
    const div = document.createElement('div');
    div.className = "lily-card p-3.5 text-xs flex justify-between items-center";
    div.innerHTML = `
      <div>
        <strong style="color: var(--pond-green);" class="text-sm">${p.name}</strong>
        <p class="text-stone-500 text-[11px] mt-0.5"><i class="fa-solid fa-train-subway me-1 text-emerald-700"></i>${p.station} ${p.walk ? '• ' + p.walk : ''}</p>
      </div>
      <a href="${p.map}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-white border border-stone-200" style="color: var(--pond-green);">
        Take me there ➔
      </a>
    `;
    container.appendChild(div);
  });
}

function executeWaddleSearch() {
  renderWaddleView();
}

// --- ITINERARY & DATES ---
function getTotalTripDays(trip) {
  if (!trip.startDate || !trip.endDate) return 5;
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return isNaN(diffDays) || diffDays <= 0 ? 5 : diffDays;
}

function renderItinerary() {
  const trip = getActiveTrip();
  const dayButtonsContainer = document.getElementById('itinerary-day-buttons');
  const timelineContainer = document.getElementById('itinerary-timeline-container');
  if (!dayButtonsContainer || !timelineContainer) return;

  dayButtonsContainer.innerHTML = "";
  timelineContainer.innerHTML = "";

  const totalDays = getTotalTripDays(trip);
  if (activeItineraryDay > totalDays) activeItineraryDay = 1;

  for (let d = 1; d <= totalDays; d++) {
    const btn = document.createElement('button');
    btn.className = `px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${activeItineraryDay === d ? 'text-white' : 'bg-white text-stone-600 border border-stone-200'}`;
    if (activeItineraryDay === d) btn.style.backgroundColor = 'var(--pond-green)';
    btn.innerText = `Day ${d}`;
    btn.onclick = () => {
      activeItineraryDay = d;
      renderItinerary();
    };
    dayButtonsContainer.appendChild(btn);
  }

  const dayActivities = (trip.itinerary || []).filter(act => act.day === activeItineraryDay);
  if (dayActivities.length === 0) {
    timelineContainer.innerHTML = `<p class="text-xs text-stone-400 py-6 text-center">No activities planned for Day ${activeItineraryDay}.</p>`;
    return;
  }

  dayActivities.forEach((act, idx) => {
    const item = document.createElement('div');
    item.className = "relative pl-8 space-y-1";
    item.innerHTML = `
      <div class="absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs" style="background-color: var(--pond-green);"></div>
      <div class="lily-card p-3 text-xs space-y-1">
        <span class="font-bold text-stone-400 text-[10px]">${act.time || 'TBD'}</span>
        <h4 style="color: var(--pond-green);" class="font-bold text-sm">${act.title}</h4>
        <p class="text-stone-600"><i class="fa-solid fa-location-dot me-1" style="color: var(--sage-green);"></i>${act.location || 'N/A'}</p>
      </div>
    `;
    timelineContainer.appendChild(item);
  });
}

function openItineraryModal() { openModal('modal-itinerary'); }
function saveItineraryForm() {
  const title = document.getElementById('itin-form-title').value.trim();
  const time = document.getElementById('itin-form-time').value.trim();
  const location = document.getElementById('itin-form-location').value.trim();
  const notes = document.getElementById('itin-form-notes').value.trim();
  if (!title) return alert("Enter activity title!");

  const trip = getActiveTrip();
  if (!trip.itinerary) trip.itinerary = [];
  trip.itinerary.push({ day: activeItineraryDay, title, time, location, notes });
  saveAppData();
  closeModal('modal-itinerary');
  renderItinerary();
}

function openHotelModal() {
  const trip = getActiveTrip();
  document.getElementById('hotel-form-name').value = trip.activeHotel || '';
  document.getElementById('hotel-form-station').value = trip.hotelStation || '';
  openModal('modal-hotel');
}

function saveHotelForm() {
  const trip = getActiveTrip();
  trip.activeHotel = document.getElementById('hotel-form-name').value.trim();
  trip.hotelStation = document.getElementById('hotel-form-station').value.trim();
  saveAppData();
  closeModal('modal-hotel');
  renderActiveTripDashboard();
}

function renderChecklistsAndExpenses() {}
function renderUpcomingTripsList() {}
function renderAllTripsList() {}
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

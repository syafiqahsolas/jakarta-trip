/**
 * LILY POND TRAVEL HUB - APP.JS
 * Fully Integrated Excel Tab Reader + All Modals & Navigation
 */

const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxAiZgIqhw21qxNeePEJC_ic4NVJes8np1f0QucxV88jooXcFoWU5l8dnmy8qpInQ54/exec";

// Master Default State
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
        { day: 1, title: "Arrival & Check-in", time: "14:00", location: "Hotel Grand Sahid Jaya", notes: "Unpack and settle in." }
      ],
      checklists: {
        prep: [{ text: "Passports & Visas", mustBring: true, done: false }],
        packing: [{ text: "Universal Adapter", mustBring: true, done: false }]
      },
      expenses: [
        { name: "Flights", category: "Flights", amount: 450.00 }
      ]
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
      if (cloudData.trips[0].places && cloudData.trips[0].places.length > 0) {
        activeTrip.places = cloudData.trips[0].places;
      }
      saveAppData();
      renderActiveTripDashboard();
      console.log("Synced locations from Excel tab successfully!");
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
  renderUpcomingTripsList();
  renderAllTripsList();
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

// --- HOMEPAGE LISTS ---
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
  const filtered = appData.trips.filter(t => t.name.toLowerCase().includes(query));

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

// --- TRIP MODAL (ADD / EDIT) ---
function openTripModal(tripIdToEdit = null) {
  const modal = document.getElementById('modal-trip');
  const titleEl = document.getElementById('modal-trip-title');
  
  const targetId = tripIdToEdit || activeTripId;
  const trip = appData.trips.find(t => t.id === targetId);

  if (tripIdToEdit && trip) {
    if (titleEl) titleEl.innerText = "Edit Trip";
    document.getElementById('trip-form-id').value = trip.id;
    document.getElementById('trip-form-title').value = trip.name || '';
    document.getElementById('trip-form-start-date').value = trip.startDate || '';
    document.getElementById('trip-form-end-date').value = trip.endDate || '';
    document.getElementById('trip-form-category').value = trip.category || 'Vacation';
    document.getElementById('trip-form-people').value = trip.people || '';
    document.getElementById('trip-form-budget').value = trip.budget || '';
    document.getElementById('trip-form-hotel').value = trip.activeHotel || '';
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

  if (!title) return alert("Please enter a Trip Name!");

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
      startDate: startDate || "2026-11-21",
      endDate: endDate || "2026-11-26",
      category: category || "Vacation",
      people: people || "1 Pax",
      budget: budget || "RM 0",
      activeHotel: hotel || "Hotel Grand Sahid Jaya",
      hotelStation: "Setiabudi Astra",
      places: [],
      itinerary: [],
      checklists: { prep: [], packing: [] },
      expenses: []
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

// --- DASHBOARD RENDER ---
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

// --- MASTER LOCATIONS ---
function renderMasterPlacesList() {
  const container = document.getElementById('masterPlacesContainer');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const query = (document.getElementById('masterSearchInput')?.value || '').toLowerCase();
  const filtered = (trip.places || []).filter(p => p.name.toLowerCase().includes(query) || p.station.toLowerCase().includes(query));

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

// --- WADDLE VIEW ---
function renderWaddleView() {
  const container = document.getElementById('waddleSearchResults');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const query = (document.getElementById('waddleSearchInput')?.value || '').toLowerCase();
  const filtered = (trip.places || []).filter(p => p.name.toLowerCase().includes(query) || p.station.toLowerCase().includes(query));

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

  dayActivities.forEach((act) => {
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
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

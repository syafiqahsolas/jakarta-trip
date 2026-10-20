/**
 * LILY POND TRAVEL HUB - APP.JS
 * Fully Synchronized Mobile & Desktop Backend + Itinerary Editing
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
let editingItineraryIndex = null;

// --- INITIALIZATION ---
window.onload = async function() {
  loadAppData();
  renderUpcomingTripsList();
  renderAllTripsList();
  renderActiveTripDashboard();
  
  await syncFromGoogleSheet();
};

// --- STORAGE & CLOUD SYNC ---
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
      console.log("Successfully synced all trips & locations across devices!");
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

// --- NAVIGATION & TABS ---
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

// --- HOMEPAGE TRIPS LIST ---
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
        <span class="font-semibold" style="color: var(--pond-green);">${trip.budget || 'RM 0'}</span>
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

// --- TRIP MODAL (ADD/EDIT) ---
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
      activeHotel: hotel || "Not Selected",
      hotelStation: "",
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

  const hotelTitle = document.getElementById('waddle-hotel-title');
  const hotelStation = document.getElementById('waddle-hotel-station');
  if (hotelTitle) hotelTitle.innerText = trip.activeHotel || 'Hotel Base Not Set';
  if (hotelStation) hotelStation.innerHTML = `<strong>Nearest Station:</strong> ${trip.hotelStation || 'Not Set'}`;

  renderMasterPlacesList();
  renderWaddleView();
}

// --- ITINERARY WITH EDITING & DATES ---
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
    timelineContainer.innerHTML = `<p class="text-xs text-stone-400 py-6 text-center">No activities planned for Day ${activeItineraryDay}. Click "+ Add Activity" to add one!</p>`;
    return;
  }

  dayActivities.forEach((act) => {
    const realIdx = trip.itinerary.indexOf(act);
    const item = document.createElement('div');
    item.className = "relative pl-8 space-y-1";
    item.innerHTML = `
      <div class="absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs" style="background-color: var(--pond-green);"></div>
      <div class="lily-card p-3 text-xs space-y-1">
        <div class="flex justify-between items-center">
          <span class="font-bold text-stone-400 text-[10px]">${act.time || 'TBD'}</span>
          <div class="space-x-2">
            <button onclick="openEditItineraryModal(${realIdx})" class="text-stone-400 hover:text-emerald-700"><i class="fa-solid fa-pen text-[10px]"></i></button>
            <button onclick="deleteItineraryActivity(${realIdx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-[10px]"></i></button>
          </div>
        </div>
        <h4 style="color: var(--pond-green);" class="font-bold text-sm">${act.title}</h4>
        <p class="text-stone-600"><i class="fa-solid fa-location-dot me-1" style="color: var(--sage-green);"></i>${act.location || 'N/A'}</p>
        ${act.notes ? `<p class="text-stone-400 text-[11px] bg-stone-50 p-2 rounded-xl mt-1">${act.notes}</p>` : ''}
      </div>
    `;
    timelineContainer.appendChild(item);
  });
}

function openItineraryModal() {
  editingItineraryIndex = null;
  document.getElementById('itin-form-title').value = '';
  document.getElementById('itin-form-time').value = '';
  document.getElementById('itin-form-location').value = '';
  document.getElementById('itin-form-notes').value = '';
  openModal('modal-itinerary');
}

function openEditItineraryModal(idx) {
  const trip = getActiveTrip();
  const act = trip.itinerary[idx];
  if (!act) return;

  editingItineraryIndex = idx;
  document.getElementById('itin-form-title').value = act.title || '';
  document.getElementById('itin-form-time').value = act.time || '';
  document.getElementById('itin-form-location').value = act.location || '';
  document.getElementById('itin-form-notes').value = act.notes || '';
  openModal('modal-itinerary');
}

function saveItineraryForm() {
  const title = document.getElementById('itin-form-title').value.trim();
  const time = document.getElementById('itin-form-time').value.trim();
  const location = document.getElementById('itin-form-location').value.trim();
  const notes = document.getElementById('itin-form-notes').value.trim();
  if (!title) return alert("Enter activity title!");

  const trip = getActiveTrip();
  if (!trip.itinerary) trip.itinerary = [];

  if (editingItineraryIndex !== null && trip.itinerary[editingItineraryIndex]) {
    trip.itinerary[editingItineraryIndex] = {
      day: activeItineraryDay,
      title,
      time,
      location,
      notes
    };
  } else {
    trip.itinerary.push({ day: activeItineraryDay, title, time, location, notes });
  }

  saveAppData();
  closeModal('modal-itinerary');
  renderItinerary();
}

function deleteItineraryActivity(realIdx) {
  const trip = getActiveTrip();
  if (trip.itinerary && trip.itinerary[realIdx]) {
    trip.itinerary.splice(realIdx, 1);
    saveAppData();
    renderItinerary();
  }
}

// --- MASTER LOCATIONS ---
function renderMasterPlacesList() {
  const container = document.getElementById('masterPlacesContainer');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const query = (document.getElementById('masterSearchInput')?.value || '').toLowerCase();
  const filtered = (trip.places || []).filter(p => p.name.toLowerCase().includes(query) || (p.station && p.station.toLowerCase().includes(query)));

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No locations added yet. Click "+ Add Spot" to add one!</p>`;
    return;
  }

  filtered.forEach(place => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs";
    card.innerHTML = `
      <div>
        <h4 style="color: var(--pond-green);" class="font-bold text-sm">${place.name}</h4>
        <p class="text-stone-500">${place.category || 'General'} • Station: <strong class="text-stone-700">${place.station || 'N/A'}</strong></p>
        ${place.walk ? `<p class="text-[11px] text-emerald-700 mt-0.5"><i class="fa-solid fa-person-walking me-1"></i>${place.walk}</p>` : ''}
      </div>
      <a href="${place.map || '#'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px]" style="background-color: var(--pond-bg); color: var(--pond-green);">
        <i class="fa-solid fa-location-dot me-1"></i>Map
      </a>
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
  renderWaddleView();

  document.getElementById('spot-form-name').value = '';
  document.getElementById('spot-form-station').value = '';
}

// --- WADDLE VIEW ---
function renderWaddleView() {
  const container = document.getElementById('waddleSearchResults');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const query = (document.getElementById('waddleSearchInput')?.value || '').toLowerCase();
  const filtered = (trip.places || []).filter(p => p.name.toLowerCase().includes(query) || (p.station && p.station.toLowerCase().includes(query)));

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
        <p class="text-stone-500 text-[11px] mt-0.5"><i class="fa-solid fa-train-subway me-1 text-emerald-700"></i>${p.station || 'Station'} ${p.walk ? '• ' + p.walk : ''}</p>
      </div>
      <a href="${p.map || '#'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-white border border-stone-200" style="color: var(--pond-green);">
        Take me there ➔
      </a>
    `;
    container.appendChild(div);
  });
}

// --- CHECKLISTS & EXPENSES ---
function switchChecklistSubTab(tab) {
  ['prep', 'packing', 'expenses'].forEach(t => {
    const sub = document.getElementById(`checklist-sub-${t}`);
    const btn = document.getElementById(`checktab-${t}`);
    if (sub) sub.classList.add('hidden');
    if (btn) {
      btn.classList.remove('border-emerald-800');
      btn.classList.add('text-stone-400', 'border-transparent');
    }
  });

  const activeSub = document.getElementById(`checklist-sub-${tab}`);
  const activeBtn = document.getElementById(`checktab-${tab}`);
  if (activeSub) activeSub.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.remove('text-stone-400', 'border-transparent');
    activeBtn.classList.add('border-emerald-800');
  }
}

function renderChecklistsAndExpenses() {
  const trip = getActiveTrip();
  if (!trip.checklists) trip.checklists = { prep: [], packing: [] };
  if (!trip.expenses) trip.expenses = [];

  const prepImp = document.getElementById('prep-items-important');
  const prepStd = document.getElementById('prep-items-standard');
  if (prepImp && prepStd) {
    prepImp.innerHTML = "";
    prepStd.innerHTML = "";
    (trip.checklists.prep || []).forEach((item, idx) => {
      const el = createChecklistRow(item, 'prep', idx);
      if (item.mustBring) prepImp.appendChild(el);
      else prepStd.appendChild(el);
    });
  }

  const packImp = document.getElementById('packing-items-important');
  const packStd = document.getElementById('packing-items-standard');
  if (packImp && packStd) {
    packImp.innerHTML = "";
    packStd.innerHTML = "";
    (trip.checklists.packing || []).forEach((item, idx) => {
      const el = createChecklistRow(item, 'packing', idx);
      if (item.mustBring) packImp.appendChild(el);
      else packStd.appendChild(el);
    });
  }

  renderExpensesList();
}

function createChecklistRow(item, type, idx) {
  const div = document.createElement('div');
  div.className = "lily-card p-3 flex justify-between items-center text-xs";
  div.innerHTML = `
    <div class="flex items-center space-x-2.5">
      <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleChecklistItem('${type}', ${idx})" class="w-4 h-4 rounded border-stone-300 text-emerald-800 focus:ring-0">
      <span class="${item.done ? 'line-through text-stone-300' : 'text-stone-700 font-medium'}">${item.text}</span>
    </div>
    <button onclick="deleteChecklistItem('${type}', ${idx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-xmark text-xs"></i></button>
  `;
  return div;
}

function toggleChecklistItem(type, idx) {
  const trip = getActiveTrip();
  if (trip.checklists[type][idx]) {
    trip.checklists[type][idx].done = !trip.checklists[type][idx].done;
    saveAppData();
    renderChecklistsAndExpenses();
  }
}

function deleteChecklistItem(type, idx) {
  const trip = getActiveTrip();
  trip.checklists[type].splice(idx, 1);
  saveAppData();
  renderChecklistsAndExpenses();
}

function openChecklistItemModal(type) {
  document.getElementById('checklist-type-target').value = type;
  openModal('modal-checklist-item');
}

function saveChecklistItemForm() {
  const type = document.getElementById('checklist-type-target').value;
  const text = document.getElementById('checklist-item-text').value.trim();
  const mustBring = document.getElementById('checklist-item-mustbring').checked;

  if (!text) return alert("Please enter description!");

  const trip = getActiveTrip();
  if (!trip.checklists[type]) trip.checklists[type] = [];

  trip.checklists[type].push({ text, mustBring, done: false });
  saveAppData();
  closeModal('modal-checklist-item');
  renderChecklistsAndExpenses();

  document.getElementById('checklist-item-text').value = '';
  document.getElementById('checklist-item-mustbring').checked = false;
}

// --- EXPENSES ---
function renderExpensesList() {
  const container = document.getElementById('expenses-items-list');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  let total = 0;
  (trip.expenses || []).forEach((exp, idx) => {
    total += parseFloat(exp.amount || 0);
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs";
    card.innerHTML = `
      <div>
        <h4 style="color: var(--pond-green);" class="font-bold text-sm">${exp.name}</h4>
        <p class="text-stone-400 text-[11px]">${exp.category}</p>
      </div>
      <div class="flex items-center space-x-3">
        <strong style="color: var(--pond-green);" class="font-bold text-sm">RM ${parseFloat(exp.amount).toFixed(2)}</strong>
        <button onclick="deleteExpense(${idx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-xs"></i></button>
      </div>
    `;
    container.appendChild(card);
  });

  const totalSpentEl = document.getElementById('expenses-total-spent');
  if (totalSpentEl) totalSpentEl.innerText = `RM ${total.toFixed(2)}`;
}

function openExpenseModal() {
  openModal('modal-expense');
}

function saveExpenseForm() {
  const name = document.getElementById('expense-form-name').value.trim();
  const category = document.getElementById('expense-form-category').value;
  const amount = parseFloat(document.getElementById('expense-form-amount').value);

  if (!name || isNaN(amount)) return alert("Please enter description and valid amount!");

  const trip = getActiveTrip();
  if (!trip.expenses) trip.expenses = [];

  trip.expenses.push({ name, category, amount });
  saveAppData();
  closeModal('modal-expense');
  renderChecklistsAndExpenses();

  document.getElementById('expense-form-name').value = '';
  document.getElementById('expense-form-amount').value = '';
}

function deleteExpense(idx) {
  const trip = getActiveTrip();
  trip.expenses.splice(idx, 1);
  saveAppData();
  renderChecklistsAndExpenses();
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

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

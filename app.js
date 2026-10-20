/**
 * LILY POND TRAVEL HUB - APP.JS
 * Fully Synchronized Cloud Backend + Local Checklists & Expenses + All Modals
 */

const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxAiZgIqhw21qxNeePEJC_ic4NVJes8np1f0QucxV88jooXcFoWU5l8dnmy8qpInQ54/exec";

// Master Default Data
const defaultTripData = {
  id: "trip_jakarta_bandung",
  name: "Jakarta & Bandung",
  startDate: "2026-11-21",
  endDate: "2026-11-26",
  category: "Vacation",
  people: "5 Pax",
  budget: "RM 2,000 / pax",
  activeHotel: "Hotel Grand Sahid Jaya",
  hotelStation: "Setiabudi Astra (1 min walk)",
  activeDay: 1,
  places: [
    { id: "p1", name: "Grand Indonesia Mall", category: "Shopping Mall", station: "Bundaran HI", map: "https://maps.google.com" },
    { id: "p2", name: "Monas (National Monument)", category: "Attraction", station: "Gambir", map: "https://maps.google.com" }
  ],
  itinerary: [
    { day: 1, title: "Arrival & Check-in", time: "14:00", location: "Hotel Grand Sahid Jaya", notes: "Unpack and relax after arrival." },
    { day: 1, title: "Dinner at Grand Indonesia", time: "18:30", location: "Grand Indonesia Mall", notes: "Explore food court options." },
    { day: 2, title: "Visit Monas Monument", time: "09:00", location: "Monas", notes: "Bring sun hats and water." }
  ],
  checklists: {
    prep: [
      { text: "Passports & Visas", mustBring: true, done: false },
      { text: "Travel Insurance", mustBring: false, done: false }
    ],
    packing: [
      { text: "Universal Power Adapter", mustBring: true, done: false },
      { text: "Comfortable Walking Shoes", mustBring: false, done: false }
    ]
  },
  expenses: [
    { name: "Return Flight Ticket", category: "Flights", amount: 450.00 },
    { name: "Hotel Deposit", category: "Accommodation", amount: 200.00 }
  ]
};

// Global Application State
let appData = {
  currentTripId: "trip_jakarta_bandung",
  trips: [ JSON.parse(JSON.stringify(defaultTripData)) ]
};

let activeTripId = "trip_jakarta_bandung";
let activeItineraryDay = 1;

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
    } catch(e) {
      console.warn("Could not parse local cache.", e);
    }
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
      cloudData.trips.forEach(cloudTrip => {
        const localTrip = appData.trips.find(t => t.id === cloudTrip.id);
        if (localTrip) {
          if (!cloudTrip.checklists) cloudTrip.checklists = localTrip.checklists;
          if (!cloudTrip.expenses) cloudTrip.expenses = localTrip.expenses;
          if (!cloudTrip.itinerary || cloudTrip.itinerary.length === 0) cloudTrip.itinerary = localTrip.itinerary;
          if (!cloudTrip.places || cloudTrip.places.length === 0) cloudTrip.places = localTrip.places;
        }
      });

      appData.trips = cloudData.trips;
      if (cloudData.currentTripId) activeTripId = cloudData.currentTripId;
      
      saveAppData();
      renderUpcomingTripsList();
      renderAllTripsList();
      renderActiveTripDashboard();
      console.log("Successfully synced with Google Sheet!");
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
    if (!trip.places) trip.places = [...defaultTripData.places];
    if (!trip.itinerary) trip.itinerary = [...defaultTripData.itinerary];
    if (!trip.checklists) trip.checklists = JSON.parse(JSON.stringify(defaultTripData.checklists));
    if (!trip.expenses) trip.expenses = [...defaultTripData.expenses];
  }
  return trip;
}

// --- NAVIGATION & TABS ---
function openHomePage(subTab = 'upcoming') {
  document.getElementById('section-home').classList.remove('hidden');
  document.getElementById('section-trip-dashboard').classList.add('hidden');
  switchHomeTab(subTab);
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

// --- RENDER DASHBOARD & SUMMARY ---
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
  if (hotelStation) hotelStation.innerHTML = `<strong>Nearest Station:</strong> ${trip.hotelStation || 'Setiabudi Astra (1 min walk)'}`;

  renderMasterPlacesList();
  renderItinerary();
  renderChecklistsAndExpenses();
}

// --- ITINERARY MODULE & MODAL ---
function renderItinerary() {
  const trip = getActiveTrip();
  const dayButtonsContainer = document.getElementById('itinerary-day-buttons');
  const timelineContainer = document.getElementById('itinerary-timeline-container');
  if (!dayButtonsContainer || !timelineContainer) return;

  dayButtonsContainer.innerHTML = "";
  timelineContainer.innerHTML = "";

  for (let d = 1; d <= 5; d++) {
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
    timelineContainer.innerHTML = `<p class="text-xs text-stone-400 py-6 text-center">No activities planned for Day ${activeItineraryDay}. Click "+ Add Activity" to create one!</p>`;
    return;
  }

  dayActivities.forEach((act, idx) => {
    const item = document.createElement('div');
    item.className = "relative pl-8 space-y-1";
    item.innerHTML = `
      <div class="absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs" style="background-color: var(--pond-green);"></div>
      <div class="lily-card p-3 text-xs space-y-1">
        <div class="flex justify-between items-center">
          <span class="font-bold text-stone-400 text-[10px]">${act.time || 'TBD'}</span>
          <button onclick="deleteItineraryActivity(${idx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-[10px]"></i></button>
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
  document.getElementById('itin-form-title').value = '';
  document.getElementById('itin-form-time').value = '';
  document.getElementById('itin-form-location').value = '';
  document.getElementById('itin-form-notes').value = '';
  openModal('modal-itinerary');
}

function saveItineraryForm() {
  const title = document.getElementById('itin-form-title').value.trim();
  const time = document.getElementById('itin-form-time').value.trim();
  const location = document.getElementById('itin-form-location').value.trim();
  const notes = document.getElementById('itin-form-notes').value.trim();

  if (!title) return alert("Please enter an activity title!");

  const trip = getActiveTrip();
  if (!trip.itinerary) trip.itinerary = [];

  trip.itinerary.push({
    day: activeItineraryDay,
    title: title,
    time: time || "12:00",
    location: location || "Destination",
    notes: notes || ""
  });

  saveAppData();
  closeModal('modal-itinerary');
  renderItinerary();
}

function deleteItineraryActivity(idx) {
  const trip = getActiveTrip();
  const dayActivities = trip.itinerary.filter(act => act.day === activeItineraryDay);
  const target = dayActivities[idx];
  if (target) {
    const realIdx = trip.itinerary.indexOf(target);
    if (realIdx > -1) {
      trip.itinerary.splice(realIdx, 1);
      saveAppData();
      renderItinerary();
    }
  }
}

// --- HOTEL MODAL ---
function openHotelModal() {
  const trip = getActiveTrip();
  document.getElementById('hotel-form-name').value = trip.activeHotel || '';
  document.getElementById('hotel-form-station').value = trip.hotelStation || '';
  openModal('modal-hotel');
}

function saveHotelForm() {
  const name = document.getElementById('hotel-form-name').value.trim();
  const station = document.getElementById('hotel-form-station').value.trim();

  const trip = getActiveTrip();
  if (name) trip.activeHotel = name;
  if (station) trip.hotelStation = station;

  saveAppData();
  closeModal('modal-hotel');
  renderActiveTripDashboard();
}

// --- MASTER PLACES & WADDLE ---
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
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No locations found. Click "+ Add Spot" to add one!</p>`;
    return;
  }

  filtered.forEach(place => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs";
    card.innerHTML = `
      <div>
        <h4 style="color: var(--pond-green);" class="font-bold text-sm">${place.name}</h4>
        <p class="text-stone-500">${place.category || 'General'} • Station: ${place.station || 'N/A'}</p>
      </div>
      <a href="${place.map || 'https://maps.google.com'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px]" style="background-color: var(--pond-bg); color: var(--pond-green);">
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

  document.getElementById('spot-form-name').value = '';
  document.getElementById('spot-form-station').value = '';
}

function renderWaddleView() {
  const container = document.getElementById('waddleSearchResults');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  (trip.places || []).forEach(p => {
    const div = document.createElement('div');
    div.className = "lily-card p-3 text-xs flex justify-between items-center";
    div.innerHTML = `
      <div>
        <strong style="color: var(--pond-green);">${p.name}</strong>
        <p class="text-stone-400 text-[11px]">${p.category} • ${p.station || 'Near Station'}</p>
      </div>
      <span class="text-[10px] px-2 py-1 rounded-lg bg-stone-100 text-stone-600">Walk 3m</span>
    `;
    container.appendChild(div);
  });
}

// --- CHECKLISTS & EXPENSES ---
function renderChecklistsAndExpenses() {
  const trip = getActiveTrip();
  if (!trip.checklists) trip.checklists = { prep: [], packing: [] };
  if (!trip.expenses) trip.expenses = [];

  const prepImp = document.getElementById('prep-items-important');
  const prepStd = document.getElementById('prep-items-standard');
  if (prepImp && prepStd) {
    prepImp.innerHTML = "";
    prepStd.innerHTML = "";
    trip.checklists.prep.forEach((item, idx) => {
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
    trip.checklists.packing.forEach((item, idx) => {
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
  trip.expenses.forEach((exp, idx) => {
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

  const ring = document.getElementById('expense-donut-ring');
  if (ring) {
    const pct = Math.min((total / 2000) * 100, 100);
    ring.setAttribute('stroke-dasharray', `${pct}, 100`);
  }
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

// --- HOMEPAGE LIST RENDERING ---
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

// --- MODAL UTILITIES ---
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

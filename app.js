/* ==========================================================================
   APP STATE & INITIAL DATA
   ========================================================================== */
const defaultData = {
  "jakarta_bandung_2026": {
    id: "jakarta_bandung_2026",
    title: "🇮🇩 Jakarta & Bandung Trip",
    dates: "Nov 21 – 26, 2026",
    category: "Vacation",
    people: "2 Pax",
    budget: "RM 2,000 / pax",
    budgetValue: 2000,
    activeHotel: "Hotel Grand Sahid Jaya",
    nearestStation: "Setiabudi Astra (1 min walk)",
    itinerary: {
      1: {
        tag: "Central / West Jakarta",
        title: "Arrival & Exploration",
        items: [
          { time: "08:00 AM", title: "Arrival at CGK Airport", location: "Soekarno-Hatta CGK", notes: "Grab transport to Hotel Grand Sahid Jaya", done: false, starred: true },
          { time: "01:00 PM", title: "Grand Indonesia Lunch", location: "Grand Indonesia", notes: "Try local delicacies", done: false, starred: false }
        ]
      }
    },
    places: [
      { id: "p1", name: "Grand Indonesia", category: "Shopping Mall", station: "Bundaran HI Bank Jakarta", walkStation: "7 mins", map: "https://maps.google.com/?q=Grand+Indonesia", photo: "", starred: true, review: "Great mall." }
    ],
    prepChecklist: [
      { text: "Check Passport Validity", done: true, mustBring: true },
      { text: "Buy eSIM / Roaming Data", done: false, mustBring: false }
    ],
    packingList: [
      { text: "Universal Power Adapter", done: true, mustBring: true },
      { text: "Comfortable Walking Shoes", done: false, mustBring: false }
    ],
    expenses: [
      { name: "Flight Ticket", category: "Flights", amount: 344.48 },
      { name: "Hotel Deposit", category: "Accommodation", amount: 250.00 }
    ]
  }
};

let appData = JSON.parse(localStorage.getItem('my_multi_trip_app')) || defaultData;
let activeTripId = localStorage.getItem('my_active_trip_id') || "jakarta_bandung_2026";
let activeItineraryDay = 1;
let currentHomeTab = 'upcoming';

function saveAppData() {
  localStorage.setItem('my_multi_trip_app', JSON.stringify(appData));
  localStorage.setItem('my_active_trip_id', activeTripId);
}

function getActiveTrip() {
  if (!appData[activeTripId]) activeTripId = Object.keys(appData)[0];
  return appData[activeTripId];
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.add('hidden');
}

/* ==========================================================================
   HOMEPAGE NAVIGATION & RENDER ENGINE
   ========================================================================== */
function openHomePage(tab = 'upcoming') {
  document.getElementById('section-home').classList.remove('hidden');
  document.getElementById('section-trip-dashboard').classList.add('hidden');
  document.getElementById('global-header-title').innerHTML = '<span>Lily Pond Hub</span> <span class="text-xs">🪷</span>';
  document.getElementById('global-header-sub').innerText = "Cozy Travel Planner";
  switchHomeTab(tab);
}

function switchHomeTab(tab) {
  currentHomeTab = tab;
  const btnUpcoming = document.getElementById('home-tab-upcoming');
  const btnAll = document.getElementById('home-tab-all');
  const viewUpcoming = document.getElementById('home-view-upcoming');
  const viewAll = document.getElementById('home-view-all');

  if (tab === 'upcoming') {
    viewUpcoming.classList.remove('hidden');
    viewAll.classList.add('hidden');
    btnUpcoming.classList.add('text-stone-800');
    btnUpcoming.classList.remove('text-stone-400');
    btnAll.classList.add('text-stone-400');
    btnAll.classList.remove('text-stone-800');
    renderUpcomingTripsList();
  } else {
    viewUpcoming.classList.add('hidden');
    viewAll.classList.remove('hidden');
    btnAll.classList.add('text-stone-800');
    btnAll.classList.remove('text-stone-400');
    btnUpcoming.classList.add('text-stone-400');
    btnUpcoming.classList.remove('text-stone-800');
    renderAllTripsList();
  }
}

function renderUpcomingTripsList() {
  const container = document.getElementById('upcoming-trips-list');
  container.innerHTML = '';
  const trips = Object.values(appData);
  
  if (trips.length === 0) {
    container.innerHTML = '<p class="text-xs text-stone-400 text-center py-6">No upcoming trips scheduled.</p>';
    return;
  }

  trips.forEach(trip => {
    container.appendChild(createTripCard(trip));
  });
}

function renderAllTripsList() {
  const container = document.getElementById('all-trips-list');
  const searchVal = document.getElementById('tripSearchInput').value.toLowerCase().trim();
  const catVal = document.getElementById('tripCategoryFilter').value;
  container.innerHTML = '';

  const filteredTrips = Object.values(appData).filter(trip => {
    const matchSearch = trip.title.toLowerCase().includes(searchVal) || trip.dates.toLowerCase().includes(searchVal);
    const matchCat = (catVal === 'ALL') || (trip.category === catVal);
    return matchSearch && matchCat;
  });

  if (filteredTrips.length === 0) {
    container.innerHTML = '<p class="text-xs text-stone-400 text-center py-6">No matching trips found.</p>';
    return;
  }

  filteredTrips.forEach(trip => {
    container.appendChild(createTripCard(trip));
  });
}

function createTripCard(trip) {
  const card = document.createElement('div');
  card.className = "lily-card p-5 space-y-4";
  card.innerHTML = `
    <div class="flex flex-wrap justify-between items-start gap-2">
      <div class="pr-2 max-w-[200px] sm:max-w-xs">
        <div class="flex items-center gap-2">
          <h3 style="color: var(--pond-green);" class="font-bold text-base leading-snug break-words">${trip.title}</h3>
          <span style="background-color: var(--sage-green); color: #FFFFFF;" class="text-[9px] font-bold px-2 py-0.5 rounded-full">${trip.category || 'Vacation'}</span>
        </div>
        <p class="text-xs text-stone-400 mt-1 flex items-center gap-1">
          <i class="fa-solid fa-calendar text-[10px]"></i>
          <span>${trip.dates} • ${trip.people}</span>
        </p>
      </div>
      <span style="background-color: var(--lily-pink); color: var(--sketch-dark);" class="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-xs">
        ${trip.budget}
      </span>
    </div>

    <div class="flex items-center space-x-2 pt-3 border-t border-stone-200/60">
      <button onclick="openTripDashboard('${trip.id}')" style="background-color: var(--pond-green);" class="text-white font-semibold py-2.5 px-4 rounded-2xl flex-1 text-center text-xs shadow-xs hover:opacity-95 transition">
        Open Dashboard ➔
      </button>
      <button onclick="openTripModal('${trip.id}')" class="bg-stone-100 text-stone-600 p-2.5 rounded-2xl hover:bg-stone-200 transition">
        <i class="fa-solid fa-pen text-xs"></i>
      </button>
      <button onclick="deleteTrip('${trip.id}')" style="background-color: var(--lily-pink); color: var(--sketch-dark);" class="p-2.5 rounded-2xl hover:opacity-90 transition font-bold">
        <i class="fa-solid fa-trash text-xs"></i>
      </button>
    </div>
  `;
  return card;
}

/* ==========================================================================
   TRIP MODAL (CREATE / EDIT SYNC)
   ========================================================================== */
function openTripModal(tripId = null) {
  document.getElementById('trip-form-id').value = tripId || '';
  document.getElementById('modal-trip-title').innerText = tripId ? 'Edit Trip' : 'Add New Trip';
  
  if (tripId && appData[tripId]) {
    const t = appData[tripId];
    document.getElementById('trip-form-title').value = t.title;
    document.getElementById('trip-form-dates').value = t.dates;
    document.getElementById('trip-form-category').value = t.category || 'Vacation';
    document.getElementById('trip-form-people').value = t.people;
    document.getElementById('trip-form-budget').value = t.budget;
    document.getElementById('trip-form-hotel').value = t.activeHotel;
  } else {
    document.getElementById('trip-form-title').value = '';
    document.getElementById('trip-form-dates').value = '';
    document.getElementById('trip-form-category').value = 'Vacation';
    document.getElementById('trip-form-people').value = '2 Pax';
    document.getElementById('trip-form-budget').value = 'RM 2,000 / pax';
    document.getElementById('trip-form-hotel').value = 'Central Hotel';
  }
  document.getElementById('modal-trip').classList.remove('hidden');
}

function saveTripForm() {
  const id = document.getElementById('trip-form-id').value;
  const title = document.getElementById('trip-form-title').value.trim();
  if (!title) return alert("Please enter trip title!");
  
  const dates = document.getElementById('trip-form-dates').value.trim() || 'Upcoming';
  const category = document.getElementById('trip-form-category').value;
  const people = document.getElementById('trip-form-people').value.trim() || '1 Pax';
  const budget = document.getElementById('trip-form-budget').value.trim() || 'RM 2,000 / pax';
  const hotel = document.getElementById('trip-form-hotel').value.trim() || 'Central Hotel';

  if (id && appData[id]) {
    appData[id].title = title;
    appData[id].dates = dates;
    appData[id].category = category;
    appData[id].people = people;
    appData[id].budget = budget;
    appData[id].activeHotel = hotel;
  } else {
    const newId = "trip_" + Date.now();
    appData[newId] = {
      id: newId, title, dates, category, people, budget, budgetValue: 2000,
      activeHotel: hotel, nearestStation: "Main Station",
      itinerary: { 1: { tag: "Day 1", title: "Arrival", items: [{ time: "12:00 PM", title: "Check-in", location: hotel, notes: "Relax", done: false, starred: true }] } },
      places: [], prepChecklist: [], packingList: [], expenses: []
    };
  }
  
  saveAppData();
  closeModal('modal-trip');
  
  if (!document.getElementById('section-home').classList.contains('hidden')) {
    switchHomeTab(currentHomeTab);
  } else {
    openTripDashboard(activeTripId);
  }
}

function deleteTrip(tripId) {
  if (Object.keys(appData).length <= 1) return alert("Keep at least one trip!");
  if (confirm("Delete this trip?")) {
    delete appData[tripId];
    saveAppData();
    switchHomeTab(currentHomeTab);
  }
}

/* ==========================================================================
   TRIP DASHBOARD & PAGE SWITCHING
   ========================================================================== */
function openTripDashboard(tripId) {
  activeTripId = tripId;
  saveAppData();
  const trip = getActiveTrip();
  
  document.getElementById('section-home').classList.add('hidden');
  document.getElementById('section-trip-dashboard').classList.remove('hidden');
  document.getElementById('global-header-title').innerText = trip.title;
  document.getElementById('global-header-sub').innerText = trip.dates;
  
  switchDashboardPage('summary');
}

function switchDashboardPage(pageName) {
  ['summary', 'itinerary', 'waddle', 'master', 'checklists'].forEach(p => {
    document.getElementById(`page-${p}`).classList.add('hidden');
    const navBtn = document.getElementById(`nav-${p}`);
    if (navBtn) {
      navBtn.classList.remove('text-stone-800');
      navBtn.classList.add('text-stone-400');
      const iconContainer = navBtn.querySelector('div');
      if (iconContainer) iconContainer.classList.remove('nav-tab-active');
    }
  });

  document.getElementById(`page-${pageName}`).classList.remove('hidden');
  const activeNav = document.getElementById(`nav-${pageName}`);
  if (activeNav) {
    activeNav.classList.remove('text-stone-400');
    activeNav.classList.add('text-stone-800');
    const activeIconContainer = activeNav.querySelector('div');
    if (activeIconContainer) activeIconContainer.classList.add('nav-tab-active');
  }

  if (pageName === 'summary') renderSummaryPage();
  if (pageName === 'itinerary') renderItineraryPage();
  if (pageName === 'waddle') renderWaddlePage();
  if (pageName === 'master') renderMasterPlacesList();
  if (pageName === 'checklists') switchChecklistSubTab('prep');
}

/* ==========================================================================
   PAGE 1: SUMMARY ENGINE (SYNCED OVERVIEW)
   ========================================================================== */
function renderSummaryPage() {
  const trip = getActiveTrip();
  document.getElementById('sum-card-title').innerText = trip.title;
  document.getElementById('sum-card-dates').innerText = trip.dates;
  document.getElementById('sum-card-category').innerText = trip.category || 'Vacation';
  document.getElementById('sum-card-people').innerText = trip.people;
  document.getElementById('sum-card-budget').innerText = trip.budget;

  // Starred Tentative Highlights (Matches Itinerary Card Layout)
  const snap = document.getElementById('summary-tentative-snapshot');
  snap.innerHTML = '';
  let starredCount = 0;

  Object.values(trip.itinerary).forEach(day => {
    day.items.forEach(item => {
      if (item.starred) {
        starredCount++;
        snap.innerHTML += `
          <div class="lily-card p-3 flex justify-between items-start text-xs">
            <div class="space-y-1">
              <span style="background-color: var(--sage-green); color: #FFFFFF;" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full">${item.time}</span>
              <h4 class="font-bold text-stone-800 text-xs mt-1">${item.title}</h4>
              <p style="color: var(--pond-green);" class="text-[11px]"><i class="fa-solid fa-location-dot me-1"></i>${item.location}</p>
            </div>
            <i class="fa-solid fa-star text-amber-500 text-sm"></i>
          </div>`;
      }
    });
  });

  if (starredCount === 0) {
    snap.innerHTML = `<p class="text-xs text-stone-400 py-2">No starred itinerary items yet. Star items in your Itinerary to highlight them here!</p>`;
  }

  // Starred Locations
  const starContainer = document.getElementById('summary-starred-spots');
  starContainer.innerHTML = '';
  const starredSpots = trip.places.filter(p => p.starred);
  if (starredSpots.length > 0) {
    starredSpots.forEach(s => {
      starContainer.innerHTML += `
        <div class="bg-stone-50 p-2.5 rounded-2xl border border-stone-200/60 flex items-center justify-between">
          <span class="font-bold text-stone-800 truncate">${s.name}</span>
          <i class="fa-solid fa-star text-amber-500 text-xs flex-shrink-0 ms-1"></i>
        </div>`;
    });
  } else {
    starContainer.innerHTML = `<p class="text-stone-400 text-xs col-span-2">No starred locations yet.</p>`;
  }
}

/* ==========================================================================
   PAGE 2: ITINERARY ENGINE
   ========================================================================== */
function renderItineraryPage() {
  const trip = getActiveTrip();
  const btnContainer = document.getElementById('itinerary-day-buttons');
  btnContainer.innerHTML = '';
  
  Object.keys(trip.itinerary).forEach(d => {
    const btn = document.createElement('button');
    btn.className = (parseInt(d) === activeItineraryDay) 
      ? "px-4 py-2 rounded-2xl text-white font-semibold text-xs whitespace-nowrap shadow-xs" 
      : "px-4 py-2 rounded-2xl bg-white text-stone-600 border border-stone-200 font-medium text-xs whitespace-nowrap";
    if (parseInt(d) === activeItineraryDay) btn.style.backgroundColor = 'var(--pond-green)';
    btn.innerText = `Day ${d}`;
    btn.onclick = () => { activeItineraryDay = parseInt(d); renderItineraryPage(); };
    btnContainer.appendChild(btn);
  });

  const timelineContainer = document.getElementById('itinerary-timeline-container');
  timelineContainer.innerHTML = '';
  const dayData = trip.itinerary[activeItineraryDay] || { items: [] };

  if (dayData.items.length === 0) {
    timelineContainer.innerHTML = '<p class="text-xs text-stone-400 text-center py-4">No activities planned for this day.</p>';
    return;
  }

  dayData.items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = "relative pl-7 group";
    card.innerHTML = `
      <div style="background-color: var(--sage-green);" class="absolute left-1.5 top-2 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs"></div>
      <div class="lily-card p-3.5 flex justify-between items-start gap-2">
        <div class="space-y-1">
          <span style="background-color: var(--sage-green); color: #FFFFFF;" class="text-[10px] font-bold px-2.5 py-0.5 rounded-full">${item.time}</span>
          <h4 class="font-bold text-sm ${item.done ? 'line-through text-stone-400' : 'text-stone-800'} mt-1">${item.title}</h4>
          <p style="color: var(--pond-green);" class="text-xs"><i class="fa-solid fa-location-dot me-1"></i>${item.location}</p>
          <p class="text-xs text-stone-400">${item.notes}</p>
        </div>
        <div class="flex items-center space-x-1 flex-shrink-0">
          <button onclick="toggleItineraryStar(${idx})" class="p-1 text-xs">
            <i class="fa-solid fa-star ${item.starred ? 'text-amber-500' : 'text-stone-300'}"></i>
          </button>
          <button onclick="openItineraryModal(${idx})" class="text-stone-400 hover:text-stone-600 p-1 text-xs"><i class="fa-solid fa-pen"></i></button>
          <button onclick="deleteItineraryItem(${idx})" style="color: var(--lily-pink);" class="p-1 text-xs"><i class="fa-solid fa-trash"></i></button>
          <button onclick="toggleItineraryDone(${idx})" class="p-1">
            <i class="fa-solid ${item.done ? 'fa-circle-check text-emerald-700' : 'fa-circle text-stone-200'} text-lg"></i>
          </button>
        </div>
      </div>`;
    timelineContainer.appendChild(card);
  });
}

function toggleItineraryStar(idx) {
  const trip = getActiveTrip();
  const item = trip.itinerary[activeItineraryDay].items[idx];
  item.starred = !item.starred;
  saveAppData();
  renderItineraryPage();
}

function openItineraryModal(idx = -1) {
  document.getElementById('itin-form-idx').value = idx;
  const trip = getActiveTrip();
  if (idx >= 0 && trip.itinerary[activeItineraryDay].items[idx]) {
    const item = trip.itinerary[activeItineraryDay].items[idx];
    document.getElementById('itin-form-title').value = item.title;
    document.getElementById('itin-form-time').value = item.time;
    document.getElementById('itin-form-location').value = item.location;
    document.getElementById('itin-form-notes').value = item.notes;
  } else {
    document.getElementById('itin-form-title').value = '';
    document.getElementById('itin-form-time').value = '02:00 PM';
    document.getElementById('itin-form-location').value = 'City Center';
    document.getElementById('itin-form-notes').value = '';
  }
  document.getElementById('modal-itinerary').classList.remove('hidden');
}

function saveItineraryForm() {
  const idx = parseInt(document.getElementById('itin-form-idx').value);
  const title = document.getElementById('itin-form-title').value.trim();
  if (!title) return alert("Please enter activity title!");
  
  const time = document.getElementById('itin-form-time').value.trim() || '12:00 PM';
  const location = document.getElementById('itin-form-location').value.trim() || '';
  const notes = document.getElementById('itin-form-notes').value.trim() || '';

  const trip = getActiveTrip();
  if (!trip.itinerary[activeItineraryDay]) trip.itinerary[activeItineraryDay] = { tag: `Day ${activeItineraryDay}`, title: "Schedule", items: [] };

  if (idx >= 0) {
    const existing = trip.itinerary[activeItineraryDay].items[idx];
    trip.itinerary[activeItineraryDay].items[idx] = { time, title, location, notes, done: existing.done, starred: existing.starred };
  } else {
    trip.itinerary[activeItineraryDay].items.push({ time, title, location, notes, done: false, starred: false });
  }
  
  saveAppData();
  closeModal('modal-itinerary');
  renderItineraryPage();
}

function deleteItineraryItem(idx) {
  const trip = getActiveTrip();
  if (confirm("Delete activity?")) {
    trip.itinerary[activeItineraryDay].items.splice(idx, 1);
    saveAppData();
    renderItineraryPage();
  }
}

function toggleItineraryDone(idx) {
  const trip = getActiveTrip();
  trip.itinerary[activeItineraryDay].items[idx].done = !trip.itinerary[activeItineraryDay].items[idx].done;
  saveAppData();
  renderItineraryPage();
}

/* ==========================================================================
   PAGE 3: WADDLE & SEARCH ENGINE
   ========================================================================== */
function renderWaddlePage() {
  const trip = getActiveTrip();
  document.getElementById('waddle-hotel-title').innerText = trip.activeHotel;
  document.getElementById('waddle-hotel-station').innerHTML = `<strong>Nearest Station:</strong> ${trip.nearestStation}`;
  
  const quickHubsContainer = document.getElementById('waddle-quick-hubs');
  quickHubsContainer.innerHTML = '';
  const stations = [...new Set(trip.places.map(p => p.station))];
  
  stations.forEach(st => {
    const btn = document.createElement('button');
    btn.className = "text-xs bg-white border border-stone-200 text-stone-700 px-3.5 py-1.5 rounded-full font-medium shadow-xs";
    btn.innerText = `📍 ${st}`;
    btn.onclick = () => { document.getElementById('waddleSearchInput').value = st; executeWaddleSearch(); };
    quickHubsContainer.appendChild(btn);
  });
}

function openHotelModal() {
  const trip = getActiveTrip();
  document.getElementById('hotel-form-name').value = trip.activeHotel;
  document.getElementById('hotel-form-station').value = trip.nearestStation;
  document.getElementById('modal-hotel').classList.remove('hidden');
}

function saveHotelForm() {
  const trip = getActiveTrip();
  trip.activeHotel = document.getElementById('hotel-form-name').value.trim() || trip.activeHotel;
  trip.nearestStation = document.getElementById('hotel-form-station').value.trim() || trip.nearestStation;
  saveAppData();
  closeModal('modal-hotel');
  renderWaddlePage();
}

function executeWaddleSearch() {
  const trip = getActiveTrip();
  const query = document.getElementById('waddleSearchInput').value.toLowerCase().trim();
  const container = document.getElementById('waddleSearchResults');
  
  if (!query) { container.innerHTML = `<p class="text-xs text-stone-400 text-center py-4">Type a place or station above!</p>`; return; }
  
  const matches = trip.places.filter(p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query) || p.station.toLowerCase().includes(query));
  if (matches.length === 0) { container.innerHTML = `<p class="text-xs text-stone-400 text-center py-4">No places found matching your search.</p>`; return; }
  
  container.innerHTML = '';
  matches.forEach(spot => {
    container.innerHTML += `
      <div class="lily-card p-4 space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center space-x-2"><h4 style="color: var(--pond-green);" class="font-bold text-sm">${spot.name}</h4><span style="background-color: var(--sage-green); color: white;" class="text-[10px] px-2 py-0.5 rounded-full font-semibold">${spot.category}</span></div>
            <p class="text-xs text-stone-400 mt-1"><i class="fa-solid fa-train me-1" style="color: var(--sage-green);"></i>${spot.station} (${spot.walkStation})</p>
          </div>
          <a href="${spot.map}" target="_blank" style="background-color: var(--pond-green);" class="text-white font-semibold text-xs px-3 py-1.5 rounded-xl">Map</a>
        </div>
        ${spot.review ? `<p class="text-xs bg-stone-50 p-2.5 rounded-2xl text-stone-600 italic border border-stone-100">"${spot.review}"</p>` : ''}
        <div class="flex justify-end pt-1"><button onclick="openReviewModal('${spot.id}')" style="color: var(--pond-green);" class="text-[11px] font-semibold hover:underline"><i class="fa-solid fa-comment-dots me-1"></i>Edit Review / Note</button></div>
      </div>`;
  });
}

function openReviewModal(spotId) {
  const trip = getActiveTrip();
  const spot = trip.places.find(p => p.id === spotId);
  if (!spot) return;
  document.getElementById('review-spot-id').value = spotId;
  document.getElementById('modal-review-title').innerText = `Review: ${spot.name}`;
  document.getElementById('review-form-text').value = spot.review || '';
  document.getElementById('modal-review').classList.remove('hidden');
}

function saveReviewForm() {
  const spotId = document.getElementById('review-spot-id').value;
  const reviewText = document.getElementById('review-form-text').value.trim();
  const trip = getActiveTrip();
  const spot = trip.places.find(p => p.id === spotId);
  if (spot) { spot.review = reviewText; saveAppData(); }
  closeModal('modal-review');
  executeWaddleSearch();
}

/* ==========================================================================
   PAGE 4: LOCATION DATABASE MODULE
   ========================================================================== */
function renderMasterPlacesList() {
  const trip = getActiveTrip();
  const filterText = document.getElementById('masterSearchInput').value.toLowerCase();
  const catText = document.getElementById('masterCategoryFilter').value;
  const container = document.getElementById('masterPlacesContainer');
  
  const filtered = trip.places.filter(p => {
    const matchText = p.name.toLowerCase().includes(filterText) || p.station.toLowerCase().includes(filterText);
    const matchCat = (catText === 'ALL') || (p.category === catText);
    return matchText && matchCat;
  });

  container.innerHTML = '';
  if (filtered.length === 0) {
    container.innerHTML = '<p class="text-xs text-stone-400 text-center py-6">No location spots added yet.</p>';
    return;
  }

  filtered.forEach(spot => {
    let photoHtml = spot.photo ? `<img src="${spot.photo}" class="w-full h-36 object-cover rounded-2xl border border-stone-100 mt-2" alt="${spot.name}" />` : '';
    container.innerHTML += `
      <div class="lily-card p-3.5 space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center space-x-1.5">
              <button onclick="toggleStarSpot('${spot.id}')" class="text-base"><i class="fa-solid fa-star ${spot.starred ? 'text-amber-500' : 'text-stone-300'}"></i></button>
              <h4 style="color: var(--pond-green);" class="font-bold text-xs">${spot.name}</h4>
              <span class="text-[9px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-medium">${spot.category}</span>
            </div>
            <p class="text-[11px] text-stone-400 mt-0.5">🚉 ${spot.station} (${spot.walkStation})</p>
          </div>
          <div class="flex items-center space-x-1">
            <button onclick="openMasterSpotModal('${spot.id}')" class="text-stone-400 hover:text-stone-600 p-1 text-xs"><i class="fa-solid fa-pen"></i></button>
            <button onclick="deleteMasterSpot('${spot.id}')" style="color: var(--lily-pink);" class="p-1 text-xs"><i class="fa-solid fa-trash"></i></button>
            <a href="${spot.map}" target="_blank" style="background-color: var(--pond-bg); color: var(--pond-green);" class="px-2.5 py-1 rounded-xl text-xs font-semibold border border-stone-200">Map</a>
          </div>
        </div>
        ${photoHtml}
      </div>`;
  });
}

function toggleStarSpot(spotId) {
  const trip = getActiveTrip();
  const spot = trip.places.find(p => p.id === spotId);
  if (spot) { spot.starred = !spot.starred; saveAppData(); renderMasterPlacesList(); }
}

function openMasterSpotModal(spotId = null) {
  document.getElementById('spot-form-id').value = spotId || '';
  document.getElementById('modal-spot-title').innerText = spotId ? 'Edit Location Spot' : 'Add Location Spot';
  document.getElementById('spot-form-file').value = '';
  
  if (spotId) {
    const trip = getActiveTrip();
    const spot = trip.places.find(p => p.id === spotId);
    if (spot) {
      document.getElementById('spot-form-name').value = spot.name;
      document.getElementById('spot-form-category').value = spot.category;
      document.getElementById('spot-form-station').value = spot.station;
      document.getElementById('spot-form-walk').value = spot.walkStation;
    }
  } else {
    document.getElementById('spot-form-name').value = '';
    document.getElementById('spot-form-category').value = 'Food';
    document.getElementById('spot-form-station').value = 'City Center';
    document.getElementById('spot-form-walk').value = '5 mins';
  }
  document.getElementById('modal-master-spot').classList.remove('hidden');
}

function saveMasterSpotForm() {
  const spotId = document.getElementById('spot-form-id').value;
  const name = document.getElementById('spot-form-name').value.trim();
  if (!name) return alert("Please enter spot name!");
  
  const category = document.getElementById('spot-form-category').value;
  const station = document.getElementById('spot-form-station').value.trim() || 'Center Station';
  const walkStation = document.getElementById('spot-form-walk').value.trim() || '5 mins';
  const fileInput = document.getElementById('spot-form-file');

  const trip = getActiveTrip();
  const finishSave = (photoBase64 = '') => {
    if (spotId) {
      const spot = trip.places.find(p => p.id === spotId);
      if (spot) {
        spot.name = name;
        spot.category = category;
        spot.station = station;
        spot.walkStation = walkStation;
        if (photoBase64) spot.photo = photoBase64;
      }
    } else {
      trip.places.push({
        id: "p_" + Date.now(),
        name, category, station, walkStation,
        map: `https://maps.google.com/?q=${encodeURIComponent(name)}`,
        photo: photoBase64, starred: false, review: ""
      });
    }
    saveAppData();
    closeModal('modal-master-spot');
    renderMasterPlacesList();
  };

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) { finishSave(e.target.result); };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    let existingPhoto = '';
    if (spotId) {
      const spot = trip.places.find(p => p.id === spotId);
      if (spot) existingPhoto = spot.photo;
    }
    finishSave(existingPhoto);
  }
}

function deleteMasterSpot(spotId) {
  const trip = getActiveTrip();
  if (confirm("Delete spot?")) {
    trip.places = trip.places.filter(p => p.id !== spotId);
    saveAppData();
    renderMasterPlacesList();
  }
}

/* ==========================================================================
   PAGE 5: CHECKLISTS & EXPENSES ENGINE
   ========================================================================== */
function switchChecklistSubTab(subName) {
  ['prep', 'packing', 'expenses'].forEach(s => {
    document.getElementById(`checklist-sub-${s}`).classList.add('hidden');
    const btn = document.getElementById(`checktab-${s}`);
    btn.classList.remove('border-emerald-800');
    btn.style.color = '#A8A29E';
    btn.classList.add('border-transparent');
  });
  
  document.getElementById(`checklist-sub-${subName}`).classList.remove('hidden');
  const activeBtn = document.getElementById(`checktab-${subName}`);
  activeBtn.classList.add('border-emerald-800');
  activeBtn.style.color = 'var(--pond-green)';
  activeBtn.classList.remove('border-transparent');

  if (subName === 'prep') renderPrepList();
  if (subName === 'packing') renderPackingList();
  if (subName === 'expenses') renderExpensesList();
}

function openChecklistItemModal(type, idx = -1) {
  document.getElementById('checklist-type-target').value = type;
  const idxInput = document.getElementById('checklist-item-idx');
  if (idxInput) idxInput.value = idx;
  
  const trip = getActiveTrip();
  const list = type === 'prep' ? trip.prepChecklist : trip.packingList;
  
  if (idx >= 0 && list[idx]) {
    document.getElementById('modal-checklist-title').innerText = type === 'prep' ? 'Edit Prep Task' : 'Edit Packing Item';
    document.getElementById('checklist-item-text').value = list[idx].text;
    document.getElementById('checklist-item-mustbring').checked = list[idx].mustBring;
  } else {
    document.getElementById('modal-checklist-title').innerText = type === 'prep' ? 'Add Prep Task' : 'Add Packing Item';
    document.getElementById('checklist-item-text').value = '';
    document.getElementById('checklist-item-mustbring').checked = false;
  }
  
  document.getElementById('modal-checklist-item').classList.remove('hidden');
}

function saveChecklistItemForm() {
  const type = document.getElementById('checklist-type-target').value;
  const idxInput = document.getElementById('checklist-item-idx');
  const idx = idxInput ? parseInt(idxInput.value) : -1;
  const text = document.getElementById('checklist-item-text').value.trim();
  if (!text) return alert("Please enter description!");
  
  const mustBring = document.getElementById('checklist-item-mustbring').checked;
  const trip = getActiveTrip();
  const list = type === 'prep' ? trip.prepChecklist : trip.packingList;

  if (idx >= 0 && list[idx]) {
    list[idx].text = text;
    list[idx].mustBring = mustBring;
  } else {
    list.push({ text, done: false, mustBring });
  }
  
  saveAppData();
  closeModal('modal-checklist-item');
  if (type === 'prep') renderPrepList();
  else renderPackingList();
}

/* Categorized Prep List with Edit Controls */
function renderPrepList() {
  const trip = getActiveTrip();
  const importantContainer = document.getElementById('prep-items-important');
  const standardContainer = document.getElementById('prep-items-standard');
  importantContainer.innerHTML = '';
  standardContainer.innerHTML = '';

  const importantItems = trip.prepChecklist.filter(i => i.mustBring);
  const standardItems = trip.prepChecklist.filter(i => !i.mustBring);

  if (importantItems.length === 0) importantContainer.innerHTML = '<p class="text-[11px] text-stone-400 italic">No important prep tasks marked.</p>';
  if (standardItems.length === 0) standardContainer.innerHTML = '<p class="text-[11px] text-stone-400 italic">No standard prep tasks.</p>';

  trip.prepChecklist.forEach((item, idx) => {
    const html = `
      <div class="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200/60 text-xs">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" ${item.done ? 'checked' : ''} onchange="togglePrepItem(${idx})" class="w-4 h-4 text-emerald-800 rounded">
          <span class="${item.done ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}">${item.text}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="openChecklistItemModal('prep', ${idx})" class="text-stone-400 hover:text-stone-600 p-1 text-xs"><i class="fa-solid fa-pen"></i></button>
          <button onclick="toggleMustBringPrep(${idx})" class="text-sm"><i class="fa-solid fa-triangle-exclamation ${item.mustBring ? 'text-amber-500' : 'text-stone-300'}"></i></button>
          <button onclick="deletePrepItem(${idx})" style="color: var(--lily-pink);" class="p-1"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    if (item.mustBring) importantContainer.innerHTML += html;
    else standardContainer.innerHTML += html;
  });
}

function togglePrepItem(idx) { const trip = getActiveTrip(); trip.prepChecklist[idx].done = !trip.prepChecklist[idx].done; saveAppData(); renderPrepList(); }
function toggleMustBringPrep(idx) { const trip = getActiveTrip(); trip.prepChecklist[idx].mustBring = !trip.prepChecklist[idx].mustBring; saveAppData(); renderPrepList(); }
function deletePrepItem(idx) { const trip = getActiveTrip(); trip.prepChecklist.splice(idx, 1); saveAppData(); renderPrepList(); }

/* Categorized Packing List with Edit Controls */
function renderPackingList() {
  const trip = getActiveTrip();
  const importantContainer = document.getElementById('packing-items-important');
  const standardContainer = document.getElementById('packing-items-standard');
  importantContainer.innerHTML = '';
  standardContainer.innerHTML = '';

  const importantItems = trip.packingList.filter(i => i.mustBring);
  const standardItems = trip.packingList.filter(i => !i.mustBring);

  if (importantItems.length === 0) importantContainer.innerHTML = '<p class="text-[11px] text-stone-400 italic">No essential luggage items marked.</p>';
  if (standardItems.length === 0) standardContainer.innerHTML = '<p class="text-[11px] text-stone-400 italic">No general packing items.</p>';

  trip.packingList.forEach((item, idx) => {
    const html = `
      <div class="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200/60 text-xs">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" ${item.done ? 'checked' : ''} onchange="togglePackingItem(${idx})" class="w-4 h-4 text-emerald-800 rounded">
          <span class="${item.done ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}">${item.text}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="openChecklistItemModal('packing', ${idx})" class="text-stone-400 hover:text-stone-600 p-1 text-xs"><i class="fa-solid fa-pen"></i></button>
          <button onclick="toggleMustBringPacking(${idx})" class="text-sm"><i class="fa-solid fa-triangle-exclamation ${item.mustBring ? 'text-amber-500' : 'text-stone-300'}"></i></button>
          <button onclick="deletePackingItem(${idx})" style="color: var(--lily-pink);" class="p-1"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    if (item.mustBring) importantContainer.innerHTML += html;
    else standardContainer.innerHTML += html;
  });
}

function togglePackingItem(idx) { const trip = getActiveTrip(); trip.packingList[idx].done = !trip.packingList[idx].done; saveAppData(); renderPackingList(); }
function toggleMustBringPacking(idx) { const trip = getActiveTrip(); trip.packingList[idx].mustBring = !trip.packingList[idx].mustBring; saveAppData(); renderPackingList(); }
function deletePackingItem(idx) { const trip = getActiveTrip(); trip.packingList.splice(idx, 1); saveAppData(); renderPackingList(); }

/* Expenses with Donut Progress & Category Grid Boxes */
function renderExpensesList() {
  const trip = getActiveTrip();
  const searchInput = document.getElementById('expenseSearchInput');
  const catFilter = document.getElementById('expenseCategoryFilter');
  
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';
  const catVal = catFilter ? catFilter.value : 'ALL';

  const totalSpent = trip.expenses.reduce((sum, item) => sum + item.amount, 0);
  const targetBudget = trip.budgetValue || 2000;
  const percentage = Math.min(100, Math.round((totalSpent / targetBudget) * 100));

  const spentEl = document.getElementById('expenses-total-spent');
  if (spentEl) spentEl.innerText = `RM ${totalSpent.toFixed(2)}`;
  
  // Donut Ring update
  const donutRing = document.getElementById('expense-donut-ring');
  if (donutRing) {
    donutRing.setAttribute('stroke-dasharray', `${percentage}, 100`);
  }

  // Category Total Breakdown Boxes
  const catTotals = {};
  trip.expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });

  const catBreakdownContainer = document.getElementById('expenses-category-breakdown');
  if (catBreakdownContainer) {
    catBreakdownContainer.innerHTML = '';
    if (Object.keys(catTotals).length === 0) {
      catBreakdownContainer.innerHTML = `<p class="text-[10px] text-stone-400 col-span-3 text-center">No expenses logged yet.</p>`;
    } else {
      Object.entries(catTotals).forEach(([cat, sum]) => {
        catBreakdownContainer.innerHTML += `
          <div class="bg-stone-50 p-2 rounded-2xl border border-stone-200/60 text-center">
            <span class="text-stone-400 block text-[9px] truncate font-medium">${cat}</span>
            <strong style="color: var(--pond-green);" class="font-bold text-xs">RM ${sum.toFixed(0)}</strong>
          </div>`;
      });
    }
  }

  // Render Expense List Items
  const container = document.getElementById('expenses-items-list');
  if (!container) return;
  container.innerHTML = '';

  const filteredExpenses = trip.expenses.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(searchVal);
    const matchCat = (catVal === 'ALL') || (e.category === catVal);
    return matchSearch && matchCat;
  });

  if (filteredExpenses.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-4">No matching expenses found.</p>`;
    return;
  }

  filteredExpenses.forEach((item, originalIdx) => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs";
    card.innerHTML = `
      <div>
        <h4 class="font-bold text-stone-800">${item.name}</h4>
        <span class="text-[10px] text-stone-400">${item.category}</span>
      </div>
      <div class="flex items-center space-x-2">
        <strong style="color: var(--pond-green);" class="text-sm font-bold">RM ${item.amount.toFixed(2)}</strong>
        <button onclick="openExpenseModal(${originalIdx})" class="text-stone-400 hover:text-stone-600 p-1"><i class="fa-solid fa-pen"></i></button>
        <button onclick="deleteExpenseItem(${originalIdx})" style="color: var(--lily-pink);" class="p-1"><i class="fa-solid fa-trash"></i></button>
      </div>`;
    container.appendChild(card);
  });
}

function openExpenseModal(idx = -1) {
  const titleEl = document.getElementById('modal-expense-title');
  if (titleEl) titleEl.innerText = idx >= 0 ? 'Edit Expense' : 'Add Expense';
  
  const idxInput = document.getElementById('expense-form-idx');
  if (idxInput) idxInput.value = idx;
  
  if (idx >= 0) {
    const trip = getActiveTrip();
    const item = trip.expenses[idx];
    if (item) {
      document.getElementById('expense-form-name').value = item.name;
      document.getElementById('expense-form-category').value = item.category;
      document.getElementById('expense-form-amount').value = item.amount;
    }
  } else {
    document.getElementById('expense-form-name').value = '';
    document.getElementById('expense-form-category').value = 'Flights';
    document.getElementById('expense-form-amount').value = '';
  }
  document.getElementById('modal-expense').classList.remove('hidden');
}

function saveExpenseForm() {
  const idxInput = document.getElementById('expense-form-idx');
  const idx = idxInput ? parseInt(idxInput.value) : -1;
  const name = document.getElementById('expense-form-name').value.trim();
  const category = document.getElementById('expense-form-category').value;
  const amount = parseFloat(document.getElementById('expense-form-amount').value);
  
  if (!name || isNaN(amount)) return alert("Please enter valid expense details!");
  
  const trip = getActiveTrip();
  if (idx >= 0) {
    trip.expenses[idx] = { name, category, amount };
  } else {
    trip.expenses.push({ name, category, amount });
  }
  
  saveAppData();
  closeModal('modal-expense');
  renderExpensesList();
}

function deleteExpenseItem(idx) {
  const trip = getActiveTrip();
  if (confirm("Delete this expense?")) {
    trip.expenses.splice(idx, 1);
    saveAppData();
    renderExpensesList();
  }
}

/* Initialize App on Load */
window.addEventListener('DOMContentLoaded', () => {
  openHomePage('upcoming');
});

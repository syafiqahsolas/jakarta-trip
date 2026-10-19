/* ==========================================================================
   DATE HELPER FUNCTIONS
   ========================================================================== */
function calculateDaysCount(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 1;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive of start & end day
  return isNaN(diffDays) || diffDays < 1 ? 1 : diffDays;
}

function formatDateRangeDisplay(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return "Dates TBD";
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Dates TBD";

  const optionsMonth = { month: 'short' };
  const startMonth = start.toLocaleDateString('en-US', optionsMonth);
  const endMonth = end.toLocaleDateString('en-US', optionsMonth);
  
  if (startMonth === endMonth) {
    return `${startMonth} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  } else {
    return `${startMonth} ${start.getDate()} – ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
  }
}

/* ==========================================================================
   APP STATE & INITIAL DATA
   ========================================================================== */
const defaultData = {
  "jakarta_bandung_2026": {
    id: "jakarta_bandung_2026",
    title: "🇮🇩 Jakarta & Bandung Trip",
    startDate: "2026-11-21",
    endDate: "2026-11-26",
    dates: "Nov 21 – 26, 2026",
    category: "Vacation",
    people: "5 Pax",
    budget: "RM 2,000 / pax",
    budgetValue: 2000,
    activeHotel: "Hotel Grand Sahid Jaya",
    nearestStation: "Setiabudi Astra (1 min walk)",
    itinerary: {
      1: { tag: "Day 1", title: "Arrival", items: [{ time: "08:00 AM", title: "Arrival at CGK Airport", location: "Soekarno-Hatta CGK", notes: "Grab transport to Hotel Grand Sahid Jaya", done: false, starred: true }] },
      2: { tag: "Day 2", title: "Exploration", items: [] },
      3: { tag: "Day 3", title: "Shopping", items: [] },
      4: { tag: "Day 4", title: "Travel to Bandung", items: [] },
      5: { tag: "Day 5", title: "Sightseeing", items: [] },
      6: { tag: "Day 6", title: "Departure", items: [] }
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
    container.innerHTML = '<p class="text-xs text-stone-400 text-center py-6">No matching

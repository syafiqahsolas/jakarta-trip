/**
 * LILY POND TRAVEL HUB - APP.JS
 * Complete Logic with Packing Categories, Ticket Uploads, Timeline Itinerary,
 * Transport Modes (Walk vs Car), and City-Strict Hotel Base Handling.
 */

const firebaseConfig = {
  apiKey: "AIzaSyD66lgTr64OmKbJVSFW0FqkU-hl-Cxj-Ko",
  authDomain: "lilypondhub.firebaseapp.com",
  projectId: "lilypondhub",
  storageBucket: "lilypondhub.firebasestorage.app",
  messagingSenderId: "506164833633",
  appId: "1:506164833633:web:48175dbea8051317472920",
  measurementId: "G-RZC21KJMJS"
};

// Initialize Firebase & Firestore
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

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
      places: [],
      itinerary: [
        { day: 1, title: "Hotel Check-in", time: "14:00", location: "Hotel Grand Sahid Jaya", notes: "Leave bags at lobby", starred: true },
        { day: 1, title: "Dinner & Waddle Around", time: "18:30", location: "Chillax Sudirman", notes: "Try local coffee", starred: false }
      ],
      checklists: {
        packing: [
          { text: "Passport & IC", category: "documents", done: true, important: true },
          { text: "Universal Adapter", category: "electronics", done: false, important: true },
          { text: "Flight Boarding Pass", category: "documents", done: false, important: true },
          { text: "T-Shirts (5x)", category: "clothes", done: false, important: false },
          { text: "Toothbrush & Paste", category: "toiletries", done: false, important: false }
        ]
      },
      tickets: [],
      expenses: [
        { title: "Hotel Deposit", amount: "300", category: "Hotel & Stay" },
        { title: "Whoosh Train Ticket", amount: "150", category: "Transport" }
      ]
    }
  ]
};

let activeTripId = "trip_jakarta_bandung";
let activeItineraryDay = 1;
let selectedWaddleCluster = "NEAR_HOTEL";
let activeLocationSubTab = "master";
let activePackingCategory = "clothes";
let activeTransportMode = "walk";

let editingItineraryIndex = null;
let editingPlaceId = null;
let editingExpenseIndex = null;

// --- INITIALIZATION & REALTIME CLOUD LISTENER ---
window.onload = function() {
  listenToCloudChanges();
};

function listenToCloudChanges() {
  const docRef = db.collection("travelHub").doc("sharedTripData");

  docRef.onSnapshot((doc) => {
    if (doc.exists) {
      appData = doc.data();
      if (appData.currentTripId) activeTripId = appData.currentTripId;

      let trip = getActiveTrip();
      if ((!trip.places || trip.places.length === 0) && typeof getAllMasterLocations === 'function') {
        trip.places = getAllMasterLocations();
        saveAppData();
      }

      localStorage.setItem("lily_pond_cloud_data", JSON.stringify(appData));
      renderUpcomingTripsList();
      renderAllTripsList();
      renderActiveTripDashboard();
    } else {
      const trip = getActiveTrip();
      if (typeof getAllMasterLocations === 'function' && (!trip.places || trip.places.length === 0)) {
        trip.places = getAllMasterLocations();
      }
      saveAppData();
    }
  }, (error) => {
    console.warn("Offline fallback activated:", error);
    const saved = localStorage.getItem("lily_pond_cloud_data");
    if (saved) appData = JSON.parse(saved);
    renderUpcomingTripsList();
    renderAllTripsList();
    renderActiveTripDashboard();
  });
}

function saveAppData() {
  appData.currentTripId = activeTripId;
  localStorage.setItem("lily_pond_cloud_data", JSON.stringify(appData));

  db.collection("travelHub").doc("sharedTripData").set(appData).catch((err) => {
    console.error("Firebase sync error (Saved locally):", err);
  });
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
    if (!trip.checklists) trip.checklists = { packing: [] };
    if (!trip.tickets) trip.tickets = [];
    if (!trip.expenses) trip.expenses = [];
  }
  return trip;
}

// --- NAVIGATION & FLOATING BOTTOM NAVBAR ---
function openHomePage(subTab = 'upcoming') {
  document.getElementById('section-home')?.classList.remove('hidden');
  document.getElementById('section-trip-dashboard')?.classList.add('hidden');
  switchHomeTab(subTab);
}

function switchHomeTab(tabName) {
  const upcomingView = document.getElementById('home-view-upcoming');
  const allView = document.getElementById('home-view-all');
  const btnUpcoming = document.getElementById('home-tab-upcoming');
  const btnAll = document.getElementById('home-tab-all');

  if (tabName === 'upcoming') {
    upcomingView?.classList.remove('hidden');
    allView?.classList.add('hidden');
    btnUpcoming?.classList.add('text-stone-800', 'bg-white', 'shadow-xs');
    btnUpcoming?.classList.remove('text-stone-500');
    btnAll?.classList.remove('text-stone-800', 'bg-white', 'shadow-xs');
    btnAll?.classList.add('text-stone-500');
  } else {
    upcomingView?.classList.add('hidden');
    allView?.classList.remove('hidden');
    btnAll?.classList.add('text-stone-800', 'bg-white', 'shadow-xs');
    btnAll?.classList.remove('text-stone-500');
    btnUpcoming?.classList.remove('text-stone-800', 'bg-white', 'shadow-xs');
    btnUpcoming?.classList.add('text-stone-500');
    renderAllTripsList();
  }
}

function switchDashboardPage(pageName) {
  const pages = ['summary', 'itinerary', 'waddle', 'master', 'checklists'];
  pages.forEach(p => {
    document.getElementById(`page-${p}`)?.classList.add('hidden');
    const navBtn = document.getElementById(`nav-${p}`);
    if (navBtn) {
      navBtn.classList.remove('nav-item-active');
      navBtn.classList.add('text-stone-400');
    }
  });

  document.getElementById(`page-${pageName}`)?.classList.remove('hidden');
  const activeNav = document.getElementById(`nav-${pageName}`);
  if (activeNav) {
    activeNav.classList.add('nav-item-active');
    activeNav.classList.remove('text-stone-400');
  }

  if (pageName === 'summary') renderStarredLocationsSummary();
  if (pageName === 'itinerary') renderItinerary();
  if (pageName === 'master') renderLocationsPage();
  if (pageName === 'waddle') renderWaddleView();
  if (pageName === 'checklists') renderChecklistsAndExpenses();
}

function openTripDashboard(tripId) {
  activeTripId = tripId;
  saveAppData();
  document.getElementById('section-home')?.classList.add('hidden');
  document.getElementById('section-trip-dashboard')?.classList.remove('hidden');
  renderActiveTripDashboard();
  switchDashboardPage('summary');
}

// --- DASHBOARD & SUMMARY ---
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
  if (hotelTitle) hotelTitle.innerText = trip.activeHotel || 'Hotel Grand Sahid Jaya';
  if (hotelStation) {
    hotelStation.innerHTML = (trip.hotelStation && trip.hotelStation !== 'No station nearby')
      ? `<strong>Nearest Station:</strong> ${trip.hotelStation}`
      : `<strong>Nearest Station:</strong> No train station nearby`;
  }

  renderStarredLocationsSummary();
  renderLocationsPage();
  renderWaddleView();
}

function renderStarredLocationsSummary() {
  const trip = getActiveTrip();
  const container = document.getElementById('summary-starred-spots');
  const snapshotContainer = document.getElementById('summary-tentative-snapshot');

  if (container) {
    const starred = (trip.places || []).filter(p => p.starred === true).slice(0, 4);
    container.innerHTML = "";
    if (starred.length === 0) {
      container.innerHTML = `<p class="col-span-2 text-xs text-stone-400 py-3 text-center">No starred locations yet. Tap ⭐ in Spots!</p>`;
    } else {
      starred.forEach(p => {
        const card = document.createElement('div');
        card.className = "lily-card p-3 flex justify-between items-center text-xs col-span-2 sm:col-span-1 bg-white/80";
        card.innerHTML = `
          <div class="space-y-0.5 overflow-hidden">
            <h5 style="color: var(--dark-green);" class="font-bold text-xs truncate flex items-center gap-1">
              <span class="text-amber-400">★</span>
              <span class="truncate">${p.name}</span>
            </h5>
            <p class="text-stone-500 text-[10px] truncate">${p.city ? p.city + ' • ' : ''}${p.category}</p>
          </div>
          <a href="${p.map || '#'}" target="_blank" class="px-2.5 py-1 rounded-xl text-[10px] font-semibold bg-emerald-50 text-emerald-800 flex-shrink-0 ms-2">Map ➔</a>
        `;
        container.appendChild(card);
      });
    }
  }

  if (snapshotContainer) {
    snapshotContainer.innerHTML = "";
    const starredItin = (trip.itinerary || []).filter(act => act.starred === true).sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
    if (starredItin.length === 0) {
      snapshotContainer.innerHTML = `<p class="text-xs text-stone-400 py-2 text-center">No starred itinerary activities yet.</p>`;
    } else {
      starredItin.forEach(act => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center text-xs bg-white/80 p-2.5 rounded-2xl border border-stone-200/60";
        item.innerHTML = `
          <div>
            <strong style="color: var(--dark-green);" class="block font-bold text-xs flex items-center gap-1">
              <span class="text-amber-400 text-xs">★</span>
              <span>${act.title}</span>
            </strong>
            <span class="text-stone-400 text-[10px]">${act.time || 'TBD'} • Day ${act.day}</span>
          </div>
        `;
        snapshotContainer.appendChild(item);
      });
    }
  }
}

function toggleStarSpot(placeId) {
  const trip = getActiveTrip();
  const place = (trip.places || []).find(p => p.id === placeId);
  if (place) {
    place.starred = !place.starred;
    saveAppData();
    renderLocationsPage();
    renderWaddleView();
    renderStarredLocationsSummary();
  }
}

function unstarAllLocations() {
  const trip = getActiveTrip();
  if (!trip || !trip.places) return;
  if (confirm("Unstar all locations?")) {
    trip.places.forEach(p => p.starred = false);
    saveAppData();
    renderLocationsPage();
    renderWaddleView();
    renderStarredLocationsSummary();
  }
}

// --- CITY-STRICT WADDLE VIEW ---
function getActiveHotelCity(trip) {
  const hotelName = trip.activeHotel || "";
  if (typeof hotelDatabase !== 'undefined' && hotelDatabase) {
    for (const [cityKey, cityHotels] of Object.entries(hotelDatabase)) {
      if (cityHotels.some(h => h.name === hotelName)) {
        return cityKey.toLowerCase();
      }
    }
  }
  return trip.name.toLowerCase().includes("bandung") ? "bandung" : "jakarta";
}

function executeWaddleSearch() {
  renderWaddleView();
}

function renderWaddleView() {
  const container = document.getElementById('waddleSearchResults');
  const quickHubsContainer = document.getElementById('waddle-quick-hubs');
  if (!container) return;
  
  const trip = getActiveTrip();
  container.innerHTML = "";

  const activeCity = getActiveHotelCity(trip);
  const places = (trip.places || []).filter(p => (p.city || 'jakarta').toLowerCase() === activeCity);

  const stationCounts = {};
  places.forEach(p => {
    if (p.station && p.station !== 'N/A' && p.station !== 'No station nearby') {
      stationCounts[p.station] = (stationCounts[p.station] || 0) + 1;
    }
  });

  const topStations = Object.keys(stationCounts).slice(0, 3);

  if (quickHubsContainer) {
    quickHubsContainer.innerHTML = "";
    
    const hotelChip = document.createElement('button');
    hotelChip.className = `px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all ${selectedWaddleCluster === 'NEAR_HOTEL' ? 'bg-emerald-900 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`;
    hotelChip.innerHTML = `<i class="fa-solid fa-hotel me-1"></i>Near Hotel`;
    hotelChip.onclick = () => { selectedWaddleCluster = 'NEAR_HOTEL'; renderWaddleView(); };
    quickHubsContainer.appendChild(hotelChip);

    topStations.forEach(stationName => {
      const chip = document.createElement('button');
      chip.className = `px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all ${selectedWaddleCluster === stationName ? 'bg-emerald-900 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`;
      chip.innerText = `🚆 ${stationName}`;
      chip.onclick = () => { selectedWaddleCluster = stationName; renderWaddleView(); };
      quickHubsContainer.appendChild(chip);
    });
  }

  const searchQuery = (document.getElementById('waddleSearchInput')?.value || '').toLowerCase();
  
  let filtered = places.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery) || (p.station && p.station.toLowerCase().includes(searchQuery)) || p.category.toLowerCase().includes(searchQuery);
    
    if (selectedWaddleCluster === 'NEAR_HOTEL') {
      return matchesSearch;
    } else {
      return matchesSearch && p.station === selectedWaddleCluster;
    }
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No spots found in ${activeCity.toUpperCase()}.</p>`;
    return;
  }

  filtered.forEach(p => {
    const div = document.createElement('div');
    div.className = "lily-card p-3.5 text-xs flex justify-between items-center mb-2 bg-white/80";
    
    const stationTag = (p.station && p.station !== 'N/A' && p.station !== 'No station nearby')
      ? `<i class="fa-solid fa-train-subway me-1 text-emerald-700"></i>${p.station}`
      : `<i class="fa-solid fa-person-walking me-1 text-emerald-700"></i>${p.walk || 'Short Walk'}`;

    div.innerHTML = `
      <div class="flex items-center space-x-2.5">
        <button onclick="toggleStarSpot('${p.id}')" class="focus:outline-none">
          ${p.starred ? '<span class="text-amber-400 text-base">★</span>' : '<span class="text-stone-300 hover:text-amber-400 text-base">☆</span>'}
        </button>
        <div>
          <strong style="color: var(--dark-green);" class="text-sm font-bold block">${p.name}</strong>
          <p class="text-stone-500 text-[11px] mt-0.5">${stationTag}</p>
        </div>
      </div>
      <a href="${p.map || '#'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-emerald-50 border border-emerald-100" style="color: var(--dark-green);">
        Go ➔
      </a>
    `;
    container.appendChild(div);
  });
}

// --- TWO-PAGE LOCATIONS & TRANSPORT MODES ---
function switchLocationSubTab(tab) {
  activeLocationSubTab = tab;
  const masterSub = document.getElementById('loc-sub-master');
  const nearbySub = document.getElementById('loc-sub-nearby');
  const btnMaster = document.getElementById('loctab-master');
  const btnNearby = document.getElementById('loctab-nearby');

  if (tab === 'master') {
    masterSub?.classList.remove('hidden');
    nearbySub?.classList.add('hidden');
    btnMaster?.classList.add('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
    btnMaster?.classList.remove('text-stone-500', 'font-semibold');
    btnNearby?.classList.remove('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
    btnNearby?.classList.add('text-stone-500', 'font-semibold');
    renderMasterPlacesList();
  } else {
    masterSub?.classList.add('hidden');
    nearbySub?.classList.remove('hidden');
    btnNearby?.classList.add('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
    btnNearby?.classList.remove('text-stone-500', 'font-semibold');
    btnMaster?.classList.remove('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
    btnMaster?.classList.add('text-stone-500', 'font-semibold');
    renderNearbyPlacesList();
  }
}

function setTransportMode(mode) {
  activeTransportMode = mode;
  const btnWalk = document.getElementById('transport-btn-walk');
  const btnCar = document.getElementById('transport-btn-car');

  if (mode === 'walk') {
    btnWalk?.classList.add('bg-emerald-100', 'text-emerald-900', 'font-bold');
    btnWalk?.classList.remove('text-stone-500', 'font-semibold');
    btnCar?.classList.remove('bg-emerald-100', 'text-emerald-900', 'font-bold');
    btnCar?.classList.add('text-stone-500', 'font-semibold');
  } else {
    btnCar?.classList.add('bg-emerald-100', 'text-emerald-900', 'font-bold');
    btnCar?.classList.remove('text-stone-500', 'font-semibold');
    btnWalk?.classList.remove('bg-emerald-100', 'text-emerald-900', 'font-bold');
    btnWalk?.classList.add('text-stone-500', 'font-semibold');
  }
  renderNearbyPlacesList();
}

function renderLocationsPage() {
  switchLocationSubTab(activeLocationSubTab);
}

function renderMasterPlacesList() {
  const container = document.getElementById('masterPlacesContainer');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const query = (document.getElementById('masterSearchInput')?.value || '').toLowerCase();
  const catFilter = document.getElementById('masterCategoryFilter')?.value || 'ALL';

  const filtered = (trip.places || []).filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query) || (p.city && p.city.toLowerCase().includes(query));
    const pCat = (p.category || '').toLowerCase();
    const filterCat = catFilter.toLowerCase();
    const matchesCat = filterCat === 'all' || pCat === filterCat;
    return matchesQuery && matchesCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No master locations found.</p>`;
    return;
  }

  filtered.forEach(place => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs bg-white/80";
    card.innerHTML = `
      <div class="space-y-0.5">
        <div class="flex items-center space-x-2">
          <button onclick="toggleStarSpot('${place.id}')" class="focus:outline-none">
            ${place.starred ? '<span class="text-amber-400 text-base">★</span>' : '<span class="text-stone-300 hover:text-amber-400 text-base">☆</span>'}
          </button>
          <h4 style="color: var(--dark-green);" class="font-bold text-sm">${place.name}</h4>
          <button onclick="openEditSpotModal('${place.id}')" class="text-stone-300 hover:text-stone-600 text-xs ms-1"><i class="fa-solid fa-pen"></i></button>
        </div>
        <p class="text-stone-500"><span class="font-bold text-emerald-900">${place.city || 'Jakarta'}</span> • ${place.category || 'General'}</p>
      </div>
      <a href="${place.map || '#'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px]" style="background-color: var(--pond-bg); color: var(--dark-green);">
        <i class="fa-solid fa-location-dot me-1"></i>Map
      </a>
    `;
    container.appendChild(card);
  });
}

function renderNearbyPlacesList() {
  const container = document.getElementById('nearbyPlacesContainer');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const activeCity = getActiveHotelCity(trip);
  
  let filtered = (trip.places || []).filter(p => {
    const isSameCity = (p.city || 'jakarta').toLowerCase() === activeCity;
    const walkMins = parseInt(p.walk) || 15;

    if (activeTransportMode === 'walk') {
      return isSameCity && walkMins <= 40;
    } else {
      return isSameCity; // Car / Taxi includes all spots in city
    }
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No spots found for ${activeTransportMode.toUpperCase()} mode in ${activeCity.toUpperCase()}.</p>`;
    return;
  }

  filtered.forEach(place => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs bg-white/80";
    
    const modeBadge = activeTransportMode === 'walk' 
      ? `<i class="fa-solid fa-person-walking text-emerald-700 me-1"></i>${place.walk || '15 min walk'}`
      : `<i class="fa-solid fa-car text-teal-700 me-1"></i>10-25 min drive`;

    card.innerHTML = `
      <div class="space-y-0.5">
        <div class="flex items-center space-x-2">
          <button onclick="toggleStarSpot('${place.id}')" class="focus:outline-none">
            ${place.starred ? '<span class="text-amber-400 text-base">★</span>' : '<span class="text-stone-300 hover:text-amber-400 text-base">☆</span>'}
          </button>
          <h4 style="color: var(--dark-green);" class="font-bold text-sm">${place.name}</h4>
        </div>
        <p class="text-stone-500">${modeBadge} • ${place.category}</p>
      </div>
      <a href="${place.map || '#'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-emerald-50 text-emerald-800">Map ➔</a>
    `;
    container.appendChild(card);
  });
}

// --- TIMELINE ITINERARY (Matching Image 3 Style) ---
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
    btn.className = `px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${activeItineraryDay === d ? 'text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`;
    if (activeItineraryDay === d) btn.style.backgroundColor = 'var(--dark-green)';
    btn.innerText = `Day ${d}`;
    btn.onclick = () => { activeItineraryDay = d; renderItinerary(); };
    dayButtonsContainer.appendChild(btn);
  }

  const dayActivities = (trip.itinerary || [])
    .filter(act => act.day === activeItineraryDay)
    .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));

  if (dayActivities.length === 0) {
    timelineContainer.innerHTML = `<p class="text-xs text-stone-400 py-6 text-center">No activities planned for Day ${activeItineraryDay}.</p>`;
    return;
  }

  dayActivities.forEach((act) => {
    const realIdx = trip.itinerary.indexOf(act);
    const item = document.createElement('div');
    item.className = "relative pl-8 space-y-1";
    item.innerHTML = `
      <div class="absolute left-2 top-2.5 w-3 h-3 rounded-full border-2 border-white shadow-xs" style="background-color: var(--dark-green);"></div>
      <div class="lily-card p-3.5 text-xs space-y-1 bg-white/80">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <button onclick="toggleStarItineraryActivity(${realIdx})" class="focus:outline-none">
              ${act.starred ? '<span class="text-amber-400 text-sm">★</span>' : '<span class="text-stone-300 hover:text-amber-400 text-sm">☆</span>'}
            </button>
            <span class="font-bold text-stone-500 text-[11px]"><i class="fa-regular fa-clock me-1"></i>${act.time || 'TBD'}</span>
          </div>
          <div class="space-x-2">
            <button onclick="openEditItineraryModal(${realIdx})" class="text-stone-400 hover:text-emerald-700"><i class="fa-solid fa-pen text-[10px]"></i></button>
            <button onclick="deleteItineraryActivity(${realIdx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-[10px]"></i></button>
          </div>
        </div>
        <h4 style="color: var(--dark-green);" class="font-bold text-sm">${act.title}</h4>
        <p class="text-stone-600"><i class="fa-solid fa-location-dot me-1" style="color: var(--moss-green);"></i>${act.location || 'N/A'}</p>
        ${act.notes ? `<p class="text-stone-400 text-[11px] bg-stone-50 p-2 rounded-xl mt-1">${act.notes}</p>` : ''}
      </div>
    `;
    timelineContainer.appendChild(item);
  });
}

function toggleStarItineraryActivity(realIdx) {
  const trip = getActiveTrip();
  if (trip.itinerary && trip.itinerary[realIdx]) {
    trip.itinerary[realIdx].starred = !trip.itinerary[realIdx].starred;
    saveAppData();
    renderItinerary();
    renderStarredLocationsSummary();
  }
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
    const existingStar = trip.itinerary[editingItineraryIndex].starred || false;
    trip.itinerary[editingItineraryIndex] = { day: activeItineraryDay, title, time, location, notes, starred: existingStar };
  } else {
    trip.itinerary.push({ day: activeItineraryDay, title, time, location, notes, starred: false });
  }

  saveAppData();
  closeModal('modal-itinerary');
  renderItinerary();
  renderStarredLocationsSummary();
}

function deleteItineraryActivity(realIdx) {
  const trip = getActiveTrip();
  if (trip.itinerary && trip.itinerary[realIdx]) {
    trip.itinerary.splice(realIdx, 1);
    saveAppData();
    renderItinerary();
    renderStarredLocationsSummary();
  }
}

// --- CHECKLISTS, CATEGORIZED PACKING & TICKETS ---
function selectPackingCategory(cat) {
  activePackingCategory = cat;
  const categories = ['clothes', 'toiletries', 'electronics', 'documents'];
  categories.forEach(c => {
    const btn = document.getElementById(`pack-cat-${c}`);
    if (btn) {
      if (c === cat) {
        btn.classList.add('bg-emerald-800', 'text-white', 'shadow-xs');
        btn.classList.remove('text-stone-400');
      } else {
        btn.classList.remove('bg-emerald-800', 'text-white', 'shadow-xs');
        btn.classList.add('text-stone-400');
      }
    }
  });
  renderCategorizedPackingList();
}

function renderCategorizedPackingList() {
  const container = document.getElementById('packing-items-container');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const items = (trip.checklists.packing || []).filter(item => (item.category || 'clothes') === activePackingCategory);

  // Sort important/pinned items to top
  items.sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0));

  if (items.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-4">No items in this category yet.</p>`;
    return;
  }

  items.forEach((item) => {
    const realIdx = trip.checklists.packing.indexOf(item);
    const div = document.createElement('div');
    div.className = "flex justify-between items-center bg-white/80 p-3 rounded-2xl border border-stone-200/60";
    div.innerHTML = `
      <label class="flex items-center space-x-2.5 cursor-pointer">
        <input type="checkbox" ${item.done ? 'checked' : ''} onchange="togglePackingDone(${realIdx})" class="rounded text-emerald-800">
        <span class="${item.done ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}">${item.text}</span>
      </label>
      <div class="flex items-center space-x-2">
        <button onclick="togglePackingImportant(${realIdx})" class="focus:outline-none">
          <i class="fa-solid fa-thumbtack ${item.important ? 'text-amber-500' : 'text-stone-300 hover:text-amber-400'} text-xs"></i>
        </button>
        <button onclick="deletePackingItem(${realIdx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-xs"></i></button>
      </div>
    `;
    container.appendChild(div);
  });
}

function addPackingItem() {
  const input = document.getElementById('new-pack-input');
  const val = input?.value.trim();
  if (!val) return;

  const trip = getActiveTrip();
  if (!trip.checklists.packing) trip.checklists.packing = [];

  trip.checklists.packing.push({ text: val, category: activePackingCategory, done: false, important: false });
  saveAppData();
  input.value = "";
  renderCategorizedPackingList();
}

function togglePackingDone(idx) {
  const trip = getActiveTrip();
  if (trip.checklists.packing[idx]) {
    trip.checklists.packing[idx].done = !trip.checklists.packing[idx].done;
    saveAppData();
    renderCategorizedPackingList();
  }
}

function togglePackingImportant(idx) {
  const trip = getActiveTrip();
  if (trip.checklists.packing[idx]) {
    trip.checklists.packing[idx].important = !trip.checklists.packing[idx].important;
    saveAppData();
    renderCategorizedPackingList();
  }
}

function deletePackingItem(idx) {
  const trip = getActiveTrip();
  trip.checklists.packing.splice(idx, 1);
  saveAppData();
  renderCategorizedPackingList();
}

// --- TICKETS & DOCUMENTS ---
function renderTicketsList() {
  const container = document.getElementById('tickets-list-container');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  if (!trip.tickets || trip.tickets.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No tickets uploaded yet. Tap "Upload Ticket" above!</p>`;
    return;
  }

  trip.tickets.forEach((ticket, idx) => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 space-y-2 bg-white";
    card.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <strong style="color: var(--dark-green);" class="font-bold text-xs block">${ticket.title}</strong>
          <span class="text-[10px] text-stone-400">${ticket.type} Document</span>
        </div>
        <button onclick="deleteTicket(${idx})" class="text-stone-300 hover:text-red-500 text-xs"><i class="fa-solid fa-trash"></i></button>
      </div>
      ${ticket.fileData ? `<img src="${ticket.fileData}" class="w-full h-36 object-cover rounded-xl border border-stone-100" />` : ''}
    `;
    container.appendChild(card);
  });
}

function openTicketModal() {
  document.getElementById('ticket-form-title').value = "";
  document.getElementById('ticket-form-file').value = "";
  openModal('modal-ticket');
}

function saveTicketForm() {
  const title = document.getElementById('ticket-form-title').value.trim();
  const type = document.getElementById('ticket-form-type').value;
  const fileInput = document.getElementById('ticket-form-file');

  if (!title) return alert("Enter ticket title!");

  const trip = getActiveTrip();
  if (!trip.tickets) trip.tickets = [];

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(e) {
      trip.tickets.push({ title, type, fileData: e.target.result });
      saveAppData();
      closeModal('modal-ticket');
      renderTicketsList();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    trip.tickets.push({ title, type, fileData: null });
    saveAppData();
    closeModal('modal-ticket');
    renderTicketsList();
  }
}

function deleteTicket(idx) {
  const trip = getActiveTrip();
  if (confirm("Delete this ticket document?")) {
    trip.tickets.splice(idx, 1);
    saveAppData();
    renderTicketsList();
  }
}

// --- BILLING REPORTS EXPENSE TRACKER ---
function renderChecklistsAndExpenses() {
  const trip = getActiveTrip();

  // Render Sub-Tabs
  renderCategorizedPackingList();
  renderTicketsList();

  let totalSum = 0;
  const categories = { "Hotel & Stay": 0, "Food & Cafe": 0, "Transport": 0, "Other": 0 };

  (trip.expenses || []).forEach(exp => {
    const amt = parseFloat(exp.amount) || 0;
    totalSum += amt;
    const cat = exp.category || "Other";
    categories[cat] = (categories[cat] || 0) + amt;
  });

  const totalDisplay = document.getElementById('expense-total-display');
  if (totalDisplay) totalDisplay.innerText = `RM ${totalSum.toLocaleString()}`;

  if (document.getElementById('cat-amount-stay')) document.getElementById('cat-amount-stay').innerText = `RM ${categories["Hotel & Stay"]}`;
  if (document.getElementById('cat-amount-food')) document.getElementById('cat-amount-food').innerText = `RM ${categories["Food & Cafe"]}`;
  if (document.getElementById('cat-amount-transport')) document.getElementById('cat-amount-transport').innerText = `RM ${categories["Transport"]}`;
  if (document.getElementById('cat-amount-other')) document.getElementById('cat-amount-other').innerText = `RM ${categories["Other"]}`;

  const expListContainer = document.getElementById('expenses-list-container');
  if (expListContainer) {
    expListContainer.innerHTML = "";
    if (trip.expenses.length === 0) {
      expListContainer.innerHTML = `<p class="text-xs text-stone-400 text-center py-4">No expense items logged yet.</p>`;
      return;
    }

    trip.expenses.forEach((exp, idx) => {
      let iconClass = "fa-receipt text-stone-500 bg-stone-100";
      if (exp.category === "Hotel & Stay") iconClass = "fa-hotel text-emerald-800 bg-emerald-100";
      if (exp.category === "Food & Cafe") iconClass = "fa-utensils text-amber-600 bg-amber-100";
      if (exp.category === "Transport") iconClass = "fa-train text-teal-600 bg-teal-100";

      const card = document.createElement('div');
      card.className = "lily-card p-3.5 flex justify-between items-center text-xs bg-white/80";
      card.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center ${iconClass}">
            <i class="fa-solid ${iconClass.split(' ')[0]}"></i>
          </div>
          <div>
            <strong class="font-bold text-stone-800 block text-xs">${exp.title}</strong>
            <span class="text-[10px] text-stone-400">${exp.category || 'Expense'}</span>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <strong style="color: var(--dark-green);" class="font-extrabold text-xs">RM ${exp.amount}</strong>
          <button onclick="openEditExpenseModal(${idx})" class="text-stone-300 hover:text-stone-600"><i class="fa-solid fa-pen text-[10px]"></i></button>
          <button onclick="deleteExpenseItem(${idx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-[10px]"></i></button>
        </div>
      `;
      expListContainer.appendChild(card);
    });
  }
}

function openExpenseModal() {
  editingExpenseIndex = null;
  document.getElementById('exp-form-idx').value = "-1";
  document.getElementById('exp-form-title').value = "";
  document.getElementById('exp-form-amount').value = "";
  document.getElementById('exp-form-category').value = "Hotel & Stay";
  document.getElementById('modal-expense-title').innerText = "Add Expense";
  openModal('modal-expense');
}

function openEditExpenseModal(idx) {
  const trip = getActiveTrip();
  const exp = trip.expenses[idx];
  if (!exp) return;

  editingExpenseIndex = idx;
  document.getElementById('exp-form-idx').value = idx;
  document.getElementById('exp-form-title').value = exp.title || "";
  document.getElementById('exp-form-amount').value = exp.amount || "";
  document.getElementById('exp-form-category').value = exp.category || "Hotel & Stay";
  document.getElementById('modal-expense-title').innerText = "Edit Expense";
  openModal('modal-expense');
}

function saveExpenseForm() {
  const title = document.getElementById('exp-form-title').value.trim();
  const amount = document.getElementById('exp-form-amount').value.trim();
  const category = document.getElementById('exp-form-category').value;
  if (!title || !amount) return alert("Enter title and amount!");

  const trip = getActiveTrip();
  if (!trip.expenses) trip.expenses = [];

  if (editingExpenseIndex !== null && trip.expenses[editingExpenseIndex]) {
    trip.expenses[editingExpenseIndex] = { title, amount, category };
  } else {
    trip.expenses.push({ title, amount, category });
  }

  saveAppData();
  closeModal('modal-expense');
  renderChecklistsAndExpenses();
}

function deleteExpenseItem(idx) {
  const trip = getActiveTrip();
  if (confirm("Delete expense item?")) {
    trip.expenses.splice(idx, 1);
    saveAppData();
    renderChecklistsAndExpenses();
  }
}

function switchChecklistSubTab(tab) {
  ['packing', 'tickets', 'expenses'].forEach(t => {
    document.getElementById(`checklist-sub-${t}`)?.classList.add('hidden');
    const btn = document.getElementById(`checktab-${t}`);
    if (btn) {
      btn.classList.remove('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
      btn.classList.add('text-stone-500', 'font-semibold');
    }
  });

  document.getElementById(`checklist-sub-${tab}`)?.classList.remove('hidden');
  const activeBtn = document.getElementById(`checktab-${tab}`);
  if (activeBtn) {
    activeBtn.classList.add('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
    activeBtn.classList.remove('text-stone-500', 'font-semibold');
  }
}

// --- HOTEL DROPDOWN LOGIC ---
function populateHotelCityDropdown(selectedCity = "jakarta") {
  const citySelect = document.getElementById('hotel-city-dropdown');
  if (!citySelect) return;
  citySelect.innerHTML = "";
  if (typeof hotelDatabase === 'undefined') return;

  Object.keys(hotelDatabase).forEach(cityKey => {
    const opt = document.createElement('option');
    opt.value = cityKey;
    opt.text = cityKey.charAt(0).toUpperCase() + cityKey.slice(1);
    if (cityKey === selectedCity) opt.selected = true;
    citySelect.appendChild(opt);
  });
  populateHotelNameDropdown();
}

function populateHotelNameDropdown(selectedHotelName = "") {
  const citySelect = document.getElementById('hotel-city-dropdown');
  const hotelSelect = document.getElementById('hotel-name-dropdown');
  if (!citySelect || !hotelSelect) return;

  const selectedCity = citySelect.value.toLowerCase();
  hotelSelect.innerHTML = "";

  const hotels = (typeof hotelDatabase !== 'undefined' && hotelDatabase[selectedCity]) ? hotelDatabase[selectedCity] : [];
  hotels.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.name;
    opt.text = h.name;
    if (h.name === selectedHotelName) opt.selected = true;
    hotelSelect.appendChild(opt);
  });
  onHotelSelectionChange();
}

function onHotelSelectionChange() {
  const citySelect = document.getElementById('hotel-city-dropdown');
  const hotelSelect = document.getElementById('hotel-name-dropdown');
  const previewLabel = document.getElementById('hotel-form-preview-station');
  if (!citySelect || !hotelSelect || !previewLabel) return;

  const city = citySelect.value;
  const hotelName = hotelSelect.value;
  const hotels = hotelDatabase[city] || [];
  const found = hotels.find(h => h.name === hotelName);

  if (found) {
    const autoStation = typeof findNearestStation === 'function' ? findNearestStation(found.lat, found.lng, city) : "No station nearby";
    previewLabel.innerText = autoStation;
  }
}

function openHotelModal() {
  const trip = getActiveTrip();
  let initialCity = getActiveHotelCity(trip);
  populateHotelCityDropdown(initialCity);
  populateHotelNameDropdown(trip.activeHotel || "");
  openModal('modal-hotel');
}

function saveHotelForm() {
  const hotelSelect = document.getElementById('hotel-name-dropdown');
  const previewLabel = document.getElementById('hotel-form-preview-station');
  if (!hotelSelect) return;

  const trip = getActiveTrip();
  trip.activeHotel = hotelSelect.value;
  trip.hotelStation = previewLabel ? previewLabel.innerText : "No station nearby";

  saveAppData();
  closeModal('modal-hotel');
  renderActiveTripDashboard();
}

// --- TRIPS HOMEPAGE LISTS ---
function renderUpcomingTripsList() {
  const container = document.getElementById('upcoming-trips-list');
  if (!container) return;
  container.innerHTML = "";

  appData.trips.forEach(trip => {
    const card = document.createElement('div');
    card.className = "lily-card p-4 space-y-2 cursor-pointer hover:border-emerald-700/30 transition-all bg-white/90";
    card.onclick = () => openTripDashboard(trip.id);
    card.innerHTML = `
      <div class="flex justify-between items-start">
        <span class="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full" style="background-color: var(--moss-green); color: var(--beige);">${trip.category || 'Trip'}</span>
        <span class="text-xs text-stone-400"><i class="fa-solid fa-calendar-days me-1"></i>${trip.startDate || ''} - ${trip.endDate || ''}</span>
      </div>
      <h3 style="color: var(--dark-green);" class="font-bold text-lg leading-tight">${trip.name}</h3>
      <div class="flex justify-between text-xs text-stone-500 pt-1">
        <span><i class="fa-solid fa-users me-1"></i>${trip.people || '1 Pax'}</span>
        <span class="font-semibold" style="color: var(--dark-green);">${trip.budget || 'RM 0'}</span>
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
  const catFilter = document.getElementById('tripCategoryFilter')?.value || 'ALL';

  const filtered = appData.trips.filter(t => {
    const matchesQuery = t.name.toLowerCase().includes(query);
    const matchesCat = catFilter === 'ALL' || t.category === catFilter;
    return matchesQuery && matchesCat;
  });

  filtered.forEach(trip => {
    const card = document.createElement('div');
    card.className = "lily-card p-4 flex justify-between items-center cursor-pointer bg-white/90";
    card.onclick = () => openTripDashboard(trip.id);
    card.innerHTML = `
      <div>
        <h4 style="color: var(--dark-green);" class="font-bold text-base">${trip.name}</h4>
        <p class="text-xs text-stone-400">${trip.category} • ${trip.startDate || 'TBD'}</p>
      </div>
      <button class="text-xs px-3 py-1.5 rounded-xl font-semibold" style="background-color: var(--dark-green); color: var(--beige);">Open ➔</button>
    `;
    container.appendChild(card);
  });
}

function openTripModal(tripIdToEdit = null) {
  const targetId = tripIdToEdit || activeTripId;
  const trip = appData.trips.find(t => t.id === targetId);

  if (tripIdToEdit && trip) {
    document.getElementById('modal-trip-title').innerText = "Edit Trip";
    document.getElementById('trip-form-id').value = trip.id;
    document.getElementById('trip-form-title').value = trip.name || '';
    document.getElementById('trip-form-start-date').value = trip.startDate || '';
    document.getElementById('trip-form-end-date').value = trip.endDate || '';
    document.getElementById('trip-form-category').value = trip.category || 'Vacation';
    document.getElementById('trip-form-people').value = trip.people || '';
    document.getElementById('trip-form-budget').value = trip.budget || '';
  } else {
    document.getElementById('modal-trip-title').innerText = "Add New Trip";
    document.getElementById('trip-form-id').value = '';
    document.getElementById('trip-form-title').value = '';
    document.getElementById('trip-form-start-date').value = '';
    document.getElementById('trip-form-end-date').value = '';
    document.getElementById('trip-form-people').value = '';
    document.getElementById('trip-form-budget').value = '';
  }
  openModal('modal-trip');
}

function saveTripForm() {
  const id = document.getElementById('trip-form-id').value;
  const title = document.getElementById('trip-form-title').value.trim();
  if (!title) return alert("Enter Trip Name!");

  if (id) {
    const trip = appData.trips.find(t => t.id === id);
    if (trip) {
      trip.name = title;
      trip.startDate = document.getElementById('trip-form-start-date').value;
      trip.endDate = document.getElementById('trip-form-end-date').value;
      trip.category = document.getElementById('trip-form-category').value;
      trip.people = document.getElementById('trip-form-people').value;
      trip.budget = document.getElementById('trip-form-budget').value;
    }
  } else {
    const newTripId = "trip_" + Date.now();
    appData.trips.push({
      id: newTripId,
      name: title,
      startDate: document.getElementById('trip-form-start-date').value || "2026-11-21",
      endDate: document.getElementById('trip-form-end-date').value || "2026-11-26",
      category: document.getElementById('trip-form-category').value || "Vacation",
      people: document.getElementById('trip-form-people').value || "1 Pax",
      budget: document.getElementById('trip-form-budget').value || "RM 0",
      activeHotel: "Hotel Grand Sahid Jaya",
      hotelStation: "Setiabudi Astra (1 min walk)",
      places: typeof getAllMasterLocations === 'function' ? getAllMasterLocations() : [],
      itinerary: [],
      checklists: { packing: [] },
      tickets: [],
      expenses: []
    });
    activeTripId = newTripId;
  }

  saveAppData();
  closeModal('modal-trip');
  renderUpcomingTripsList();
  renderAllTripsList();
  openTripDashboard(activeTripId);
}

function openMasterSpotModal() {
  editingPlaceId = null;
  document.getElementById('spot-form-id').value = '';
  document.getElementById('spot-form-name').value = '';
  document.getElementById('spot-form-city').value = 'Jakarta';
  document.getElementById('spot-form-category').value = 'Attraction';
  document.getElementById('spot-form-station').value = '';
  document.getElementById('spot-form-walk').value = '';
  document.getElementById('modal-spot-title').innerText = "Add Location Spot";
  openModal('modal-master-spot');
}

function openEditSpotModal(placeId) {
  const trip = getActiveTrip();
  const place = (trip.places || []).find(p => p.id === placeId);
  if (!place) return;
  editingPlaceId = placeId;
  document.getElementById('spot-form-id').value = place.id;
  document.getElementById('spot-form-name').value = place.name || '';
  document.getElementById('spot-form-city').value = place.city || 'Jakarta';
  document.getElementById('spot-form-category').value = place.category || 'Attraction';
  document.getElementById('spot-form-station').value = place.station || '';
  document.getElementById('spot-form-walk').value = place.walk || '';
  document.getElementById('modal-spot-title').innerText = "Edit Location Spot";
  openModal('modal-master-spot');
}

function saveMasterSpotForm() {
  const name = document.getElementById('spot-form-name').value.trim();
  const city = document.getElementById('spot-form-city').value;
  const category = document.getElementById('spot-form-category').value;
  const station = document.getElementById('spot-form-station').value.trim();
  const walk = document.getElementById('spot-form-walk').value.trim();
  if (!name) return alert("Enter spot name!");

  const trip = getActiveTrip();
  if (!trip.places) trip.places = [];

  if (editingPlaceId) {
    const place = trip.places.find(p => p.id === editingPlaceId);
    if (place) {
      place.name = name;
      place.city = city;
      place.category = category;
      place.station = station || place.station;
      place.walk = walk;
      place.map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
    }
  } else {
    trip.places.push({
      id: "p_" + Date.now(),
      name: name,
      city: city,
      category: category,
      station: station || "Near Hotel Area",
      walk: walk,
      map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      starred: false
    });
  }

  saveAppData();
  closeModal('modal-master-spot');
  renderLocationsPage();
  renderWaddleView();
  renderStarredLocationsSummary();
}

function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

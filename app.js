/**
 * LILY POND TRAVEL HUB - APP.JS
 * Complete Production Logic: Offline-First, GPS Proximity, Top 3 Cluster Search,
 * Chronological Itinerary, Working Checklists & Real-Time Firebase Sync
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
      itinerary: [],
      checklists: { 
        prep: [{ id: 1, text: "Book airport transfer", done: false }, { id: 2, text: "Check passport validity", done: true }], 
        packing: [{ id: 1, text: "Universal adapter", done: false }, { id: 2, text: "Comfortable walking shoes", done: false }] 
      },
      expenses: [{ id: 1, title: "Hotel Deposit", amount: "RM 300" }]
    }
  ]
};

let activeTripId = "trip_jakarta_bandung";
let activeItineraryDay = 1;
let selectedWaddleCluster = "NEAR_HOTEL";
let editingItineraryIndex = null;
let editingPlaceId = null;

// GPS Coordinates State
let userCurrentLat = null;
let userCurrentLng = null;

// --- INITIALIZATION & REAL-TIME LISTENER ---
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
    console.warn("Offline/Cloud error, loading local cache:", error);
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

  db.collection("travelHub").doc("sharedTripData").set(appData).catch((error) => {
    console.error("Cloud sync error (Saved locally):", error);
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
    document.getElementById(`nav-${p}`)?.classList.remove('text-stone-800', 'font-bold', 'bg-white', 'shadow-xs');
  });

  document.getElementById(`page-${pageName}`)?.classList.remove('hidden');
  const activeNav = document.getElementById(`nav-${pageName}`);
  if (activeNav) {
    activeNav.classList.add('text-stone-800', 'font-bold', 'bg-white', 'shadow-xs');
  }

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
  if (hotelStation) hotelStation.innerHTML = `<strong>Nearest Station:</strong> ${trip.hotelStation || 'Setiabudi Astra (1 min walk)'}`;

  renderStarredLocationsSummary();
  renderMasterPlacesList();
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
      container.innerHTML = `<p class="col-span-2 text-xs text-stone-400 py-3 text-center">No starred locations yet. Tap ⭐ in Locations!</p>`;
    } else {
      starred.forEach(p => {
        const card = document.createElement('div');
        card.className = "lily-card p-3 flex justify-between items-center text-xs col-span-2 sm:col-span-1 bg-white/60";
        card.innerHTML = `
          <div class="space-y-0.5 overflow-hidden">
            <h5 style="color: var(--pond-green);" class="font-bold text-xs truncate flex items-center gap-1">
              <span class="text-amber-400">★</span>
              <span class="truncate">${p.name}</span>
            </h5>
            <p class="text-stone-500 text-[10px] truncate">${p.category} • ${p.station || 'Near Hotel'}</p>
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
            <strong style="color: var(--pond-green);" class="block font-bold text-xs flex items-center gap-1">
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
    renderMasterPlacesList();
    renderWaddleView();
    renderStarredLocationsSummary();
  }
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

function unstarAllLocations() {
  const trip = getActiveTrip();
  if (!trip || !trip.places) return;
  if (confirm("Unstar all locations?")) {
    trip.places.forEach(p => p.starred = false);
    saveAppData();
    renderMasterPlacesList();
    renderWaddleView();
    renderStarredLocationsSummary();
  }
}

// --- GPS GEOLOCATION & MASTER LOCATIONS SORTING ---
function sortByUserLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported by your browser");
    return;
  }

  const container = document.getElementById('masterPlacesContainer');
  if (container) container.innerHTML = `<p class="text-xs text-stone-400 text-center py-4">📍 Detecting your GPS position...</p>`;

  navigator.geolocation.getCurrentPosition((position) => {
    userCurrentLat = position.coords.latitude;
    userCurrentLng = position.coords.longitude;
    renderMasterPlacesList();
  }, (error) => {
    console.error("GPS error:", error);
    alert("Unable to fetch GPS position. Please check location permissions.");
    renderMasterPlacesList();
  }, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
}

function renderMasterPlacesList() {
  const container = document.getElementById('masterPlacesContainer');
  if (!container) return;
  const trip = getActiveTrip();
  container.innerHTML = "";

  const query = (document.getElementById('masterSearchInput')?.value || '').toLowerCase();
  const catFilter = document.getElementById('masterCategoryFilter')?.value || 'ALL';

  let filtered = (trip.places || []).filter(p => {
    const matchesQuery = p.name.toLowerCase().includes(query) || (p.station && p.station.toLowerCase().includes(query)) || (p.city && p.city.toLowerCase().includes(query));
    const pCat = (p.category || '').toLowerCase();
    const filterCat = catFilter.toLowerCase();
    const matchesCat = filterCat === 'all' || pCat === filterCat || pCat.includes(filterCat);
    return matchesQuery && matchesCat;
  });

  // Sort by GPS proximity if live coordinates exist
  if (userCurrentLat !== null && userCurrentLng !== null) {
    filtered.sort((a, b) => {
      const distA = (a.lat && a.lng && typeof calculateDistanceInKm === 'function') 
        ? calculateDistanceInKm(userCurrentLat, userCurrentLng, a.lat, a.lng) : Infinity;
      const distB = (b.lat && b.lng && typeof calculateDistanceInKm === 'function') 
        ? calculateDistanceInKm(userCurrentLat, userCurrentLng, b.lat, b.lng) : Infinity;
      return distA - distB;
    });
  }

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No locations found.</p>`;
    return;
  }

  filtered.forEach(place => {
    let distanceLabel = "";
    if (userCurrentLat !== null && userCurrentLng !== null && place.lat && place.lng && typeof calculateDistanceInKm === 'function') {
      const km = calculateDistanceInKm(userCurrentLat, userCurrentLng, place.lat, place.lng);
      distanceLabel = ` • 📍 ${km < 1 ? Math.round(km * 1000) + 'm away' : km.toFixed(1) + 'km away'}`;
    }

    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs bg-white/80";
    card.innerHTML = `
      <div class="space-y-0.5">
        <div class="flex items-center space-x-2">
          <button onclick="toggleStarSpot('${place.id}')" class="focus:outline-none transition-transform active:scale-125">
            ${place.starred ? '<span class="text-amber-400 text-base">★</span>' : '<span class="text-stone-300 hover:text-amber-400 text-base">☆</span>'}
          </button>
          <h4 style="color: var(--pond-green);" class="font-bold text-sm">${place.name}</h4>
        </div>
        <p class="text-stone-500">${place.city ? place.city + ' • ' : ''}${place.category || 'General'}${distanceLabel}</p>
      </div>
      <a href="${place.map || '#'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px]" style="background-color: var(--pond-bg); color: var(--pond-green);">
        <i class="fa-solid fa-location-dot me-1"></i>Map
      </a>
    `;
    container.appendChild(card);
  });
}

// --- WADDLE VIEW (LIMITED TO TOP 3 STATIONS + NEAR HOTEL) ---
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

  const stationCounts = {};
  places.forEach(p => {
    if (p.station && p.station !== 'N/A' && p.station !== 'No station nearby') {
      stationCounts[p.station] = (stationCounts[p.station] || 0) + 1;
    }
  });

  const topStations = Object.keys(stationCounts).slice(0, 3);

  if (quickHubsContainer) {
    quickHubsContainer.innerHTML = "";
    
    // 1. Near Hotel Chip
    const hotelChip = document.createElement('button');
    hotelChip.className = `px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all ${selectedWaddleCluster === 'NEAR_HOTEL' ? 'bg-emerald-900 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`;
    hotelChip.innerHTML = `<i class="fa-solid fa-hotel me-1"></i>Near Hotel`;
    hotelChip.onclick = () => { selectedWaddleCluster = 'NEAR_HOTEL'; renderWaddleView(); };
    quickHubsContainer.appendChild(hotelChip);

    // 2. Top 3 Stations Only
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
      const isHotelCluster = p.station && (p.station.toLowerCase().includes(hotelStation) || p.station.toLowerCase().includes("setiabudi") || p.station.toLowerCase().includes("bundaran hi"));
      return matchesSearch && isHotelCluster;
    } else {
      return matchesSearch && p.station === selectedWaddleCluster;
    }
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No cozy spots found in this cluster.</p>`;
    return;
  }

  filtered.forEach(p => {
    const div = document.createElement('div');
    div.className = "lily-card p-3.5 text-xs flex justify-between items-center mb-2 bg-white/80";
    div.innerHTML = `
      <div class="flex items-center space-x-2.5">
        <button onclick="toggleStarSpot('${p.id}')" class="focus:outline-none">
          ${p.starred ? '<span class="text-amber-400 text-base">★</span>' : '<span class="text-stone-300 hover:text-amber-400 text-base">☆</span>'}
        </button>
        <div>
          <div class="flex items-center space-x-1.5">
            <strong style="color: var(--pond-green);" class="text-sm font-bold">${p.name}</strong>
          </div>
          <p class="text-stone-500 text-[11px] mt-0.5"><i class="fa-solid fa-train-subway me-1 text-emerald-700"></i>${p.station || 'Near Station'} ${p.walk ? '• ' + p.walk : ''}</p>
        </div>
      </div>
      <a href="${p.map || '#'}" target="_blank" class="px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-emerald-50 border border-emerald-100" style="color: var(--pond-green);">
        Go ➔
      </a>
    `;
    container.appendChild(div);
  });
}

// --- ITINERARY ---
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
    if (activeItineraryDay === d) btn.style.backgroundColor = 'var(--pond-green)';
    btn.innerText = `Day ${d}`;
    btn.onclick = () => { activeItineraryDay = d; renderItinerary(); };
    dayButtonsContainer.appendChild(btn);
  }

  const dayActivities = (trip.itinerary || [])
    .filter(act => act.day === activeItineraryDay)
    .sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));

  if (dayActivities.length === 0) {
    timelineContainer.innerHTML = `<p class="text-xs text-stone-400 py-6 text-center">No activities planned for Day ${activeItineraryDay}. Tap "+ Add" to begin!</p>`;
    return;
  }

  dayActivities.forEach((act) => {
    const realIdx = trip.itinerary.indexOf(act);
    const item = document.createElement('div');
    item.className = "relative pl-8 space-y-1";
    item.innerHTML = `
      <div class="absolute left-2 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs" style="background-color: var(--pond-green);"></div>
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

// --- CHECKLISTS & EXPENSES RENDERER ---
function renderChecklistsAndExpenses() {
  const trip = getActiveTrip();
  if (!trip.checklists) trip.checklists = { prep: [], packing: [] };
  if (!trip.expenses) trip.expenses = [];

  // 1. Prep List
  const prepContainer = document.getElementById('checklist-sub-prep');
  if (prepContainer) {
    prepContainer.innerHTML = `
      <div class="space-y-2">
        <div class="flex gap-2 mb-3">
          <input type="text" id="new-prep-input" placeholder="Add prep item..." class="w-full bg-white border border-stone-200 rounded-2xl p-2.5 text-xs">
          <button onclick="addChecklistItem('prep')" style="background-color: var(--pond-green);" class="px-3.5 py-2 text-white rounded-2xl font-semibold flex-shrink-0">Add</button>
        </div>
        ${trip.checklists.prep.map((item, idx) => `
          <div class="flex justify-between items-center bg-white/80 p-3 rounded-2xl border border-stone-200/60">
            <label class="flex items-center space-x-2.5 cursor-pointer">
              <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleChecklistItem('prep', ${idx})" class="rounded text-emerald-800">
              <span class="${item.done ? 'line-through text-stone-400' : 'text-stone-700'}">${item.text}</span>
            </label>
            <button onclick="deleteChecklistItem('prep', ${idx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-xs"></i></button>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 2. Packing List
  const packContainer = document.getElementById('checklist-sub-packing');
  if (packContainer) {
    packContainer.innerHTML = `
      <div class="space-y-2">
        <div class="flex gap-2 mb-3">
          <input type="text" id="new-pack-input" placeholder="Add packing item..." class="w-full bg-white border border-stone-200 rounded-2xl p-2.5 text-xs">
          <button onclick="addChecklistItem('packing')" style="background-color: var(--pond-green);" class="px-3.5 py-2 text-white rounded-2xl font-semibold flex-shrink-0">Add</button>
        </div>
        ${trip.checklists.packing.map((item, idx) => `
          <div class="flex justify-between items-center bg-white/80 p-3 rounded-2xl border border-stone-200/60">
            <label class="flex items-center space-x-2.5 cursor-pointer">
              <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleChecklistItem('packing', ${idx})" class="rounded text-emerald-800">
              <span class="${item.done ? 'line-through text-stone-400' : 'text-stone-700'}">${item.text}</span>
            </label>
            <button onclick="deleteChecklistItem('packing', ${idx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-xs"></i></button>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 3. Expenses List
  const expContainer = document.getElementById('checklist-sub-expenses');
  if (expContainer) {
    expContainer.innerHTML = `
      <div class="space-y-2">
        <div class="flex gap-2 mb-3">
          <input type="text" id="new-exp-title" placeholder="Expense title..." class="w-3/5 bg-white border border-stone-200 rounded-2xl p-2.5 text-xs">
          <input type="text" id="new-exp-amount" placeholder="Amount" class="w-2/5 bg-white border border-stone-200 rounded-2xl p-2.5 text-xs">
          <button onclick="addExpenseItem()" style="background-color: var(--pond-green);" class="px-3 py-2 text-white rounded-2xl font-semibold flex-shrink-0">Add</button>
        </div>
        ${trip.expenses.map((exp, idx) => `
          <div class="flex justify-between items-center bg-white/80 p-3 rounded-2xl border border-stone-200/60">
            <div>
              <span class="font-bold text-stone-800 block">${exp.title}</span>
            </div>
            <div class="flex items-center space-x-3">
              <span style="color: var(--pond-green);" class="font-bold">${exp.amount}</span>
              <button onclick="deleteExpenseItem(${idx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-xs"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

function addChecklistItem(type) {
  const inputId = type === 'prep' ? 'new-prep-input' : 'new-pack-input';
  const val = document.getElementById(inputId)?.value.trim();
  if (!val) return;
  const trip = getActiveTrip();
  trip.checklists[type].push({ text: val, done: false });
  saveAppData();
  renderChecklistsAndExpenses();
}

function toggleChecklistItem(type, idx) {
  const trip = getActiveTrip();
  trip.checklists[type][idx].done = !trip.checklists[type][idx].done;
  saveAppData();
  renderChecklistsAndExpenses();
}

function deleteChecklistItem(type, idx) {
  const trip = getActiveTrip();
  trip.checklists[type].splice(idx, 1);
  saveAppData();
  renderChecklistsAndExpenses();
}

function addExpenseItem() {
  const title = document.getElementById('new-exp-title')?.value.trim();
  const amount = document.getElementById('new-exp-amount')?.value.trim();
  if (!title || !amount) return;
  const trip = getActiveTrip();
  trip.expenses.push({ title, amount });
  saveAppData();
  renderChecklistsAndExpenses();
}

function deleteExpenseItem(idx) {
  const trip = getActiveTrip();
  trip.expenses.splice(idx, 1);
  saveAppData();
  renderChecklistsAndExpenses();
}

function switchChecklistSubTab(tab) {
  ['prep', 'packing', 'expenses'].forEach(t => {
    document.getElementById(`checklist-sub-${t}`)?.classList.add('hidden');
    const btn = document.getElementById(`checktab-${t}`);
    if (btn) {
      btn.classList.remove('border-emerald-800', 'text-stone-800', 'font-bold');
      btn.classList.add('text-stone-400', 'border-transparent', 'font-semibold');
    }
  });

  document.getElementById(`checklist-sub-${tab}`)?.classList.remove('hidden');
  const activeBtn = document.getElementById(`checktab-${tab}`);
  if (activeBtn) {
    activeBtn.classList.remove('text-stone-400', 'border-transparent', 'font-semibold');
    activeBtn.classList.add('border-emerald-800', 'text-stone-800', 'font-bold');
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

  const selectedCity = citySelect.value;
  hotelSelect.innerHTML = "";

  const hotels = hotelDatabase[selectedCity] || [];
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
    const autoStation = typeof findNearestStation === 'function' ? findNearestStation(found.lat, found.lng, city) : "Near Hotel Area";
    previewLabel.innerText = autoStation;
  }
}

function openHotelModal() {
  const trip = getActiveTrip();
  let initialCity = "jakarta";
  if (trip.name && trip.name.toLowerCase().includes("bandung")) initialCity = "bandung";
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
  trip.hotelStation = previewLabel ? previewLabel.innerText : "Near Hotel Area";

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
        <span class="text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full" style="background-color: var(--sage-green);">${trip.category || 'Trip'}</span>
        <span class="text-xs text-stone-400"><i class="fa-solid fa-calendar-days me-1"></i>${trip.startDate || ''} - ${trip.endDate || ''}</span>
      </div>
      <h3 style="color: var(--pond-green);" class="font-bold text-lg leading-tight">${trip.name}</h3>
      <div class="flex justify-between text-xs text-stone-500 pt-1">
        <span><i class="fa-solid fa-users me-1"></i>${trip.people || '1 Pax'}</span>
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
        <h4 style="color: var(--pond-green);" class="font-bold text-base">${trip.name}</h4>
        <p class="text-xs text-stone-400">${trip.category} • ${trip.startDate || 'TBD'}</p>
      </div>
      <button class="text-xs px-3 py-1.5 rounded-xl font-semibold text-white" style="background-color: var(--pond-green);">Open ➔</button>
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
      checklists: { prep: [], packing: [] },
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
  document.getElementById('spot-form-category').value = place.category || 'Attraction';
  document.getElementById('spot-form-station').value = place.station || '';
  document.getElementById('spot-form-walk').value = place.walk || '';
  document.getElementById('modal-spot-title').innerText = "Edit Location Spot";
  openModal('modal-master-spot');
}

function saveMasterSpotForm() {
  const name = document.getElementById('spot-form-name').value.trim();
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
      place.category = category;
      place.station = station || place.station;
      place.walk = walk;
      place.map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
    }
  } else {
    trip.places.push({
      id: "p_" + Date.now(),
      name: name,
      city: "Jakarta",
      category: category,
      station: station || "Near Hotel Area",
      walk: walk,
      map: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`,
      starred: false
    });
  }

  saveAppData();
  closeModal('modal-master-spot');
  renderMasterPlacesList();
  renderWaddleView();
  renderStarredLocationsSummary();
}

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

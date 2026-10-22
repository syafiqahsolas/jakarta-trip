/**
 * LILY POND & CARNIVAL TRAVEL HUB - APP.JS
 * Complete Logic with Image 2 Palette, Hidden Nav on Home,
 * Fixed Hotel Base Loading, Merged Docs Upload in Packing,
 * Spots Map + Gallery Detail View, & Timeline Itinerary.
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
      name: "Jakarta & Bandung Escape",
      startDate: "2026-11-21",
      endDate: "2026-11-26",
      category: "Vacation",
      people: "5 Pax",
      budget: "RM 2,000 / pax",
      activeHotel: "The Papandayan Hotel",
      hotelCity: "bandung",
      hotelStation: "Bandung Station (23 min walk)",
      places: [],
      itinerary: [
        { day: 1, title: "Airport Arrival & Whoosh Transfer", time: "09:00", location: "CGK / Halim Station", notes: "High speed train to Bandung", starred: true },
        { day: 1, title: "Hotel Check-in & Relaxation", time: "14:00", location: "The Papandayan Hotel", notes: "Unpack and rest", starred: true }
      ],
      checklists: {
        packing: [
          { text: "Passport & ID", category: "documents", done: true, important: true, fileData: null },
          { text: "Whoosh Train Ticket", category: "documents", done: false, important: true, fileData: null },
          { text: "Universal Adapter", category: "electronics", done: false, important: true },
          { text: "T-Shirts (5x)", category: "clothes", done: false, important: false }
        ]
      },
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
let activeLocationSubTab = "nearby";
let activePackingCategory = "clothes";
let activeTransportMode = "walk";

let editingItineraryIndex = null;
let editingPlaceId = null;
let editingExpenseIndex = null;
let editingPackingIndex = null;
let editingTicketIndex = null;
let activeItinTab = 'plan';
const TICKET_ICONS = { Flight: 'fa-plane', Train: 'fa-train', Bus: 'fa-bus', Hotel: 'fa-hotel', Other: 'fa-ticket' };
const ticketIcon = t => TICKET_ICONS[t] || TICKET_ICONS.Other;
let pendingCover = null;
let userLoc = { lat: -6.1754, lng: 106.8272, label: "Jakarta (simulated)" };
const WALK_M_PER_MIN = 80;
const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4E888A"/><stop offset="1" stop-color="#113665"/></linearGradient></defs><rect width="600" height="400" fill="url(#g)"/></svg>');

// Downscale photos so they fit in Firestore (1 MB per document)
function scaleImage(file, maxDim, cb) {
  const r = new FileReader();
  r.onload = e => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, maxDim / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      cb(c.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => cb(e.target.result);
    img.src = e.target.result;
  };
  r.readAsDataURL(file);
}
function walkMins(lat1, lng1, lat2, lng2) { return Math.round(calculateDistanceInKm(lat1, lng1, lat2, lng2) * 1000 / WALK_M_PER_MIN); }
function getHotelObj(trip) {
  const list = (typeof hotelDatabase !== 'undefined' && hotelDatabase[getActiveHotelCity(trip)]) || [];
  return list.find(h => h.name === trip.activeHotel) || null;
}
// Stations within maxMins walk of a point, nearest first
function stationsNear(lat, lng, city, maxMins = 30) {
  return (stationDatabase[city] || []).map(s => ({ ...s, mins: walkMins(lat, lng, s.lat, s.lng) }))
    .filter(s => s.mins <= maxMins).sort((a, b) => a.mins - b.mins);
}
function stationLabel(lat, lng, city) {
  const s = stationsNear(lat, lng, city)[0];
  return s ? `${s.name} (${s.mins} min walk)` : "No station within 30 min walk";
}
function openImageViewer(src) { document.getElementById('image-viewer-img').src = src; openModal('modal-image'); }

// --- INITIALIZATION ---
window.onload = function() {
  initHotelDatabase();
  listenToCloudChanges();
};

function initHotelDatabase() {
  if (typeof hotelDatabase === 'undefined' || !hotelDatabase) {
    window.hotelDatabase = {
      jakarta: [
        { name: "Hotel Grand Sahid Jaya", city: "Jakarta", lat: -6.210709476, lng: 106.8200146, nearestStation: "Setiabudi Astra (1 min walk)" },
        { name: "Park Hyatt Jakarta", city: "Jakarta", lat: -6.1845858, lng: 106.8313233, nearestStation: "Gondangdia (3 min walk)" }
      ],
      bandung: [
        { name: "The Papandayan Hotel", city: "Bandung", lat: -6.9242, lng: 107.6231, nearestStation: "Bandung Station (23 min walk)" },
        { name: "Padma Hotel Bandung", city: "Bandung", lat: -6.8488, lng: 107.6105, nearestStation: "No station nearby" }
      ]
    };
  }
}

function checklistStorageKey(tripId) { return `lily_pond_device_checklists_${tripId}`; }
function saveDeviceChecklists() {
  try { appData.trips.forEach(t => localStorage.setItem(checklistStorageKey(t.id), JSON.stringify(t.checklists || { packing: [] }))); } catch (e) { console.warn('Device checklist storage unavailable', e); }
}
function hydrateDeviceChecklists() {
  try { appData.trips.forEach(t => { const raw = localStorage.getItem(checklistStorageKey(t.id)); if (raw) t.checklists = JSON.parse(raw); else localStorage.setItem(checklistStorageKey(t.id), JSON.stringify(t.checklists || { packing: [] })); }); } catch (e) { console.warn('Device checklist storage unavailable', e); }
}
function listenToCloudChanges() {
  const docRef = db.collection("travelHub").doc("sharedTripData");

  docRef.onSnapshot((doc) => {
    if (doc.exists) {
      appData = doc.data();
      hydrateDeviceChecklists();
      if (appData.currentTripId) activeTripId = appData.currentTripId;

      let trip = getActiveTrip();
      if (syncMasterLocations(trip)) saveAppData();

      localStorage.setItem("lily_pond_image2_data", JSON.stringify(appData));
      renderHomeViews();
      renderActiveTripDashboard();
    } else {
      const trip = getActiveTrip();
      if (typeof getAllMasterLocations === 'function' && (!trip.places || trip.places.length === 0)) {
        trip.places = getAllMasterLocations();
      }
      saveAppData();
    }
  }, (error) => {
    const saved = localStorage.getItem("lily_pond_image2_data");
    if (saved) appData = JSON.parse(saved);
    renderHomeViews();
    renderActiveTripDashboard();
  });
}

// Add any new spots from location.js (and fill in missing coordinates) without touching your edits
function syncMasterLocations(trip) {
  if (typeof getAllMasterLocations !== 'function') return false;
  let changed = false;
  getAllMasterLocations().forEach(m => {
    const p = trip.places.find(x => x.id === m.id);
    if (!p) { trip.places.push({ ...m }); changed = true; }
    else if (!p.lat && m.lat) { p.lat = m.lat; p.lng = m.lng; changed = true; }
  });
  return changed;
}

// Stylised "pond map": pins + dashed route, no external map service needed
function renderMiniMap(id, pts, opts = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  pts = pts.filter(p => p.lat && p.lng);
  if (!pts.length) { el.innerHTML = `<div class="h-28 flex items-center justify-center text-xs text-stone-400 px-6 text-center" style="background: var(--beige);">${opts.empty || 'No mapped places yet'}</div>`; return; }
  const W = 360, H = 190, pad = 28;
  const lats = pts.map(p => p.lat), lngs = pts.map(p => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const k = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
  const sx = Math.max((maxLng - minLng) * k, 1e-4), sy = Math.max(maxLat - minLat, 1e-4);
  const s = Math.min((W - 2 * pad) / sx, (H - 2 * pad) / sy);
  const ox = (W - sx * s) / 2, oy = (H - sy * s) / 2;
  const P = pts.map(p => ({ ...p, x: ox + (p.lng - minLng) * k * s, y: oy + (maxLat - p.lat) * s }));
  const col = { stop: '#4D5A2E', you: '#E9767F', hotel: '#8A8C41', spot: '#C4BA65' };
  let km = 0;
  if (opts.route) for (let i = 1; i < pts.length; i++) km += calculateDistanceInKm(pts[i - 1].lat, pts[i - 1].lng, pts[i].lat, pts[i].lng);
  const pads = [[40, 150, 26], [300, 40, 20], [330, 160, 16], [150, 30, 14], [90, 100, 12]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#8A8C41" opacity=".13"/>`).join('');
  const path = opts.route && P.length > 1 ? `<polyline points="${P.map(p => p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')}" fill="none" stroke="#4D5A2E" stroke-width="2.5" stroke-dasharray="6 5" stroke-linecap="round" opacity=".7"/>` : '';
  let n = 0;
  const pins = P.map(p => {
    const lab = (p.label || '').slice(0, 16);
    const inner = p.kind === 'stop' ? `<text x="${p.x}" y="${p.y + 4}" text-anchor="middle" font-size="11" font-weight="800" fill="#fff">${++n}</text>` : '';
    return `<circle cx="${p.x}" cy="${p.y}" r="${p.kind === 'stop' ? 11 : 8}" fill="${col[p.kind] || col.spot}" stroke="#fff" stroke-width="2.5"/>${inner}<text x="${p.x}" y="${p.y + 24}" text-anchor="middle" font-size="9" font-weight="700" fill="#39431f" stroke="#F7F4E8" stroke-width="3" paint-order="stroke">${lab.replace(/&/g, '&amp;')}</text>`;
  }).join('');
  const cap = opts.caption || (opts.route ? `${pts.length} stop${pts.length > 1 ? 's' : ''} • ≈ ${km.toFixed(1)} km straight-line${km <= 8 ? ` • ~${Math.round(km * 1000 / WALK_M_PER_MIN)} min if on foot` : ' • includes train / car legs'}` : '');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" class="w-full block" style="background: linear-gradient(160deg, #F1ECD3, #E3E2B0);">${pads}${path}${pins}</svg>${cap ? `<div class="px-3.5 py-2 text-[11px] font-semibold text-white" style="background: var(--midnight-blue);">🦆 ${cap}</div>` : ''}`;
}

function saveAppData() {
  appData.currentTripId = activeTripId;
  saveDeviceChecklists();
  localStorage.setItem("lily_pond_image2_data", JSON.stringify(appData));
  // Shared trip content syncs across devices; packing/checklist data stays device-local.
  const sharedData = JSON.parse(JSON.stringify(appData));
  (sharedData.trips || []).forEach(t => { delete t.checklists; });
  db.collection("travelHub").doc("sharedTripData").set(sharedData).catch((err) => console.error("Cloud sync error:", err));
}

function getActiveTrip() {
  let trip = appData.trips.find(t => t.id === activeTripId);
  if (!trip) {
    trip = appData.trips[0];
    if (trip) activeTripId = trip.id;
  }
  if (trip) {
    if (!trip.places) trip.places = [];
    trip.places.forEach(p => { if (!p.city && p.id && p.id.startsWith('jkt_')) p.city = 'Jakarta'; });
    if (!trip.itinerary) trip.itinerary = [];
    if (trip.checklists && trip.checklists.packing) trip.checklists.packing.forEach(i => { if (!i.id) i.id = 'd_' + Math.random().toString(36).slice(2, 9); });
    if (!trip.tickets) trip.tickets = [];
    if (!trip.checklists) trip.checklists = { packing: [] };
    if (!trip.expenses) trip.expenses = [];
  }
  return trip;
}

// --- NAVIGATION & BOTTOM NAVBAR TOGGLE ---
function openHomePage(subTab = 'upcoming') {
  document.getElementById('section-home')?.classList.remove('hidden');
  document.getElementById('section-trip-dashboard')?.classList.add('hidden');
  
  // Hide bottom navbar on Home Screen
  document.getElementById('floating-bottom-nav')?.classList.add('hidden');
  
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
  document.getElementById('page-spot-detail')?.classList.add('hidden');
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

  const globalTripName = document.getElementById('global-trip-name');
  if (globalTripName) globalTripName.textContent = getActiveTrip()?.name || 'Your trip';
  if (pageName === 'summary') renderSummaryPage();
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
  
  // Show bottom navbar inside trip dashboard
  document.getElementById('floating-bottom-nav')?.classList.remove('hidden');

  const globalTripName = document.getElementById('global-trip-name'); if (globalTripName) globalTripName.textContent = getActiveTrip()?.name || 'Your trip';
  renderActiveTripDashboard();
  switchDashboardPage('summary');
}

function renderHomeViews() {
  renderUpcomingTripsList();
  renderAllTripsList();
}

function isUpcoming(t) {
  const now = new Date(), lim = new Date(); lim.setMonth(lim.getMonth() + 6);
  const s = new Date(t.startDate), e = new Date(t.endDate || t.startDate);
  return (isNaN(e) || e >= now) && (isNaN(s) || s <= lim);
}

function quickOpen(page) {
  const t = appData.trips.find(isUpcoming) || appData.trips[0];
  if (!t) return openTripModal();
  openTripDashboard(t.id);
  switchDashboardPage(page);
}

function renderUpcomingTripsList() {
  const container = document.getElementById('upcoming-trips-list');
  if (!container) return;
  container.innerHTML = "";
  const list = appData.trips.filter(isUpcoming).sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  if (list.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 py-6 w-full text-center">No trips in the next 6 months. Tap + to plan one, or see All Trips.</p>`;
    return;
  }
  list.forEach(t => {
    const days = Math.ceil((new Date(t.startDate) - new Date()) / 864e5);
    const when = isNaN(days) ? 'Date TBD' : days > 0 ? `In ${days} days` : 'Ongoing';
    const card = document.createElement('div');
    card.className = "snap-start flex-shrink-0 w-64 h-44 rounded-3xl overflow-hidden shadow-md cursor-pointer active:scale-[0.98] transition-all";
    card.style.background = t.coverImage
      ? `linear-gradient(rgba(17,54,101,.1), rgba(10,51,35,.85)), url(${t.coverImage}) center/cover`
      : 'linear-gradient(135deg, var(--midnight-blue), var(--muted-teal))';
    card.onclick = () => openTripDashboard(t.id);
    card.innerHTML = `
      <div class="h-full flex flex-col justify-between p-4 text-white">
        <div class="flex justify-between items-start">
          <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full" style="background-color: var(--carnival-red);">${t.category || 'Trip'}</span>
          <span class="text-[10px] font-semibold bg-white/25 px-2 py-0.5 rounded-full">${when}</span>
        </div>
        <div>
          <h3 class="font-extrabold text-lg leading-tight">${t.name}</h3>
          <p class="text-[11px] text-white/80 mt-0.5">${t.startDate || 'TBD'} – ${t.endDate || 'TBD'} • ${t.people || ''}</p>
        </div>
      </div>`;
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
        <h4 style="color: var(--olive-green);" class="font-bold text-base">${trip.name}</h4>
        <p class="text-xs text-stone-400">${trip.category} • ${trip.startDate || 'TBD'}</p>
      </div>
      <button class="text-xs px-3 py-1.5 rounded-xl font-semibold text-white" style="background-color: var(--rose-pink);">Open ➔</button>
    `;
    container.appendChild(card);
  });
}

// --- SUMMARY DASHBOARD PAGE ---
function renderSummaryPage() {
  const trip = getActiveTrip();
  if (!trip) return;

  document.getElementById('sum-trip-title').innerText = trip.name;
  document.getElementById('sum-trip-dates').innerText = `${trip.startDate || 'TBD'} – ${trip.endDate || 'TBD'}`;
  const pEl = document.getElementById('sum-card-people'); if (pEl) pEl.innerText = trip.people || '1 Pax';
  const bEl = document.getElementById('sum-card-budget'); if (bEl) bEl.innerText = trip.budget || 'RM 0';
  const banner = document.getElementById('sum-banner');
  if (banner) banner.style.background = trip.coverImage
    ? `linear-gradient(rgba(17,54,101,.4), rgba(10,51,35,.85)), url(${trip.coverImage}) center/cover`
    : 'linear-gradient(135deg, var(--midnight-blue), var(--dark-green))';

  // Trip readiness calculation
  const packingCount = (trip.checklists?.packing || []).length;
  const packedDone = (trip.checklists?.packing || []).filter(i => i.done).length;
  const packPercent = packingCount > 0 ? Math.round((packedDone / packingCount) * 100) : 100;
  
  const percentEl = document.getElementById('readiness-percent');
  if (percentEl) percentEl.innerText = `${packPercent}%`;
  
  const bar = document.getElementById('readiness-bar-fill');
  if (bar) bar.style.width = `${packPercent}%`;

  // Render Uploaded Document Preview inside Summary
  const docPreview = document.getElementById('summary-doc-preview');
  if (docPreview) {
    const docItems = (trip.checklists?.packing || []).filter(i => i.category === 'documents' && i.fileData);
    if (docItems.length > 0) {
      const topDoc = docItems[0];
      docPreview.innerHTML = `
        <div class="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs">
          <div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Uploaded Document</span>
            <h4 style="color: var(--olive-green);" class="font-bold text-xs mt-1">${topDoc.text}</h4>
          </div>
          <img src="${topDoc.fileData}" onclick="openImageViewer(this.src)" class="w-12 h-12 object-cover rounded-xl border border-stone-200 cursor-pointer" />
        </div>
      `;
    } else {
      docPreview.innerHTML = `<p class="text-xs text-stone-400 text-center py-2">No document photos attached yet. Add in Checklist → Docs!</p>`;
    }
  }

  renderStarredLocationsSummary();
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
            <h5 style="color: var(--olive-green);" class="font-bold text-xs truncate flex items-center gap-1">
              <span class="text-amber-500">★</span>
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
      snapshotContainer.innerHTML = `<p class="text-xs text-stone-400 py-2 text-center">No starred itinerary activities looking forward to.</p>`;
    } else {
      starredItin.forEach(act => {
        const item = document.createElement('div');
        item.className = "flex justify-between items-center text-xs bg-white/80 p-2.5 rounded-2xl border border-stone-200/60";
        item.innerHTML = `
          <div>
            <strong style="color: var(--olive-green);" class="block font-bold text-xs flex items-center gap-1">
              <span class="text-amber-500 text-xs">★</span>
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

// --- WADDLE EXPLORATION ---
function getActiveHotelCity(trip) {
  const hotelName = trip.activeHotel || "";
  if (typeof hotelDatabase !== 'undefined' && hotelDatabase) {
    for (const [cityKey, cityHotels] of Object.entries(hotelDatabase)) {
      if (cityHotels.some(h => h.name === hotelName)) {
        return cityKey.toLowerCase();
      }
    }
  }
  return (trip.hotelCity || "bandung").toLowerCase();
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
  const hotel = getHotelObj(trip);
  const ht = document.getElementById('waddle-hotel-title'); if (ht) ht.innerText = trip.activeHotel || 'No hotel selected';
  const hs = document.getElementById('waddle-hotel-station');
  if (hs) hs.innerText = hotel ? 'Nearest Station: ' + stationLabel(hotel.lat, hotel.lng, activeCity) : 'Choose a hotel to see nearby stations';
  const places = (trip.places || []).filter(p => (p.city || 'jakarta').toLowerCase() === activeCity);

  const stationCounts = {};
  places.forEach(p => {
    if (p.station && p.station !== 'N/A' && p.station !== 'No station nearby') {
      stationCounts[p.station] = (stationCounts[p.station] || 0) + 1;
    }
  });

  const topStations = (hotel ? stationsNear(hotel.lat, hotel.lng, activeCity) : []).map(s => s.name).filter(n => stationCounts[n]).slice(0, 3);

  if (quickHubsContainer) {
    quickHubsContainer.innerHTML = "";
    
    const hotelChip = document.createElement('button');
    hotelChip.className = `px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all ${selectedWaddleCluster === 'NEAR_HOTEL' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`;
    hotelChip.innerHTML = `<i class="fa-solid fa-hotel me-1"></i>Near Hotel`;
    hotelChip.onclick = () => { selectedWaddleCluster = 'NEAR_HOTEL'; renderWaddleView(); };
    quickHubsContainer.appendChild(hotelChip);

    topStations.forEach(stationName => {
      const chip = document.createElement('button');
      chip.className = `px-3.5 py-1.5 rounded-2xl text-xs font-semibold transition-all ${selectedWaddleCluster === stationName ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-stone-600 border border-stone-200'}`;
      chip.innerText = `🚆 ${stationName}`;
      chip.onclick = () => { selectedWaddleCluster = stationName; renderWaddleView(); };
      quickHubsContainer.appendChild(chip);
    });
  }

  const searchQuery = (document.getElementById('waddleSearchInput')?.value || '').toLowerCase();
  const categoryBox = document.getElementById('waddle-category-filters');
  const categories = [...new Set(places.map(p => p.category || 'Other'))].sort();
  if (categoryBox) {
    const current = window.waddleCategoryFilter || 'ALL';
    categoryBox.innerHTML = '';
    ['ALL', ...categories].forEach(cat => { const b = document.createElement('button'); b.className = `px-3 py-1.5 rounded-full text-[11px] font-bold border ${current === cat ? 'text-white border-transparent' : 'bg-white text-stone-600 border-stone-200'}`; if (current === cat) b.style.backgroundColor = 'var(--midnight-blue)'; b.textContent = cat === 'ALL' ? 'All categories' : cat; b.onclick = () => { window.waddleCategoryFilter = cat; renderWaddleView(); }; categoryBox.appendChild(b); });
  }
  let filtered = places.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(searchQuery) || (p.station || '').toLowerCase().includes(searchQuery) || (p.category || '').toLowerCase().includes(searchQuery) || (p.city || '').toLowerCase().includes(searchQuery);
    const matchesCategory = !window.waddleCategoryFilter || window.waddleCategoryFilter === 'ALL' || (p.category || 'Other') === window.waddleCategoryFilter;
    const matchesCluster = selectedWaddleCluster === 'NEAR_HOTEL' ? (!hotel || !p.lat || walkMins(hotel.lat, hotel.lng, p.lat, p.lng) <= 30) : p.station === selectedWaddleCluster;
    return matchesSearch && matchesCategory && matchesCluster;
  });

  renderMiniMap('waddle-map', [...(hotel ? [{ lat: hotel.lat, lng: hotel.lng, label: 'Hotel', kind: 'hotel' }] : []), ...filtered.filter(p => p.lat).slice(0, 12).map(p => ({ lat: p.lat, lng: p.lng, label: p.name, kind: 'spot' }))], { caption: `Around ${trip.activeHotel || 'your hotel'}`, empty: 'No mapped spots within 30 min of the hotel yet' });
  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No transport/waddle spots found for ${activeCity.toUpperCase()}.</p>`;
    return;
  }

  filtered.forEach(p => {
    const div = document.createElement('div');
    div.className = "lily-card p-3.5 text-xs flex justify-between items-center mb-2 bg-white/80 cursor-pointer hover:border-amber-500 transition-all";
    div.onclick = () => openSpotDetailView(p);

    const stationTag = (p.station && p.station !== 'N/A' && p.station !== 'No station nearby')
      ? `<i class="fa-solid fa-train-subway me-1 text-emerald-700"></i>${p.station}`
      : `<i class="fa-solid fa-person-walking me-1 text-emerald-700"></i>${p.walk || 'Short Walk'}`;

    div.innerHTML = `
      <div class="flex items-center space-x-2.5">
        <div class="w-9 h-9 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
          <i class="fa-solid fa-dove text-sm"></i>
        </div>
        <div>
          <strong style="color: var(--olive-green);" class="text-sm font-bold block">${p.name}</strong>
          <p class="text-stone-500 text-[11px] mt-0.5">${stationTag} • ${p.category}</p>
        </div>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800">View ➔</span>
    `;
    container.appendChild(div);
  });
}

// --- SPOTS DETAIL VIEW (Image 7 & 8 Concept: Back Button, Edit, Star & Gallery) ---
function openSpotDetailView(place) {
  const container = document.getElementById('page-spot-detail');
  if (!container) return;
  const galleryImages = (place.gallery && place.gallery.length) ? place.gallery : [PLACEHOLDER_IMG];
  document.getElementById('page-master')?.classList.add('hidden');
  container.classList.remove('hidden');

  container.innerHTML = `
    <div class="space-y-4 animate-fadeIn">
      <!-- Fixed Working Go Back Button -->
      <button onclick="closeSpotDetail()" class="text-xs font-semibold px-3.5 py-2 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center gap-1.5 w-fit shadow-xs">
        <i class="fa-solid fa-arrow-left"></i> Back to Spots
      </button>

      <div class="lily-card overflow-hidden bg-white">
        <!-- Photo Gallery Header -->
        <div class="h-48 bg-stone-200 relative overflow-hidden flex items-center justify-center">
          <img id="spot-detail-main-img" src="${galleryImages[0]}" onclick="openImageViewer(this.src)" class="w-full h-full object-cover cursor-pointer" />
          <span class="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-3 py-1 rounded-full text-xs font-bold text-stone-800">${place.category}</span>
          <button onclick="triggerSpotPhotoUpload('${place.id}')" class="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white px-2.5 py-1 rounded-xl text-[10px] font-semibold">
            <i class="fa-solid fa-camera me-1"></i>Add Photo
          </button>
        </div>

        <!-- Detail Content -->
        <div class="p-5 space-y-4">
          <div class="flex justify-between items-start">
            <div>
              <h2 style="color: var(--olive-green);" class="font-extrabold text-xl">${place.name}</h2>
              <p class="text-xs text-stone-500 mt-0.5"><i class="fa-solid fa-location-dot text-rose-600 me-1"></i>${place.city || 'Jakarta'} • ${place.station || 'Near Hotel'}</p>
            </div>
            
            <!-- Actions: Edit & Star/Unstar -->
            <div class="flex items-center space-x-2">
              <button onclick="openEditSpotModal('${place.id}')" class="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200">
                <i class="fa-solid fa-pen text-xs"></i>
              </button>
              <button onclick="toggleStarSpot('${place.id}'); openSpotDetailView(getActiveTrip().places.find(p => p.id === '${place.id}'));" class="text-xl">
                ${place.starred ? '<span class="text-amber-500">★</span>' : '<span class="text-stone-300">☆</span>'}
              </button>
            </div>
          </div>

          <p class="text-xs text-stone-600 leading-relaxed">This spot is located within easy reach of your accommodation base. Enjoy local delicacies, cultural points, and scenic views.</p>

          <!-- Gallery Thumbnails -->
          <div class="space-y-1.5">
            <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Spot Gallery</span>
            <div id="spot-gallery-thumbs" class="flex space-x-2 overflow-x-auto pb-1">
              ${galleryImages.map((imgUrl, i) => `
                <img src="${imgUrl}" onclick="document.getElementById('spot-detail-main-img').src='${imgUrl}'" class="w-14 h-14 object-cover rounded-xl border border-stone-200 cursor-pointer hover:scale-105 transition-all" />
              `).join('')}
            </div>
          </div>

          <!-- Get Directions Map Button -->
          <a href="${place.map || 'https://maps.google.com/?q=' + encodeURIComponent(place.name)}" target="_blank" class="w-full py-3 rounded-2xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm" style="background-color: var(--rose-pink);">
            <i class="fa-solid fa-diamond-turn-right"></i> Get Directions
          </a>
        </div>
      </div>
    </div>
  `;
}

function closeSpotDetail() {
  document.getElementById('page-spot-detail')?.classList.add('hidden');
  document.getElementById('page-master')?.classList.remove('hidden');
  renderLocationsPage();
}

function triggerSpotPhotoUpload(placeId) {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = (e) => {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    scaleImage(f, 800, data => {
      const place = getActiveTrip().places.find(p => p.id === placeId);
      if (place) { (place.gallery = place.gallery || []).unshift(data); saveAppData(); openSpotDetailView(place); }
    });
  };
  input.click();
}

// --- LOCATIONS PAGE (Nearby First) ---
function switchLocationSubTab(tab) {
  activeLocationSubTab = tab;
  const masterSub = document.getElementById('loc-sub-master');
  const nearbySub = document.getElementById('loc-sub-nearby');
  const btnMaster = document.getElementById('loctab-master');
  const btnNearby = document.getElementById('loctab-nearby');

  if (tab === 'nearby') {
    nearbySub?.classList.remove('hidden');
    masterSub?.classList.add('hidden');
    btnNearby?.classList.add('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
    btnNearby?.classList.remove('text-stone-500', 'font-semibold');
    btnMaster?.classList.remove('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
    btnMaster?.classList.add('text-stone-500', 'font-semibold');
    renderNearbyPlacesList();
  } else {
    masterSub?.classList.remove('hidden');
    nearbySub?.classList.add('hidden');
    btnMaster?.classList.add('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
    btnMaster?.classList.remove('text-stone-500', 'font-semibold');
    btnNearby?.classList.remove('text-stone-800', 'bg-white', 'shadow-xs', 'font-bold');
    btnNearby?.classList.add('text-stone-500', 'font-semibold');
    renderMasterPlacesList();
  }
}

function setTransportMode(mode) {
  activeTransportMode = mode;
  const btnWalk = document.getElementById('transport-btn-walk');
  const btnCar = document.getElementById('transport-btn-car');

  if (mode === 'walk') {
    btnWalk?.classList.add('bg-amber-100', 'text-amber-900', 'font-bold');
    btnWalk?.classList.remove('text-stone-500', 'font-semibold');
    btnCar?.classList.remove('bg-amber-100', 'text-amber-900', 'font-bold');
    btnCar?.classList.add('text-stone-500', 'font-semibold');
  } else {
    btnCar?.classList.add('bg-amber-100', 'text-amber-900', 'font-bold');
    btnCar?.classList.remove('text-stone-500', 'font-semibold');
    btnWalk?.classList.remove('bg-amber-100', 'text-amber-900', 'font-bold');
    btnWalk?.classList.add('text-stone-500', 'font-semibold');
  }
  renderNearbyPlacesList();
}

function renderLocationsPage() {
  switchLocationSubTab(activeLocationSubTab);
}

function useMyGps() {
  if (!navigator.geolocation) return alert("GPS isn't available on this device.");
  navigator.geolocation.getCurrentPosition(
    pos => { userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Your GPS location" }; renderNearbyPlacesList(); },
    () => alert("Couldn't get your GPS. Staying on simulated Jakarta."), { timeout: 8000 });
}
function useSimulatedJakarta() { userLoc = { lat: -6.1754, lng: 106.8272, label: "Jakarta (simulated)" }; renderNearbyPlacesList(); }

function renderNearbyPlacesList() {
  const container = document.getElementById('nearbyPlacesContainer');
  if (!container) return;
  const lbl = document.getElementById('nearby-loc-label'); if (lbl) lbl.innerText = userLoc.label;
  container.innerHTML = "";
  const walk = activeTransportMode === 'walk';
  const list = (getActiveTrip().places || []).filter(p => p.lat && p.lng)
    .map(p => { const km = calculateDistanceInKm(userLoc.lat, userLoc.lng, p.lat, p.lng); return { p, km, wm: Math.round(km * 1000 / WALK_M_PER_MIN), dm: Math.max(3, Math.round(km / 25 * 60)) }; })
    .filter(x => walk ? x.wm <= 40 : x.km <= 20).sort((a, b) => a.km - b.km);

  renderMiniMap('nearby-map', [{ lat: userLoc.lat, lng: userLoc.lng, label: 'You', kind: 'you' }, ...list.slice(0, 10).map(x => ({ lat: x.p.lat, lng: x.p.lng, label: x.p.name, kind: 'spot' }))], { caption: `${userLoc.label} • ${list.length} spots nearby`, empty: 'No mapped spots near this location' });
  if (list.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No spots within ${walk ? '40 min walk' : '20 km'} of ${userLoc.label}. Try Car / Taxi.</p>`;
    return;
  }
  list.forEach(({ p, km, wm, dm }) => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs bg-white/80 cursor-pointer hover:border-amber-500 transition-all";
    card.onclick = () => openSpotDetailView(p);
    const badge = walk ? `<i class="fa-solid fa-person-walking text-emerald-700 me-1"></i>${wm} min walk` : `<i class="fa-solid fa-car text-amber-700 me-1"></i>~${dm} min drive`;
    card.innerHTML = `
      <div class="space-y-0.5">
        <div class="flex items-center space-x-2">
          <button onclick="event.stopPropagation(); toggleStarSpot('${p.id}')" class="focus:outline-none">${p.starred ? '<span class="text-amber-500 text-base">★</span>' : '<span class="text-stone-300 hover:text-amber-500 text-base">☆</span>'}</button>
          <h4 style="color: var(--olive-green);" class="font-bold text-sm">${p.name}</h4>
        </div>
        <p class="text-stone-500">${badge} • ${km.toFixed(1)} km • ${p.category}</p>
      </div>
      <a href="${p.map || '#'}" target="_blank" onclick="event.stopPropagation();" class="px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-emerald-50 text-emerald-800">Map ➔</a>`;
    container.appendChild(card);
  });
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
    const matchesCat = filterCat === 'all' || pCat === filterCat.toLowerCase();
    return matchesQuery && matchesCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">No master locations found.</p>`;
    return;
  }

  filtered.forEach(place => {
    const card = document.createElement('div');
    card.className = "lily-card p-3.5 flex justify-between items-center text-xs bg-white/80 cursor-pointer hover:border-amber-500 transition-all";
    card.onclick = () => openSpotDetailView(place);
    card.innerHTML = `
      <div class="space-y-0.5">
        <div class="flex items-center space-x-2">
          <button onclick="event.stopPropagation(); toggleStarSpot('${place.id}')" class="focus:outline-none">
            ${place.starred ? '<span class="text-amber-500 text-base">★</span>' : '<span class="text-stone-300 hover:text-amber-500 text-base">☆</span>'}
          </button>
          <h4 style="color: var(--olive-green);" class="font-bold text-sm">${place.name}</h4>
          <button onclick="event.stopPropagation(); openEditSpotModal('${place.id}')" class="text-stone-300 hover:text-stone-600 text-xs ms-1"><i class="fa-solid fa-pen"></i></button>
        </div>
        <p class="text-stone-500"><span class="font-bold text-amber-800">${place.city || 'Jakarta'}</span> • ${place.category || 'General'}${place.lat ? '' : ' • <span class="text-rose-600">no coordinates</span>'}</p>
      </div>
      <a href="${place.map || '#'}" target="_blank" onclick="event.stopPropagation();" class="px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-emerald-50 text-emerald-800">Map ➔</a>
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
    renderLocationsPage();
    renderWaddleView();
    renderSummaryPage();
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
    renderSummaryPage();
  }
}

// --- TIMELINE ITINERARY (Image 9 & 10 Concept) ---
function getTotalTripDays(trip) {
  if (!trip.startDate || !trip.endDate) return 5;
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return isNaN(diffDays) || diffDays <= 0 ? 5 : diffDays;
}

function dayParts(trip, d) {
  if (!trip.startDate) return { wd: 'Day', dd: d };
  const dt = new Date(new Date(trip.startDate).getTime() + (d - 1) * 864e5);
  return { wd: dt.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' }), dd: dt.getUTCDate(),
    full: dt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' }) };
}

// Find map coordinates for an activity: pinned spot/hotel first, then name matching
function resolveCoord(trip, a) {
  if (a.placeId === 'hotel') { const h = getHotelObj(trip); if (h) return h; }
  const byId = a.placeId && trip.places.find(p => p.id === a.placeId);
  if (byId && byId.lat) return byId;
  const txt = ((a.location || '') + ' ' + (a.title || '')).toLowerCase();
  const pools = [trip.places.filter(p => p.lat), Object.values(hotelDatabase).flat(), Object.values(stationDatabase).flat()];
  for (const pool of pools) { const m = pool.find(x => txt.includes(x.name.toLowerCase())); if (m) return m; }
  return null;
}

function openDocById(id) {
  const d = getActiveTrip().checklists.packing.find(i => i.id === id);
  if (d && d.fileData) openImageViewer(d.fileData);
  else { switchDashboardPage('checklists'); selectPackingCategory('documents'); }
}

function renderItinerary() {
  const trip = getActiveTrip();
  const box = document.getElementById('itinerary-timeline-container'), strip = document.getElementById('itin-day-strip');
  if (!box || !strip) return;
  const total = getTotalTripDays(trip);
  if (activeItineraryDay > total) activeItineraryDay = 1;
  const sub = document.getElementById('itin-subtitle');
  if (sub) sub.innerText = `${trip.name} • ${total} days`;

  strip.innerHTML = "";
  for (let d = 1; d <= total; d++) {
    const p = dayParts(trip, d), on = d === activeItineraryDay;
    const b = document.createElement('button');
    b.className = `flex-shrink-0 w-14 py-2 rounded-2xl text-center transition-all ${on ? 'text-white shadow-md' : 'bg-white text-stone-500 border border-stone-200'}`;
    if (on) b.style.backgroundColor = 'var(--midnight-blue)';
    b.innerHTML = `<span class="block text-[10px] font-semibold">${p.wd}</span><span class="block text-lg font-extrabold leading-tight">${p.dd}</span><span class="block text-[9px] opacity-70">Day ${d}</span>`;
    b.onclick = () => { activeItineraryDay = d; renderItinerary(); };
    strip.appendChild(b);
  }

  const acts = trip.itinerary.map((a, i) => ({ a, i })).filter(x => x.a.day === activeItineraryDay)
    .sort((x, y) => (x.a.time || '99').localeCompare(y.a.time || '99'));
  const pts = acts.map(({ a }) => { const c = resolveCoord(trip, a); return c ? { lat: c.lat, lng: c.lng, label: a.title, kind: 'stop' } : null; }).filter(Boolean);
  renderMiniMap('itin-map', pts, { route: true, empty: 'Pin activities to a spot or your hotel to see the day on the map' });

  const head = `<p class="font-bold text-sm mb-3" style="color: var(--midnight-blue);">${dayParts(trip, activeItineraryDay).full || 'Day ' + activeItineraryDay}</p>`;
  if (acts.length === 0) { box.innerHTML = head + `<p class="text-xs text-stone-400 py-6 text-center">Nothing planned yet. Tap + Add Activity.</p>`; return; }
  box.innerHTML = head + acts.map(({ a, i }) => {
    const doc = a.docId && trip.checklists.packing.find(x => x.id === a.docId);
    return `
    <div class="flex gap-2">
      <div class="w-12 text-right text-[11px] font-bold text-stone-400 pt-3.5 flex-shrink-0">${a.time || '—'}</div>
      <div class="relative pl-5 pb-4 flex-1 min-w-0 border-l-2 border-dashed ms-1.5" style="border-color: rgba(138,140,65,.4);">
        <span class="absolute -left-[7px] top-4 w-3 h-3 rounded-full bg-white border-2" style="border-color: var(--muted-teal);"></span>
        <div class="lily-card p-3.5 bg-white space-y-1.5">
          <div class="flex justify-between items-start gap-2">
            <div class="min-w-0">
              <p class="font-bold text-sm text-stone-800">${a.title}</p>
              ${a.location ? `<p class="text-[11px] text-stone-500 mt-0.5"><i class="fa-solid fa-location-dot me-1 text-rose-600"></i>${a.location}</p>` : ''}
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button onclick="toggleStarItineraryActivity(${i})">${a.starred ? '<span class="text-amber-500">★</span>' : '<span class="text-stone-300">☆</span>'}</button>
              <button onclick="openEditItineraryModal(${i})" class="text-stone-300 hover:text-stone-600"><i class="fa-solid fa-pen text-[10px]"></i></button>
              <button onclick="deleteItineraryActivity(${i})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-[10px]"></i></button>
            </div>
          </div>
          ${a.notes ? `<p class="text-[11px] text-stone-400">${a.notes}</p>` : ''}
          ${doc ? `<button onclick="openDocById('${doc.id}')" class="w-full flex items-center gap-2 rounded-xl p-2 text-left" style="background: var(--beige);">
            ${doc.fileData ? `<img src="${doc.fileData}" class="w-10 h-10 rounded-lg object-cover flex-shrink-0">` : '<i class="fa-solid fa-ticket text-stone-500 px-2"></i>'}
            <span class="text-[11px] font-semibold flex-1 truncate" style="color: var(--midnight-blue);">${doc.text}</span>
            <span class="text-[10px] font-bold" style="color: var(--muted-teal);">View</span></button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleStarItineraryActivity(realIdx) {
  const trip = getActiveTrip();
  if (trip.itinerary && trip.itinerary[realIdx]) {
    trip.itinerary[realIdx].starred = !trip.itinerary[realIdx].starred;
    saveAppData();
    renderItinerary();
    renderSummaryPage();
  }
}

function fillItinSelects(selPlace, selDoc) {
  const trip = getActiveTrip(), h = getHotelObj(trip);
  const options = [];
  if (h) options.push({ id: 'hotel', name: h.name, extra: 'Hotel' });
  (trip.places || []).forEach(p => options.push({ id: p.id, name: p.name, extra: p.city || p.category || 'Spot' }));
  (typeof stationDatabase !== 'undefined' ? Object.values(stationDatabase).flat() : []).forEach(s => options.push({ id: '', name: s.name, extra: 'Station' }));
  window.itinLocationOptions = options.filter(o => o.name).filter((o, i, arr) => arr.findIndex(x => x.name.toLowerCase() === o.name.toLowerCase()) === i);
  const placeInput = document.getElementById('itin-form-location');
  const hidden = document.getElementById('itin-form-place');
  const selected = options.find(o => o.id && o.id === selPlace);
  if (placeInput && selected) placeInput.value = selected.name;
  if (hidden) hidden.value = selPlace || '';
  document.getElementById('itin-form-doc').innerHTML = '<option value="">None</option>'
    + (trip.checklists?.packing || []).filter(i => i.category === 'documents').map(i => `<option value="${i.id}" ${i.id === selDoc ? 'selected' : ''}>${i.text}${i.fileData ? ' 📷' : ''}</option>`).join('');
  document.getElementById('itin-form-docfile').value = '';
}

function onItinPlacePick() {
  const loc = document.getElementById('itin-form-location');
  const hidden = document.getElementById('itin-form-place');
  if (!loc || !hidden) return;
  const text = loc.value.trim().toLowerCase();
  const match = (window.itinLocationOptions || []).find(o => (o.name || '').toLowerCase() === text && o.id);
  hidden.value = match ? match.id : '';
}

function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#39;'); }

function renderItinLocationPopup() {
  const input = document.getElementById('itin-form-location');
  const popup = document.getElementById('itin-location-popup');
  if (!input || !popup) return;
  const query = input.value.trim().toLowerCase();
  const all = window.itinLocationOptions || [];
  const matches = all.filter(o => !query || `${o.name} ${o.extra || ''}`.toLowerCase().includes(query)).slice(0, 8);
  if (!matches.length) {
    popup.innerHTML = `<div class="location-suggestion-empty">No saved matches — your custom location is fine</div>`;
  } else {
    popup.innerHTML = matches.map((o, i) => `<button type="button" role="option" class="location-suggestion-item" data-location-index="${i}" onmousedown="event.preventDefault(); chooseItinLocation(${i}, this)"><span class="location-suggestion-pin"><i class="fa-solid ${o.extra === 'Hotel' ? 'fa-bed' : o.extra === 'Station' ? 'fa-train' : 'fa-location-dot'}"></i></span><span class="location-suggestion-copy"><span class="location-suggestion-name">${escapeHtml(o.name)}</span><span class="location-suggestion-meta">${escapeHtml(o.extra || 'Saved place')}</span></span><i class="fa-solid fa-arrow-up-left-from-circle location-suggestion-arrow"></i></button>`).join('');
    popup.dataset.count = String(matches.length);
    popup._matches = matches;
  }
  popup.classList.remove('hidden');
}

function chooseItinLocation(index, button) {
  const popup = document.getElementById('itin-location-popup');
  const input = document.getElementById('itin-form-location');
  const hidden = document.getElementById('itin-form-place');
  const item = popup?._matches?.[index];
  if (!item || !input || !hidden) return;
  input.value = item.name;
  hidden.value = item.id || '';
  popup.classList.add('hidden');
}

function handleItinLocationKeydown(event) {
  if (event.key === 'Escape') document.getElementById('itin-location-popup')?.classList.add('hidden');
  if (event.key === 'Enter') {
    const popup = document.getElementById('itin-location-popup');
    if (popup && !popup.classList.contains('hidden') && popup._matches?.length) {
      event.preventDefault(); chooseItinLocation(0);
    }
  }
}

function openItineraryModal(day) {
  editingItineraryIndex = null;
  if (day) activeItineraryDay = day;
  ['title', 'time', 'location', 'notes'].forEach(k => { document.getElementById('itin-form-' + k).value = ''; });
  fillItinSelects('', '');
  document.getElementById('itin-modal-title').innerText = `Day ${activeItineraryDay} • Add Activity`;
  openModal('modal-itinerary');
}

function openEditItineraryModal(idx) {
  const act = getActiveTrip().itinerary[idx];
  if (!act) return;
  editingItineraryIndex = idx;
  activeItineraryDay = act.day;
  ['title', 'time', 'location', 'notes'].forEach(k => { document.getElementById('itin-form-' + k).value = act[k] || ''; });
  fillItinSelects(act.placeId || '', act.docId || '');
  document.getElementById('itin-modal-title').innerText = `Day ${act.day} • Edit Activity`;
  openModal('modal-itinerary');
}

function saveItineraryForm() {
  const v = k => document.getElementById('itin-form-' + k).value.trim();
  if (!v('title')) return alert("Enter activity title!");
  const trip = getActiveTrip();
  const file = document.getElementById('itin-form-docfile').files[0];
  const finish = (data) => {
    let docId = document.getElementById('itin-form-doc').value || null;
    if (data) {   // a new ticket photo becomes a Document in Checklist
      docId = 'd_' + Date.now();
      trip.checklists.packing.push({ id: docId, text: v('title') + ' (ticket)', category: 'documents', done: false, important: false, fileData: data });
    }
    const act = { day: activeItineraryDay, title: v('title'), time: v('time'), location: v('location'), notes: v('notes'),
      starred: false, placeId: (document.getElementById('itin-form-place').value || null), docId };
    if (editingItineraryIndex !== null && trip.itinerary[editingItineraryIndex]) {
      act.starred = trip.itinerary[editingItineraryIndex].starred || false;
      trip.itinerary[editingItineraryIndex] = act;
    } else trip.itinerary.push(act);
    saveAppData(); closeModal('modal-itinerary'); renderItinerary(); renderSummaryPage();
  };
  if (file) scaleImage(file, 1100, finish); else finish(null);
}

function deleteItineraryActivity(realIdx) {
  const trip = getActiveTrip();
  if (trip.itinerary && trip.itinerary[realIdx]) {
    trip.itinerary.splice(realIdx, 1);
    saveAppData();
    renderItinerary();
    renderSummaryPage();
  }
}

// --- MERGED PACKING & DOCS SUB-TAB (2 TABS: PACKING & EXPENSES) ---
function selectPackingCategory(cat) {
  activePackingCategory = cat;
  const categories = ['clothes', 'toiletries', 'electronics', 'documents'];
  categories.forEach(c => {
    const btn = document.getElementById(`pack-cat-${c}`);
    if (btn) {
      if (c === cat) {
        btn.classList.add('bg-amber-600', 'text-white', 'shadow-xs');
        btn.classList.remove('text-stone-400');
      } else {
        btn.classList.remove('bg-amber-600', 'text-white', 'shadow-xs');
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

  const packingQuery = (document.getElementById('packingSearchInput')?.value || '').trim().toLowerCase();
  const items = (trip.checklists.packing || []).filter(item => (item.category || 'clothes') === activePackingCategory && (item.text || '').toLowerCase().includes(packingQuery));

  // Pin / Starred items always on top
  items.sort((a, b) => (b.important ? 1 : 0) - (a.important ? 1 : 0));

  if (items.length === 0) {
    container.innerHTML = `<p class="text-xs text-stone-400 text-center py-6">${packingQuery ? 'No matching items. Try another search.' : 'No items in this category yet. Tap “Add” to create one.'}</p>`;
    return;
  }

  items.forEach((item) => {
    const realIdx = trip.checklists.packing.indexOf(item);
    const div = document.createElement('div');
    div.className = "flex flex-col space-y-2 bg-white/90 p-3.5 rounded-2xl border border-stone-200/60";
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <label class="flex items-center space-x-2.5 cursor-pointer">
          <input type="checkbox" ${item.done ? 'checked' : ''} onchange="togglePackingDone(${realIdx})" class="rounded text-amber-600">
          <span class="${item.done ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}">${item.text}</span>
        </label>
        <div class="flex items-center space-x-2">
          <button onclick="togglePackingImportant(${realIdx})" class="focus:outline-none">
            <i class="fa-solid fa-thumbtack ${item.important ? 'text-amber-500' : 'text-stone-300 hover:text-amber-400'} text-xs"></i>
          </button>
          <button onclick="openEditPackingItem(${realIdx})" class="text-stone-300 hover:text-stone-600"><i class="fa-solid fa-pen text-xs"></i></button>
          <button onclick="deletePackingItem(${realIdx})" class="text-stone-300 hover:text-red-500"><i class="fa-solid fa-trash text-xs"></i></button>
        </div>
      </div>
      ${item.fileData ? `<img src="${item.fileData}" onclick="openImageViewer(this.src)" class="w-full h-32 object-cover rounded-xl border border-stone-100 mt-1 cursor-pointer" />` : ''}
    `;
    container.appendChild(div);
  });
}

function openPackingItemModal() {
  editingPackingIndex = null;
  document.getElementById('pack-form-text').value = "";
  document.getElementById('pack-form-category').value = activePackingCategory;
  document.getElementById('pack-form-file').value = "";
  document.getElementById('modal-packing-title').innerText = "Add Packing Item";
  toggleDocUploadVisibility();
  openModal('modal-packing');
}

function openEditPackingItem(idx) {
  const it = getActiveTrip().checklists.packing[idx];
  if (!it) return;
  editingPackingIndex = idx;
  document.getElementById('pack-form-text').value = it.text;
  document.getElementById('pack-form-category').value = it.category || 'clothes';
  document.getElementById('pack-form-file').value = "";
  document.getElementById('modal-packing-title').innerText = "Edit Item";
  toggleDocUploadVisibility();
  openModal('modal-packing');
}

function toggleDocUploadVisibility() {
  const cat = document.getElementById('pack-form-category')?.value;
  document.getElementById('pack-doc-upload-container')?.classList.toggle('hidden', cat !== 'documents');
}

function savePackingItemForm() {
  const text = document.getElementById('pack-form-text').value.trim();
  const category = document.getElementById('pack-form-category').value;
  const file = document.getElementById('pack-form-file')?.files?.[0];
  if (!text) return alert("Enter item name!");
  const trip = getActiveTrip();
  if (!trip.checklists.packing) trip.checklists.packing = [];
  const list = trip.checklists.packing;
  const finish = (fileData) => {
    if (editingPackingIndex !== null && list[editingPackingIndex]) {
      const it = list[editingPackingIndex];
      it.text = text; it.category = category;
      if (fileData) it.fileData = fileData;
    } else {
      list.push({ id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2,7), text, category, done: false, important: false, fileData: fileData || null });
    }
    saveAppData(); closeModal('modal-packing'); selectPackingCategory(category); renderSummaryPage();
  };
  if (category === 'documents' && file) scaleImage(file, 1100, finish); else finish(null);
}

function togglePackingDone(idx) {
  const trip = getActiveTrip();
  if (trip.checklists.packing[idx]) {
    trip.checklists.packing[idx].done = !trip.checklists.packing[idx].done;
    saveAppData();
    renderCategorizedPackingList();
    renderSummaryPage();
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
  renderSummaryPage();
}

// --- BILLING REPORTS EXPENSES ---
function renderChecklistsAndExpenses() {
  renderCategorizedPackingList();

  const trip = getActiveTrip();
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
          <strong style="color: var(--olive-green);" class="font-extrabold text-xs">RM ${exp.amount}</strong>
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
  ['packing', 'expenses'].forEach(t => {
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

// --- HOTEL SELECTION LOGIC ---
function populateHotelCityDropdown(selectedCity = "bandung") {
  const citySelect = document.getElementById('hotel-city-dropdown');
  if (!citySelect) return;
  citySelect.innerHTML = "";
  initHotelDatabase();

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

  initHotelDatabase();
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
    previewLabel.innerText = stationLabel(found.lat, found.lng, city);
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
  const citySelect = document.getElementById('hotel-city-dropdown');
  const hotelSelect = document.getElementById('hotel-name-dropdown');
  const previewLabel = document.getElementById('hotel-form-preview-station');
  if (!hotelSelect) return;

  const trip = getActiveTrip();
  trip.activeHotel = hotelSelect.value;
  trip.hotelCity = citySelect ? citySelect.value : "bandung";
  trip.hotelStation = previewLabel ? previewLabel.innerText : "No station nearby";

  saveAppData();
  closeModal('modal-hotel');
  renderActiveTripDashboard();
}

// --- TRIPS MANAGEMENT MODALS ---
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
  document.getElementById('trip-form-cover').value = '';
  openModal('modal-trip');
}

function saveTripForm() {
  const f = document.getElementById('trip-form-cover')?.files?.[0];
  if (f) scaleImage(f, 900, d => { pendingCover = d; saveTripFormCore(); });
  else { pendingCover = null; saveTripFormCore(); }
}

function saveTripFormCore() {
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
      if (pendingCover) trip.coverImage = pendingCover;
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
      activeHotel: "The Papandayan Hotel",
      hotelCity: "bandung",
      hotelStation: "Bandung Station (23 min walk)",
      places: typeof getAllMasterLocations === 'function' ? getAllMasterLocations() : [],
      itinerary: [],
      checklists: { packing: [] },
      expenses: [],
      coverImage: pendingCover
    });
    activeTripId = newTripId;
  }

  saveAppData();
  closeModal('modal-trip');
  renderHomeViews();
  openTripDashboard(activeTripId);
}

function fillSpotForm(p) {
  const set = (k, v) => { document.getElementById('spot-form-' + k).value = v; };
  set('id', p.id || ''); set('name', p.name || ''); set('city', p.city || 'Bandung'); set('category', p.category || 'Attraction');
  set('station', p.station || ''); set('walk', p.walk || ''); set('lat', p.lat || ''); set('lng', p.lng || '');
}
function openMasterSpotModal() {
  editingPlaceId = null; fillSpotForm({});
  document.getElementById('modal-spot-title').innerText = "Add Location Spot";
  openModal('modal-master-spot');
}
function openEditSpotModal(placeId) {
  const place = (getActiveTrip().places || []).find(p => p.id === placeId);
  if (!place) return;
  editingPlaceId = placeId; fillSpotForm(place);
  document.getElementById('modal-spot-title').innerText = "Edit Location Spot";
  openModal('modal-master-spot');
}

function getSpotCoords() {
  let a = document.getElementById('spot-form-lat').value.trim(), b = document.getElementById('spot-form-lng').value.trim();
  if (a.includes(',') && !b) [a, b] = a.split(',').map(s => s.trim());
  const lat = parseFloat(a), lng = parseFloat(b);
  return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
}

async function findSpotCoords() {
  const name = document.getElementById('spot-form-name').value.trim(), city = document.getElementById('spot-form-city').value;
  if (!name) return alert("Enter the spot name first.");
  const tip = "Paste the coordinates from Google Maps instead (long-press the spot, tap the numbers).";
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(name + ', ' + city + ', Indonesia')}`);
    const j = await r.json();
    if (!j[0]) return alert("Couldn't find that place. " + tip);
    document.getElementById('spot-form-lat').value = (+j[0].lat).toFixed(6);
    document.getElementById('spot-form-lng').value = (+j[0].lon).toFixed(6);
  } catch (e) { alert("Couldn't reach the map service. " + tip); }
}

function copySpotLine() {
  const f = k => document.getElementById('spot-form-' + k).value.trim(), c = getSpotCoords();
  const name = f('name');
  if (!name) return alert("Enter the spot name first.");
  const line = `{ id: "${editingPlaceId || 'new_' + Date.now()}", name: "${name}", category: "${f('category')}", lat: ${c ? c.lat : 'null'}, lng: ${c ? c.lng : 'null'}, station: "${f('station') || 'No station nearby'}", walk: "${f('walk')}", map: "https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name).replace(/%20/g, '+')}", starred: false },`;
  if (navigator.clipboard) navigator.clipboard.writeText(line).then(() => alert("Copied! Paste it into the right city and category in location.js.")).catch(() => prompt("Copy this line:", line));
  else prompt("Copy this line:", line);
}

function saveMasterSpotForm() {
  const f = k => document.getElementById('spot-form-' + k).value.trim();
  const name = f('name'), city = f('city'), c = getSpotCoords();
  if (!name) return alert("Enter spot name!");
  const trip = getActiveTrip();
  const station = f('station') || (c ? ((stationsNear(c.lat, c.lng, city.toLowerCase())[0] || {}).name || 'No station nearby') : 'Near Hotel Area');
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
  if (editingPlaceId) {
    const p = trip.places.find(x => x.id === editingPlaceId);
    if (p) Object.assign(p, { name, city, category: f('category'), station, walk: f('walk'), map, ...(c || {}) });
  } else {
    trip.places.push({ id: "p_" + Date.now(), name, city, category: f('category'), station, walk: f('walk'), map, starred: false, gallery: [], lat: c ? c.lat : null, lng: c ? c.lng : null });
  }
  saveAppData(); closeModal('modal-master-spot');
  renderLocationsPage(); renderWaddleView(); renderSummaryPage();
}

function renderActiveTripDashboard() {
  renderSummaryPage();
  renderLocationsPage();
  renderWaddleView();
  renderItinerary();
  renderChecklistsAndExpenses();
}

function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }


// Rounded, theme-matched dropdowns with custom option popups.
// The original <select> remains the source of truth so existing app logic keeps working.
(function initRoundedDropdowns() {
  const SELECTOR = 'select:not([data-custom-dropdown-ready])';

  function setup(select) {
    if (!select || select.dataset.customDropdownReady === 'true') return;
    select.dataset.customDropdownReady = 'true';
    const wrap = document.createElement('div');
    wrap.className = 'custom-select-wrap';
    if (select.id === 'masterCategoryFilter') wrap.classList.add('custom-select-master-filter');
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add('custom-select-native');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const label = document.createElement('span');
    label.className = 'custom-select-current';
    const chevron = document.createElement('span');
    chevron.className = 'custom-select-chevron';
    chevron.innerHTML = '<i class="fa-solid fa-chevron-down" aria-hidden="true"></i>';
    trigger.append(label, chevron);
    wrap.appendChild(trigger);

    const menu = document.createElement('div');
    menu.className = 'custom-select-menu hidden';
    menu.setAttribute('role', 'listbox');
    wrap.appendChild(menu);

    function syncLabel() {
      const option = select.options[select.selectedIndex];
      label.textContent = option ? option.textContent.trim() : 'Choose an option';
      trigger.disabled = select.disabled;
      trigger.setAttribute('aria-label', label.textContent);
      wrap.classList.toggle('is-disabled', select.disabled);
    }
    function close() {
      menu.classList.add('hidden');
      trigger.setAttribute('aria-expanded', 'false');
      wrap.classList.remove('is-open');
    }
    function renderOptions() {
      menu.innerHTML = '';
      Array.from(select.options).forEach((option, index) => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'custom-select-option';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(index === select.selectedIndex));
        item.disabled = option.disabled || (option.parentElement && option.parentElement.disabled);
        item.textContent = option.textContent.trim();
        if (index === select.selectedIndex) item.classList.add('is-selected');
        item.addEventListener('click', () => {
          if (item.disabled) return;
          select.selectedIndex = index;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          syncLabel();
          close();
          trigger.focus();
        });
        menu.appendChild(item);
      });
      if (!select.options.length) {
        const empty = document.createElement('div');
        empty.className = 'custom-select-empty';
        empty.textContent = 'No options available';
        menu.appendChild(empty);
      }
    }
    trigger.addEventListener('click', () => {
      if (select.disabled) return;
      const opening = menu.classList.contains('hidden');
      document.querySelectorAll('.custom-select-menu:not(.hidden)').forEach(other => {
        other.classList.add('hidden');
        const otherWrap = other.closest('.custom-select-wrap');
        otherWrap?.classList.remove('is-open');
        otherWrap?.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
      });
      if (opening) {
        renderOptions();
        menu.classList.remove('hidden');
        trigger.setAttribute('aria-expanded', 'true');
        wrap.classList.add('is-open');
        const selected = menu.querySelector('.is-selected');
        if (selected) selected.scrollIntoView({ block: 'nearest' });
      } else close();
    });
    trigger.addEventListener('keydown', event => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowDown' && menu.classList.contains('hidden')) {
        event.preventDefault(); trigger.click();
      }
    });
    select.addEventListener('change', syncLabel);
    syncLabel();
  }

  function init() {
    document.querySelectorAll(SELECTOR).forEach(setup);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
  // A few dropdowns receive options after startup; the menu is rebuilt whenever opened.
  new MutationObserver(() => init()).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', event => {
    if (event.target.closest('.custom-select-wrap')) return;
    document.querySelectorAll('.custom-select-menu:not(.hidden)').forEach(menu => {
      menu.classList.add('hidden');
      const wrap = menu.closest('.custom-select-wrap');
      wrap?.classList.remove('is-open');
      wrap?.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
    });
  });
})();

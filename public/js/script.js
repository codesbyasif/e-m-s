/* ============================================
   EVENTHUB — Premium Event Management Platform
   Frontend-only build with localStorage-based auth.
   ============================================
   NOTE FOR BACKEND INTEGRATION:
   All temporary auth lives in the AuthService object below.
   When the Express + MongoDB backend is ready, replace the
   methods in AuthService with real fetch() calls. The rest of
   the app talks to AuthService only — no other changes needed.
   ============================================ */
'use strict';

/* ============================================
   DEMO DATA
   ============================================ */
const CATEGORIES = [
  { name: 'Hackathon',       icon: '💻', color: 'wine'  },
  { name: 'Concert',         icon: '🎤', color: 'gold'  },
  { name: 'Stand-up Comedy', icon: '🎭', color: 'wine'  },
  { name: 'Webinar',         icon: '🖥️', color: 'gold'  },
  { name: 'Workshop',        icon: '🛠️', color: 'wine'  },
  { name: 'Business',        icon: '💼', color: 'gold'  },
  { name: 'Food Festival',   icon: '🍷', color: 'wine'  },
  { name: 'Gaming',          icon: '🎮', color: 'gold'  },
  { name: 'Marathon',        icon: '🏃', color: 'wine'  },
];

const EVENTS = [
  { id:'e1', name:'Vintage Wine Tasting Soirée', cat:'Gala',       city:'New York',  venue:'The Grand Ballroom',     date:'Jul 12, 2026', time:'7:00 PM', price:150, rating:4.9, seats:2,   cap:250, img:'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80', about:'An intimate evening of curated vintages, candlelight and live string quartet.', org:{name:'Aaliyah Hassan',company:'EventHub Studios',email:'aaliyah@eventhub.com',phone:'+1 555 010 2030',site:'eventhub.com'}, address:'305 Park Ave, New York, NY 10001' },
  { id:'e2', name:'Tech Founders Summit',        cat:'Conference', city:'San Francisco', venue:'Halcyon Convention Ctr', date:'Jul 18, 2026', time:'9:00 AM', price:95,  rating:4.8, seats:80,  cap:600, img:'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=900&q=80', about:'Three days with founders, operators and investors shaping what comes next.', org:{name:'Marcus Reed',company:'Halcyon Group',email:'hello@halcyon.io',phone:'+1 555 020 1010',site:'halcyon.io'}, address:'120 Market St, San Francisco, CA' },
  { id:'e3', name:'Midnight Jazz Gala',          cat:'Concert',    city:'Chicago',    venue:'Rooftop @ The Onyx',     date:'Jul 24, 2026', time:'10:00 PM',price:120, rating:4.7, seats:116, cap:300, img:'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=900&q=80', about:'A sultry rooftop night with live jazz, cocktails and city skyline views.', org:{name:'Lena Park',company:'Onyx Nights',email:'lena@onyx.com',phone:'+1 555 030 4040',site:'onyxnights.com'}, address:'88 N Wabash Ave, Chicago, IL' },
  { id:'e4', name:'Indie Film Festival',         cat:'Festival',   city:'Austin',     venue:'Theatre du Lumière',     date:'Aug 02, 2026', time:'5:00 PM', price:65,  rating:4.6, seats:188, cap:500, img:'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&q=80', about:'Four nights of indie premieres, director Q&As and curated short films.', org:{name:'Sami Cohen',company:'Lumière Collective',email:'sami@lumiere.co',phone:'+1 555 040 2020',site:'lumiere.co'}, address:'42 Congress Ave, Austin, TX' },
  { id:'e5', name:'Mindful Leadership Workshop', cat:'Workshop',   city:'Boston',     venue:'Studio Loft 5',          date:'Aug 09, 2026', time:'10:00 AM',price:220, rating:4.9, seats:14,  cap:80,  img:'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&q=80', about:'A hands-on day on mindful decision-making for senior leaders.', org:{name:'Dr. Priya Shah',company:'Mindshift Co.',email:'priya@mindshift.co',phone:'+1 555 050 3030',site:'mindshift.co'}, address:'9 Beacon St, Boston, MA' },
  { id:'e6', name:'Sommelier Networking Night',  cat:'Networking', city:'New York',   venue:'Crimson Hall',           date:'Aug 15, 2026', time:'8:00 PM', price:75,  rating:4.5, seats:42,  cap:120, img:'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=900&q=80', about:'Meet the city\'s top wine professionals over a guided tasting flight.', org:{name:'Rohan Mehta',company:'Crimson Society',email:'rohan@crimson.club',phone:'+1 555 060 9090',site:'crimson.club'}, address:'1 Crimson Ave, New York, NY' },
  { id:'e7', name:'Citywide Marathon 2026',      cat:'Marathon',   city:'Los Angeles',venue:'Griffith Park',          date:'Sep 05, 2026', time:'6:00 AM', price:45,  rating:4.7, seats:1240,cap:5000,img:'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=900&q=80', about:'A scenic 42km run through downtown finishing at Griffith Observatory.', org:{name:'LA Run Club',company:'LARC Events',email:'race@larc.org',phone:'+1 555 070 8080',site:'larc.org'}, address:'4730 Crystal Springs Dr, LA' },
  { id:'e8', name:'Future of AI — Hackathon',    cat:'Hackathon',  city:'Seattle',    venue:'Pike District Hub',      date:'Sep 14, 2026', time:'9:00 AM', price:0,   rating:4.8, seats:62,  cap:400, img:'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=80', about:'48 hours, $50k in prizes, mentors from leading AI labs.', org:{name:'Pike Labs',company:'Pike Labs Inc.',email:'team@pikelabs.dev',phone:'+1 555 080 7070',site:'pikelabs.dev'}, address:'1428 Pike Pl, Seattle, WA' },
  { id:'e9', name:'Friday Comedy Showcase',      cat:'Stand-up Comedy', city:'Brooklyn', venue:'Bedford Comedy Club',  date:'Jul 11, 2026', time:'9:00 PM', price:35,  rating:4.6, seats:21,  cap:90,  img:'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=900&q=80', about:'Six rising comics. One unforgettable night.', org:{name:'Bedford Comedy',company:'BFC Productions',email:'hi@bedfordcomedy.nyc',phone:'+1 555 090 6060',site:'bedfordcomedy.nyc'}, address:'151 Bedford Ave, Brooklyn, NY' },
];

const FEATURED_IDS = ['e1','e2','e3','e8'];
const UPCOMING_IDS = ['e9','e4','e5','e6'];
const TRENDING_IDS = ['e2','e7','e8','e3'];

const RECENT_BOOKINGS = [
  { cust:'Aiden Park',    event:'Wine Tasting Soirée',  amount:'$300', status:'success' },
  { cust:'Maya Rodriguez',event:'Tech Founders Summit', amount:'$190', status:'success' },
  { cust:'Jordan Lee',    event:'Midnight Jazz Gala',   amount:'$240', status:'pending' },
  { cust:'Priya Shah',    event:'Indie Film Festival',  amount:'$65',  status:'success' },
];

const BOOKINGS = [
  { id:'EVH-00482', cust:'Aiden Park',    event:'Wine Tasting Soirée',  tix:2, amount:'$300', pay:'success', status:'active'  },
  { id:'EVH-00481', cust:'Maya Rodriguez',event:'Tech Founders Summit', tix:2, amount:'$190', pay:'success', status:'active'  },
  { id:'EVH-00480', cust:'Jordan Lee',    event:'Midnight Jazz Gala',   tix:2, amount:'$240', pay:'pending', status:'pending' },
  { id:'EVH-00479', cust:'Priya Shah',    event:'Indie Film Festival',  tix:1, amount:'$65',  pay:'success', status:'active'  },
  { id:'EVH-00478', cust:'Daniel Okafor', event:'Wine Tasting Soirée',  tix:4, amount:'$600', pay:'success', status:'active'  },
  { id:'EVH-00477', cust:'Sophia Tran',   event:'Leadership Workshop',  tix:1, amount:'$220', pay:'failed',  status:'failed'  },
];

const PAYMENTS = [
  { id:'TXN-9821', cust:'Aiden Park',    event:'Wine Tasting Soirée',  amount:'$300', method:'Visa ••4242', date:'Jun 28, 2026', status:'success' },
  { id:'TXN-9820', cust:'Maya Rodriguez',event:'Tech Founders Summit', amount:'$190', method:'Mastercard',  date:'Jun 28, 2026', status:'success' },
  { id:'TXN-9819', cust:'Jordan Lee',    event:'Midnight Jazz Gala',   amount:'$240', method:'Apple Pay',   date:'Jun 28, 2026', status:'pending' },
  { id:'TXN-9818', cust:'Priya Shah',    event:'Indie Film Festival',  amount:'$65',  method:'Visa ••1011', date:'Jun 27, 2026', status:'success' },
];

const ADMIN_USERS = [
  { name:'Aiden Park',     email:'aiden@mail.com',  phone:'+1 555 110 2200', bookings:6, joined:'May 02, 2026', status:'active' },
  { name:'Maya Rodriguez', email:'maya@mail.com',   phone:'+1 555 120 3300', bookings:9, joined:'Apr 18, 2026', status:'active' },
  { name:'Jordan Lee',     email:'jordan@mail.com', phone:'+1 555 130 4400', bookings:3, joined:'Jun 11, 2026', status:'active' },
  { name:'Priya Shah',     email:'priya@mail.com',  phone:'+1 555 140 5500', bookings:5, joined:'Jun 22, 2026', status:'active' },
  { name:'Daniel Okafor',  email:'daniel@mail.com', phone:'+1 555 150 6600', bookings:2, joined:'Mar 30, 2026', status:'active' },
];

const USER_BOOKINGS = [
  { id:'EVH-10021', eventId:'e1', date:'Jul 12, 2026', tix:2, amount:'$300', status:'success' },
  { id:'EVH-10018', eventId:'e2', date:'Jul 18, 2026', tix:1, amount:'$95',  status:'success' },
  { id:'EVH-10009', eventId:'e3', date:'Jul 24, 2026', tix:2, amount:'$240', status:'pending' },
];

/* ============================================
   AUTH SERVICE  (replace with backend later)
   ============================================ */
const AuthService = (() => {
  const KEY = 'eh_session';
  const USERS_KEY = 'eh_users';

  // Seeded demo accounts
  const SEED = [
    { email:'admin@eventhub.com', password:'admin123', role:'admin', name:'Admin User',  phone:'+1 555 000 0001' },
    { email:'user@eventhub.com',  password:'user123',  role:'user',  name:'Demo User',   phone:'+1 555 000 0002' },
  ];

  function _users() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED));
    return SEED.slice();
  }
  function _save(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

  return {
    login(email, password) {
      const u = _users().find(x =>
        x.email.toLowerCase() === String(email||'').toLowerCase().trim() &&
        x.password === String(password||''));
      if (!u) return { ok:false, error:'Invalid email or password.' };
      const session = { email:u.email, name:u.name, role:u.role };
      localStorage.setItem(KEY, JSON.stringify(session));
      return { ok:true, user:session };
    },
    register({ name, email, phone, password, confirm }) {
      if (!name || !email || !password) return { ok:false, error:'Please complete all required fields.' };
      if (password.length < 6) return { ok:false, error:'Password must be at least 6 characters.' };
      if (password !== confirm) return { ok:false, error:'Passwords do not match.' };
      const users = _users();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return { ok:false, error:'An account with this email already exists.' };
      }
      const u = { name, email, phone, password, role:'user' };
      users.push(u);
      _save(users);
      const session = { email:u.email, name:u.name, role:u.role };
      localStorage.setItem(KEY, JSON.stringify(session));
      return { ok:true, user:session };
    },
    current() {
      try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
    },
    logout() { localStorage.removeItem(KEY); },
  };
})();

/* ============================================
   APP STATE
   ============================================ */
const App = {
  postLoginAction: null, // optional callback after login (e.g. continue booking)
  currentEventId: null,
};

/* ============================================
   LANDING PAGE RENDERERS
   ============================================ */
function eventById(id) { return EVENTS.find(e => e.id === id); }

function categoryCard(c) {
  return `<button class="cat-card cat-${c.color}" onclick="filterByCategory('${c.name}')">
    <span class="cat-emoji">${c.icon}</span>
    <span class="cat-name">${c.name}</span>
  </button>`;
}
function eventCard(e) {
  const price = e.price === 0 ? 'Free' : `$${e.price}`;
  return `<article class="event-card" onclick="openEventDetails('${e.id}')">
    <div class="event-img" style="background-image:url('${e.img}')">
      <span class="event-cat-tag">${e.cat}</span>
      <span class="event-price-tag">${price}</span>
    </div>
    <div class="event-body">
      <h3 class="event-name">${e.name}</h3>
      <div class="event-meta">
        <span>📅 ${e.date}</span>
        <span>📍 ${e.city}</span>
      </div>
      <div class="event-foot">
        <span class="event-rating">★ ${e.rating.toFixed(1)}</span>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openEventDetails('${e.id}')">View Details</button>
      </div>
    </div>
  </article>`;
}

function renderLanding() {
  const cg = document.getElementById('catGrid');
  if (cg) cg.innerHTML = CATEGORIES.map(categoryCard).join('');
  const fg = document.getElementById('featuredGrid');
  if (fg) fg.innerHTML = FEATURED_IDS.map(eventById).map(eventCard).join('');
  const ug = document.getElementById('upcomingGrid');
  if (ug) ug.innerHTML = UPCOMING_IDS.map(eventById).map(eventCard).join('');
  const tg = document.getElementById('trendingGrid');
  if (tg) tg.innerHTML = TRENDING_IDS.map(eventById).map(eventCard).join('');
}

function runHeroSearch() {
  const q = (document.getElementById('heroSearchName').value || '').toLowerCase();
  const city = (document.getElementById('heroSearchCity').value || '').toLowerCase();
  const cat = document.getElementById('heroSearchCat').value;
  const results = EVENTS.filter(e =>
    (!q || e.name.toLowerCase().includes(q)) &&
    (!city || e.city.toLowerCase().includes(city)) &&
    (!cat || e.cat === cat));
  toast(`${results.length} event${results.length===1?'':'s'} found`);
  document.getElementById('upcomingGrid').innerHTML =
    (results.length ? results : EVENTS).map(eventCard).join('');
  document.querySelector('#upcomingGrid').scrollIntoView({ behavior:'smooth', block:'start' });
}

function filterByCategory(cat) {
  document.getElementById('heroSearchCat').value =
    [...document.getElementById('heroSearchCat').options].some(o => o.value === cat) ? cat : '';
  runHeroSearch();
}

/* ============================================
   EVENT DETAILS MODAL
   ============================================ */
function openEventDetails(id) {
  const e = eventById(id);
  if (!e) return;
  App.currentEventId = id;
  const gst = Math.round(e.price * 0.18);
  const fee = e.price === 0 ? 0 : 5;
  const total = e.price + gst + fee;
  const priceTxt = e.price === 0 ? 'Free' : `$${e.price}`;

  document.getElementById('eventModalCard').innerHTML = `
    <button class="modal-close light" onclick="closeModal('eventModal')" aria-label="Close">×</button>
    <div class="ev-banner" style="background-image:url('${e.img}')">
      <div class="ev-banner-overlay">
        <span class="event-cat-tag">${e.cat}</span>
        <h2>${e.name}</h2>
        <div class="ev-banner-meta">
          <span>📅 ${e.date} · ${e.time}</span>
          <span>📍 ${e.venue}, ${e.city}</span>
          <span>★ ${e.rating.toFixed(1)}</span>
        </div>
      </div>
    </div>
    <div class="ev-body">
      <div class="ev-main">
        <div class="ev-section">
          <h3>About this event</h3>
          <p>${e.about}</p>
        </div>
        <div class="ev-section">
          <h3>Organizer</h3>
          <div class="ev-org">
            <div class="ev-org-avatar">${e.org.name.split(' ').map(s=>s[0]).join('').slice(0,2)}</div>
            <div>
              <strong>${e.org.name}</strong>
              <p>${e.org.company}</p>
              <p class="muted">${e.org.email} · ${e.org.phone}</p>
              <p class="muted">🌐 ${e.org.site}</p>
            </div>
          </div>
        </div>
        <div class="ev-section">
          <h3>Location</h3>
          <p>${e.address}</p>
          <div class="map-placeholder">
            <span>🗺️ Map preview · ${e.venue}</span>
          </div>
        </div>
      </div>
      <aside class="ev-side">
        <div class="ev-price-card">
          <p class="seats-left">${e.seats} seats left of ${e.cap}</p>
          <div class="price-row"><span>Ticket Price</span><span>${priceTxt}</span></div>
          <div class="price-row"><span>GST (18%)</span><span>$${gst}</span></div>
          <div class="price-row"><span>Platform Fee</span><span>$${fee}</span></div>
          <div class="price-divider"></div>
          <div class="price-row total"><span>Total</span><span>$${total}</span></div>
          <button class="btn-login book-btn" onclick="handleBook('${e.id}')">
            <span>Book Ticket</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <p class="ev-side-note">Free cancellation up to 48h before the event.</p>
        </div>
      </aside>
    </div>
  `;
  openModal('eventModal');
}

function handleBook(id) {
  const user = AuthService.current();
  if (!user) {
    App.postLoginAction = () => {
      const e = eventById(id);
      toast(`🎉 Booking confirmed for ${e.name}`);
      closeModal('eventModal');
    };
    openLoginModal();
    return;
  }
  const e = eventById(id);
  toast(`🎉 Booking confirmed for ${e.name}`);
  closeModal('eventModal');
}

/* ============================================
   MODALS (generic)
   ============================================ */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  if (!document.querySelector('.modal-overlay.open')) document.body.style.overflow = '';
}
function onOverlayClick(ev, id) { if (ev.target.id === id) closeModal(id); }
function openLoginModal()    { closeModal('registerModal'); openModal('loginModal'); }
function openRegisterModal() { closeModal('loginModal');    openModal('registerModal'); }
function swapAuth(which) {
  if (which === 'login') openLoginModal();
  else openRegisterModal();
}
function fillDemo(role) {
  if (role === 'admin') {
    document.getElementById('loginEmail').value = 'admin@eventhub.com';
    document.getElementById('loginPassword').value = 'admin123';
  } else {
    document.getElementById('loginEmail').value = 'user@eventhub.com';
    document.getElementById('loginPassword').value = 'user123';
  }
}

/* ============================================
   AUTH HANDLERS
   ============================================ */
function submitLogin() {
  const email = document.getElementById('loginEmail').value;
  const pw    = document.getElementById('loginPassword').value;
  const res = AuthService.login(email, pw);
  if (!res.ok) { toast(res.error, 'err'); return; }
  toast(`Welcome back, ${res.user.name}!`);
  closeModal('loginModal');
  enterApp();
  if (App.postLoginAction) { const cb = App.postLoginAction; App.postLoginAction = null; setTimeout(cb, 250); }
}
function submitRegister() {
  const res = AuthService.register({
    name:     document.getElementById('regName').value.trim(),
    email:    document.getElementById('regEmail').value.trim(),
    phone:    document.getElementById('regPhone').value.trim(),
    password: document.getElementById('regPassword').value,
    confirm:  document.getElementById('regConfirm').value,
  });
  if (!res.ok) { toast(res.error, 'err'); return; }
  toast(`Account created — welcome, ${res.user.name}!`);
  closeModal('registerModal');
  enterApp();
  if (App.postLoginAction) { const cb = App.postLoginAction; App.postLoginAction = null; setTimeout(cb, 250); }
}
function handleLogout() {
  AuthService.logout();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('landingPage').classList.remove('hidden');
  toast('Signed out');
}

/* ============================================
   APP ENTRY (role-based)
   ============================================ */
function enterApp() {
  const user = AuthService.current();
  if (!user) return;
  document.getElementById('landingPage').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  // Apply role to body so CSS hides the wrong sections
  document.body.classList.remove('is-admin','is-user');
  document.body.classList.add(user.role === 'admin' ? 'is-admin' : 'is-user');

  // Sidebar header
  const initials = user.name.split(' ').map(s=>s[0]).join('').slice(0,2).toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('navAvatar').textContent = initials;
  document.getElementById('sidebarUserName').textContent = user.name;
  document.getElementById('sidebarUserRole').textContent = user.role === 'admin' ? 'Organizer' : 'Member';
  document.getElementById('navTagline').textContent = user.role === 'admin' ? 'Manage Events Professionally' : 'Discover · Book · Celebrate';
  const greet = document.getElementById('userGreetName');
  if (greet) greet.textContent = user.name.split(' ')[0];
  // Pre-fill settings
  const sn = document.getElementById('settName'); if (sn) sn.value = user.name;
  const se = document.getElementById('settEmail'); if (se) se.value = user.email;

  // Build sidebar nav per role
  buildSidebar(user.role);

  // Navigate to default landing for role
  navigateTo(user.role === 'admin' ? 'dashboard' : 'user-home');

  renderAll();
}

function buildSidebar(role) {
  const adminNav = [
    { label:'Workspace', items:[
      ['dashboard','Dashboard','grid'],
      ['events','Events','calendar'],
      ['create','Create Event','plus'],
      ['bookings','Bookings','ticket'],
      ['users','Users','users'],
      ['checkin','QR Check-In','qr'],
      ['payments','Payments','card'],
      ['analytics','Analytics','chart'],
    ]},
    { label:'Account', items:[
      ['settings','Settings','gear'],
    ]},
  ];
  const userNav = [
    { label:'Discover', items:[
      ['user-home','Home','home'],
      ['user-browse','Browse Events','calendar'],
    ]},
    { label:'My Activity', items:[
      ['user-bookings','My Bookings','ticket'],
      ['user-tickets','My Tickets','qr'],
    ]},
    { label:'Account', items:[
      ['settings','Profile','gear'],
    ]},
  ];
  const groups = role === 'admin' ? adminNav : userNav;
  const icons = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    plus:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    ticket:'<path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 0 0-4z"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    qr:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="21" y2="14"/><line x1="14" y1="18" x2="21" y2="18"/>',
    card:'<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
    chart:'<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    home:'<path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/>',
  };
  const html = groups.map(g => `
    <p class="nav-label">${g.label}</p>
    ${g.items.map(([id,label,icon]) => `
      <a href="#" class="nav-item" data-section="${id}" onclick="navigateTo('${id}'); return false;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[icon] || ''}</svg>
        ${label}
      </a>`).join('')}
  `).join('') + `
    <a href="#" class="nav-item logout-nav" onclick="handleLogout(); return false;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Logout
    </a>`;
  document.getElementById('sidebarNav').innerHTML = html;
}

/* ============================================
   NAV / UI HELPERS
   ============================================ */
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function toggleProfileMenu() { document.getElementById('profileMenu').classList.toggle('hidden'); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }
function toggleMobileNav() { document.getElementById('mobileNav').classList.toggle('open'); }
function closeMobileNav() { document.getElementById('mobileNav').classList.remove('open'); }

function navigateTo(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.section === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');

  // Lazy renders
  if (id === 'user-browse') renderUserBrowse();
}

function goLanding(ev) {
  if (ev) ev.preventDefault();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('landingPage').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ============================================
   TOASTS
   ============================================ */
function toast(msg, kind='ok') {
  const box = document.getElementById('toastBox');
  if (!box) return alert(msg);
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 280); }, 2600);
}

/* ============================================
   DASHBOARD RENDERERS
   ============================================ */
const badge = (status) => {
  const map = { success:'success', paid:'success', active:'active', live:'live', pending:'pending', draft:'draft', failed:'failed' };
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return `<span class="badge ${map[status] || 'draft'}">${label}</span>`;
};

function renderUpcomingEvents() {
  const tb = document.getElementById('upcomingEventsTbody'); if (!tb) return;
  tb.innerHTML = EVENTS.slice(0,4).map(e => `
    <tr><td><strong>${e.name}</strong></td><td>${e.date}</td><td>${e.venue}</td><td>${e.cap - e.seats}/${e.cap}</td><td>${badge('active')}</td></tr>`).join('');
}
function renderRecentBookings() {
  const tb = document.getElementById('recentBookingsTbody'); if (!tb) return;
  tb.innerHTML = RECENT_BOOKINGS.map(b => `
    <tr><td><strong>${b.cust}</strong></td><td>${b.event}</td><td>${b.amount}</td><td>${badge(b.status)}</td></tr>`).join('');
}
function renderEvents() {
  const tb = document.getElementById('eventsTbody'); if (!tb) return;
  tb.innerHTML = EVENTS.map(e => `
    <tr>
      <td><strong>${e.name}</strong></td><td>${e.cat}</td><td>${e.date}</td><td>${e.venue}</td>
      <td>${e.cap}</td><td>${e.price === 0 ? 'Free' : '$' + e.price}</td><td>${badge('active')}</td>
      <td><div class="row-actions">
        <button class="icon-action" title="Edit"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="icon-action danger" title="Delete"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
      </div></td>
    </tr>`).join('');
}
function renderBookings() {
  const tb = document.getElementById('bookingsTbody'); if (!tb) return;
  tb.innerHTML = BOOKINGS.map(b => `
    <tr><td><strong>${b.id}</strong></td><td>${b.cust}</td><td>${b.event}</td><td>${b.tix}</td><td><strong>${b.amount}</strong></td><td>${badge(b.pay)}</td><td>${badge(b.status)}</td></tr>`).join('');
}
function renderPayments() {
  const tb = document.getElementById('paymentsTbody'); if (!tb) return;
  tb.innerHTML = PAYMENTS.map(p => `
    <tr><td><strong>${p.id}</strong></td><td>${p.cust}</td><td>${p.event}</td><td><strong>${p.amount}</strong></td><td>${p.method}</td><td>${p.date}</td><td>${badge(p.status)}</td></tr>`).join('');
}
function renderUsers() {
  const tb = document.getElementById('usersTbody'); if (!tb) return;
  tb.innerHTML = ADMIN_USERS.map(u => `
    <tr><td><strong>${u.name}</strong></td><td>${u.email}</td><td>${u.phone}</td><td>${u.bookings}</td><td>${u.joined}</td><td>${badge(u.status)}</td></tr>`).join('');
}
function renderHeaderDate() {
  const el = document.getElementById('headerDate');
  const el2 = document.getElementById('headerDateUser');
  const d = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  if (el)  el.textContent = d;
  if (el2) el2.textContent = d;
}

/* ===== USER dashboard renderers ===== */
function userEventMiniCard(e) {
  return `<article class="event-card" onclick="openEventDetails('${e.id}')">
    <div class="event-img" style="background-image:url('${e.img}')">
      <span class="event-cat-tag">${e.cat}</span>
    </div>
    <div class="event-body">
      <h3 class="event-name">${e.name}</h3>
      <div class="event-meta"><span>📅 ${e.date}</span><span>📍 ${e.city}</span></div>
      <div class="event-foot"><span class="event-rating">★ ${e.rating.toFixed(1)}</span><strong>${e.price===0?'Free':'$'+e.price}</strong></div>
    </div>
  </article>`;
}
function renderUserHome() {
  const up = document.getElementById('userUpcomingGrid');
  if (up) up.innerHTML = ['e1','e2','e3'].map(eventById).map(userEventMiniCard).join('');
  const rec = document.getElementById('userRecommendedGrid');
  if (rec) rec.innerHTML = ['e8','e5','e9','e6'].map(eventById).map(userEventMiniCard).join('');
  const tb = document.getElementById('userBookingsMiniTbody');
  if (tb) tb.innerHTML = USER_BOOKINGS.map(b => {
    const e = eventById(b.eventId);
    return `<tr><td><strong>${e.name}</strong></td><td>${b.date}</td><td>${b.amount}</td><td>${badge(b.status)}</td></tr>`;
  }).join('');
  const qb = document.getElementById('quickBookList');
  if (qb) qb.innerHTML = ['e7','e8','e9'].map(eventById).map(e => `
    <button class="quick-book-item" onclick="openEventDetails('${e.id}')">
      <div class="qb-img" style="background-image:url('${e.img}')"></div>
      <div class="qb-info"><strong>${e.name}</strong><span>${e.date} · ${e.city}</span></div>
      <span class="qb-price">${e.price===0?'Free':'$'+e.price}</span>
    </button>`).join('');
}
function renderUserBookings() {
  const tb = document.getElementById('userBookingsTbody'); if (!tb) return;
  tb.innerHTML = USER_BOOKINGS.map(b => {
    const e = eventById(b.eventId);
    return `<tr><td><strong>${b.id}</strong></td><td>${e.name}</td><td>${b.date}</td><td>${b.tix}</td><td><strong>${b.amount}</strong></td><td>${badge(b.status)}</td></tr>`;
  }).join('');
}
function renderUserTickets() {
  const g = document.getElementById('userTicketsGrid'); if (!g) return;
  g.innerHTML = USER_BOOKINGS.map(b => {
    const e = eventById(b.eventId);
    return `<div class="ticket-card">
      <div class="ticket-side"></div>
      <div class="ticket-main">
        <span class="event-cat-tag">${e.cat}</span>
        <h3>${e.name}</h3>
        <div class="ticket-meta">
          <div><small>Date</small><strong>${b.date}</strong></div>
          <div><small>Venue</small><strong>${e.venue}</strong></div>
          <div><small>Tickets</small><strong>${b.tix}</strong></div>
          <div><small>ID</small><strong>${b.id}</strong></div>
        </div>
      </div>
      <div class="ticket-qr">
        <div class="qr-mock"></div>
        <small>Scan at entry</small>
      </div>
    </div>`;
  }).join('');
}
function renderUserBrowse() {
  const g = document.getElementById('userBrowseGrid'); if (!g) return;
  const q = (document.getElementById('browseQuery')?.value || '').toLowerCase();
  const cat = document.getElementById('browseCat')?.value || '';
  const res = EVENTS.filter(e =>
    (!q || e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)) &&
    (!cat || e.cat === cat));
  g.innerHTML = res.length ? res.map(eventCard).join('') : `<p class="empty">No events match your filters.</p>`;
}

function renderAll() {
  renderHeaderDate();
  renderUpcomingEvents();
  renderRecentBookings();
  renderEvents();
  renderBookings();
  renderPayments();
  renderUsers();
  renderUserHome();
  renderUserBookings();
  renderUserTickets();
}

/* ============================================
   MISC
   ============================================ */
function publishEvent() {
  toast('🎉 Event published successfully');
  navigateTo('events');
}
function verifyTicket() {
  const id = (document.getElementById('manualTicketId').value || '').trim();
  if (!id) { toast('Enter a ticket ID first.', 'err'); return; }
  document.getElementById('checkinName').textContent = `Verified · ${id}`;
  document.getElementById('checkinEvent').textContent = 'Vintage Wine Tasting Soirée · VIP entry';
  toast('Ticket verified');
}

// Close profile menu / mobile nav on outside click; ESC closes modals
document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.profile-wrap');
  const menu = document.getElementById('profileMenu');
  if (wrap && menu && !wrap.contains(e.target)) menu.classList.add('hidden');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  renderLanding();
  const session = AuthService.current();
  if (session) enterApp();
  renderAll();
});

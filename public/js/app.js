/* ============================================
   EVENTHUB — Live Backend Integration
   This frontend loads events, auth, bookings, tickets, and payments
   from the Express/MongoDB API instead of using static demo data.
   ============================================ */
'use strict';

const AppState = {
  token: null,
  user: null,
  events: [],
  bookings: [],
  tickets: [],
  payments: [],
  users: [],
};

const ApiService = {
  setSession(token, user) {
    this.token = token;
    AppState.token = token;
    AppState.user = user;
    localStorage.setItem('eh_token', token);
    localStorage.setItem('eh_user', JSON.stringify(user));
  },

  clearSession() {
    this.token = null;
    AppState.token = null;
    AppState.user = null;
    localStorage.removeItem('eh_token');
    localStorage.removeItem('eh_user');
  },

  loadSession() {
    const token = localStorage.getItem('eh_token');
    const user = localStorage.getItem('eh_user');
    if (!token || !user) return null;
    try {
      const parsed = JSON.parse(user);
      this.setSession(token, parsed);
      return { token, user: parsed };
    } catch {
      this.clearSession();
      return null;
    }
  },

  async request(path, options = {}) {
    const opts = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    };

    if (this.token) {
      opts.headers.Authorization = `Bearer ${this.token}`;
    }
    if (opts.body && typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
    }

    const res = await fetch(`/api${path}`, opts);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const message = (data && data.message) || res.statusText || 'Request failed';
      throw new Error(message);
    }
    return data;
  },

  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: { email, password } });
  },

  register(payload) {
    return this.request('/auth/register', { method: 'POST', body: payload });
  },

  forgotPassword(email) {
    return this.request('/auth/forgot-password', { method: 'POST', body: { email } });
  },

  verifyResetCode(email, code) {
    return this.request('/auth/verify-reset-code', { method: 'POST', body: { email, code } });
  },

  resetPassword(email, code, password, confirm) {
    return this.request('/auth/reset-password', { method: 'POST', body: { email, code, password, confirm } });
  },

  getEvents(query = '?limit=100') {
    return this.request(`/events${query}`);
  },

  getEvent(id) {
    return this.request(`/events/${id}`);
  },

  createEvent(eventData) {
    return this.request('/events', { method: 'POST', body: eventData });
  },

  updateEvent(id, eventData) {
    return this.request(`/events/${id}`, { method: 'PUT', body: eventData });
  },

  deleteEvent(id) {
    return this.request(`/events/${id}`, { method: 'DELETE' });
  },

  createBooking(eventId, tickets = 1, extra = {}) {
    return this.request('/bookings', { method: 'POST', body: { eventId, tickets, ...extra } });
  },

  getMyBookings() {
    return this.request('/bookings/me');
  },

  cancelBooking(id) {
    return this.request(`/bookings/${id}/cancel`, { method: 'PUT' });
  },

  getAllBookings() {
    return this.request('/bookings');
  },

  getMyTickets() {
    return this.request('/tickets/me');
  },

  createPaymentIntent(bookingId) {
    return this.request('/payments/create-intent', { method: 'POST', body: { bookingId, method: 'card' } });
  },

  confirmPayment(paymentId) {
    return this.request(`/payments/${paymentId}/confirm`, { method: 'POST' });
  },

  getMyPayments() {
    return this.request('/payments/me');
  },

  getAllPayments() {
    return this.request('/payments');
  },

  getAllUsers() {
    return this.request('/users');
  },
};

const formatMoney = (value) => (Number(value) === 0 ? 'Free' : `$${value}`);
const formatDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || 'TBD';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// safe DOM helpers
function setHtmlIfExists(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}
function setTextIfExists(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function eventById(id) {
  return AppState.events.find((e) => String(e._id) === String(id));
}

function categoryCard(category) {
  return `<button class="cat-card cat-wine" onclick="filterByCategory('${category}')">
    <span class="cat-emoji">🎟️</span>
    <span class="cat-name">${category}</span>
  </button>`;
}

function eventCard(e) {
  const price = formatMoney(e.price);
  return `<article class="event-card" onclick="openEventDetails('${e._id}')">
    <div class="event-img" style="background-image:url('${e.img || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80'}')">
      <span class="event-cat-tag">${e.cat}</span>
      <span class="event-price-tag">${price}</span>
    </div>
    <div class="event-body">
      <h3 class="event-name">${e.name}</h3>
      <div class="event-meta">
        <span>📅 ${formatDate(e.date)}</span>
        <span>📍 ${e.city}</span>
      </div>
      <div class="event-foot">
        <span class="event-rating">★ ${Number(e.rating || 0).toFixed(1)}</span>
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openEventDetails('${e._id}')">View Details</button>
      </div>
    </div>
  </article>`;
}

function renderLanding() {
  // helpers for ongoing / same-day
  function isSameDay(d) {
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  }

  function formatCountdown(d) {
    const then = new Date(d).getTime();
    const now = Date.now();
    let diff = Math.floor((then - now) / 1000); // seconds
    const future = diff >= 0;
    diff = Math.abs(diff);
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    const parts = [];
    if (hrs) parts.push(`${hrs}h`);
    if (mins) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return future ? `Starts in ${parts.join(' ')}` : `Started ${parts.join(' ')} ago`;
  }

  function ongoingCard(e) {
    const price = formatMoney(e.price);
    const startTs = new Date(e.date).toISOString();
    return `<article class="event-card" onclick="openEventDetails('${e._id}')">
      <div class="event-img" style="background-image:url('${e.img || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80'}')">
        <span class="event-cat-tag">${e.cat}</span>
        <span class="event-price-tag">${price}</span>
      </div>
      <div class="event-body">
        <h3 class="event-name">${e.name}</h3>
        <div class="event-meta">
          <span>📅 ${formatDate(e.date)}</span>
          <span>📍 ${e.city}</span>
        </div>
        <div class="event-start" data-start="${startTs}">${formatCountdown(e.date)}</div>
        <div class="event-foot">
          <span class="event-rating">★ ${Number(e.rating || 0).toFixed(1)}</span>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); openEventDetails('${e._id}')">View Details</button>
        </div>
      </div>
    </article>`;
  }

  const categories = Array.from(new Set(AppState.events.map((e) => e.cat))).slice(0, 9);
  const featured = AppState.events.filter((e) => e.featured).slice(0, 4);
  const ongoing = AppState.events.filter((e) => isSameDay(e.date) || e.status === 'ongoing').slice(0, 8);
  const upcoming = AppState.events.filter((e) => new Date(e.date) >= new Date()).slice(0, 4);
  const trending = AppState.events.filter((e) => e.trending).slice(0, 4);

  setHtmlIfExists('catGrid', categories.map(categoryCard).join(''));
  setHtmlIfExists('featuredGrid', featured.map(eventCard).join(''));
  const og = document.getElementById('ongoingGrid');
  if (og) og.innerHTML = ongoing.length ? ongoing.map(ongoingCard).join('') : '<p class="empty">No ongoing events.</p>';
  setHtmlIfExists('upcomingGrid', upcoming.map(eventCard).join(''));
  setHtmlIfExists('trendingGrid', trending.map(eventCard).join(''));

  // live clocks
  function updateEventClocks() {
    document.querySelectorAll('.event-start[data-start]').forEach((el) => {
      const ts = el.getAttribute('data-start');
      if (!ts) return;
      el.textContent = formatCountdown(ts);
    });
  }
  if (window._eventClockInterval) clearInterval(window._eventClockInterval);
  updateEventClocks();
  window._eventClockInterval = setInterval(updateEventClocks, 1000);
}

function runHeroSearch() {
  const q = (document.getElementById('heroSearchName').value || '').toLowerCase();
  const city = (document.getElementById('heroSearchCity').value || '').toLowerCase();
  const cat = document.getElementById('heroSearchCat').value;

  const results = AppState.events.filter((e) =>
    (!q || e.name.toLowerCase().includes(q)) &&
    (!city || e.city.toLowerCase().includes(city)) &&
    (!cat || e.cat === cat)
  );

  toast(`${results.length} event${results.length === 1 ? '' : 's'} found`);
  setHtmlIfExists('upcomingGrid', results.map(eventCard).join('') || '<p class="empty">No events found.</p>');
  document.querySelector('#upcomingGrid').scrollIntoView({ behavior:'smooth', block:'start' });
}

function filterByCategory(cat) {
  document.getElementById('heroSearchCat').value = cat;
  runHeroSearch();
}

async function openEventDetails(id) {
  let e = eventById(id);
  if (!e) {
    const response = await ApiService.getEvent(id);
    e = response.event;
  }
  if (!e) return;

  App.currentEventId = id;
  const gst = Math.round(e.price * 0.18);
  const fee = e.price === 0 ? 0 : 5;
  const total = e.price + gst + fee;
  const priceTxt = formatMoney(e.price);

  setHtmlIfExists('eventModalCard', `
    <button class="modal-close light" onclick="closeModal('eventModal')" aria-label="Close">×</button>
    <div class="ev-banner" style="background-image:url('${e.img || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80'}')">
      <div class="ev-banner-overlay">
        <span class="event-cat-tag">${e.cat}</span>
        <h2>${e.name}</h2>
        <div class="ev-banner-meta">
          <span>📅 ${formatDate(e.date)} · ${e.time || ''}</span>
          <span>📍 ${e.venue}, ${e.city}</span>
          <span>★ ${Number(e.rating || 0).toFixed(1)}</span>
        </div>
      </div>
    </div>
    <div class="ev-body">
      <div class="ev-main">
        <div class="ev-section">
          <h3>About this event</h3>
          <p>${e.about || 'No description available.'}</p>
        </div>
        <div class="ev-section">
          <h3>Organizer</h3>
          <div class="ev-org">
            <div class="ev-org-avatar">${(e.org?.name || 'EO').split(' ').map((s) => s[0]).join('').slice(0, 2)}</div>
            <div>
              <strong>${e.org?.name || 'Organizer'}</strong>
              <p>${e.org?.company || ''}</p>
              <p class="muted">${e.org?.email || ''} · ${e.org?.phone || ''}</p>
              <p class="muted">🌐 ${e.org?.site || ''}</p>
            </div>
          </div>
        </div>
        <div class="ev-section">
          <h3>Location</h3>
          <p>${e.address || `${e.venue}, ${e.city}`}</p>
          <div class="map-placeholder">
            <span>🗺️ Map preview · ${e.venue}</span>
          </div>
        </div>
      </div>
      <aside class="ev-side">
        <div class="ev-price-card">
          <p class="seats-left">${e.seats ?? 0} seats left of ${e.cap ?? 'N/A'}</p>
          <div class="price-row"><span>Ticket Price</span><span>${priceTxt}</span></div>
          <div class="price-row"><span>GST (18%)</span><span>$${gst}</span></div>
          <div class="price-row"><span>Platform Fee</span><span>$${fee}</span></div>
          <div class="price-divider"></div>
          <div class="price-row total"><span>Total</span><span>$${total}</span></div>
          <button class="btn-login book-btn" onclick="handleBook('${e._id}')">
            <span>Book Ticket</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <p class="ev-side-note">Free cancellation up to 48h before the event.</p>
        </div>
      </aside>
    </div>
  `);

  openModal('eventModal');
}

async function handleBook(id) {
  if (!AppState.user) {
    App.postLoginAction = async () => {
      await processBooking(id);
      closeModal('eventModal');
    };
    openLoginModal();
    return;
  }
    await processBooking(id);
}

async function processBooking(id, extra = {}) {
  try {
    const bookingResult = await ApiService.createBooking(id, 1, extra);
      const paymentResponse = await ApiService.createPaymentIntent(bookingResult.booking._id);
      const attendeeLabel = extra.guestName ? ` for ${extra.guestName}` : '';
      toast(`💳 Redirecting to payment gateway${attendeeLabel}...`);
      window.location.href = paymentResponse.checkoutUrl;
    closeModal('eventModal');
    await loadUserData();
    await loadEventData();
    renderAll();
    askAnotherPersonBooking(id);
  } catch (err) {
    toast(err.message, 'err');
  }
}

function askAnotherPersonBooking(eventId) {
  if (!confirm('Do you want to book this event for another person?')) return;
  App.guestBookingEventId = eventId;
  document.getElementById('guestName').value = '';
  document.getElementById('guestPhone').value = '';
  openModal('guestBookingModal');
}

function handleCancelBooking(bookingId) {
  if (!confirm('Cancel this booking and remove its tickets?')) return;
  ApiService.cancelBooking(bookingId)
    .then(async () => {
      toast('Booking and associated tickets deleted.');
      const bookingIdString = String(bookingId);
      AppState.bookings = AppState.bookings.map((b) =>
        String(b._id) === bookingIdString ? { ...b, status: 'cancelled' } : b
      );
      AppState.tickets = AppState.tickets.filter((t) => {
        const ticketBookingId = String(t.booking?._id || t.booking || '');
        return ticketBookingId !== bookingIdString;
      });
      await loadUserData();
      await loadEventData();
      renderAll();
    })
    .catch((err) => toast(err.message, 'err'));
}

async function handlePayPendingBooking(bookingId) {
  if (!AppState.user) {
    App.postLoginAction = async () => handlePayPendingBooking(bookingId);
    openLoginModal();
    return;
  }

  const booking = AppState.bookings.find((b) => String(b._id) === String(bookingId));
  if (!booking) {
    toast('Unable to locate booking for payment.', 'err');
    return;
  }
  if (booking.status !== 'pending') {
    toast('This booking is not eligible for payment.', 'err');
    return;
  }

  try {
    const paymentResponse = await ApiService.createPaymentIntent(bookingId);
    if (!paymentResponse?.checkoutUrl) {
      throw new Error('Payment gateway did not return a checkout URL.');
    }
    toast('Redirecting to checkout to complete your payment...');
    window.location.href = paymentResponse.checkoutUrl;
  } catch (err) {
    toast(err.message, 'err');
  }
}

function submitGuestBooking() {
  const guestName = document.getElementById('guestName')?.value.trim();
  const guestPhone = document.getElementById('guestPhone')?.value.trim();

  if (!guestName || !guestPhone) {
    toast('Please enter the guest name and phone number.', 'err');
    return;
  }
  if (!App.guestBookingEventId) {
    toast('Unable to identify the event for guest booking.', 'err');
    return;
  }

  closeModal('guestBookingModal');
  processBooking(App.guestBookingEventId, { guestName, guestPhone });
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  if (!document.querySelector('.modal-overlay.open')) {
    document.body.style.overflow = '';
  }
}

function onOverlayClick(ev, id) {
  if (ev.target.id === id) closeModal(id);
}

function openLoginModal() {
  closeModal('registerModal');
  closeModal('forgotPasswordModal');
  openModal('loginModal');
}

function openRegisterModal() {
  closeModal('loginModal');
  closeModal('forgotPasswordModal');
  openModal('registerModal');
}

function openForgotPasswordModal() {
  closeModal('loginModal');
  closeModal('registerModal');
  document.getElementById('forgotEmail').value = '';
  document.getElementById('forgotCode').value = '';
  document.getElementById('forgotNewPassword').value = '';
  document.getElementById('forgotConfirmPassword').value = '';
  App.resetPasswordEmail = '';
  App.resetPasswordCode = '';
  showForgotPasswordStep(1);
  openModal('forgotPasswordModal');
}

function showForgotPasswordStep(step) {
  const step1 = document.getElementById('forgotStep1');
  const step2 = document.getElementById('forgotStep2');
  const step3 = document.getElementById('forgotStep3');
  if (step1) step1.classList.toggle('hidden', step !== 1);
  if (step2) step2.classList.toggle('hidden', step !== 2);
  if (step3) step3.classList.toggle('hidden', step !== 3);
}

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

function setupLoginEnterKey() {
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  if (!emailInput || !passwordInput) return;

  const handleEnter = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email) {
      toast('Please enter your email before pressing Enter.', 'err');
      return;
    }
    if (!password) {
      toast('Please enter your password before pressing Enter.', 'err');
      return;
    }
    submitLogin();
  };

  emailInput.addEventListener('keydown', handleEnter);
  passwordInput.addEventListener('keydown', handleEnter);

  // Also listen at the modal level in case inputs are dynamically focused
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email) return toast('Please enter your email before pressing Enter.', 'err');
        if (!password) return toast('Please enter your password before pressing Enter.', 'err');
        submitLogin();
      }
    });
  }
}

async function submitForgotPassword() {
  const email = document.getElementById('forgotEmail')?.value.trim();
  if (!email) {
    toast('Please enter your email address.', 'err');
    return;
  }

  try {
    const response = await ApiService.forgotPassword(email);
    App.resetPasswordEmail = email;
    toast(response.message || 'Verification code sent.', 'ok');
    showForgotPasswordStep(2);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function submitVerifyResetCode() {
  const email = App.resetPasswordEmail || document.getElementById('forgotEmail')?.value.trim();
  const code = document.getElementById('forgotCode')?.value.trim();
  if (!email || !code) {
    toast('Please enter the verification code.', 'err');
    return;
  }

  try {
    const response = await ApiService.verifyResetCode(email, code);
    App.resetPasswordCode = code;
    toast(response.message || 'Code verified.', 'ok');
    showForgotPasswordStep(3);
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function submitResetPassword() {
  const email = App.resetPasswordEmail || document.getElementById('forgotEmail')?.value.trim();
  const code = App.resetPasswordCode || document.getElementById('forgotCode')?.value.trim();
  const password = document.getElementById('forgotNewPassword')?.value;
  const confirm = document.getElementById('forgotConfirmPassword')?.value;

  if (!email || !code) {
    toast('Verification details are missing.', 'err');
    return;
  }
  if (!password || password.length < 6) {
    toast('New password must be at least 6 characters.', 'err');
    return;
  }
  if (password !== confirm) {
    toast('Passwords do not match.', 'err');
    return;
  }

  try {
    const response = await ApiService.resetPassword(email, code, password, confirm);
    toast(response.message || 'Password updated successfully.', 'ok');
    closeModal('forgotPasswordModal');
    openLoginModal();
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function submitLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) {
    toast('Email and password are required.', 'err');
    return;
  }

  try {
    const response = await ApiService.login(email, password);
    ApiService.setSession(response.token, response.user);
    toast(`Welcome back, ${response.user.name}!`);
    closeModal('loginModal');
    await enterApp();
    if (App.postLoginAction) {
      const callback = App.postLoginAction;
      App.postLoginAction = null;
      setTimeout(callback, 250);
    }
  } catch (err) {
    toast(err.message, 'err');
  }
}

async function submitRegister() {
  const payload = {
    name: document.getElementById('regName').value.trim(),
    email: document.getElementById('regEmail').value.trim(),
    phone: document.getElementById('regPhone').value.trim(),
    password: document.getElementById('regPassword').value,
    confirm: document.getElementById('regConfirm').value,
    adminCode: document.getElementById('regAdminCode')?.value.trim(),
  };

  if (!payload.adminCode) {
    delete payload.adminCode;
  }

  try {
    const response = await ApiService.register(payload);
    ApiService.setSession(response.token, response.user);
    toast(`Account created — welcome, ${response.user.name}!`);
    closeModal('registerModal');
    await enterApp();
    if (App.postLoginAction) {
      const callback = App.postLoginAction;
      App.postLoginAction = null;
      setTimeout(callback, 250);
    }
  } catch (err) {
    toast(err.message, 'err');
  }
}

function handleLogout() {
  if (!confirm('Are you sure you want to log out?')) return;
  ApiService.clearSession();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('landingPage').classList.remove('hidden');
  toast('Signed out');
}

async function enterApp() {
  const session = ApiService.loadSession();
  if (!session || !session.user) return;
  AppState.user = session.user;
  document.getElementById('landingPage').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  const roleNorm = (AppState.user.role || '').toString().toLowerCase();
  document.body.classList.remove('is-admin', 'is-user');
  document.body.classList.add(roleNorm === 'admin' ? 'is-admin' : 'is-user');

  const initials = (AppState.user.name || '').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  document.getElementById('sidebarAvatar').textContent = initials;
  document.getElementById('navAvatar').textContent = initials;
  document.getElementById('sidebarUserName').textContent = AppState.user.name;
  document.getElementById('sidebarUserRole').textContent = roleNorm === 'admin' ? 'Organizer' : 'Member';
  document.getElementById('navTagline').textContent = roleNorm === 'admin' ? 'Manage Events Professionally' : 'Discover · Book · Celebrate';
  document.getElementById('userGreetName').textContent = AppState.user.name.split(' ')[0];
  document.getElementById('settName').value = AppState.user.name;
  document.getElementById('settEmail').value = AppState.user.email;

  buildSidebar(AppState.user.role);
  await loadUserData();
  if (roleNorm === 'admin') await loadAdminData();
  renderAll();
  navigateTo(roleNorm === 'admin' ? 'dashboard' : 'user-home');
  // ensure dashboard is visible for admins — some CSS setups hide role-specific sections until body classes settle
  if (roleNorm === 'admin') {
    const dash = document.getElementById('dashboard');
    if (dash && !dash.classList.contains('active')) {
      dash.classList.add('active');
      toast('Admin dashboard activated', 'ok');
    }
  }
}

function buildSidebar(role) {
  const adminNav = [
    { label: 'Workspace', items: [['dashboard', 'Dashboard', 'grid'], ['admin-events', 'Events', 'calendar'], ['create', 'Create Event', 'plus'], ['bookings', 'Bookings', 'ticket'], ['users', 'Users', 'users'], ['checkin', 'QR Check-In', 'qr'], ['payments', 'Payments', 'card'], ['analytics', 'Analytics', 'chart']] },
    { label: 'Account', items: [['settings', 'Settings', 'gear']] },
  ];
  const userNav = [
    { label: 'Discover', items: [['user-home', 'Home', 'home'], ['user-browse', 'Browse Events', 'calendar']] },
    { label: 'My Activity', items: [['user-bookings', 'My Bookings', 'ticket'], ['user-tickets', 'My Tickets', 'qr']] },
    { label: 'Account', items: [['settings', 'Profile', 'gear']] },
  ];
  const roleNorm = (role || '').toString().toLowerCase();
  const groups = roleNorm === 'admin' ? adminNav : userNav;
  const icons = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    plus: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    ticket: '<path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V13a2 2 0 0 0 0-4z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    qr: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><line x1="14" y1="14" x2="21" y2="14"/><line x1="14" y1="18" x2="21" y2="18"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
    chart: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    home: '<path d="M3 12 12 3l9 9"/><path d="M5 10v10h14V10"/>',
  };

  const sidebarHtml = groups
    .map((group) => `
      <p class="nav-label">${group.label}</p>
      ${group.items
        .map(
          ([id, label, icon]) => `
            <a href="#" class="nav-item" data-section="${id}" onclick="navigateTo('${id}'); return false;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${icons[icon] || ''}</svg>
              ${label}
            </a>`
        )
        .join('')}
    `)
    .join('') + `
      <a href="#" class="nav-item logout-nav" onclick="handleLogout(); return false;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout
      </a>`;
  setHtmlIfExists('sidebarNav', sidebarHtml);
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function toggleProfileMenu() { document.getElementById('profileMenu').classList.toggle('hidden'); }
function toggleDarkMode() { document.body.classList.toggle('dark-mode'); }
function toggleMobileNav() { document.getElementById('mobileNav').classList.toggle('open'); }
function closeMobileNav() { document.getElementById('mobileNav').classList.remove('open'); }

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  if (btn && btn.setAttribute) btn.setAttribute('aria-pressed', String(isHidden));
  // swap simple icon
  if (btn) {
    btn.innerHTML = isHidden
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.14 20.14 0 0 1 4.23-5.26"/><path d="M1 1l22 22"/></svg>';
  }
}

function navigateTo(id) {
  document.querySelectorAll('.section').forEach((section) => section.classList.remove('active'));
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.section === id));
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.innerWidth < 768) document.getElementById('sidebar').classList.remove('open');
  if (id === 'user-browse') renderUserBrowse();
}

function goLanding(ev) {
  if (ev) ev.preventDefault();
  document.getElementById('app').classList.add('hidden');
  document.getElementById('landingPage').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toast(message, kind = 'ok') {
  const box = document.getElementById('toastBox');
  if (!box) return alert(message);
  const toastEl = document.createElement('div');
  toastEl.className = `toast ${kind}`;
  toastEl.textContent = message;
  box.appendChild(toastEl);
  setTimeout(() => {
    toastEl.classList.add('out');
    setTimeout(() => toastEl.remove(), 280);
  }, 2600);
}

const badge = (status) => {
  const map = { success: 'success', paid: 'success', active: 'active', live: 'live', pending: 'pending', draft: 'draft', failed: 'failed', cancelled: 'failed' };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  return `<span class="badge ${map[status] || 'draft'}">${label}</span>`;
};

function renderUpcomingEvents() {
  const upcoming = AppState.events.filter((e) => new Date(e.date) >= new Date()).slice(0, 4);
  const tb = document.getElementById('upcomingEventsTbody');
  if (!tb) return;
  tb.innerHTML = upcoming
    .map((e) => `
      <tr>
        <td><strong>${e.name}</strong></td>
        <td>${formatDate(e.date)}</td>
        <td>${e.venue}</td>
        <td>${(e.cap || 0) - (e.seats || 0)}/${e.cap || 'N/A'}</td>
        <td>${badge(e.status || 'active')}</td>
      </tr>`)
    .join('');
}

function renderRecentBookings() {
  const tb = document.getElementById('recentBookingsTbody');
  if (!tb) return;
  const visibleBookings = AppState.bookings.filter((booking) => booking.status !== 'cancelled').slice(0, 4);
  tb.innerHTML = visibleBookings
    .map((booking) => `
      <tr>
        <td><strong>${booking.user?.name || AppState.user?.name || 'You'}</strong></td>
        <td>${booking.event?.name || 'Event'}</td>
        <td>${formatMoney(booking.amount)}</td>
        <td>${badge(booking.status)}</td>
      </tr>`)
    .join('') || '<tr><td colspan="4">No bookings yet.</td></tr>';
}

function renderEvents() {
  const tb = document.getElementById('eventsTbody');
  if (!tb) return;
  tb.innerHTML = AppState.events
    .map((e) => `
      <tr>
        <td><strong>${e.name}</strong></td>
        <td>${e.cat}</td>
        <td>${formatDate(e.date)}</td>
        <td>${e.venue}</td>
        <td>${e.cap || 'N/A'}</td>
        <td>${formatMoney(e.price)}</td>
        <td>${badge(e.status || 'active')}</td>
        <td><div class="row-actions">
          <button class="icon-action" title="Edit" onclick="openEditEvent('${e._id}')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="icon-action danger" title="Delete" onclick="deleteEventRow('${e._id}')"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg></button>
        </div></td>
      </tr>`)
    .join('');
}

function renderBookings() {
  const tb = document.getElementById('bookingsTbody');
  if (!tb) return;
  tb.innerHTML = AppState.bookings
    .map((booking) => `
      <tr>
        <td><strong>${booking.bookingCode || booking._id}</strong></td>
        <td>${booking.user?.name || booking.user?.email || 'Customer'}</td>
        <td>${booking.event?.name || 'Event'}</td>
        <td>${booking.tickets}</td>
        <td><strong>${formatMoney(booking.amount)}</strong></td>
        <td>${badge(booking.payment?.status || booking.status)}</td>
        <td>${badge(booking.status)}</td>
      </tr>`)
    .join('');
}

function renderPayments() {
  const tb = document.getElementById('paymentsTbody');
  if (!tb) return;
  tb.innerHTML = AppState.payments
    .map((payment) => `
      <tr>
        <td><strong>${payment._id}</strong></td>
        <td>${payment.user?.name || payment.user?.email || 'Customer'}</td>
        <td>${payment.event?.name || 'Event'}</td>
        <td><strong>${formatMoney(payment.amount)}</strong></td>
        <td>${payment.method || 'Card'}</td>
        <td>${formatDate(payment.createdAt)}</td>
        <td>${badge(payment.status)}</td>
      </tr>`)
    .join('');
}

function renderUsers() {
  const tb = document.getElementById('usersTbody');
  if (!tb) return;
  tb.innerHTML = AppState.users
    .map((user) => `
      <tr>
        <td><strong>${user.name}</strong></td>
        <td>${user.email}</td>
        <td>${user.phone || '—'}</td>
        <td>${user.bookings || 0}</td>
        <td>${formatDate(user.joined)}</td>
        <td>${badge(user.status)}</td>
      </tr>`)
    .join('');
}

function renderHeaderDate() {
  const el = document.getElementById('headerDate');
  const el2 = document.getElementById('headerDateUser');
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  if (el) el.textContent = today;
  if (el2) el2.textContent = today;
}

function userEventMiniCard(e) {
  return `<article class="event-card" onclick="openEventDetails('${e._id}')">
    <div class="event-img" style="background-image:url('${e.img || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80'}')">
      <span class="event-cat-tag">${e.cat}</span>
    </div>
    <div class="event-body">
      <h3 class="event-name">${e.name}</h3>
      <div class="event-meta"><span>📅 ${formatDate(e.date)}</span><span>📍 ${e.city}</span></div>
      <div class="event-foot"><span class="event-rating">★ ${Number(e.rating || 0).toFixed(1)}</span><strong>${formatMoney(e.price)}</strong></div>
    </div>
  </article>`;
}

function renderUserHome() {
  const upcoming = AppState.events.filter((e) => new Date(e.date) >= new Date()).slice(0, 4);
  const recommended = AppState.events.filter((e) => e.trending).slice(0, 4);
  const up = document.getElementById('userUpcomingGrid');
  if (up) up.innerHTML = upcoming.map(userEventMiniCard).join('');
  const rec = document.getElementById('userRecommendedGrid');
  if (rec) rec.innerHTML = recommended.map(userEventMiniCard).join('');
  const tb = document.getElementById('userBookingsMiniTbody');
  const visibleBookings = AppState.bookings.filter((b) => b.status !== 'cancelled').slice(0, 4);
  if (tb) tb.innerHTML = visibleBookings
    .map((b) => `
      <tr>
        <td><strong>${b.event?.name || 'Event'}</strong></td>
        <td>${formatDate(b.event?.date)}</td>
        <td>${formatMoney(b.amount)}</td>
        <td>${badge(b.status)}</td>
      </tr>`)
    .join('');
  const qb = document.getElementById('quickBookList');
  if (qb) qb.innerHTML = upcoming
    .slice(0, 3)
    .map((e) => `
      <button class="quick-book-item" onclick="openEventDetails('${e._id}')">
        <div class="qb-img" style="background-image:url('${e.img || 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80'}')"></div>
        <div class="qb-info"><strong>${e.name}</strong><span>${formatDate(e.date)} · ${e.city}</span></div>
        <span class="qb-price">${formatMoney(e.price)}</span>
      </button>`)
    .join('');
}

function renderUserBookings() {
  const tb = document.getElementById('userBookingsTbody');
  if (!tb) return;
  const visibleBookings = AppState.bookings.filter((b) => b.status !== 'cancelled');
  tb.innerHTML = visibleBookings
    .map((b) => `
      <tr>
        <td><strong>${b.bookingCode || b._id}</strong></td>
        <td>
          <strong>${b.event?.name || 'Event'}</strong>
          ${b.guestName ? `<div class="muted">Guest: ${b.guestName}${b.guestPhone ? ` · ${b.guestPhone}` : ''}</div>` : ''}
        </td>
        <td>${formatDate(b.event?.date)}</td>
        <td>${b.tickets}</td>
        <td><strong>${formatMoney(b.amount)}</strong></td>
        <td>${badge(b.status)}</td>
        <td>
          ${b.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="handlePayPendingBooking('${b._id}')">Pay Now</button>` : ''}
          <button class="btn btn-ghost btn-sm" onclick="handleCancelBooking('${b._id}')">Cancel</button>
        </td>
      </tr>`)
    .join('');
}

function renderUserTickets() {
  const g = document.getElementById('userTicketsGrid');
  if (!g) return;
  const activeBookingIds = new Set(AppState.bookings.filter((b) => b.status !== 'cancelled').map((b) => String(b._id)));
  g.innerHTML = AppState.tickets
    .filter((t) => activeBookingIds.has(String(t.booking || t.booking?._id || '')))
    .map((t) => `
      <div class="ticket-card">
        <div class="ticket-side"></div>
        <div class="ticket-main">
          <span class="event-cat-tag">${t.event?.cat || 'Ticket'}</span>
          <h3>${t.event?.name || 'Event'}</h3>
          <div class="ticket-meta">
            <div><small>Date</small><strong>${formatDate(t.event?.date)}</strong></div>
            <div><small>Venue</small><strong>${t.event?.venue}</strong></div>
            <div><small>Tier</small><strong>${t.tier}</strong></div>
            <div><small>ID</small><strong>${t.ticketId}</strong></div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="handleCancelBooking('${t.booking}')">Cancel Booking</button>
        </div>
        <div class="ticket-qr">
          <div class="qr-mock"></div>
          <small>Scan at entry</small>
        </div>
      </div>`)
    .join('');
}

function renderUserBrowse() {
  const g = document.getElementById('userBrowseGrid');
  if (!g) return;
  const q = (document.getElementById('browseQuery')?.value || '').toLowerCase();
  const cat = document.getElementById('browseCat')?.value || '';
  const results = AppState.events.filter((e) =>
    (!q || e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)) &&
    (!cat || e.cat === cat)
  );
  g.innerHTML = results.length ? results.map(eventCard).join('') : `<p class="empty">No events match your filters.</p>`;
}

function renderAll() {
  renderHeaderDate();
  renderLanding();
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

function clearEventForm() {
  App.editingEventId = null;
  document.getElementById('eventName').value = '';
  document.getElementById('eventCategory').value = '';
  document.getElementById('eventDescription').value = '';
  document.getElementById('eventVenue').value = '';
  document.getElementById('eventCity').value = '';
  document.getElementById('eventDate').value = '';
  document.getElementById('eventTime').value = '';
  document.getElementById('eventPrice').value = '';
  document.getElementById('eventCapacity').value = '';
  document.getElementById('eventBanner').value = '';
  const formTitle = document.getElementById('eventFormTitle');
  const formButton = document.getElementById('eventFormButton');
  if (formTitle) formTitle.textContent = 'Create Event';
  if (formButton) formButton.textContent = 'Publish Event';
}

function openEditEvent(id) {
  const eventData = eventById(id);
  if (!eventData) return toast('Event not found.', 'err');
  App.editingEventId = id;
  document.getElementById('eventName').value = eventData.name || '';
  document.getElementById('eventCategory').value = eventData.cat || '';
  document.getElementById('eventDescription').value = eventData.about || '';
  document.getElementById('eventVenue').value = eventData.venue || '';
  document.getElementById('eventCity').value = eventData.city || '';
  document.getElementById('eventDate').value = eventData.date ? new Date(eventData.date).toISOString().slice(0, 10) : '';
  document.getElementById('eventTime').value = eventData.time || '';
  document.getElementById('eventPrice').value = eventData.price ?? '';
  document.getElementById('eventCapacity').value = eventData.cap ?? '';
  document.getElementById('eventBanner').value = eventData.img || '';
  const formTitle = document.getElementById('eventFormTitle');
  const formButton = document.getElementById('eventFormButton');
  if (formTitle) formTitle.textContent = 'Edit Event';
  if (formButton) formButton.textContent = 'Save Changes';
  navigateTo('create');
}

function deleteEventRow(id) {
  if (!confirm('Delete this event? This cannot be undone.')) return;
  ApiService.deleteEvent(id)
    .then(async () => {
      toast('Event deleted successfully');
      await loadEventData();
      renderAll();
    })
    .catch((err) => toast(err.message, 'err'));
}

function publishEvent() {
  const payload = {
    name: document.getElementById('eventName')?.value.trim(),
    cat: document.getElementById('eventCategory')?.value.trim(),
    about: document.getElementById('eventDescription')?.value.trim(),
    venue: document.getElementById('eventVenue')?.value.trim(),
    city: document.getElementById('eventCity')?.value.trim(),
    date: document.getElementById('eventDate')?.value,
    time: document.getElementById('eventTime')?.value,
    price: Number(document.getElementById('eventPrice')?.value || 0),
    cap: Number(document.getElementById('eventCapacity')?.value || 0),
    seats: Number(document.getElementById('eventCapacity')?.value || 0),
    img: document.getElementById('eventBanner')?.value.trim() || '',
    status: 'upcoming',
  };

  if (!payload.name || !payload.cat || !payload.venue || !payload.city || !payload.date || payload.cap <= 0) {
    toast('Please complete all required event fields before publishing.', 'err');
    return;
  }

  const request = App.editingEventId ? ApiService.updateEvent(App.editingEventId, payload) : ApiService.createEvent(payload);
  const successMessage = App.editingEventId ? 'Event updated successfully' : 'Event published successfully';

  request
    .then(async () => {
      toast(`🎉 ${successMessage}`);
      clearEventForm();
      await loadEventData();
      renderAll();
      navigateTo('admin-events');
    })
    .catch((err) => {
      toast(err.message, 'err');
    });
}

function verifyTicket() {
  const id = (document.getElementById('manualTicketId').value || '').trim();
  if (!id) {
    toast('Enter a ticket ID first.', 'err');
    return;
  }
  document.getElementById('checkinName').textContent = `Verified · ${id}`;
  document.getElementById('checkinEvent').textContent = 'Ticket verified successfully';
  toast('Ticket verified');
}

async function loadEventData() {
  try {
    const response = await ApiService.getEvents('?limit=100');
    AppState.events = response.events || [];
  } catch (err) {
    toast(`Unable to load events: ${err.message}`, 'err');
  }
}

async function loadUserData() {
  if (!AppState.user) return;
  try {
    const [bookings, tickets, payments] = await Promise.all([
      ApiService.getMyBookings().catch(() => ({ bookings: [] })),
      ApiService.getMyTickets().catch(() => ({ tickets: [] })),
      ApiService.getMyPayments().catch(() => ({ payments: [] })),
    ]);
    AppState.bookings = bookings.bookings || [];
    AppState.tickets = tickets.tickets || [];
    AppState.payments = payments.payments || [];
  } catch (err) {
    toast(`Unable to load your data: ${err.message}`, 'err');
  }
}

async function loadAdminData() {
  if (!AppState.user) return;
  if (((AppState.user.role || '').toString().toLowerCase()) !== 'admin') return;
  try {
    const [bookings, users, payments] = await Promise.all([
      ApiService.getAllBookings().catch(() => ({ bookings: [] })),
      ApiService.getAllUsers().catch(() => ({ users: [] })),
      ApiService.getAllPayments().catch(() => ({ payments: [] })),
    ]);
    AppState.bookings = bookings.bookings || [];
    AppState.users = users.users || [];
    AppState.payments = payments.payments || [];
  } catch (err) {
    toast(`Unable to load admin data: ${err.message}`, 'err');
  }
}

const App = {
  postLoginAction: null,
  currentEventId: null,
  editingEventId: null,
  guestBookingEventId: null,
  resetPasswordEmail: '',
  resetPasswordCode: '',
};

document.addEventListener('click', (e) => {
  const wrap = document.querySelector('.profile-wrap');
  const menu = document.getElementById('profileMenu');
  if (wrap && menu && !wrap.contains(e.target)) menu.classList.add('hidden');
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach((m) => closeModal(m.id));
  }
});

async function initApp() {
  ApiService.loadSession();
  await loadEventData();
  // handle return from Stripe Checkout (cancel or success)
  await handleCheckoutReturn();
  if (AppState.user) {
    await loadUserData();
    const roleNorm = (AppState.user.role || '').toString().toLowerCase();
    if (roleNorm === 'admin') await loadAdminData();
    await enterApp();
  } else {
    renderAll();
  }
  setupLoginEnterKey();
}

async function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('checkout_cancel')) {
    const bookingId = params.get('bookingId');
    if (bookingId) {
      toast('Payment cancelled. Cleaning up incomplete booking...', 'err');
      try {
        if (AppState.user) {
          await ApiService.cancelBooking(bookingId);
          await loadUserData();
          renderAll();
          toast('Booking cancelled because payment was not completed.');
        } else {
          toast('Payment cancelled. Please login to see booking status.', 'err');
        }
      } catch (err) {
        toast(`Unable to cancel booking: ${err.message}`, 'err');
      }
    } else {
      toast('Payment cancelled.', 'err');
    }
    // remove query params from URL
    const cleanUrl = window.location.pathname;
    history.replaceState({}, document.title, cleanUrl);
  }
  if (params.get('checkout_success')) {
    toast('Payment completed — thank you! If tickets do not appear, wait a moment for processing.');
    const cleanUrl = window.location.pathname;
    history.replaceState({}, document.title, cleanUrl);
  }
}

document.addEventListener('DOMContentLoaded', initApp);

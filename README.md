# EventHub Backend

Node.js + Express + MongoDB (Mongoose) API for the EventHub event management frontend.

## Setup

```bash
npm install
cp .env.example .env   # then fill in MONGODB_URI, JWT_SECRET, Stripe keys
npm run seed            # optional: loads demo events + admin/demo users
npm run dev              # nodemon, or `npm start` for plain node
```

Demo accounts created by the seed script:
- Admin: `admin@eventhub.com` / `admin123`
- User: `user@eventhub.com` / `user123`

## Environment variables

See `.env.example`. Required: `MONGODB_URI`, `JWT_SECRET`. Stripe keys
(`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are optional until you wire up
real payments — see `controllers/paymentController.js` for the TODO comments
showing exactly where to plug Stripe in.

## Project structure

```
config/db.js              MongoDB connection
models/                   User, Event, Booking, Ticket, Payment (Mongoose schemas)
controllers/               route handlers / business logic
routes/                    Express routers
middleware/auth.js        JWT protect() + role-based authorize()
middleware/errorHandler.js centralized error handling
server.js                  app entry point
seed.js                    loads demo data matching the frontend's mock data
```

## API overview

All protected routes require `Authorization: Bearer <token>` (returned from login/register).

### Auth — `/api/auth`
- `POST /register` — { name, email, phone, password, confirm }
- `POST /login` — { email, password }
- `GET /me` — current user (protected)
- `PUT /me` — update profile (protected)

### Events — `/api/events`
- `GET /` — query: search, city, cat, minPrice, maxPrice, featured, trending, page, limit
- `GET /categories`
- `GET /:id`
- `POST /` — admin only
- `PUT /:id` — admin only
- `DELETE /:id` — admin only

### Bookings — `/api/bookings` (all protected)
- `POST /` — { eventId, tickets } → creates a pending booking
- `GET /me` — current user's bookings
- `GET /` — admin only, all bookings
- `GET /:id`
- `PUT /:id/cancel`

### Payments — `/api/payments` (all protected, see Stripe section below)
- `POST /create-intent` — { bookingId, method } → creates a Payment record (simulated until Stripe is wired in)
- `POST /:id/confirm` — confirms payment, activates booking, generates tickets
- `GET /me`
- `GET /` — admin only
- `POST /api/payments/webhook` — Stripe webhook (mounted in server.js with raw body)

### Tickets — `/api/tickets` (all protected)
- `GET /me`
- `GET /verify/:ticketId` — admin, check-in screen
- `POST /checkin/:ticketId` — admin
- `GET /event/:eventId` — admin

### Users — `/api/users` (admin only)
- `GET /`
- `GET /:id`
- `PUT /:id/status` — { status: 'active' | 'suspended' }
- `DELETE /:id`

### Analytics — `/api/analytics` (admin only)
- `GET /overview` — revenue, payment counts, totals (for stat cards)
- `GET /revenue-by-month`
- `GET /sales-by-category`

## Stripe integration

Payments currently run in a **simulated mode** so the rest of the flow
(booking → payment → ticket generation) is testable without a Stripe account.
To go live:

1. `npm install stripe`
2. Add real keys to `.env` (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
3. In `controllers/paymentController.js`, follow the `TODO (Stripe)` comments:
   replace `createPaymentIntent` with a real `stripe.paymentIntents.create()`
   call, and implement `handleWebhook` with `stripe.webhooks.constructEvent`.
4. On the frontend, use Stripe.js/Elements with the returned `clientSecret`
   to collect card details.

## MongoDB

Set `MONGODB_URI` in `.env` to a local MongoDB instance or a MongoDB Atlas
connection string. See the comment in `.env.example` for the Atlas URI format.

## Connecting the existing frontend

The frontend's `AuthService` object (in `script.js`) currently uses
localStorage. Replace its `login`, `register`, and `current` methods with
`fetch()` calls to `/api/auth/login`, `/api/auth/register`, and `/api/auth/me`
respectively, storing the returned JWT instead of a fake session object. The
rest of the app (events, bookings, tickets, payments, admin panels) can be
migrated the same way — swap the `EVENTS` / `BOOKINGS` / etc. mock arrays for
`fetch()` calls to the matching endpoints above.

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
// Seeds the database with demo data matching the frontend's mock data
// (CATEGORIES / EVENTS / SEED users in script.js), so the existing
// frontend works against the real API with minimal changes.
require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const Event = require('./models/Event');

const events = [
  { name: 'Vintage Wine Tasting Soirée', cat: 'Gala', city: 'New York', venue: 'The Grand Ballroom', date: new Date('2026-07-12'), time: '7:00 PM', price: 150, rating: 4.9, seats: 2, cap: 250, img: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80', about: 'An intimate evening of curated vintages, candlelight and live string quartet.', org: { name: 'Aaliyah Hassan', company: 'EventHub Studios', email: 'aaliyah@eventhub.com', phone: '+1 555 010 2030', site: 'eventhub.com' }, address: '305 Park Ave, New York, NY 10001', featured: true },
  { name: 'Tech Founders Summit', cat: 'Conference', city: 'San Francisco', venue: 'Halcyon Convention Ctr', date: new Date('2026-07-18'), time: '9:00 AM', price: 95, rating: 4.8, seats: 80, cap: 600, img: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=900&q=80', about: 'Three days with founders, operators and investors shaping what comes next.', org: { name: 'Marcus Reed', company: 'Halcyon Group', email: 'hello@halcyon.io', phone: '+1 555 020 1010', site: 'halcyon.io' }, address: '120 Market St, San Francisco, CA', featured: true, trending: true },
  { name: 'Midnight Jazz Gala', cat: 'Concert', city: 'Chicago', venue: 'Rooftop @ The Onyx', date: new Date('2026-07-24'), time: '10:00 PM', price: 120, rating: 4.7, seats: 116, cap: 300, img: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=900&q=80', about: 'A sultry rooftop night with live jazz, cocktails and city skyline views.', org: { name: 'Lena Park', company: 'Onyx Nights', email: 'lena@onyx.com', phone: '+1 555 030 4040', site: 'onyxnights.com' }, address: '88 N Wabash Ave, Chicago, IL', featured: true, trending: true },
  { name: 'Indie Film Festival', cat: 'Festival', city: 'Austin', venue: 'Theatre du Lumière', date: new Date('2026-08-02'), time: '5:00 PM', price: 65, rating: 4.6, seats: 188, cap: 500, img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=900&q=80', about: 'Four nights of indie premieres, director Q&As and curated short films.', org: { name: 'Sami Cohen', company: 'Lumière Collective', email: 'sami@lumiere.co', phone: '+1 555 040 2020', site: 'lumiere.co' }, address: '42 Congress Ave, Austin, TX' },
  { name: 'Mindful Leadership Workshop', cat: 'Workshop', city: 'Boston', venue: 'Studio Loft 5', date: new Date('2026-08-09'), time: '10:00 AM', price: 220, rating: 4.9, seats: 14, cap: 80, img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&q=80', about: 'A hands-on day on mindful decision-making for senior leaders.', org: { name: 'Dr. Priya Shah', company: 'Mindshift Co.', email: 'priya@mindshift.co', phone: '+1 555 050 3030', site: 'mindshift.co' }, address: '9 Beacon St, Boston, MA' },
  { name: 'Sommelier Networking Night', cat: 'Networking', city: 'New York', venue: 'Crimson Hall', date: new Date('2026-08-15'), time: '8:00 PM', price: 75, rating: 4.5, seats: 42, cap: 120, img: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=900&q=80', about: "Meet the city's top wine professionals over a guided tasting flight.", org: { name: 'Rohan Mehta', company: 'Crimson Society', email: 'rohan@crimson.club', phone: '+1 555 060 9090', site: 'crimson.club' }, address: '1 Crimson Ave, New York, NY' },
  { name: 'Citywide Marathon 2026', cat: 'Marathon', city: 'Los Angeles', venue: 'Griffith Park', date: new Date('2026-09-05'), time: '6:00 AM', price: 45, rating: 4.7, seats: 1240, cap: 5000, img: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=900&q=80', about: 'A scenic 42km run through downtown finishing at Griffith Observatory.', org: { name: 'LA Run Club', company: 'LARC Events', email: 'race@larc.org', phone: '+1 555 070 8080', site: 'larc.org' }, address: '4730 Crystal Springs Dr, LA', trending: true },
  { name: 'Future of AI — Hackathon', cat: 'Hackathon', city: 'Seattle', venue: 'Pike District Hub', date: new Date('2026-09-14'), time: '9:00 AM', price: 0, rating: 4.8, seats: 62, cap: 400, img: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=900&q=80', about: '48 hours, $50k in prizes, mentors from leading AI labs.', org: { name: 'Pike Labs', company: 'Pike Labs Inc.', email: 'team@pikelabs.dev', phone: '+1 555 080 7070', site: 'pikelabs.dev' }, address: '1428 Pike Pl, Seattle, WA', featured: true, trending: true },
  { name: 'Friday Comedy Showcase', cat: 'Stand-up Comedy', city: 'Brooklyn', venue: 'Bedford Comedy Club', date: new Date('2026-07-11'), time: '9:00 PM', price: 35, rating: 4.6, seats: 21, cap: 90, img: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=900&q=80', about: 'Six rising comics. One unforgettable night.', org: { name: 'Bedford Comedy', company: 'BFC Productions', email: 'hi@bedfordcomedy.nyc', phone: '+1 555 090 6060', site: 'bedfordcomedy.nyc' }, address: '151 Bedford Ave, Brooklyn, NY' },
];

const run = async () => {
  await connectDB();

  await User.deleteMany({});
  await Event.deleteMany({});

  await User.create([
    { name: 'Admin User', email: 'admin@eventhub.com', password: 'admin123', role: 'admin', phone: '+1 555 000 0001' },
    { name: 'Demo User', email: 'user@eventhub.com', password: 'user123', role: 'user', phone: '+1 555 000 0002' },
  ]);

  await Event.insertMany(events);

  console.log('Seed complete: 2 users, %d events created.', events.length);
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

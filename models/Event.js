const mongoose = require('mongoose');

const OrganizerSchema = new mongoose.Schema(
  {
    name: String,
    company: String,
    email: String,
    phone: String,
    site: String,
  },
  { _id: false }
);

const EventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    cat: { type: String, required: true }, // category, e.g. 'Gala', 'Conference'
    city: { type: String, required: true },
    venue: { type: String, required: true },
    address: { type: String },
    date: { type: Date, required: true },
    time: { type: String }, // display string e.g. "7:00 PM"
    price: { type: Number, required: true, default: 0 },
    rating: { type: Number, default: 0 },
    seats: { type: Number, required: true }, // seats remaining
    cap: { type: Number, required: true }, // total capacity
    img: { type: String },
    about: { type: String },
    org: OrganizerSchema,
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

EventSchema.index({ name: 'text', city: 'text', venue: 'text', cat: 'text' });

module.exports = mongoose.model('Event', EventSchema);

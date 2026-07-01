const mongoose = require('mongoose');
const crypto = require('crypto');

const TicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true }, // e.g. EVH-2026-00123
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seat: { type: String }, // e.g. "Seat A12"
    tier: { type: String, default: 'General' }, // e.g. VIP, General
    qrCode: { type: String }, // data string encoded into the QR (e.g. ticketId)
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

TicketSchema.pre('save', function (next) {
  if (!this.ticketId) {
    const year = new Date().getFullYear();
    const rand = crypto.randomInt(10000, 99999);
    this.ticketId = `EVH-${year}-${rand}`;
  }
  if (!this.qrCode) {
    this.qrCode = this.ticketId;
  }
  next();
});

module.exports = mongoose.model('Ticket', TicketSchema);

const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, unique: true }, // e.g. EVH-10021
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    tickets: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true }, // total amount in dollars
    status: { type: String, enum: ['pending', 'active', 'cancelled', 'failed', 'completed'], default: 'pending' },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

// Auto-generate a human friendly booking code like EVH-10021
BookingSchema.pre('save', async function (next) {
  if (!this.bookingCode) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingCode = `EVH-${10000 + count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);

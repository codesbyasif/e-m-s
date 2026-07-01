const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    txnId: { type: String, unique: true }, // e.g. TXN-9821
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'usd' },
    method: { type: String, default: 'card' }, // e.g. "Visa ••4242"
    status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },

    // ---- Stripe integration fields ----
    // TODO (Stripe): populate these once Stripe is wired up in
    // controllers/paymentController.js (createPaymentIntent / webhook handler).
    stripePaymentIntentId: { type: String }, // pi_xxx returned by Stripe
    stripeCheckoutSessionId: { type: String }, // cs_xxx if using Checkout Sessions
    stripeCustomerId: { type: String }, // cus_xxx
  },
  { timestamps: true }
);

PaymentSchema.pre('save', async function (next) {
  if (!this.txnId) {
    const count = await mongoose.model('Payment').countDocuments();
    this.txnId = `TXN-${9000 + count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);

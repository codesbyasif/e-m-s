const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const { confirmBookingAfterPayment } = require('./bookingController');

// ============================================
// STRIPE PAYMENT GATEWAY — INTEGRATION POINT
// ============================================
// TODO (Stripe):
// 1. Run: npm install stripe
// 2. Uncomment the line below and set STRIPE_SECRET_KEY in your .env file
//    (see .env.example). Get your keys at https://dashboard.stripe.com/apikeys
//
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
//
// 3. This controller currently SIMULATES a successful payment so the rest
//    of the API (bookings -> tickets -> revenue) can be tested end-to-end
//    without a real Stripe account. Replace the simulated logic in
//    createPaymentIntent() below with real Stripe calls, e.g.:
//
//    const paymentIntent = await stripe.paymentIntents.create({
//      amount: Math.round(booking.amount * 100), // Stripe expects cents
//      currency: 'usd',
//      metadata: { bookingId: booking._id.toString(), userId: req.user._id.toString() },
//    });
//    return res.json({ success: true, clientSecret: paymentIntent.client_secret });
//
//    Then on the frontend, use Stripe.js / Stripe Elements with the
//    returned clientSecret to collect card details and confirm the payment.
//
// 4. Set up a webhook endpoint in your Stripe Dashboard pointing to:
//    POST /api/payments/webhook
//    Listen for "payment_intent.succeeded" and "payment_intent.payment_failed".
//    Use STRIPE_WEBHOOK_SECRET (see .env.example) to verify the signature:
//
//    const sig = req.headers['stripe-signature'];
//    const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
//
//    NOTE: the webhook route must receive the RAW request body (not JSON-parsed).
//    In server.js, mount it with express.raw({ type: 'application/json' })
//    BEFORE the global express.json() middleware.
// ============================================

// @route POST /api/payments/create-intent
// Body: { bookingId, method }
// Currently simulates a payment gateway call. Swap for real Stripe PaymentIntent above.
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId, method = 'card' } = req.body;
    const booking = await Booking.findById(bookingId).populate('event', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const payment = await Payment.create({
      user: req.user._id,
      event: booking.event._id,
      booking: booking._id,
      amount: booking.amount,
      method,
      status: 'pending',
      // stripePaymentIntentId: paymentIntent.id, // TODO (Stripe): set once real Stripe call is in place
    });

    booking.payment = payment._id;
    await booking.save();

    // ---- SIMULATED RESPONSE (replace with Stripe clientSecret) ----
    res.status(201).json({
      success: true,
      message: 'Payment intent created (simulated — integrate Stripe here).',
      payment,
      // clientSecret: paymentIntent.client_secret, // TODO (Stripe)
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/payments/:id/confirm
// Manually confirms a payment (used while Stripe isn't wired up yet / for testing).
// Once Stripe is integrated, real confirmation should happen via the webhook
// handler (handleWebhook below) instead of being triggered by the client.
exports.confirmPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    if (String(payment.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    payment.status = 'success';
    await payment.save();

    const { booking, tickets } = await confirmBookingAfterPayment(payment.booking);

    res.json({ success: true, payment, booking, tickets });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/payments/me
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).populate('event', 'name').sort({ createdAt: -1 });
    res.json({ success: true, count: payments.length, payments });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/payments  (admin only)
exports.getAllPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate('user', 'name email')
        .populate('event', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    res.json({ success: true, count: payments.length, total, payments });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/payments/webhook
// TODO (Stripe): replace this stub with real Stripe webhook verification + handling.
// Must be mounted with express.raw() — see notes at top of file.
exports.handleWebhook = async (req, res, next) => {
  try {
    // const sig = req.headers['stripe-signature'];
    // let event;
    // try {
    //   event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    // } catch (err) {
    //   return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    // }
    //
    // switch (event.type) {
    //   case 'payment_intent.succeeded': {
    //     const intent = event.data.object;
    //     const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
    //     if (payment && payment.status !== 'success') {
    //       payment.status = 'success';
    //       await payment.save();
    //       await confirmBookingAfterPayment(payment.booking);
    //     }
    //     break;
    //   }
    //   case 'payment_intent.payment_failed': {
    //     const intent = event.data.object;
    //     await Payment.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: 'failed' });
    //     break;
    //   }
    // }
    //
    // res.json({ received: true });

    res.status(501).json({
      success: false,
      message: 'Stripe webhook not yet implemented. See TODO comments in paymentController.js',
    });
  } catch (err) {
    next(err);
  }
};

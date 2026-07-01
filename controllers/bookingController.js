const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Ticket = require('../models/Ticket');

// @route POST /api/bookings
// Creates a booking in "pending" status. Confirmation to "active" happens
// after successful payment (see paymentController -> confirmPayment / webhook).
exports.createBooking = async (req, res, next) => {
  try {
    const { eventId, tickets } = req.body;
    if (!eventId || !tickets || tickets < 1) {
      return res.status(400).json({ success: false, message: 'eventId and a valid tickets count are required.' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.seats < tickets) {
      return res.status(400).json({ success: false, message: 'Not enough seats available.' });
    }

    const amount = event.price * tickets;

    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      tickets,
      amount,
      status: 'pending',
    });

    res.status(201).json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/bookings/me
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'name date img venue city price')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/bookings  (admin only)
exports.getAllBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('user', 'name email')
        .populate('event', 'name date')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Booking.countDocuments(filter),
    ]);

    res.json({ success: true, count: bookings.length, total, bookings });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/bookings/:id
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event').populate('user', 'name email');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Users may only view their own booking; admins can view any
    if (req.user.role !== 'admin' && String(booking.user._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (req.user.role !== 'admin' && String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (booking.status === 'active') {
      // restore seats if it had been confirmed
      await Event.findByIdAndUpdate(booking.event, { $inc: { seats: booking.tickets } });
    }
    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// Internal helper used by paymentController after successful payment:
// confirms booking, decrements seats, and generates tickets.
exports.confirmBookingAfterPayment = async (bookingId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new Error('Booking not found');

    booking.status = 'active';
    await booking.save({ session });

    await Event.findByIdAndUpdate(booking.event, { $inc: { seats: -booking.tickets } }, { session });

    const tickets = [];
    for (let i = 0; i < booking.tickets; i++) {
      const ticket = await Ticket.create(
        [
          {
            booking: booking._id,
            event: booking.event,
            user: booking.user,
            tier: 'General',
          },
        ],
        { session }
      );
      tickets.push(ticket[0]);
    }

    await session.commitTransaction();
    session.endSession();
    return { booking, tickets };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const Ticket = require('../models/Ticket');

// @route GET /api/tickets/me
exports.getMyTickets = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id }).populate('event', 'name date venue city img time');
    res.json({ success: true, count: tickets.length, tickets });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/tickets/verify/:ticketId  (admin / check-in staff)
// Used by the "Verify Ticket" check-in screen.
exports.verifyTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId })
      .populate('event', 'name date venue')
      .populate('user', 'name email');

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found / invalid.' });
    }
    if (ticket.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Ticket already checked in.',
        ticket,
      });
    }

    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/tickets/checkin/:ticketId  (admin / check-in staff)
exports.checkInTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ ticketId: req.params.ticketId });
    if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
    if (ticket.checkedIn) {
      return res.status(400).json({ success: false, message: 'Ticket already checked in.' });
    }

    ticket.checkedIn = true;
    ticket.checkedInAt = new Date();
    await ticket.save();

    res.json({ success: true, message: 'Checked in successfully', ticket });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/tickets/event/:eventId  (admin)
exports.getTicketsForEvent = async (req, res, next) => {
  try {
    const tickets = await Ticket.find({ event: req.params.eventId }).populate('user', 'name email');
    res.json({ success: true, count: tickets.length, tickets });
  } catch (err) {
    next(err);
  }
};

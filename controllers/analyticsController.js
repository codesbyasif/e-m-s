const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const User = require('../models/User');

// @route GET /api/analytics/overview  (admin only)
// Powers the admin dashboard stat cards (revenue, successful/pending/failed payments, etc.)
exports.getOverview = async (req, res, next) => {
  try {
    const [totalRevenueAgg, successful, pending, failed, totalEvents, totalUsers, totalBookings] = await Promise.all([
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments({ status: 'success' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'failed' }),
      Event.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
    ]);

    res.json({
      success: true,
      overview: {
        totalRevenue: totalRevenueAgg[0]?.total || 0,
        successfulPayments: successful,
        pendingPayments: pending,
        failedPayments: failed,
        totalEvents,
        totalUsers,
        totalBookings,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/analytics/revenue-by-month  (admin only)
exports.getRevenueByMonth = async (req, res, next) => {
  try {
    const data = await Payment.aggregate([
      { $match: { status: 'success' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/analytics/sales-by-category  (admin only)
exports.getSalesByCategory = async (req, res, next) => {
  try {
    const data = await Booking.aggregate([
      { $match: { status: { $in: ['active', 'completed'] } } },
      {
        $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'eventInfo' },
      },
      { $unwind: '$eventInfo' },
      { $group: { _id: '$eventInfo.cat', ticketsSold: { $sum: '$tickets' } } },
      { $sort: { ticketsSold: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

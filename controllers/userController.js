const User = require('../models/User');
const Booking = require('../models/Booking');

// @route GET /api/users  (admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { role: 'user' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const users = await User.find(filter).skip(skip).limit(Number(limit)).sort({ createdAt: -1 });

    // attach booking counts (mirrors ADMIN_USERS.bookings in the frontend mock data)
    const withCounts = await Promise.all(
      users.map(async (u) => {
        const bookings = await Booking.countDocuments({ user: u._id });
        return {
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          status: u.status,
          joined: u.createdAt,
          bookings,
        };
      })
    );

    const total = await User.countDocuments(filter);
    res.json({ success: true, count: withCounts.length, total, users: withCounts });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/users/:id  (admin only)
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/users/:id/status  (admin only) — suspend / activate a user
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/users/:id  (admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

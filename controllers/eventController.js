const Event = require('../models/Event');

// @route GET /api/events
// Supports query params: search, city, cat, minPrice, maxPrice, featured, trending, page, limit
exports.getEvents = async (req, res, next) => {
  try {
    const { search, city, cat, minPrice, maxPrice, featured, trending, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
      ];
    }
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (cat) filter.cat = cat;
    if (featured !== undefined) filter.featured = featured === 'true';
    if (trending !== undefined) filter.trending = trending === 'true';
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [events, total] = await Promise.all([
      Event.find(filter).sort({ date: 1 }).skip(skip).limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({ success: true, count: events.length, total, page: Number(page), events });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/events/:id
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/events  (admin only)
exports.createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/events/:id  (admin only)
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/events/:id  (admin only)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/events/categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Event.distinct('cat');
    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

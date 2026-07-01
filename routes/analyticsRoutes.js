const express = require('express');
const router = express.Router();
const { getOverview, getRevenueByMonth, getSalesByCategory } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/overview', getOverview);
router.get('/revenue-by-month', getRevenueByMonth);
router.get('/sales-by-category', getSalesByCategory);

module.exports = router;

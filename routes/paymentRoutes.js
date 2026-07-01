const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  confirmPayment,
  getMyPayments,
  getAllPayments,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// NOTE: the Stripe webhook route (/api/payments/webhook) is intentionally
// NOT defined here — it needs the raw request body for signature
// verification, so it's mounted directly in server.js before express.json().

router.use(protect);

router.post('/create-intent', createPaymentIntent);
router.post('/:id/confirm', confirmPayment);
router.get('/me', getMyPayments);
router.get('/', authorize('admin'), getAllPayments);

module.exports = router;

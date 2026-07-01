const express = require('express');
const router = express.Router();
const {
  getMyTickets,
  verifyTicket,
  checkInTicket,
  getTicketsForEvent,
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/me', getMyTickets);
router.get('/verify/:ticketId', authorize('admin'), verifyTicket);
router.post('/checkin/:ticketId', authorize('admin'), checkInTicket);
router.get('/event/:eventId', authorize('admin'), getTicketsForEvent);

module.exports = router;

const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController');
const reviewController = require('./../controllers/reviewController');

const router = express.Router();

router.use(authController.protect); // As middleware runs in sequence, all code below
                                    // will be accessible only after authController.protect execution
                                    // All routes below are protected by authController.protect

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);

router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router.route('/:id')
  .delete(bookingController.deleteBooking)
  .patch(bookingController.updateBooking)
  .get(bookingController.getBooking);

module.exports = router;

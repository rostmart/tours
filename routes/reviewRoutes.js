const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true }); // for nested routes (standard). It allows to use
                                                      // either "POST /tour/tourid/reviews" or "POST /reviews"
                                                      // As a result, in both cases all code below will be executed

router.use(authController.protect); // As middleware runs in sequence, all code below
                                    // will be accessible only after authController.protect execution
                                    // All routes below are protected by authController.protect


router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(authController.protect, authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);

router.route('/:id')
  .delete(reviewController.deleteReview)
  .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
  .get(authController.restrictTo('user', 'admin'), reviewController.getReview);

module.exports = router;

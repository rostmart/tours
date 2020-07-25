const express = require('express');
const tourController = require('./../controllers/tourController');
const router = express.Router();
const authController = require('./../controllers/authController');
//const reviewController  = require('./../controllers/reviewController'); // For simple nested routing explanation
const reviewRouter = require('./reviewRoutes'); // for nester routes (standard not simple)

//router.param('id', tourController.checkID);//param is used for specific routes

// Nested Routing (not simple)
router
  .use('/:tourId/reviews',
    reviewRouter); // uses reviewRouter whenever there is this url pattern

router //specification for 5 cheapest tours
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours,
    tourController.getAllTours)

router //Aggregation pipeline (Lesson 101)
  .route('/tour-stats')
  .get(tourController.getTourStats);

router //Aggregation pipeline Unwinding, Projecting (Lesson 102)
  .route('/monthly-plan/:year')
  .get(authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan);

router // route for geospatial quires (determining the circle with different tours inside)
  .route('/tours-within/:distance/center/:latlnd/unit/:unit')
  // (e.x. /tours-within/233/center/-40.45/unit/mi)
  .get(tourController.getToursWithin);

router // route for geospatial quires (determining distances to all tours from my point)
  .route('/distances/:latlnd/unit/:unit')
  // (e.x. /tours-within/233/center/-40.45/unit/mi)
  .get(tourController.getDistances);

router //here we specified all possible methods with ('/api/v1/tours') route
  .route('/')
  .get(tourController.getAllTours)
  //.post(tourController.checkBody, tourController.createTour);
  .post(authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour);

router //here we specified all possible methods with ('/api/v1/tours/:id') route
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour) //.patch updates data
  .delete(authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour); //firstly
  //"authController.protect" middleware is executed. In case it does not throw an error, "authController.restrictTo"() is
  //executed. Finally, if there are any errors, "tourController.deleteTour" is excuted

//Simple Nested Routes
// router
//   .route('/:tourId/reviews')
//   .post(authController.protect, authController.restrictTo('user'), reviewController.createReview
// );

module.exports = router;

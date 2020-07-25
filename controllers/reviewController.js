const Review = require('./../models/reviewModel');
//const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory'); // imports universal functions

// has been moved to handlerFactory.js as getAll function
// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   //const reviews = await Review.find();
//
//   // if (reviews.length < 1 || reviews == undefined) {
//   //     return next(new AppError('No users were found', 404)); //need to use 'return' as it sends response and exits the function
//   // };
//
//   //Nested routes implementation. In case there is a tour ID in url, shows reviews only for this tour
//   let filter = {};
//   if (req.params.tourId) {
//     filter = { tour: req.params.tourId };
//   };
//
//   const reviews = await Review.find(filter);
//
//   if (reviews.length < 1 || reviews == undefined) {
//     return next(new AppError('No reviews were found', 404)); //need to use 'return' as it sends response and exits the function
//   };
//   sendResponse(reviews, 200, res);
// });
exports.getAllReviews = factory.getAll(Review);

exports.setTourUserIds = (req, res, next) => { // checks and sets ids (for Nested routes)
  if (!req.body.tour) req.body.tour = req.params.tourId; // nested routes implementation. In case there is no information
                                                         // specified in the body, take tourId from URL
  if (!req.body.user) req.body.user = req.user.id        // nested routes implementation. In case there is no information
                                                         // specified in the body, take user id from authController.protect
  next();
};

// has been moved to handlerFactory.js as createOne function
// exports.createReview = catchAsync(async (req, res, next) => {
//   // //Nested routes (has been moved to setTourUserIds function)
//   // if (!req.body.tour) req.body.tour = req.params.tourId; // nested routes implementation. In case there is no information
//   //                                                        // specified in the body, take tourId from URL
//   // if (!req.body.user) req.body.user = req.user.id        // nested routes implementation. In case there is no information
//   //                                                        // specified in the body, take user id from authController.protect
//   const newReview = await Review.create(req.body);
//   sendResponse(newReview, 201, res);
//   });
exports.createReview = factory.createOne(Review);

//FUNCTION WHICH SENDS RESPONSE TO THE USER
const sendResponse = (review, statusCode, res) => {

  res.status(statusCode).json({
    status: 'success',
    results: review.length,
      data: {
        review
      }
    });
}

exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review);

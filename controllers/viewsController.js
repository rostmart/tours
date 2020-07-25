const Tour =require('../models/tourModel')
const Booking =require('../models/bookingModel')
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory'); // imports universal functions
const AppError = require('../utils/appError');
const User = require('../models/userModel');

// router.get('/', (req, res) => { // uses template from views folder/base.pug file and sends it to the browser home page
//   res.status(200).render('base', {
//     tour: 'The Forest Alik',
//     user: 'Rost'
//   });
// });

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get tour data from collection
  const tours = await Tour.find();

  // 2) Build template

  // 3) Render that template using tour data from 1)

  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  });
});

exports.getTour =  catchAsync(async (req, res, next) => {
  // 1) Get the data, for the requested tour (including reviews and guides)
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({ // we use slug in order to pass a tour name 'the-forest-hiker' from url to findOne
    path: 'reviews',
    fields: 'review rating user'
  });
  // console.log(tour);
  if (!tour) {
    return next(new AppError('There is no tour with url specified', 404));
  }
  // 2) Build template (tour.pug)

  // 3) Render that template using tour data from 1)
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour
  });
});

exports.getLoginForm = (req, res) => {

  res.status(200).render('login', {
    title: 'Log into your account!!!'
  });
};

exports.getSignUpForm = (req, res) => {

  res.status(200).render('signup', {
    title: 'Sign your account!!!'
  });
};

exports.getAccount = (req, res) => {

  res.status(200).render('account', {
    title: 'My account'
  });
};

exports.getMyTours = catchAsync(async(req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id }); // we find user ID here

  // 2) Find tours with returned IDs
  const tourIDs = bookings.map(el => el.tour); // finds all booked of req.user.id tours and
                                               // saves them into an array
  const tours = await Tour.find({ _id: { $in: tourIDs } }); // gets all tours based on theirs IDs
  res.status(200).render('overview', {
    title: 'MyTours',
    tours
  });
});

// user update (variant: Specifying POST method in a
// form along with url where it should be sent)
// exports.updateUserData = catchAsync( async (req, res, next) => {
//   const updatedUser = await User.findByIdAndUpdate(req.user.id,
//   {
//     name: req.body.name,
//     email: req.body.email
//   },
//   {
//     new: true,
//     runValidators: true
//     //  {new: true, runValidators: true} - options where "new: true" returns new updated
//     // object; x - data user needs to update (in case of req.body we get an object
//     // with all new data so NEVER use it as user will be able to update his role, etc).
//     // Therefore, we use filteredBody
//   });
//   res.status(200).render('account', {
//     title: 'My account',
//     user: updatedUser
//   });
// });

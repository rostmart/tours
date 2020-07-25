const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory'); // imports universal functions
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);//stripe for payment


exports.createBooking = factory.createOne(Booking);

exports.getAllBookings = factory.getAll(Booking);

exports.deleteBooking = factory.deleteOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.getBooking = factory.getOne(Booking);






exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get currently booked tour
   const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/?tour =${req.params.tourId}&user=${req.user.id}$price=${tour.price}`, // in case of successful payment,
                                                                                                                             // user will be redirected to this url.
                                                                                                                             // To this url we added all fields for
                                                                                                                             // booking model
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, // in case user cancel payment, he will
                                                                          // be redirected to this url
    customer_email: req.user.email, // req.user.email we get from authController.protect
    client_reference_id: req.params.tourId, // saves info about current checkout session to booking field in DB. Works
                                            // only for deployed website
    line_items: [ // details about product itself
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
        amount: tour.price * 100, // *100 because the amount is in cents
        currency: 'usd',
        quantity: 1
      }
    ]
  })

  // 3) Send checkout session to the client
  res.status(200).json({
    status: 'success',
    session
  });
});

// Function that creates new booking in DB (this function will be added when booking is successful)
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  // TEMPORARY SOLUTION AS IT IS UNSECURE
  const {tour, user, price} = req.query;

  if (!tour && !user && !price) return next();
  await Booking.create({tour, user, price})

  res.redirect(req.originalUrl.split('?')[0]); // hides url with tour, user and price (security measure).
                                               // After createBookingCheckout execution and reaching this
                                               // point, this function will be executed one more time with
                                               // a new url, specified here
  next();
});

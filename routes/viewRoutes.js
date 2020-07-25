const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

//Router for logged in users(here on the top as it should be before any other midlleware)
//router.use(authController.isLoggedIn);

//ROUTES
// router.get('/', (req, res) => { // uses template from views folder/base.pug file
//                                 // and sends it to the browser home page
//   res.status(200).render('base', {
//     tour: 'The Forest Alik',
//     user: 'Rost'
//   });
// });

router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewController.getOverview); // uses template from views folder/base.pug file
                                             // and sends it to the browser home page

router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);

router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

router.get('/signup', authController.isLoggedIn, viewController.getSignUpForm);

router.get('/me', authController.protect, viewController.getAccount);

router.get('/my-tours', authController.protect, viewController.getMyTours);

//router.post('/submit-user-data', authController.protect, viewController.updateUserData); // route for user update
                                                                // (variant: Specifying POST method in a
                                                                //-form along with url where it should be sent)

module.exports = router;

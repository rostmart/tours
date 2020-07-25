const { promisify } = require('util'); // destructuring built in 'util' object and extracting promisify
const crypto = require('crypto'); // for sending a random token to a user when the user forgot her password
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const Email = require('./../utils/email');

const signToken = id => { //returns new token for the user with given id
  return jwt.sign({ id }, process.env.JWT_SECRET, { //{ id: newUser._id } - payload (user's id),
                                                                      //'secret' - JWT_SECRET  from config.env
  expiresIn: process.env.JWT_EXPIRES_IN                               //Here an option of password expiring is
                                                                      //specified (from config.env)
  });
}

//FUNCTION WHICH SENDS RESPONSE TO THE USER
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), //converting
                                                                     // JWT_COOKIE_EXPIRES_IN into milliseconds
                                                                     // in config.env "JWT_COOKIE_EXPIRES_IN=90"
                                                                     // without "d" at the end because we need to
                                                                     // convert it to milliseconds
    httpOnly: true // cookie will not be modified by the browser
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true; // we need to use https only in production,
                                                                          // as "secure: true" option will allow to sent
                                                                          // cookie only via https
  res.password = undefined; // removes password from showing up in postman
  res.cookie('jwt', token, cookieOptions);

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
}

//SIGNIG UP
exports.signup = catchAsync(async (req, res, next) => { //req holds all info about the request, which was done
  const newUser = await User.create({//in this way we create a new user with only these selected fields
                                     //so new user have user role. In order to change a role to admin it is,
				                     //it is necessary to change it in mongodb
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpires: req.body.passwordResetExpires
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);
  await new Email(newUser, url).sendWelcome();
    ///*My CODING (emailconfirmation)/////////////////
    // const resetToken = newUser.createPasswordResetToken();
    // await newUser.save({ validateBeforeSave: false }); // deactivates all validators before saving
    //                                                // so we can save "passwordResetToken" and
    //                                                // "passwordResetExpires"
    //
    // // 3) Send it to user's email
    // //console.log(resetToken);
    // const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/emailconfirmation/${resetToken}`;
    // const message = `In order to restore password, submit a PATCH request with a new
    // password and passwordConfirm to: ${resetURL}.`;
    // try { // we use try/catch block because it is not enough to send simple error message as we need to
    //       // reset encrypted password and expires date in DB
    //   await sendEmail({
    //     email: newUser.email,
    //     subject: 'Your email confirmation token (valid 10 minutes!)',
    //     message
    //   });
    //   res.status(200).json({
    //     status: 'success',
    //     message: 'Check an email confirmation token in email!!!'
    //   });
    // } catch (err) {
    //   // user.passwordResetToken = undefined;
    //   // user.passwordResetExpires = undefined;
    //   // await user.save({ validateBeforeSave: false }); // deactivates all validators before saving
    //   //                                                 // so we can save "passwordResetToken" and
    //   //                                                 // "passwordResetExpires"
    //  return next(new AppError('There was an error sending the email. Try again later!!!'), 500);
    // }
    ///My CODING (emailconfirmation)*/////////////////


  //signToken function has been created for this block
  // const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { //{ id: newUser._id } - payload (user's id),
  //                                                                       //'secret' - JWT_SECRET  from config.env
  //   expiresIn: process.env.JWT_EXPIRES_IN                               //Here an option of password expiring is
  //                                                                       //specified (from config.env)
  // });

  createSendToken(newUser._id, 201, res);
});

//LOGING IN
exports.login = catchAsync(async (req, res, next) => {

  const { email, password } = req.body; //creating two variables from the same object (destructuring)
  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Provide email and password!!!', 400)); // 'return' fixes the issue with sending two responses
  }




  // 2) Check if the user exists && password is correct
  const user = await User.findOne({ email }).select('+password'); //+password we use in order to explicitly use a password
                                                                  // which is hidden in userModel

  if(!user || !(await user.correctPassword(password, user.password))) { // we can use user.correctPassword
                                                                         // as correctPassword is an instance method
    return next(new AppError('Password or emmail is INCORRECT!!!', 401));
  }
  ///*My CODING (emailconfirmation)/////////////////
  if ( user.isActivated === false) {
    return next(new AppError('Email has not been confirmed. Follow the link from the email for confirmation', 400));
  }
  ///*My CODING (emailconfirmation)/////////////////
  // 3) If everything is ok, sent token to the client
  createSendToken(user, 200, res);
});

//Log out function
exports.logout = (req, res) => {
  res.cookie('jwt', 'logedout', {
    expires: new Date(Date.now() + 10 * 1000), //expires in 10 seconds
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
  next();
}

//Protecting routes from anauthorized access (AUTHENTICATION)
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it exists
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]; // selects token from
                                                           // the header
  } else if (req.cookies.jwt) { // in case there is no jwt in req.headers.authorization,
                                // we check cookies in the browser
    token = req.cookies.jwt;
  }
  console.log(token);
  if (!token) {
    return next(new AppError('Access is DENIED for unauthorized users!!!', 401));
  }

  // 2) Token verification
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  console.log(decoded); //logs decoded object(with user id)

  // 3) Check if user still exists (when user has been deleted but the token remains)
  const currentUser = await User.findById(decoded.id);
  if(!currentUser) {
    // in case user has been deleted, it will not be found in decoded.id
    return next(new AppError('The user bolonging to the token does no longer exist!'), 401);
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat))
    return next(new AppError('User recently changed a password! You must login again!!!', 401));

  //Grant access to protected route
  req.user = currentUser;//req object travels fron one middleware to another. In case we want
                         // to pass something to next middleware, we need to change req
  res.locals.user = currentUser; // res.locals - allows to pass a variable (users) to templates and this variable will be accessible in all pug files
  next();
});

//Middleware for rendering pages (to display different content of the page for logged in users)
exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
      try{
      // 1) Token verification
      const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET)

      // 2) Check if user still exists (when user has been deleted but the token remains)
      const currentUser = await User.findById(decoded.id);
      if(!currentUser) {
        // in case user has been deleted, it will not be found in decoded.id
        return next();
      }

      // 3) Check if user changed password after the token was issued
      if (currentUser.changePasswordAfter(decoded.iat))
        return next();

      // 4) The current user is logged in
      res.locals.user = currentUser; // res.locals - allows to pass a variable (users) to templates and this variable will be accessible in all pug files
      return next();
    }  catch (err) {
       return next();
    }
  }
  next();
};

//AUTHORIZATION
exports.restrictTo = (...roles) => { // "restrictTo" is simple function, which returns
                                     // a middleware function. We do that in order to pass
                                     // some arguments ("admins" and "lead-guide") to the
                                     // function. (It is not possible to pass arguments
                                     // to middleware function,therefore, we use ordinary
                                     // function to pass arguments in it. This arguments
                                     // will be available inside middleware function which
                                     // is wrapped in this ordinary function);
                                     // (...roles) - arbitary number of argument (array of
                                     // arguments we send in the function ('admin' and '
                                     // lead guide'))
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) { // req.user.role - comes from previous middleware,
                                          // as we stored "req.user = currentUser"
                                          // (see tour.Routes - .delete(authController.protect,
                                          // authController.restrictTo('admin', 'lead-guide'),
                                          // tourController.deleteTour); Firstly,
                                          // "authController.protect" is executed and send req.user
                                          // to "authController.restrictTo('admin', 'lead-guide')")
      return next(new AppError('You DO NOT have permissions to perform this action', 403));
    }
    next();
  }
}

//PASSWORD RESET
exports.forgotPassword = catchAsync(async(req, res, next) => {

  // 1) Get user based on posted Email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with the specified email!!!', 404));
  }

  // 2) Generate a random reset Token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false }); // deactivates all validators before saving
                                                 // so we can save "passwordResetToken" and
                                                 // "passwordResetExpires"

  // 3) Send it to user's email
  //console.log(resetToken);
  // const message = `In order to restore password, submit a PATCH request with a new
  // password and passwordConfirm to: ${resetURL}.\nIf you know your password, ignore this email!!!`;
  try { // we use try/catch block because it is not enough to send simple error message as we need to
        // reset encrypted password and expires date in DB
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid 10 minutes!)',
    //   message
    // });
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();


    res.status(200).json({
      status: 'success',
      message: 'Check a token in email!!!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false }); // deactivates all validators before saving
                                                    // so we can save "passwordResetToken" and
                                                    // "passwordResetExpires"
   return next(new AppError('There was an error sending the email. Try again later!!!'), 500);
  }
});

//PASSWORD RESET (second function)
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the Token
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
   });

  // 2) If token has not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 404))
  }

  // 3) Update changePasswordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
});

///*My CODING (emailconfirmation)/////////////////
// exports.confirmMe = catchAsync(async (req, res, next) => {
//
//   const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
//   const user = await User.findOne({
//     passwordResetToken: hashedToken,
//     passwordResetExpires: { $gt: Date.now() }
//    });
//
//   if (!user) {
//     return next(new AppError('Token is invalid or has expired', 404))
//   }
//
//   // 3) Update changePasswordAt property for the user
//   user.isActivated = true;
//   user.passwordResetToken = undefined;
//   user.passwordResetExpires = undefined;
//   await user.save({ validateBeforeSave: false });
//
//   // 4) Log the user in, send JWT
//   createSendToken(user, 200, res);
// });
///*My CODING (emailconfirmation)/////////////////

//UPDATING CURRENT USER PASSWORD
exports.updatePassword = catchAsync(async(req, res, next) => {
  // 1) Get a user from the collection
  const user = await User.findOne({ email: req.user.email }).select('+password');

  // 2) Check if POSTed current password is correct
  if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Password is INCORRECT!!!', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in, send JWT

  createSendToken(user, 200, res);
});

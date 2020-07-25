//Error module for different error types
const AppError = require('./../utils/appError');

//url error from mongoose transforms into a friendly error
const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldDB = err => {
  const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];// (["'])(?:\\.|[^\\])*?\1 - extracting a
                                                            // text between quotation-marks
  const message = `Duplicate field value ${value}. Please use another value!`;
  return new AppError(message, 404);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);//in case there are more than 1 validtion
                                                                 //validation error (ratings=6 and difficulty=
                                                                 //'some text'), there will be an array of 2
                                                                 //error objects in postman. We extract message
                                                                 //from each object to errors array
  const message = `Invalid input data. ${errors.join('. ')}`;//joins messages from errors in 1 string
  return new AppError(message, 404);
};

const handleJWTError = () => new AppError('Invalid token! Login again!', 401);

const handleJWTExpiredError = () => new AppError('Token has been expired', 401);

const sendErrorDev = (err, req, res) => { //in case of development env, all info about
                                          // an error is required
  // a) API (Error for postman without rendering a page)
  if(req.originalUrl.startsWith('/api')) { // we check in case url starts with api/... we do not use rendering for beautiful error display
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // b) RENDERING WEBSITE
  console.error('ERROR', err);
  return res.status(err.statusCode).render('error', { // error.pug will be activated here
    title: 'Fatal error occured!!!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => { //in case of production env, little info about
                                      // an error is required
  // a) API (Error for postman without rendering a page)
  if(req.originalUrl.startsWith('/api')) { // we check in case url starts with api/... we do not use rendering for beautiful error display
    //Operational error - trusted error: send message to a client
    if (err.isOperational) { //isOperational is defined in appError.js
      return res.status(err.statusCode).json({
          status: err.status,
          message: err.message
      });
    //Programming or other error: dont leak error details!
    }
    // 1) Log Error:
    console.error('ERROR', err);
    // 2) Send generic message:
    return res.status(500).json({
      status: 'error',
      message: 'Something fatal went wrong'
    });

  } // b) RENDERING WEBSITE
  //Operational error - trusted error: send message to a client
  if (err.isOperational) { //isOperational is defined in appError.js
    return res.status(err.statusCode).render('error', { // error.pug will be activated here
      title: 'Fatal error occured!!!',
      msg: err.message
    });
  //Programming or other error: dont leak error details!
  }
  // 1) Log Error:
  console.error('ERROR', err);
  // 2) Send generic message:
  return res.status(err.statusCode).render('error', { // error.pug will be activated here
    title: 'Fatal error occured!!!',
    msg: 'ERROR !!! TRY LATER !!!'
  });
};

module.exports = (err, req, res, next) => { //when we send 4 arguments, it is automatically
                                            //regognized as error handling function
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') { //in case of development environment
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {//in case of production environment
    let error = {...err}; // copies error from error with all its parameters
    error.message = err.message // for some reason error.message parameter was not copied from err.message (in let error = {...err};). therefore, we specified it manually

    // Invalid URL error (Cast error):
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    //The same name error (duplicate error):
    if (error.code === 11000)  error = handleDuplicateFieldDB(error);
    //Validation error(when an imputed data differ from presetting data in a
    //model (e.x. rating: 6, difficulty: ‘sometext’))
    if (error.name === 'ValidationError')  error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(); //Lesson 131 JWT error
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();//L 131 Token Expired Error

    sendErrorProd(error, req, res);
  };
};

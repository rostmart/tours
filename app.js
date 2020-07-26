//Here is express configurartion and middleware which executes one after another

const path = require('path'); //for specifying a path
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit'); // for rate limiting implementation
const helmet = require('helmet'); // for setting security http headers
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');// for compressing text files sendig to the clients (JSON files for example)
const cookieParser = require('cookie-parser');//for reading cookies from the browser
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');
//console.log(process.env.NODE_ENV);

const app = express();

app.set('trust', 'proxy'); //sets proxy for heroku

//Setting up pug engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // creates a path joining directory name /views

//*GLOBAL MIDDLEWARES
//Serving static files
app.use(express.static(path.join(__dirname, 'public'))); //example of how to access files in public folder
                                                         //in browser it is necessary to write: 127.0.0.1:3000/filename

// Security HTTP header - should be at the beginning of all global MIDDLEWARES
app.use(helmet());

//console.log(process.env.NODE_ENV);logs all environment veriables
//console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  //console.log(process.env.NODE_ENV);
  app.use(morgan('dev'));//we use it to see in cmd the time and the name of the function executed
}

// Rate Limiting implementation (limit requests from same IP)
const limiter = rateLimit({
  max: 100, // option for specifieng number of requests
  windowMs: 60 * 60 * 1000, // option for specifying a time in milliseconds for number of requests
  message: 'ACHTUNG!!! Too many requests from this IP!!! Try again in 1 hour' // an error message in
                                                                              // case of a lot of requests
});
app.use('/api', limiter); // '/api' - url which will be blocked if limiter is achieved

//Body parser, reading data from body to req.body
app.use(express.json({ limit: '10kb' })) // middleware- function that modifies. Midleware functions execute
                        // one after another in sequence (order matters!)
                        // { limit: '10kb' } - restricts from sending data from a user more than 10 kb
//app.use(express.urlencoded({ extended: true, limit: '10kb' })); // middleware for sending data from the form for user
                                                                // update (variant: Specifying POST method in
                                                                // a form along with url where it should be sent)
app.use(cookieParser()); // allows to read cookies from the browser

//DATA SANITIZATION
//This middleware should be after Body parser, so we can operate with received data
//Data Sanitization against NoSQL query injections
app.use(mongoSanitize());
//Data Sanitization against XSS (js code in req.body)
app.use(xss());

//Prevents parameter pollution (should be used at the end of global middleware)
app.use(hpp({
  whitelist: [ // here are fields which are whitelisted from double and more appearing in url
    'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'
  ]
}));

app.use(compression())

//Test middleware 1
app.use((req, res, next) => { //app.use we use in order to create a middleware function
                             // next - the name of our function
  //console.log('Hello from the middleware');
  //console.log(req.cookies);
  next();//next() we use in order to continue a cycle of middleware functions. Without
         // it middleware would end and no respond would send to a user
});

//Test middleware 2
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();//in order to get time for specific execution of function
  //console.log(`Hello from the middleware second time ${req.requestTime}`);
  //console.log(req.headers); //logs all headers from a user
  next();
});

//MIDDLEWARES*

//Examples of .get, .post methods
// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'Hello from the server', app: 'Notours'});
// });
// app.post('/', (req, res) => {
//   res.status(400).json({ message: 'You can post to this endpoint...', app: 'Notours'});
// });

//*BLOCK1 (top-level code)
// const tours = JSON.parse(fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`, 'utf-8'));
//JSON.parse() - automatically conversts to array of JS objects
//BLOCK1*

//*ROURE HANDLERS
// const getAllTours = (req, res) => {
//   console.log(`getAllTours requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   res.status(200).json({
//     status: 'success',
//     requestedAt: req.requestTime,// to get exact time of getAllTours execution
//     results: tours.length, //use it when we are sending an array of results
//     data: {
//       tours
//     }
//   });
// };
//
// const getTour = (req, res) => { //creating id variable. It is possible
//                                 // to create many parameters ('/api/v1/tours/:id/:x/:y')
//                                 // also optional parameter '/api/v1/tours/:id/:x?/:y'
//   const id = req.params.id * 1; //trick to convert id parameters to numbers
//   const tour = tours.find(el => el.id === id); // find method creates an array where condition is true
//   //*BLOCK2 Simple example when user wants to get unavailable id of a tour
//   if (!tour) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }
//   //BLOCK2*
//   console.log(req.params); //req.params - all variables defined in app.get('/api/v1/tours/:id'...
//                            // 'id' in our case
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour
//     }
//   });
// };
//
// const createTour = (req, res) => { //req holds all info about the request, whuch was done
//   //console.log(req.body);//we can use body method because we specified middleware
//   const newID = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({id: newID}, req.body)
//   tours.push(newTour);
//   fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
//     res.status(201).json({
//       status: "success",
//       data: {
//         tour: newTour
//       }
//     });
//   });
//   //res.send('Done');
// };
//
// const updateTour = (req, res) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }
//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: '<Updated Tour Here...>'
//     }
//   });
// };
//
// const deleteTour = (req, res) => {
//   if (req.params.id * 1 > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID'
//     });
//   }
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// };

// const getAllUsers = (req, res) => {
//   console.log(`getAllUses requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   res.status(500).json({
//     status: 'err',
//     message: 'This route has not yet been defnied'
//   });
// };
//
// const getUser = (req, res) => {
//   console.log(`getUser requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   res.status(500).json({
//     status: 'err',
//     message: 'This route has not yet been defnied'
//   });
// };
//
// const createUser = (req, res) => {
//   console.log(`createUser requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   res.status(500).json({
//     status: 'err',
//     message: 'This route has not yet been defnied'
//   });
// };
//
// const updateUser = (req, res) => {
//   console.log(`updateUser requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   res.status(500).json({
//     status: 'err',
//     message: 'This route has not yet been defnied'
//   });
// };
//
// const deleteUser = (req, res) => {
//   console.log(`deleteUser requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   res.status(500).json({
//     status: 'err',
//     message: 'This route has not yet been defnied'
//   });
// };
//ROURE HANDLERS*

//*ROUTS
//*BLOCK4 (the same as BLOCK5)
// app.get('/api/v1/tours', getAllTours);
// app.post('/api/v1/tours', createTour);
// app.get('/api/v1/tours/:id', getTour);
// app.patch('/api/v1/tours/:id', updateTour);
// app.delete('/api/v1/tours/:id', deleteTour);
//BLOCK4*

//*BLOCK5 better version of BLOCK4
// const tourRouter = express.Router();
// const userRouter = express.Router();

app.use('/', viewRouter);

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => { // For handling unhanded routes. Order important as it is meddleware
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));//in case we pass
                                                                           //something in next(),
                                                                           //it automatically determines it as
                                                                           //an error and stops middleware
});

//Global Error Handling Middleware
app.use(globalErrorHandler);
// tourRouter //here we specified all possible methods with ('/api/v1/tours') route
//   .route('/')
//   .get(getAllTours)
//   .post(createTour);
// tourRouter //here we specified all possible methods with ('/api/v1/tours/:id') route
//   .route('/:id')
//   .get(getTour)
//   .patch(updateTour) //.patch updates data
//   .delete(deleteTour);
//BLOCK5*
// userRouter
//   .route('/')
//   .get(getAllUsers)
//   .post(createUser);
// userRouter
//   .route('/:id')
//   .get(getUser)
//   .patch(updateUser) //.patch updates data
//   .delete(deleteUser);
//ROUTS*

//*START SERVER
// const port = 3000;
// app.listen(port, () => {
//   console.log(`App runing on port ${port}...!`);
//});
//START SERVER*
module.exports = app;

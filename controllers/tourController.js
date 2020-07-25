//const fs = require('fs');
const Tour = require('./../models/tourModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('./handlerFactory'); // imports universal functions
const multer = require('multer'); // for uploading files
const sharp = require('sharp'); // for resizing uploaded images

//An example of importing data as a JSON file
//const tours = JSON.parse(fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`, 'utf-8'));//..-to go one level up

//CheckID - the function that checks incoming ID
// exports.checkID = (req, res, next, val) => {//use of param middleware
//     console.log(`Tour ID is ${val}`);
//     if (req.params.id * 1 > tours.length) {//req.params - to access all parameters
//       return res.status(404).json({//return is mandatory as without it there would be 2 responses from the express which is forbidden
//         status: 'fail',
//         message: 'Invalid ID'
//       });
//     }
//     next();
// };

// Configuring multer upload (for uploading images)
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => { // checks if uploaded file is an image.
  if (file.mimetype.startsWith('image')) { // file.mimetype - from req.file. For images file.mimetype is sth like image/jpeg;
                                           // in case image is uploaded, its req.file.mimetype always
                                           //starts with 'image'
  cb(null, true) // in case req.file.mimetype startsWith 'image', we pass null as 'no errors'
  } else {
    cb(new AppError('It is not an IMAGE!!!', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

// Uploading multiply files at once
// There are three ways on how to upload files:
//  1. upload.single('image') - uploads one file only, produces req.file
//  2. upload.array('images', 5) - uploads multiply files (max 5), produces req.files
//  3. upload.fields([{name: 'imageCover', maxCount: 1}, {name: 'images', maxCount: 3}]); uploads for 1 field 1 file
//     for 2 field 3 files. Produces req.files
exports.uploadTourImages = upload.fields([ // in case we have only one field in a Model for multiply files upload, we use upload.array('images', 5)
  { name: 'imageCover', maxCount: 1 }, // 'imageCover and 'images' are fields from tourModel
  { name: 'images', maxCount: 3 }
]);

exports.resizeTourImages =  catchAsync(async (req, res, next) => {
  //console.log(req.files);

  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Image cover
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`; // 'imageCover' - the field in schema definition


  await sharp(req.files.imageCover[0].buffer) // uses an image uploaded to a buffer
    .resize(2000, 1333) // we set width ang height
    .toFormat('jpeg') // all uploaded images will be .jpeg
    .jpeg({ quality: 90 }) // quality = 90 %
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];// An array of strings for images (according to a field in the tourModel)

  await Promise.all(req.files.images.map(async (file, i) => { // As we have async function inside of a loop, we need to
                                                              // use map (instead of foreach) to save an array of promises

    var filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

    await sharp(file.buffer) // uses an image uploaded to a buffer
      .resize(2000, 1333) // we set width ang height
      .toFormat('jpeg') // all uploaded images will be .jpeg
      .jpeg({ quality: 90 }) // quality = 90 %
      .toFile(`public/img/tours/${filename}`);

    req.body.images.push(filename);
  }));

  next();
});

exports.aliasTopTours = (req, res, next) => {//aliasTopTours is middleware function where preset for best
                                             //5 tours are defined
  req.query.limit = '5';
  req.query.sort = 'price, -ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage,summary';//short overview including only these fields
  next();
};

//has been moved to handlerFactory.js as getAll function
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   //console.log(`getAllTours requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   //try {
//     //*BULDING QUERY
//
//     //1a) Simple Filtering
//     // const queryObj = {...req.query}//creating a hard copy object. In case of const queryObj = req.query - gives a reference
//     // // to an obj but we need a copy; ...-destructuring (copies all fields from req.query object), {} - creates a new object
//     // const excludedFields = ['page', 'sort', 'limit', 'fields'];//an array of excluded parameters
//     // excludedFields.forEach(el => delete queryObj[el]);
//     // //console.log(req.query, queryObj);//logs filtering options from postman
//     //
//     // //1b) Advanced filtering (implementing gte(grater than), gt, lte, lt). We need to add $ sign to each because
//     // // mongodb understands only with $ sign
//     // let queryStr = JSON.stringify(queryObj);//converting queryObj to string
//     // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);//regular expression: \b - expression must match the
//     //                                                                // exact word (gte or lt etc); /g - replace more than 1
//     //                                                                //or more matches; match => `$${match}` - callback function,
//     //                                                                //which replaces any of matches with the same word with $ usign
//     //                                                                //in front of it
//     // console.log(JSON.parse(queryStr));
//     // let query = Tour.find(JSON.parse(queryStr));//converts string back to object
//     // const tours = await Tour.find()
//     //   .where('duration')
//     //   .equals(5)
//     //   .where('difficulty')
//     //   equals('easy');
//
//     //2) Sorting
//     // if (req.query.sort) { //in case there is sort keyword in url
//     //   const sortBy = req.query.sort.split(',').join(' ');//converts a string with commas from url
//     //                                                     //(postman:27.0.0.1:3000/api/v1/tours?sort=price,ratingsAverage)
//     //                                                     //to a string with space symbols
//     //   query = query.sort(sortBy);
//     // } else {
//     //   query = query.sort('-createdAt');//sorts by default(without using sort method at all) and returns
//     //                                    //results sorted by creation date
//     // }
//     //
//     // //Fields Limiting
//     // if (req.query.fields) {
//     //   const fields = req.query.fields.split(',').join(' ');
//     //   query = query.select(fields);
//     //  } else {
//     //   query = query.select('-__v')//excludes __v from the output
//     //  }
//
//     //Pagination
//     // const page = req.query.page * 1 || 1;//req.query.page * 1 - in case there is page keyword in url;
//     //                                      //* 1 - converts to int;
//     //                                      //|| 1 - in case nothing specified in url page = 1 is default
//     // const limit = req.query.limit * 1 || 100;//req.query.page * 1 - in case there is limit keyword in url;
//     //                                      ////* 1 - converts to int;
//     //                                      //|| 100 - in case nothing specified in url limit = 100 is default
//     // const skip = (page - 1) * limit//formula for pagination(limit results per page)
//     // query = query.skip(skip).limit(limit);//.skip(skip).limit(limit) - shows limit results, starting
//     //                                       //from (page - 1) * limit
//     // if (req.query.page) {
//     //   const numTours = await Tour.countDocuments();
//     //   if (skip > numTours) {
//     //     throw new Error('This page does not exist');//implementing a situation when in url the number
//     //                                                 //of the page bigger than all poosible documents for that page
//     //     }
//     // }
//
//     //EXECUTE QUERY
//     const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();
//     const tours = await features.query; // we await for query here and not in "const features = new APIFeatures(Tour.find(), req.query)"
//                                        // because we need to do some manipulations and "await" it at the end
//
//     //SEND RESPONSE
//     res.status(200).json({
//       status: 'success',
//       //requestedAt: req.requestTime,// to get exact time of getAllTours execution
//       results: tours.length, //use it when we are sending an array of results
//       data: {
//         tours
//       }
//     });
//   // } catch(err) {
//   //   res.status(404).json({
//   //     status: 'FAILLLLLt',
//   //     message: err
//   //   });
//   // }
// });
exports.getAllTours = factory.getAll(Tour);

//has been moved to handlerFactory.js as getOne function
// // exports.getTour = catchAsync(async (req, res, next) => { //creating id variable. It is possible
//                                 // to create many parameters ('/api/v1/tours/:id/:x/:y')
//                                 // also optional parameter '/api/v1/tours/:id/:x?/:y'
//   //const id = req.params.id * 1; //trick to convert id parameters to numbers
//   //const tour = tours.find(el => el.id === id); // find method creates an array where condition is true
//   //*BLOCK2 Simple example when user wants to get unavailable id of a tour
//   // if (!tour) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Invalid ID'
//   //   });
//   // }
//   //BLOCK2*
//   //console.log(req.params); //req.params - all variables defined in app.get('/api/v1/tours/:id'...
//                            // 'id' in our case
//   // res.status(200).json({
//   //   status: 'success',
//   //   data: {
//   //     tour
//   //   }
//   // });
//   //try {
//     const tour = await Tour.findById(req.params.id).populate('reviews'); // req.params.id - id which
//                                                                          // was created; .populate('reviews') -
//                                                                          // virtual populate (in order to let tour
//                                                                          // model know about its child - reviews
//                                                                          // (fills up in a query not in DB))
//     if (!tour) {//Implementing 404 not found tours
//         return next(new AppError('No tour found with the ID', 404)); //need to use 'return' as it sends response and exits the function
//     };
//     res.status(200).json({
//       status: 'success',
//        data: {
//          tour
//        }
//      });
//   // } catch (err) {
//   //   res.status(404).json({
//   //     status: 'FAILLLLL',
//   //     message: err
//   //   });
//   // }
// });
exports.getTour = factory.getOne(Tour, { path: 'reviews' });

// exports.checkBody = ((req, res, next) => {
//     if (!req.body.name || !req.body.price) {
//       return res.status(400).json({
//         status: 'fail',
//         message: 'Bad Request (missing name or price)'
//       });
//     }
//   next();
// });

//has been moved to handlerFactory.js as createOne function
// exports.createTour = catchAsync(async (req, res, next) => { //req holds all info about the request, whuch was done
//   //console.log(req.body);//we can use body method because we specified middleware
//   // const newID = tours[tours.length - 1].id + 1;
//   // const newTour = Object.assign({id: newID}, req.body)
//   // tours.push(newTour);
//   // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
//   const newTour = await Tour.create(req.body);//Example of creating a document based on a model (Variant 2)
//   res.status(201).json({
//     status: "success",
//      data: {
//        tour: newTour
//      }
//   });
//   // try {
//   //   //const newTour = new Tour({})//example of usign save() method, where newTour is a prototype method of Tour class(Model)
//   //   //newTour.save()//example of usign save() method, where newTour is a prototype method of Tour class(Model)
//   //   const newTour = await Tour.create(req.body);//Example of creating a document based on a model (Variant 2)
//   //   res.status(201).json({
//   //     status: "success",
//   //      data: {
//   //        tour: newTour
//   //      }
//   //   });
//   // } catch (err) {//error handling with async/await function
//   //   res.status(400).json({
//   //     status: 'FAILLLLL',
//   //     message: err
//   //   });
//   // }
// });
exports.createTour = factory.createOne(Tour);

//has been moved to handlerFactory.js as updateOne function
// exports.updateTour = catchAsync(async (req, res, next) => {
//   // if (req.params.id * 1 > tours.length) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Invalid ID'
//   //   });
//   // }
//   //try {
//     const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {//1st arg - id of document which needs to be updated;
//                                                                         //2nd argument - new data for implementing;
//                                                                         //3rd arg - some options
//         new: true,//option which returns updated document to a user
//         runValidators: true
//     });
//     res.status(200).json({
//       status: 'success',
//         data: {
//           tour
//         }
//       });
//   // } catch (err) {
//   //     res.status(400).json({
//   //       status: 'FAILLLLL',
//   //       message: err
//   //     });
//   // };
//
// });
exports.updateTour = factory.updateOne(Tour);

//has been moved to handlerFactory.js as deleteOne function
// exports.deleteTour = catchAsync(async (req, res, next) => {
//   // if (req.params.id * 1 > tours.length) {
//   //   return res.status(404).json({
//   //     status: 'fail',
//   //     message: 'Invalid ID'
//   //   });
//   // }
//   //try {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if (!tour) {//Implementing 404 not found tours
//         return next(new AppError('No tour found with the ID', 404)); //need to use 'return' as it sends response and exits the function
//     };
//     res.status(204).json({
//       status: 'success',
//         data: null
//       });
//   // } catch (err) {
//   //     res.status(400).json({
//   //       status: 'FAILLLLL',
//   //       message: err
//   //     });
//   // };
// });
exports.deleteTour = factory.deleteOne(Tour);

//Aggregation Pipeline (Lesson 101)
exports.getTourStats = catchAsync(async (req, res, next) => {
  //try {
    const stats = await Tour.aggregate([ //here stages are specified
      {
        $match: { ratingsAverage: { $gte:4.5 } }
      },
      {
        $group: {
          //_id: null, //null because we want all statistics, which is not separated by groups }
          _id: '$difficulty', //gives statistics defined by difficulty field
          numRatings: { $sum: '$ratingsQuantity' },
          numTours: { $sum: 1 },//each document will come via a pipeline and finally counts all documents
          avgRating: { $avg: '$ratingsAverage' },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        }
      },
      {
      $sort: { avgPrice: 1 }
      }
      // {
      //   $match: { _id: { $ne: 'EASY'} }//selects all docs which are not easy
      // }
    ]);
    res.status(200).json({
      status: 'success',
        data: {
          stats
        }
    });
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'FAILLLLL',
  //     message: err
  //   });
  // };
});

//Aggregation Pipeline Unwinding, Projecting (Lesson 102 - find out how many
//tours are in each month of a specified year)
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  //try {
    const year = req.params.year * 1; //gets a year from url and transforms it to number
    const plan = await Tour.aggregate ([
      {
        $unwind: '$startDates'//unwind deconstructs the startDates array and output the each document for each element in the array
      },
      {
        $match: {
           startDates: {
             $gte: new Date(`${year}-01-01`),
             $lte: new Date(`${year}-12-31`)
           }
        }
      },
      {
        $group: {
          _id: {$month: '$startDates'},//grouping results by months
          numTourStarts: { $sum: 1}, //each document will come via a pipeline and finally counts all documents
          tours: { $push: '$name' }//creates an array with names of all tours in a specific month
        }
      },
      {
        $addFields: { month: '$_id' }
      },
      {
        $project: {
          _id: 0//hides _id field
        }
      },
      {
        $sort: {numTourStarts: -1} //-1 for descending order
      },
      {
        $limit: 12//reference for using limit field
      }
    ]);
    res.status(200).json({
      status: 'success',
        data: {
          plan
        }
    });
  // } catch (err) {
  //     res.status(400).json({
  //       status: 'FAILLLLL',
  //       message: err
  //     });
  // };
});

// function for geospatial quires (determining the circle with different tours inside)
exports.getToursWithin = catchAsync(async(req, res, next) => {
  const { distance, latlnd, unit } = req.params; // destructuring to get all the data from url
  const [lat, lng] = latlnd.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    //console.log(!lat);
    next(new AppError('latlng must be in format lat, lng', 400));
  }

  const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } });
  //console.log(tours);
  res.status(200).json({
    status: 'success',
    result: tours.length,
    data: {
      data: tours
    }
  });
});

// function for geospatial quires (determining distances to all tours from my point)
exports.getDistances = catchAsync(async(req, res, next) => {
  const { latlnd, unit } = req.params; // destructuring to get all the data from url
  const [lat, lng] = latlnd.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    //console.log(!lat);
    next(new AppError('latlng must be in format lat, lng', 400));
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: { // the only one possible geospatial pipeline which always must be at first position
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1] // transforms to number
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
      distance: 1,
      name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});

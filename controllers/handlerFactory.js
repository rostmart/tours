//Here are universal functions, like "delete" for all models
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

//UNIVERSAL FUNCTION FOR DELETION
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
  // if (req.params.id * 1 > tours.length) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid ID'
  //   });
  // }
  //try {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {//Implementing 404 not found tours
        return next(new AppError('No document found with the ID', 404)); //need to use 'return' as it sends response and exits the function
    };
    res.status(204).json({
      status: 'success',
        data: null
      });
  // } catch (err) {
  //     res.status(400).json({
  //       status: 'FAILLLLL',
  //       message: err
  //     });
  // };
});

//UNIVERSAL FUNCTION FOR UPDATING
exports.updateOne = Model => catchAsync(async (req, res, next) => {
  // if (req.params.id * 1 > tours.length) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid ID'
  //   });
  // }
  //try {
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {//1st arg - id of document which needs to be updated;
                                                                      //2nd argument - new data for implementing;
                                                                      //3rd arg - some options
    new: true,//option which returns updated document to a user
    runValidators: true
  });

  if (!doc) {
    return next(new AppError('No document found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
      data: {
        data: doc
      }
    });
  // } catch (err) {
  //     res.status(400).json({
  //       status: 'FAILLLLL',
  //       message: err
  //     });
  // };
});

//UNIVERSAL FUNCTION FOR CREATION
exports.createOne = Model => catchAsync(async (req, res, next) => { //req holds all info about the request, whuch was done
  //console.log(req.body);//we can use body method because we specified middleware
  // const newID = tours[tours.length - 1].id + 1;
  // const newTour = Object.assign({id: newID}, req.body)
  // tours.push(newTour);
  // fs.writeFile(`${__dirname}/dev-data/data/tours-simple.json`, JSON.stringify(tours), err => {
  const doc = await Model.create(req.body);//Example of creating a document based on a model (Variant 2)
  res.status(201).json({
    status: "success",
     data: {
       data: doc
     }
  });
  // try {
  //   //const newTour = new Tour({})//example of usign save() method, where newTour is a prototype method of Tour class(Model)
  //   //newTour.save()//example of usign save() method, where newTour is a prototype method of Tour class(Model)
  //   const newTour = await Tour.create(req.body);//Example of creating a document based on a model (Variant 2)
  //   res.status(201).json({
  //     status: "success",
  //      data: {
  //        tour: newTour
  //      }
  //   });
  // } catch (err) {//error handling with async/await function
  //   res.status(400).json({
  //     status: 'FAILLLLL',
  //     message: err
  //   });
  // }
});

//UNIVERSAL FUNCTION FOR GETING DATA
exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => { //creating id variable. It is possible
                                // to create many parameters ('/api/v1/tours/:id/:x/:y')
                                // also optional parameter '/api/v1/tours/:id/:x?/:y'
  //const id = req.params.id * 1; //trick to convert id parameters to numbers
  //const tour = tours.find(el => el.id === id); // find method creates an array where condition is true
  //*BLOCK2 Simple example when user wants to get unavailable id of a tour
  // if (!tour) {
  //   return res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid ID'
  //   });
  // }
  //BLOCK2*
  //console.log(req.params); //req.params - all variables defined in app.get('/api/v1/tours/:id'...
                           // 'id' in our case
  // res.status(200).json({
  //   status: 'success',
  //   data: {
  //     tour
  //   }
  // });
  //try {
    //has been transformed to code below
    //const doc = await Model.findById(req.params.id).populate('reviews'); // req.params.id - id which
                                                                         // was created; .populate('reviews') -
                                                                         // virtual populate (in order to let tour
                                                                         // model know about its child - reviews
                                                                         // (fills up in a query not in DB))
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query; // we await for query here and not in "let query = Model.findById(req.params.id);"
                             // because we need to do some manipulations "if (popOptions) query = query.populate(popOptions);"
                             // and "await" it at the end

    if (!doc) {//Implementing 404 not found tours
        return next(new AppError('No document found with the ID', 404)); //need to use 'return' as it sends response and exits the function
    };
    res.status(200).json({
      status: 'success',
       data: {
         data: doc
       }
     });
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'FAILLLLL',
  //     message: err
  //   });
  // }
});

//UNIVERSAL FUNCTION FOR GETING ALL DATA
exports.getAll = Model => catchAsync(async (req, res, next) => {

  //from reviewController (to allow nested GET reviews on tour)
  let filter = {}; //from reviewController (to allow nested GET reviews on tour)
  if (req.params.tourId) {
    filter = { tour: req.params.tourId };
  };

    //EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    //const doc = await features.query.explain(); // In order to see how many documents have been affected by search (indexing)
    const doc = await features.query; // we await for query here and not in "const features = new APIFeatures(Tour.find(), req.query)"
                                      // because we need to do some manipulations and "await" it at the end

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      //requestedAt: req.requestTime,// to get exact time of getAllTours execution
      results: doc.length, //use it when we are sending an array of results
      data: {
        data: doc
      }
    });
});

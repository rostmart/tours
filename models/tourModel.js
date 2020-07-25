const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require('./userModel'); // for embedding users datset into tour Model

const tourSchema = new mongoose.Schema({ //creating mongoose schema
  name: {
    type: String,
    required: [true, 'A tour must have a name'],// second argument in the array is a message in case of empty field
    unique: true,
    trim: true,
    maxlength: [40, 'More than 40 symbols are entered, which is unacceptable! FATAL ERROR!'],
    minlength: [5, 'Less than 5 symbols are entered, which is unacceptable! FATAL ERROR!'],
    //validate: [validator.isAlpha, 'Tour name must only contain characters']//here isAlpha validator
                                                                             //is specified from GitHub
  },
  slug: String,//for Document Middleware we specify slug field
  duration: {
    type: Number,
    required: [true, 'A tour must have a duration']
  },
  maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size']
  },
  difficulty: {
      type: String,
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'An error message indicating that data entered is differ from one in values'
      },
      required: [true, 'A tour must have a difficulty']
  },
  ratingsAverage: {
    type: Number,
    default: 4.5,
    min: [1, 'Rating must be above 1.0'],
    max: [5, 'Rating must be below 5.0'],
    set: val => Math.round(val * 10) / 10 // function for rounding the value
                                          // Math.round - round only to integer
                                          // (e.x. 4.666 = 5). By (val * 10) /10
                                          // we can get 4.6666 = 4.7

  },
  ratingsQuantity: {
      type: Number,
      default: 0
  },
  price: {
    type: Number,
    required: [true, 'A tour must have a price']
  },
  priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) { // validator whcih check if the price is bigger
                                   // than price discount; val - imputed data
          return val < this.price; // in case imputed data for price discount is
                                   // is bigger than price, the validator will
                                   //return false and error message; 'this' is
                                   //pointed to newly created document, we cannot
                                   //use it when updating the document (It only
                                   //works on CREATE and SAVE!!!)
        },
      message: 'Discount price ({VALUE}) must be lower than price value' //({VALUE})
                                   // implements an imputed data to be in an error message
    }
  },

  summary: {
    type: String,
    trim: true, //trim works only with String - it removes spaces before and after text
    required: [true, 'A tour must have a description']
  },
  description: {
      type: String,
      trim: true
  },
  imageCover: {
    type: String,
    required: [true, 'A tour must have an image']
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false//hides created At field from showing to a user
  },
  startDates: [Date],
  secretTour: {
    type: Boolean,
    default: false
  },
  startLocation: { //this data is embedded into tour model (few to few relationship)
    // GeoJSON form to describe location:
    type: {
      type: String,
      default: 'Point', //place with coordinates
      enum: ['Point']
    },
    coordinates: [Number],
    address: String,
    description: String
  },
  locations: [ // an array indicates that location is a dataset embedded into tour Model
    {
      type: {
        type: String,
        default: 'Point', //place with coordinates
        enum: ['Point']
      },
      coordinates: [Number],
      address: String,
      description: String,
      day: Number
    }
  ],
  //guides: Array // an array of users' IDs embedded in tourModel (variant with embedding)
  guides: [ // references of user dataset embedded into tourModel (variant with references)
    {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  ]
}, { //properties are specified here, e.x. virtual property
     toJSON: { virtuals: true },
     toObject: { virtuals: true }
   }
);


//INDEXING
//tourSchema.index({price: 1}); // 1 - sorts in ascending order; -1 - descending order
                             // In order to deactivate index, it must be deleted from Compas
tourSchema.index({price: 1, ratingsAverage: -1}); //compound index(includes two or more parameters);
                                                 //also work for each individual index included in compoumd
tourSchema.index({slug: 1});

tourSchema.index({ startLocation: '2dsphere' }); // for geospatial data

//Virtual Properties
tourSchema.virtual('durationWeeks').get(function() {//Each time when we get data from DB,
                                                    //virtual property is created. We use
                                                    //a regular function and not an arrow
                                                    //function because we need to return
                                                    //'this'. It is impossible with arrow
                                                    //functions
    return this.duration / 7;
});

// Virtual populate (in order to let tour model know about its child - reviews)
tourSchema.virtual('reviews', {
  ref: 'Review', // the model that we want to reference
  foreignField: 'tour', // name of the field in Review model, where reference to the current model is stored
  localField: '_id' // name of the field where id is stored in current model
});


//Document Middleware
tourSchema.pre('save', function(next) {// pre means that it runs only before save() and .create() events
  this.slug = slugify(this.name, { lower: true }); // this is currently processed document
  next();
});

//Embeding User data-set into tourModel (A bad decision as it is better to modeling "tours - users" by refference)
// tourSchema.pre('save', async function(next) {
//   const guidesPromises = this.guides.map(async id => await User.findById(id)); // we loop through all IDs
//                                                              // specified in body (Postman). Resultatively, we have
//                                                              // an array of promises because of assync function
//   this.guides = await Promise.all(guidesPromises); // we reasign guides with data from promises with Promise.all
//   next();
// });

tourSchema.pre('save', function(next) {//an example of additional pre middleware
  console.log('Will save document');
  next();
});
tourSchema.post('save', function(doc, next) {//post means that it runs after save() and .create() events
  console.log(doc);//in post instead of this we have the whole doc, saved in DB
  next();
});

//Query Middleware (e.x. for a secret tour for a small group of people)
tourSchema.pre(/^find/, function(next) {///^find/-includes all methods start with find
                                        //(find() and findByID())
  this.find({ secretTour: { $ne: true } })//'this' refers to query object
  this.start = Date.now();//we use it for calculating the time for execution
                          //in 'post' query middleware
  next();
});

//Refferencing User data-set into tourModel (A good decision)
tourSchema.pre(/^find/, function(next) {
  this.populate({
                                                             //.populate() - fills refferences for path(field in
                                                             //tourModel) - guides(Modelling Tour Guides Child
                                                             // Referencing). As a result when quering a particular
                                                             //tour - it gives data about guids (user dataset);
                                                             // We use "/^find/" both for getTour and getAllTours
                                                             // from tourController
    path: 'guides',
    select: '-__v -passwordChangedAt'              //"select: '-__v -passwordChangedAt'" - excludes both fields from
                                                   // showing up
 });
 next();
});

tourSchema.post(/^find/, function(docs, next) {///^find/-includes all methods start with find
                                               //(find() and findByID()); in post we have access to
                                               //all documents returned from query
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  //console.log(docs);
  next();
});

//Aggregation Middleware
//We commented it out because we are using $geoNear pipeline which must be first in among all pipelines (L. 171)
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: {secretTour: { $ne: true }} })//unshift()-adds an elemnt
//                                                                   //to the begining of an array
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);//creating a mongoose model (Capital letter!)
module.exports = Tour;
//*BLOCK1 Example of creating a document based on a model (Variant 1)
// const testTour = new Tour({//creating a new document based on created model
//   name: 'The orest Hiker',
//   rating: 4.7,
//   price: 499
// });
// testTour.save().then(doc => { //saves the document to the database
//   console.log(doc);
// }).catch(err => {
//     console.log('ERROR:', err )//in case of error logs error to the console
// });
//BLOCK1*

const crypto = require('crypto'); // for sending a random token to a user when the user forgot her password
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema({ //creating mongoose schema
  review: {
    type: String,
    required: [true, 'There must be a review!!!']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  createdAt: {
  type: Date,
  default: Date.now()
  },
  user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Provide your name for this review!!!']
    },
  tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'What tour are you wring about?!']
  }
}, { //properties are specified here, e.x. virtual property (each time when data is output as an
     //object it should be in this output)
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Preventing Duplicate Reviews
// (From one user only one review about one particular tour is allowed)
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); // each combination of tour and user must be unique

reviewSchema.pre(/^find/, function(next) {
  // We comment this out in order to avoid nested populate as we populate have
  // populated
  // this.populate({
  //   path: 'tour',
  //   select: 'name'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo' //Only "name" and "photo" fields will be included
  // });
  this.populate({
    path: 'user',
    select: 'name photo' //Only "name" and "photo" fields will be included
  });
  next();
});

//Static method (for Calculating Average Rating on Tours)
reviewSchema.statics.calcAverageRatings = async function(tourId) {
  const stats = await this.aggregate([ // "this" points to the current model; "aggregate" can b ecalled only on a model
    //selects all reviews which belongs to the current tour which ID we passed as an argument
    {
      $match: {tour: tourId} // "$match" - first stage of aggegation technique
    },
    {
      $group: { // "$group" - second stage of aggegation technique
        _id: '$tour', // groups statistic by tour field
        nRating: { $sum: 1 }, // each document will come via a pipeline and finally counts all documents
        avgRating: {$avg: '$rating'} // calculates average in rating field
      }
    }
  ]);
  //console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating, // stats is an array
      ratingsAverage: stats[0].avgRating
    });
  } else { // in case when we do not have reviews yet, stats will be empty, therefore, we specify default parameters
    await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity: 0,
    ratingsAverage: 4.5
    });
  }
};

//Calling calcAverageRatings - Static method (for Calculating Average Rating on Tours)
//Calculation of Saving(creating) new review
reviewSchema.post('save', function() { // we must use post instead of pre as at this point of time it is has not
                                       // been saved to the collection
  // "this" points to the current review
  this.constructor.calcAverageRatings(this.tour); // we need to call ".constructor" as current model (Review) has not yet been defined
  // post middleware does not have access to next
});

//Calling calcAverageRatings - Static method (for Calculating Average Rating on Tours)
//Calculation of Saving(creating) update and delete review
//Updating/deleting only possible with:
//findByIdAndUpdate and findByIdAndDelete. Both of them unavailable in document middleware only in query middleware
reviewSchema.pre(/^findOneAnd/, async function(next) { // "(/^findOneAnd/)" - includes findByIdAndUpdate and findByIdAndDelete
  this.r = await this.findOne(); // "this" - points to current query; this.r will be passed to post middleware below and will pass
                                 // tourId to it, which will be passed as argument to calcAverageRatings function
  next();
});
reviewSchema.post(/^findOneAnd/, async function() { // "(/^findOneAnd/)" - includes findByIdAndUpdate and findByIdAndDelete
  // await this.findOne(); We cannot use it as query has already been executed
  await this.r.constructor.calcAverageRatings(this.r.tour);
});


const Review = mongoose.model('Review', reviewSchema);//creating a mongoose model (Capital letter!)
module.exports = Review;

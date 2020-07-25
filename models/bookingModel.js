const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  tour: {
    type: mongoose.Schema.ObjectId, // parent refferencing
    ref: 'Tour',
    required: [true, 'Booking must belong to a Tour']
  },
  user: {
    type: mongoose.Schema.ObjectId, // parent refferencing
    ref: 'User',
    required: [true, 'Booking must belong to a User']
  },
  price: {
    type: Number,
    required:[true, 'Booking must belong to a price']
  },
  createdAt: {
    type: Date,
    default: Date.now()
  },
  paid: { // for a situation when a user cannot order a tour and an admin can order a tour for a user
    type: Boolean,
    default: true
  }
});

bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name'
  });
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;

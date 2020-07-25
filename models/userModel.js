//All staff regarding user data itslef

const crypto = require('crypto'); // for sending a random token to a user when the user forgot her password
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({ //creating mongoose schema
  name: {
    type: String,
    required: [true, 'A user must have a name']// second argument in the array is a message in case of empty field
    //trim: true, //removes whitespaces from imputed data
    //maxlength: [40, 'More than 40 symbols are entered, which is unacceptable! FATAL ERROR!'],
    //minlength: [5, 'Less than 5 symbols are entered, which is unacceptable! FATAL ERROR!']
    //validate: [validator.isAlpha, 'Tour name must only contain characters']//here isAlpha validator
                                                                             //is specified from GitHub
  },
  email: {
    type: String,
    //trim: true,
    lowercase: true,
    unique: true,
    required: [true, 'Email address is required!!!'],
    // validate: {
    //   validator: function() {
    //     var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    //     return re.test(email);
    //   },
    //   message: 'Please fill a valid email address'
    // },
    //match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    validate: [validator.isEmail, 'Please fill a valid email address']
  },
  photo: {
    type: String,
    default: 'default.jpg'
  },
  role: {
   type: String,
   enum: ['user', 'guide', 'lead-guide', 'admin'],
   default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [2, 'Less than 2 symbols are entered, which is unacceptable! FATAL ERROR!'],
    select: false // hides password from showing up in postman
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Password confirmation is required'],
    validate: {
      validator: function(el) { //This only works on CREATE and SAVE!!!
        return el === this.password;
      },
      message: 'Passwords are DIFFERENT!!!'
    }
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: { //field for user deletion
    type: Boolean,
    default: true,
    select: false //hides this property from showing up
  }
  /////*My CODING (emailconfirmation)/////////////////
  // isActivated: { // my field for email confirmation after signing in
  //   type: Boolean,
  //   default: false,
  //   select: false
  // }
  ///*My CODING (emailconfirmation)/////////////////
});

//Updating PasswordAt (when a password was changed) - middleware
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next(); // in case password has not been changed
  this.passwordChangedAt = Date.now() - 1000; //saving to DB is slower than issuing new token, therefore we
                                             // subtract a second
  next();
});

//User DELETION (additional function which hides users with "active" property from showing up)
userSchema.pre(/^find/, function(next) { // includes all strings starting with find
  this.find({ active: {$ne: false} }); // $ne allows to show up all documents with without
                                       // "active" field specified in this documents also with
                                       // "active": false
  next();
});

//Password Encryption (using Document Middleware)
userSchema.pre('save', async function(next) {//pre means that it runs only before save() and .create() events
  if(!this.isModified('password')) return next(); //In case there were no changes to password - exit;
                                                  //'this' - is currently processed document
  this.password = await bcrypt.hash(this.password, 12); //12 do not use more because it is CPU intensive
  this.passwordConfirm = undefined; //we delete passwordConfirm field as it was required only for checkig
  next();
});

//Instance method is available on all documents in certain collection - checks if the entered password
//is the same as the one in DB
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await(bcrypt.compare(candidatePassword, userPassword)); //returns true if both passwords are similar
                                                                 //As password is 'select: false' in userModel
                                                                 //the only way to compare entered password and
                                                                 //password in DB is to use bcrypt.compare
};

//Instance method is available on all documents in certain collection
//Checks if the user has changed a password after the token was issued
userSchema.methods.changePasswordAfter = function(JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10); // .getTime() - gives time in milliseconds;
                                                                         // /1000 - converts to seconds; parseInt(value, 10) -
                                                                         // converts to int with 10 numbers

    return JWTTimeStamp < changedTimestamp;                               // JWTTimeStamp - time when token was issued;
                                                                          // changedTimestamp - time when password was changed

  }
  return false; //password has not been changed after token was issued
};

//Instance method is available on all documents in certain collection
//Creating and encryption token for password reset
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex'); // generates token for password encryption
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex'); // encrypts token for password encryption
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

 //console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);//creating a mongoose model (Capital letter!)
module.exports = User;

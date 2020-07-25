//Staff regarding user's data and manipulation with it
const User = require('./../models/userModel');
//const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const fs = require('fs');
const factory = require('./handlerFactory'); // imports universal functions
const multer = require('multer'); // for uploading files
const sharp = require('sharp'); // for resizing uploaded images

// Configuring multer upload (for uploading images)
//The first variant of defining multerStorage is without resizing and saving directly to file location
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => { // cb the same as next() in express
//     cb(null, 'public/img/users'); // null in case there are no errors
//   },
//   filename: (req, file, cb) => {
//     // the name includes timestamp (depends on time at the moment of download) and
//     // user id (ex: user-userID-timestamp.jpg)
//     const ext = file.mimetype.split('/')[1] // ext - extension; file.mimetype - from
//                                             // req.file
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// });

// The second variant of defining multerStorage is to store uploaded image to a buffer
// We use it for resizing images
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

exports.uploadUserPhoto = upload.single('photo'); // upload.single - uploads one user's photo (only 1 file uploads)
                                                  // ('photo') - name of the field in a form

//As we need square images, we need to resize any image uploaded by the user to square
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  await sharp(req.file.buffer) // uses an image uploaded to a buffer
    .resize(500, 500) // we set width ang height
    .toFormat('jpeg') // all uploaded images will be .jpeg
    .jpeg({ quality: 90 }) // quality = 90 %
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

//Function filters data in req.body and returns only required data
const filterObj = (obj, ...allowedFields) => {
  const newObj = {}; // new object for filtered data
  Object.keys(obj).forEach(el => { // here we loop through the object and check
                                   // each element in the object
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

// has been moved to handlerFactory.js as getAll function
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   console.log(`getAllUses requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   const users = await User.find();
//
//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users
//     }
//   });
// });
exports.getAllUsers = factory.getAll(User);

//For retreiving data of currently logged user
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

//Updates currently authenticated user
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create an error if user POSTs password data
  if(req.body.password || req.body.passwordConfirm) {
    return next(new AppError('It is forbidden to update password here!!!', 400))
  }

  // 2) Filers unwanted fields in req.body that are not allowed to be updated
  var filteredBody = filterObj(req.body, 'name', 'email');

  if (req.file) filteredBody.photo = req.file.filename;

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true});
                      //  {new: true, runValidators: true} - options where "new: true" returns new updated
                      // object; x - data user needs to update (in case of req.body we get an object
                      // with all new data so NEVER use it as user will be able to update his role, etc).
                      // Therefore, we use filteredBody
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

//USER DELETION
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// has been changed to handlerFactory.js as deleteOne function
// exports.deleteUser = (req, res) => {
//   console.log(`deleteUser requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   res.status(500).json({
//     status: 'err',
//     message: 'This route has not yet been defnied'
//   });
// };

exports.deleteUser = factory.deleteOne(User);

//email confirmation after sign in (my function)
// exports.confirmMe = catchAsync(async (req, res, next) => {
//   await User.findByIdAndUpdate(req.user.id, { isActivated: true });
//   res.status(204).json({
//     status: 'success',
//     data: null
//   });
// });

// has been moved to handlerFactory.js as getOne function
// exports.getUser = (req, res) => {
//   console.log(`getUser requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   res.status(500).json({
//     status: 'err',
//     message: 'This route has not yet been defnied'
//   });
// };
exports.getUser = factory.getOne(User);

exports.createUser = (req, res) => {
  console.log(`createUser requested at ${req.requestTime}`);// to get exact time of getAllTours execution
  res.status(500).json({
    status: 'err',
    message: 'USE SIGN UP!!!'
  });
};

// has been changed to handlerFactory.js as deleteOne function
// exports.updateUser = (req, res) => {
//   console.log(`updateUser requested at ${req.requestTime}`);// to get exact time of getAllTours execution
//   res.status(500).json({
//     status: 'err',
//     message: 'This route has not yet been defnied'
//   });
// };
exports.updateUser = factory.updateOne(User); // Do not update password with this

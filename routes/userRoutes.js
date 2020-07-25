const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router.use(authController.protect); // As middleware runs in sequence, all code below
                                    // will be accessible only after authController.protect execution
                                    // All routes below are protected by authController.protect

router.patch('/updatePassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser); // for retrieving info
                                                                 // of currently logged user
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

////////*MY CODING
//router.patch('/confirmEmail/:token', authController.confirmMe);
////////MY CODING*

router.use(authController.restrictTo('admin')); // As middleware runs in sequence, all code below
                                    // will be accessible only after authController.restrictTo('admin') execution
                                    // All routes below are protected by authController.restrictTo('admin')

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser) //.patch updates data
  .delete(userController.deleteUser);

module.exports = router;

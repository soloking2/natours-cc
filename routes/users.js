const express = require('express');

const userController = require('../mvc/controllers/usersController');
const authController = require('../mvc/controllers/authController');

const router = express.Router();



router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPasword);
router.patch('/resetPassword/:token', authController.resetPassword);


// This protects the routes after this middleware
router.use(authController.protect);

// Protected Middlewares
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMyPassword', authController.updatePassword);
router.patch('/updateMe', 
        userController.uploadUserPhoto,
        userController.resizeUserPhoto, 
        userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

// Only Admins can utilize these routes
router.use(authController.restrictTo('admin'));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);


router.route('/:id')
        .get(userController.getUser)
        .patch(userController.updateUser)
        .delete(userController.deleteUser);



module.exports = router;
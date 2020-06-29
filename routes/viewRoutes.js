const express = require('express');


const router = express.Router();
const viewController = require('../mvc/controllers/viewController');
const authController = require('../mvc/controllers/authController');
const bookingController = require('../mvc/controllers/bookingController');

router.get('/', 
        bookingController.createBookingCheckout,
        authController.isLoggedIn, 
        viewController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getSingleTour);
router.get('/login', authController.isLoggedIn, viewController.getLogin);
router.get('/me', authController.protect, viewController.getMe);

router.get('/my-tours', authController.protect, viewController.getMyTours);

router.post('/submit-user-data', authController.protect, viewController.updateUserData);


module.exports = router;
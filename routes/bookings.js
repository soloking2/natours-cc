const express = require('express');
const bookingsController = require('../mvc/controllers/bookingController');
const authController = require('../mvc/controllers/authController');


const router = express.Router();


router.get('/checkout-session/:tourId', 
        authController.protect, 
        bookingsController.getCheckOutSession);

router.use(authController.protect);  
router.get('/', bookingsController.getAllBookings);
router.get('/:id', bookingsController.getBooking);
router.post('/', bookingsController.createBooking);
router.patch('/:id', bookingsController.updateBooking);
router.delete('/:id', bookingsController.deleteBooking);





module.exports = router;
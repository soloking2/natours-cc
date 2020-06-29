const express = require('express');

const router = express.Router();
const toursController = require('../mvc/controllers/toursController');
const authController = require('../mvc/controllers/authController');
const reviewRouter = require('./review');

// router.param('id', toursController.checkId);

// Review Routes Associated with Tours

router.use('/:tourId/reviews', reviewRouter);

router.get('/top-5-cheap', toursController.aliasTopTour, toursController.getTours);
router.get('/tours-stat', toursController.getTourStats);
router.get('/', toursController.getTours);
router.get('/monthly-plan/:year',
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        toursController.getMonthlyPlan);

router.route('/tours-within/:distance/center/:latlng/unit/:unit')
        .get(toursController.getToursWithin);

router.route('/distances/:latlng/unit/:unit')
        .get(toursController.getDistances);

router.post('/', 
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide'),
        toursController.createTour);

router.get('/:id', toursController.getTour);

router.patch('/:id', 
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide'),
        toursController.sendTourImages,
        toursController.resizeImages,
        toursController.updateTour);

router.delete('/:id', 
        authController.protect, 
        authController.restrictTo('admin', 'lead-guide'),
        toursController.deleteTour);





module.exports = router;
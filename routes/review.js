const express = require('express');

const router = express.Router({mergeParams: true});

const reviewController = require('../mvc/controllers/reviewController');
const authController = require('../mvc/controllers/authController');

router.use(authController.protect);
// GET ROUTES
router.get('/', reviewController.getAllReviews);

// POST ROUTES
router.post('/',
            authController.restrictTo('user'),
            reviewController.getTourAndUserIds,
            reviewController.createReview);


router.route('/:id')
        .get(reviewController.getReview)
        .patch(authController.restrictTo('user', 'admin'),
        reviewController.updateReview)
        .delete(authController.restrictTo('user', 'admin'), 
        reviewController.deleteReview);

module.exports = router;
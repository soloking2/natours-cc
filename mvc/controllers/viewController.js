const catchAsync = require('../../utils/catchAsync');
const Tour = require('../models/tours');
const Booking = require('../models/bookings');
const User = require('../models/users');
const AppError = require('../../appError');

exports.getOverview = catchAsync( async (req, res, next) => {

    const tours = await Tour.find();
    res.status(200).render('overview', {
        title: 'Overview Page',
        tours
    })
});

exports.getSingleTour = catchAsync( async(req, res, next) => {

    const tour = await Tour.findOne({slug: req.params.slug}).populate(
        {
            path: 'reviews',
            fields: 'review rating user'
        })

    if(!tour) {
        return next(new AppError('There is no tour with that name', 404));
    }
    res.status(200).render('tour', {
        title: `${tour.name} Page`,
        tour
    })
})

exports.getLogin = catchAsync(async(req, res, next) => {
    res.status(200).render('login', {
        title: 'Login Into Your Account'
    });
})

exports.getMe = (req, res, next) => {
    res.status(200).render('account', {
        title: 'Your account'
    })
}

exports.updateUserData = catchAsync(async(req, res, next) => {
    const user = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email
    }, {new: true, runValidators: true});

    res.status(200).render('account', {
        title: 'Your account',
        user
    })
})

exports.getMyTours = catchAsync(async(req, res, next) => {
    // Find all Bookings
    const bookings = await Booking.find({user: req.user.id});

    // Find the tours with the returned IDs
    const tourIds = bookings.map(el => el.tour);
    const tours = await Tour.find({_id: {$in: tourIds}});

    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    })

});
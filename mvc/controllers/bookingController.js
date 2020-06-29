const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tours');
const Booking = require('../models/bookings');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../appError');
const factory = require('./handlerFactory');

exports.getCheckOutSession = catchAsync( async(req, res, next) => {
    const bookTour = await Tour.findById(req.params.tourId);

    if(!bookTour) {
        return new AppError('No tour with that ID. Please cross check', 404);
    }

    // create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${
            req.params.tourId}&user=${
                req.user.id}&price=${bookTour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${bookTour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                name: `${bookTour.name} Tour`,
                description: bookTour.summary,
                images: [`https://www.natours.dev/img/tours/${bookTour.imageCover}`],
                amount: bookTour.price * 100,
                currency: 'usd',
                quantity: 1
            }
        ]
    })

    // create the session as response
    res.status(200).json({
        status: 'success',
        session
    })
})

exports.createBookingCheckout = catchAsync(async(req, res, next) => {
    const {tour, user, price} = req.query;

    if(!tour && !user && !price) {
        return next();
    }

    await Booking.create({tour, user, price});

    res.redirect(req.originalUrl.split('?')[0]);
})
exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.createBooking = factory.createOne(Booking);

exports.updateBooking = factory.UpdateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
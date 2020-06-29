const mongoose = require('mongoose');

const {Schema} = mongoose;

const bookingSchema = new Schema({
    tour: {
        type: Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Booking must contain a tour']
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must contain a user']
    },
    paid: {
        type: Boolean,
        default: true
    },
    price: {
        type: Number,
        required: [true, 'There must be price for a booking']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

bookingSchema.pre(/^find/, function(next) {
    this.populate('user').populate('tour');

    next();
})

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
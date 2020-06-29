const mongoose = require('mongoose');
const {Schema} = mongoose;
const Tour = require('./tours');
const AppError = require('../../appError');

const reviewSchema = new Schema({
    review: {
        type: String,
        required: [true, 'Review can not be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: Schema.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user:
        {
            type: Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user']
        }
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// COMPOUND INDEXING OF TOUR & USER
reviewSchema.index({tour: 1, user: 1}, {unique: true});

// QUERY MIDDLEWARE
reviewSchema.pre(/^find/, function(next) {
    this.populate({
    path: 'user',
    select: 'name photo'
  });

next();
})

// STATIC METHOD - This points to model

reviewSchema.statics.calcAverageRating = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: {tour: tourId}
        },
        {
            $group: {
                _id: '$tour',
                nRating: {$sum: 1},
                avgRating: {$avg: '$rating'}
            }
        }
    ]);

    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: stats[0].avgRating,
            ratingsQuantity: stats[0].nRating
        });
    } else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsAverage: 4.5,
            ratingsQuantity: 0
        });
    }

    }

// Calls the result of calcAverageRating after save prototype
// The post method on the DOCUMENT middleware doesnt contain next 
reviewSchema.post('save', function() {
    // this points to current review
    this.constructor.calcAverageRating(this.tour);
  });

  reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.findOne();
    next();
  })

  reviewSchema.post(/^findOneAnd/, async function() {
      // await this.findOne(); does NOT work here, query has already executed
      if(!this.r) {
          return new AppError('ID Not found', 400);
      } else {
          await this.r.constructor.calcAverageRating(this.r.tour);
      }
  })

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
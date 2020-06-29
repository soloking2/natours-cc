const mongoose = require('mongoose');
const {Schema} = mongoose;
const slugify = require('slugify');
// const User = require('./users');

const tourSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: [true, 'Name must be unique'],
        trim: true,
        maxlength: [40, 'A tour length should be less than or 40 characters'],
        minlength: [10, 'A tour length should be more than or 10 characters']
    },
    slug: String,
    duration: {
        type: Number,
        required: true
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
          values: ['easy', 'medium', 'difficult'],
          message: 'Difficulty is either: easy, medium, difficult'
        }
      },
    price: 
    {
        type: Number,
        required: true
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below or 5.0'],
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                return  val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below regular price'
        } 
    },
    summary: {
        type:String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'The tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    startLocation: {
        // GeoJSON
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: Schema.ObjectId,
            ref: 'User'
        }
    ]
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// INDEX
tourSchema.index({price: 1, ratingsAverage: -1});
tourSchema.index({slug: 1});
// Sets the index of the location to 2dsphere
tourSchema.index({startLocation: '2dsphere' });
// DOCUMENT MIDDLEWARE
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, {lower: true});
    next();
});

// Query Middleware
tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    }).select('-__v');
    next();
})

// Just for running embedde=ing in the database. It could work only if no update
// or no edit will be done on it.
// tourSchema.pre('save', async function(next) {
//     const guidePromises = this.guides.map(async id => await User.findById(id));
//     this.guides = await Promise.all(guidePromises);
//     next();
// })

// Virtual
tourSchema.virtual('durationWeeks').get(function() {
    this.duration / 7;
});

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

module.exports = mongoose.model('Tour', tourSchema);
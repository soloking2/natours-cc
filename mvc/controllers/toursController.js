const Tour = require('../models/tours');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../appError');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb(new AppError('Not an image! please upload only images.', 400), false)
    }
};

const upload = multer({storage: multerStorage, fileFilter: multerFilter});

// upload.single('image') - req.file
// upload.array('images', 5) - req.files
// upload.fields([{name: 'images', maxCount: 3}]) - req.files
exports.sendTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images',  maxCount: 3}
]);

exports.resizeImages = catchAsync( async(req, res, next) => {
    if(!req.files.imageCover || !req.files.images) return next();

    // 1) Image cover
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

    await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) images
    req.body.images = [];
    await Promise.all(
        req.files.images.map( async (file, i )=> {
        const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({quality: 90})
            .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename);
    })
    );
    next();


})

exports.aliasTopTour = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,summary,difficulty,ratingsAverage';
    next();
}

exports.getTours = factory.getAll(Tour);

exports.createTour = factory.createOne(Tour);

exports.getTour = factory.getOne(Tour, {path: 'reviews'});

exports.updateTour = factory.UpdateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
        const stats = await Tour.aggregate([
            {
                $match: {ratingsAverage: {$gte: 4.5}}
            },
            {
                $group: {
                    _id: '$difficulty',
                    numTours: {$sum: 1},
                    numRatings: {$sum: '$ratingsQuantity'},
                    avgRating: {$avg: '$ratingsAverage'},
                    avgPrice: {$avg: '$price'},
                    minPrice: {$min: '$price'},
                    maxPrice: {$max: '$price'}
                }
            },
            {
                $sort: {avgPrice: 1}
            }
        ]);
        res.status(200).json({
            status: 'Success',
            stats
        })

});

exports.getMonthlyPlan = catchAsync(async ({params}, res, next) => {
        const year = params.year * 1;

        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)}}
            },
            {
                $group: {

                    _id: {$month: '$startDates'},
                    numTourStarts: {$sum: 1},
                    tours: {$push: '$name'}
                }
            },
            {
                $addFields: { month: '$_id'
                }
            },
            {
                $project: {_id: 0}
            },
            {
                $sort: {numTourStarts: -1}
            }
        ])
        
        res.status(200).json({
            status: 'Success',
            plan
        })
});

// :distance/center/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async(req, res, next) => {
    const {distance, latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');
    // miles = distance divided by the radius of the earth in miles
    // km = distance divided by the radius of the earth in kilometer
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

    if(!lat || !lng) {
        return next(
            new AppError('Please provide latitude and longitude', 400));
    }

    const tours = await Tour.find(
        {startLocation: {$geoWithin: {$centerSphere: [[lng, lat], radius]}}});

    res.status(201).json({
        status: 'Success',
        data: {
            data: tours
        }
    });
})

exports.getDistances = catchAsync(async(req, res, next) => {
    const {latlng, unit} = req.params;
    const [lat, lng] = latlng.split(',');

    const multipler = unit === 'mi' ? 0.000621371 : 0.001;
    if(!lat || !lng) {
        return next(
            new AppError('Please provide longitude and latitude', 400))
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
            },
            distanceField: 'distance',
            distanceMultiplier: multipler
        }
    },
    {
        $project: {
            distance: 1,
            name: 1
        }
    }
    ]);

    res.status(201).json({
        status: 'Success',
        data: {
            data: distances
        }
    });
})
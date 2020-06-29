const catchAsync = require("../../utils/catchAsync");
const AppError = require('../../appError');
const APIFeatures = require('../../utils/apiFeatures');


exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc) {
        return next(new AppError('No Document found with that ID', 404));
    }
    res.status(204).json({
        message:'Success'
    })

});

exports.UpdateOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body,
        {
            new: true,
            runValidators: true
        });
        if(!doc) {
            return next(new AppError('No document found with that ID', 404));
        }
    res.status(204).json({
        status: 'Success',
        data: {
            data: doc
        }
    })

});

exports.createOne = Model => catchAsync(async(req, res, next) => {
    const docs = await Model.create(req.body);

    res.status(201).json({
        status: 'Success',
        data: {
            docs
        }
    })
});

exports.getOne = (Model, popOptions) => catchAsync(async ({params}, res, next) => {
    let query = Model.findById(params.id);
    if(popOptions) query = query.populate(popOptions);
    const doc = await query;

    if(!doc) {
        return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({
        status: 'Success',
        data: {
            data: doc
        }
    })
});

exports.getAll = Model => catchAsync(async(req, res, next) => {
    let filter = {};
    if(req.params.tourId) filter = {tour: req.params.tourId};
    // EXECUTE THE QUERY
    const features = new APIFeatures(Model.find(filter).select('-__v'), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
    const docs = await features.query;
    
    // SEND RESPONSE
    res.status(200).json({
        results: docs.length,
        message: 'Fetched successfully',
        data: docs
    })
})
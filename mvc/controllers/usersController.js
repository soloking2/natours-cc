const AppError = require('../../appError');
const catchAsync = require('../../utils/catchAsync');
const User = require('../models/users');
const factory = require('./handlerFactory');
const multer = require('multer');
const sharp = require('sharp');

// const diskStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const ext = file.mimetype.split('/')[1];
//         cb(null, `user${req.user.id}-${Date.now()}.${ext}`);
//     }
// });
const diskStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! please upload only images.', 400), false);
    }
}

const upload = multer(
    {
        storage: diskStorage, 
        fileFilter: multerFilter
    });

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync( async (req, res, next) => {
    if(!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/users/${req.file.filename}`);

    next();

})


const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
}


exports.updateMe = catchAsync(async(req, res, next) => {
    // Throw an error if the user tries to update the password
    if(req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
            'This is not the route for updating password, use /updateMyPassword route for that', 400));
    }

    // update user document
    //Filter out the user that are required
    const filterObjBody = filterObj(req.body, 'name', 'email');
    if(req.file) filterObjBody.photo = req.file.filename;
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filterObjBody, 
        {new: true, runValidators: true}); 

    // send response
    res.status(201).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    }
    )
})

exports.deleteMe = catchAsync(async(req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {active: false});

    res.status(204).json({
        status: 'success',
        data: null
    })
});

exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
}

exports.createUser = factory.createOne(User);
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);

// Don't use this to update the user's password
exports.updateUser = factory.UpdateOne(User);
exports.deleteUser = factory.deleteOne(User);
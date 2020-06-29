const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../appError');

const Email = require('../../utils/email');
const crypto = require('crypto');

const createSendToken = (user, statusCode, res) => {
    const token = user.jwtSign();

    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
            ),
            httpOnly: true
    };

    if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;
    res.cookie('jwt', token, cookieOptions);

    // Remove the password from the output
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
        }
        );
        const url = `${req.protocol}://${req.get('host')}/me`;
        await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
})

exports.login = catchAsync(async({body}, res, next) => {
    // Request password and email
    const {email, password} = body;

    // Check for error
    if(!email || !password) {
        return next(new AppError('Please provide email or password', 400));
    }

    // fetch the result
    const user = await User.findOne({email: email}).select('+password');

    if(!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401));
    }

    // confirmation
    createSendToken(user, 200, res);


});

exports.logout = (req, res, next) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({status: 'success'});
}
exports.protect = catchAsync(async(req, res, next) => {
    let token;
    // Getting the token
    if(req.headers.authorization && 
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(" ")[1];
    } else if(req.cookies.jwt) {
        token = req.cookies.jwt
    }

    if(!token) {
        return next(new AppError('You are not logged in! Please log in to get access', 401));
    }
    // Verifies the token
    const decodedToken = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // check if the user still exists
    const currentUser = await User.findById(decodedToken.id);
    if(!currentUser) {
        return next(new AppError('The user belonging to the token does not exist', 401));
    }

    // check if user changed password after the token was issued
    if(currentUser.changedPasswordAfter(decodedToken.iat)) {
        return next(
            new AppError('User recently changed password! Please log in again.', 401));
    }
    
    // Grant access to the protected route
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
})

exports.isLoggedIn = async(req, res, next) => {
 if(req.cookies.jwt) {
     try {
    // Verifies the token
    const decodedToken = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
    // check if the user still exists
    const currentUser = await User.findById(decodedToken.id);
    if(!currentUser) {
        return next();
    }
    // check if user changed password after the token was issued
    if(currentUser.changedPasswordAfter(decodedToken.iat)) {
        return next();
    }
    
    // There is a logged In user
    res.locals.user = currentUser;
    return next();
} catch(err) {
    return next();
}

 }
next();
}

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // Roles is an array
        if(!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403));
        }
        next();
    }
}

exports.forgotPasword = catchAsync(async(req, res, next) => {
    // Fetch user
    const user = await User.findOne({email: req.body.email});

    if(!user) {
        return next(new AppError('There is no user with this email address', 404))
    }

    //Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({validateBeforeSave: false});

    // send it to user's email
    
    try {
        const resetUrl = `${req.protocol}://${req.get(
            'host'
            )}/api/v1/users/resetPassword/${resetToken}`;
           
            await new Email(user, resetUrl).sendPasswordReset();
        
            res.status(200).json({
                status: 'success',
                message: 'Token sent to email'
            });
            
        } catch (error) {
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({validateBeforeSave: false});

            return next(new AppError('There was an error sending the email. Try again later', 
            500));
        }
});

exports.resetPassword = catchAsync(async(req, res, next) => {
    // Get user based on the token
    const hashedToken = crypto.createHash('sha256')
                                .update(req.params.token)
                                .digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: {$gt: Date.now()}
    });
    
    // If token has not expired, and there is user, se the new password
    if(!user) {
        return next(new AppError('Token is invalid / expired!', 400));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    // Update changedPassAt property for the user

    // Log the user in, send JWT
    createSendToken(user, 200, res);

})

exports.updatePassword = catchAsync(async (req, res, next) => {
    // Get user from collection
    if(!req.body.passwordCurrent) {
        return next(new AppError('Please provide previous password', 400));
    }
    const user = await User.findById(req.user.id).select('+password');

    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(
            new AppError('The Password is not correct, please check your password', 401));
    }

    // If so, update Password
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // Log user in, send JWT
    // createSendToken(user, 200, res);
    createSendToken(user, 200, res);

})
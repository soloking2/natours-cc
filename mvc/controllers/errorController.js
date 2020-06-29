const AppError = require('../../appError');

const handleCastErr = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
}

const handleDuplicateErrDb = err => {
    // const value = err.keyValue.name;
    const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
    // err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    console.log(value);
    const message = `Duplicate field value: ${value}. Please use another value`;
    return new AppError(message, 400);
}

const handleValidationFailedErr = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid Input data: ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invalid token. Please log in again', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired! Please log in again', 401);
const devErr = (err, req, res) => {
    if(req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        })
    
}

const proErr = (err, req, res) => {
    // operational, trusted error
    if(req.originalUrl.startsWith('/api')) {
        if(err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
                
            });
        }
        // programming error that is unknown
        return res.status(500).json({
            // status: 'error',
            // message: 'Something went wrong'
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        })
    }
    if(err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    }
        // programming error that is unknown
        console.error('Error', err);

        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        })

}



module.exports = function(err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error'

    if(process.env.NODE_ENV === 'development') {
        devErr(err, req, res)
    } else if(process.env.NODE_ENV === 'production') {
        let error = {...err};
        error.message = err.message;

        if(error.kind === 'CastError') error = handleCastErr(error)
        if(error.code === 11000) error = handleDuplicateErrDb(error)
        if(error._message === 'ValidationError') error = handleValidationFailedErr(error);
        if(error.name === 'JsonWebTokenError') error = handleJWTError();
        if(error.name === 'TokenExpiredError') error = handleJWTExpiredError();
        proErr(error, req, res)
    }
    
}
const creatError = require('http-errors');
const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const morgan = require('morgan');
const mongoose = require('mongoose');
const AppError = require('./appError');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cookieParser = require('cookie-parser');

const hpp = require('hpp');


dotenv.config({path: './config.env'});

const errorHandler = require('./mvc/controllers/errorController');
const toursRoutes = require('./routes/tours');
const usersRoutes = require('./routes/users');
const reviewsRoutes = require('./routes/review');
const bookingRoutes = require('./routes/bookings');
const viewRoutes = require('./routes/viewRoutes');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

const port = process.env.PORT || 3000;

// Helmet for setting security HTTP headers
app.use(helmet());
app.use(morgan('dev'));

const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter);

app.use(express.json({limit: '20kb'}));
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());


// Data sanitization against NoSQL
app.use(mongoSanitize());

app.use(xss());

// Parameter Polution
app.use(hpp({
    whitelist: [
    'duration', 
    'ratingsAverage', 
    'ratingsQuantity', 
    'maxGroupSize', 
    'price', 
    'difficulty']
}))
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    // console.log(req.cookies);
    next();
})

app.use('/api/v1/tours', toursRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/reviews', reviewsRoutes);
app.use('/api/v1/bookings', bookingRoutes);

app.use('/', viewRoutes);

const db = process.env.DATABASE_LOCAL;
// const db = 'mongodb://localhost:27017/natours';
mongoose.connect(db, 
    {useNewUrlParser: true, 
        useCreateIndex: true, 
        useFindAndModify: false,
        useUnifiedTopology: true
    })
.then(() => {
    console.log('DB connection successful');
}).catch(err => console.error(err));

app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
})

app.use(errorHandler);
const server = app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    })
});

process.on('uncaughtException', err => {
    console.log('UNCAUGHT EXCEPTION! Shutting Down')
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    })
})
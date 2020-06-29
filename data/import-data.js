const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');

const Tour = require('../mvc/models/tours');
const Review = require('../mvc/models/reviews');
const User = require('../mvc/models/users');
dotenv.config({path: './config.env'});

const db = process.env.DATABASE_LOCAL;

mongoose.connect(db, {
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useNewUrlParser: true
}).then(() => {
    console.log('Connected to DB');
}).catch(error => console.error(error));

const tour = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const review = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

const importData = async () => {
    try {
        await Tour.create(tour);
        await Review.create(review);
        await User.create(users);
        console.log('Successfully created');
    } catch (error) {
        console.error(error)
    }
    process.exit();
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        await Review.deleteMany();
        await User.deleteMany();
        console.log('Deleted created');
    } catch (error) {
        console.error(error)
    }
    process.exit();
}

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}

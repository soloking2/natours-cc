const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const {Schema} = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Please tell us your name']
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please provide your password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function(el) {
                return el === this.password
            },
            message: 'Passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }

});

// Document Middleware
userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew) return next();
    
    this.passwordChangedAt = Date.now() - 1000;
    next();
})
userSchema.pre('save', async function(next) {
    // Run this password if there was no password modification
    if(!this.isModified('password')) return next();

    // Runs when creating a password
    this.password = await bcrypt.hash(this.password, 12);

    // Removes the passwordConfirm from the database
    this.passwordConfirm = undefined;
    next();

});

// Query Document
userSchema.pre(/^find/, function(next) {
    // this points to the current query

    this.find({active: {$ne: false}});
    next();

});

userSchema.methods.jwtSign = function() {
    return jwt.sign({id: this._id}, 
        process.env.JWT_SECRET, 
        {expiresIn: process.env.JWT_EXPIRES_IN})
}

userSchema.methods.correctPassword = async function(
    candidatePassword, 
    userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if(this.passwordChangedAt) {
        const changedTimeStamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimeStamp;
    }
    return false;
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;

}

module.exports = mongoose.model('User', userSchema);
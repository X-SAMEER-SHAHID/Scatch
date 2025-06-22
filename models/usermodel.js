const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const productmodel = require('./productmodel');

const activitySchema = new mongoose.Schema({
    action: String,
    details: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        minLength: 3,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: String,
    isAdmin: {
        type: Boolean,
        default: false
    },
    cart: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: productmodel
    }],
    orders: {
        type: Array,
        default: []
    },
    contact: Number,
    picture: String,
    // Security questions
    securityQuestions: [{
        question: String,
        answer: String
    }],
    // Password reset fields
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    // Activity logging
    activities: [activitySchema],
    // Session management
    lastActivity: {
        type: Date,
        default: Date.now
    },
    sessionTimeout: {
        type: Number,
        default: 30 * 60 * 1000 // 30 minutes in milliseconds
    },
    shippingAddress: {
        type: String,
        default: ''
    },
    billingAddress: {
        type: String,
        default: ''
    }
});

// Add index for email field
userSchema.index({ email: 1 });

// Method to log activity
userSchema.methods.logActivity = async function (action, details) {
    this.activities.push({ action, details });
    this.lastActivity = Date.now();
    await this.save();
};

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("user", userSchema);
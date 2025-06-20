const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Review must belong to a product']
    },
    rating: {
        type: Number,
        required: [true, 'Review must have a rating'],
        min: 1,
        max: 5
    },
    title: {
        type: String,
        required: [true, 'Review must have a title'],
        trim: true,
        maxlength: [100, 'A review title must have less or equal than 100 characters']
    },
    comment: {
        type: String,
        required: [true, 'Review must have a comment'],
        trim: true
    },
    images: [{
        url: String,
        alt: String
    }],
    helpful: {
        type: Number,
        default: 0
    },
    helpfulUsers: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    verified: {
        type: Boolean,
        default: false
    },
    verifiedPurchase: {
        type: Boolean,
        default: false
    },
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order'
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminResponse: {
        comment: String,
        respondedAt: Date,
        respondedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    },
    reportCount: {
        type: Number,
        default: 0
    },
    reportedBy: [{
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        reason: String,
        reportedAt: {
            type: Date,
            default: Date.now
        }
    }],
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    dislikes: {
        type: Number,
        default: 0
    },
    dislikedBy: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    replies: [{
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        comment: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        }
    }],
    meta: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1, status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ helpful: -1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for is helpful
reviewSchema.virtual('isHelpful').get(function () {
    return this.helpful > 0;
});

// Virtual for is reported
reviewSchema.virtual('isReported').get(function () {
    return this.reportCount > 0;
});

// Pre-save middleware to update product ratings
reviewSchema.pre('save', async function (next) {
    if (this.isModified('rating') || this.isModified('status')) {
        const Product = mongoose.model('Product');
        const product = await Product.findById(this.product);

        if (product) {
            const stats = await this.constructor.aggregate([
                {
                    $match: {
                        product: this.product,
                        status: 'approved'
                    }
                },
                {
                    $group: {
                        _id: '$product',
                        ratingsAverage: { $avg: '$rating' },
                        ratingsQuantity: { $sum: 1 }
                    }
                }
            ]);

            if (stats.length > 0) {
                product.ratingsAverage = stats[0].ratingsAverage;
                product.ratingsQuantity = stats[0].ratingsQuantity;
            } else {
                product.ratingsAverage = 0;
                product.ratingsQuantity = 0;
            }

            await product.save();
        }
    }
    next();
});

// Method to mark review as helpful
reviewSchema.methods.markHelpful = async function (userId) {
    if (this.helpfulUsers.includes(userId)) {
        this.helpfulUsers.pull(userId);
        this.helpful -= 1;
    } else {
        this.helpfulUsers.push(userId);
        this.helpful += 1;
    }
    return await this.save();
};

// Method to report review
reviewSchema.methods.report = async function (userId, reason) {
    if (!this.reportedBy.some(report => report.user.toString() === userId.toString())) {
        this.reportedBy.push({
            user: userId,
            reason: reason
        });
        this.reportCount += 1;
        return await this.save();
    }
    return this;
};

// Method to like review
reviewSchema.methods.like = async function (userId) {
    if (this.likedBy.includes(userId)) {
        this.likedBy.pull(userId);
        this.likes -= 1;
    } else {
        if (this.dislikedBy.includes(userId)) {
            this.dislikedBy.pull(userId);
            this.dislikes -= 1;
        }
        this.likedBy.push(userId);
        this.likes += 1;
    }
    return await this.save();
};

// Method to dislike review
reviewSchema.methods.dislike = async function (userId) {
    if (this.dislikedBy.includes(userId)) {
        this.dislikedBy.pull(userId);
        this.dislikes -= 1;
    } else {
        if (this.likedBy.includes(userId)) {
            this.likedBy.pull(userId);
            this.likes -= 1;
        }
        this.dislikedBy.push(userId);
        this.dislikes += 1;
    }
    return await this.save();
};

// Method to add reply
reviewSchema.methods.addReply = async function (userId, comment) {
    this.replies.push({
        user: userId,
        comment: comment
    });
    return await this.save();
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review; 
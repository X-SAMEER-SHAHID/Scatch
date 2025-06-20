const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Payment must belong to a user']
    },
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order'
    },
    amount: {
        type: Number,
        required: [true, 'Payment amount is required']
    },
    currency: {
        type: String,
        required: [true, 'Currency is required'],
        default: 'USD'
    },
    status: {
        type: String,
        enum: [
            'pending',
            'processing',
            'completed',
            'failed',
            'refunded',
            'partially_refunded',
            'cancelled',
            'expired'
        ],
        default: 'pending'
    },
    method: {
        type: {
            type: String,
            enum: [
                'credit_card',
                'debit_card',
                'paypal',
                'stripe',
                'apple_pay',
                'google_pay',
                'bank_transfer',
                'crypto',
                'gift_card',
                'store_credit'
            ],
            required: [true, 'Payment method is required']
        },
        details: {
            type: Map,
            of: mongoose.Schema.Types.Mixed
        }
    },
    transactionId: {
        type: String,
        unique: true,
        sparse: true
    },
    paymentIntentId: String,
    refundId: String,
    refundAmount: Number,
    refundReason: String,
    refundDate: Date,
    failureReason: String,
    failureCode: String,
    failureMessage: String,
    metadata: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    billingAddress: {
        type: mongoose.Schema.ObjectId,
        ref: 'Address'
    },
    paymentDate: Date,
    expiryDate: Date,
    lastAttempt: Date,
    attempts: {
        type: Number,
        default: 0
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    recurringDetails: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly']
        },
        interval: Number,
        startDate: Date,
        endDate: Date,
        nextPaymentDate: Date
    },
    security: {
        threeDSecure: {
            type: Boolean,
            default: false
        },
        verificationStatus: String,
        verificationDate: Date
    },
    risk: {
        score: Number,
        level: {
            type: String,
            enum: ['low', 'medium', 'high']
        },
        factors: [String]
    },
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
paymentSchema.index({ user: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentIntentId: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ paymentDate: -1 });

// Virtual for is refundable
paymentSchema.virtual('isRefundable').get(function () {
    return ['completed', 'partially_refunded'].includes(this.status);
});

// Virtual for remaining amount
paymentSchema.virtual('remainingAmount').get(function () {
    if (!this.refundAmount) return this.amount;
    return this.amount - this.refundAmount;
});

// Method to process payment
paymentSchema.methods.process = async function (paymentDetails) {
    this.status = 'processing';
    this.lastAttempt = new Date();
    this.attempts += 1;

    // Update payment method details
    if (paymentDetails) {
        this.method.details = new Map(Object.entries(paymentDetails));
    }

    return await this.save();
};

// Method to complete payment
paymentSchema.methods.complete = async function (transactionId) {
    this.status = 'completed';
    this.transactionId = transactionId;
    this.paymentDate = new Date();
    return await this.save();
};

// Method to fail payment
paymentSchema.methods.fail = async function (reason, code, message) {
    this.status = 'failed';
    this.failureReason = reason;
    this.failureCode = code;
    this.failureMessage = message;
    this.lastAttempt = new Date();
    return await this.save();
};

// Method to refund payment
paymentSchema.methods.refund = async function (amount, reason) {
    if (!this.isRefundable) {
        throw new Error('Payment is not refundable');
    }

    const refundAmount = amount || this.remainingAmount;
    if (refundAmount > this.remainingAmount) {
        throw new Error('Refund amount exceeds remaining amount');
    }

    this.refundAmount = (this.refundAmount || 0) + refundAmount;
    this.refundReason = reason;
    this.refundDate = new Date();

    this.status = this.refundAmount >= this.amount ? 'refunded' : 'partially_refunded';
    return await this.save();
};

// Method to cancel payment
paymentSchema.methods.cancel = async function () {
    if (['pending', 'processing'].includes(this.status)) {
        this.status = 'cancelled';
        return await this.save();
    }
    throw new Error('Payment cannot be cancelled');
};

// Static method to create payment
paymentSchema.statics.create = async function (data) {
    const payment = new this(data);
    return await payment.save();
};

// Static method to get user payments
paymentSchema.statics.getUserPayments = async function (userId, options = {}) {
    const query = { user: userId };

    if (options.status) {
        query.status = options.status;
    }

    if (options.startDate && options.endDate) {
        query.createdAt = {
            $gte: options.startDate,
            $lte: options.endDate
        };
    }

    return await this.find(query)
        .sort({ createdAt: -1 })
        .limit(options.limit || 10)
        .skip(options.skip || 0);
};

// Static method to get payment by transaction ID
paymentSchema.statics.getByTransactionId = async function (transactionId) {
    return await this.findOne({ transactionId });
};

// Static method to get payment by intent ID
paymentSchema.statics.getByIntentId = async function (paymentIntentId) {
    return await this.findOne({ paymentIntentId });
};

// Static method to get failed payments
paymentSchema.statics.getFailedPayments = async function (options = {}) {
    const query = { status: 'failed' };

    if (options.startDate && options.endDate) {
        query.lastAttempt = {
            $gte: options.startDate,
            $lte: options.endDate
        };
    }

    return await this.find(query)
        .sort({ lastAttempt: -1 })
        .limit(options.limit || 10)
        .skip(options.skip || 0);
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment; 
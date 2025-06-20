const mongoose = require('mongoose');

const giftCardSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'A gift card must have a code'],
        unique: true,
        trim: true,
        uppercase: true
    },
    amount: {
        type: Number,
        required: [true, 'A gift card must have an amount'],
        min: [0, 'Amount must be greater than or equal to 0']
    },
    balance: {
        type: Number,
        required: [true, 'A gift card must have a balance'],
        min: [0, 'Balance must be greater than or equal to 0']
    },
    type: {
        type: String,
        enum: ['physical', 'digital'],
        required: [true, 'A gift card must have a type']
    },
    status: {
        type: String,
        enum: ['active', 'used', 'expired', 'cancelled'],
        default: 'active'
    },
    issuedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    },
    issuedBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'A gift card must have an issuer']
    },
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order'
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    expiryDate: {
        type: Date,
        required: [true, 'A gift card must have an expiry date']
    },
    lastUsed: {
        type: Date
    },
    usageHistory: [{
        order: {
            type: mongoose.Schema.ObjectId,
            ref: 'Order'
        },
        amount: Number,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    message: String,
    from: String,
    to: String,
    design: {
        type: String,
        enum: ['default', 'birthday', 'anniversary', 'holiday', 'custom'],
        default: 'default'
    },
    customDesign: {
        backgroundColor: String,
        textColor: String,
        image: String
    },
    isRedeemable: {
        type: Boolean,
        default: true
    },
    isTransferable: {
        type: Boolean,
        default: true
    },
    transferHistory: [{
        from: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        to: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date,
            default: Date.now
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
giftCardSchema.index({ code: 1 });
giftCardSchema.index({ status: 1 });
giftCardSchema.index({ expiryDate: 1 });
giftCardSchema.index({ issuedTo: 1 });
giftCardSchema.index({ issuedBy: 1 });

// Virtual for is valid
giftCardSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.status === 'active' &&
        this.balance > 0 &&
        now <= this.expiryDate;
});

// Virtual for is expired
giftCardSchema.virtual('isExpired').get(function () {
    return new Date() > this.expiryDate;
});

// Method to generate gift card code
giftCardSchema.statics.generateCode = function () {
    const crypto = require('crypto');
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    return code;
};

// Method to create gift card
giftCardSchema.statics.create = async function (data) {
    const code = this.generateCode();
    const giftCard = new this({
        ...data,
        code: code,
        balance: data.amount
    });
    return await giftCard.save();
};

// Method to redeem gift card
giftCardSchema.methods.redeem = async function (orderId, amount) {
    if (!this.isValid) {
        throw new Error('Gift card is not valid');
    }

    if (amount > this.balance) {
        throw new Error('Insufficient balance');
    }

    this.balance -= amount;
    this.lastUsed = new Date();
    this.usageHistory.push({
        order: orderId,
        amount: amount
    });

    if (this.balance === 0) {
        this.status = 'used';
    }

    return await this.save();
};

// Method to transfer gift card
giftCardSchema.methods.transfer = async function (fromUserId, toUserId) {
    if (!this.isTransferable) {
        throw new Error('Gift card is not transferable');
    }

    if (!this.isValid) {
        throw new Error('Gift card is not valid');
    }

    this.transferHistory.push({
        from: fromUserId,
        to: toUserId
    });

    this.issuedTo = toUserId;
    return await this.save();
};

// Method to cancel gift card
giftCardSchema.methods.cancel = async function () {
    if (this.status !== 'active') {
        throw new Error('Gift card cannot be cancelled');
    }

    this.status = 'cancelled';
    return await this.save();
};

// Method to extend expiry date
giftCardSchema.methods.extendExpiry = async function (newExpiryDate) {
    if (this.status !== 'active') {
        throw new Error('Gift card cannot be extended');
    }

    if (newExpiryDate <= this.expiryDate) {
        throw new Error('New expiry date must be after current expiry date');
    }

    this.expiryDate = newExpiryDate;
    return await this.save();
};

const GiftCard = mongoose.model('GiftCard', giftCardSchema);

module.exports = GiftCard; 
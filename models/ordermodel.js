const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Order must belong to a user']
    },
    items: [{
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'Order item must have a product']
        },
        quantity: {
            type: Number,
            required: [true, 'Order item must have a quantity'],
            min: [1, 'Quantity must be at least 1']
        },
        price: {
            type: Number,
            required: [true, 'Order item must have a price']
        },
        variant: {
            type: mongoose.Schema.ObjectId,
            ref: 'ProductVariant'
        }
    }],
    shippingAddress: {
        type: {
            type: String,
            enum: ['home', 'work', 'other'],
            required: true
        },
        street: {
            type: String,
            required: [true, 'Please provide street address']
        },
        city: {
            type: String,
            required: [true, 'Please provide city']
        },
        state: {
            type: String,
            required: [true, 'Please provide state']
        },
        country: {
            type: String,
            required: [true, 'Please provide country']
        },
        zipCode: {
            type: String,
            required: [true, 'Please provide zip code']
        }
    },
    billingAddress: {
        type: {
            type: String,
            enum: ['home', 'work', 'other'],
            required: true
        },
        street: {
            type: String,
            required: [true, 'Please provide street address']
        },
        city: {
            type: String,
            required: [true, 'Please provide city']
        },
        state: {
            type: String,
            required: [true, 'Please provide state']
        },
        country: {
            type: String,
            required: [true, 'Please provide country']
        },
        zipCode: {
            type: String,
            required: [true, 'Please provide zip code']
        }
    },
    paymentMethod: {
        type: {
            type: String,
            enum: ['card', 'paypal'],
            required: true
        },
        last4: String,
        brand: String,
        transactionId: String
    },
    subtotal: {
        type: Number,
        required: [true, 'Order must have a subtotal']
    },
    tax: {
        type: Number,
        required: [true, 'Order must have tax amount']
    },
    shippingCost: {
        type: Number,
        required: [true, 'Order must have shipping cost']
    },
    discount: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: [true, 'Order must have a total amount']
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    trackingNumber: String,
    trackingUrl: String,
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    notes: String,
    refundReason: String,
    refundAmount: Number,
    refundStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: null
    },
    couponApplied: {
        type: mongoose.Schema.ObjectId,
        ref: 'Coupon'
    },
    giftCardApplied: {
        type: mongoose.Schema.ObjectId,
        ref: 'GiftCard'
    },
    loyaltyPointsEarned: {
        type: Number,
        default: 0
    },
    loyaltyPointsRedeemed: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for order summary
orderSchema.virtual('summary').get(function () {
    return {
        orderId: this._id,
        total: this.total,
        status: this.status,
        itemCount: this.items.length,
        date: this.createdAt
    };
});

// Pre-save middleware to calculate totals
orderSchema.pre('save', function (next) {
    if (this.isModified('items') || this.isModified('discount')) {
        this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        this.total = this.subtotal + this.tax + this.shippingCost - this.discount;
    }
    next();
});

// Method to calculate estimated delivery date
orderSchema.methods.calculateEstimatedDelivery = function () {
    const processingTime = 2; // days
    const shippingTime = 5; // days
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + processingTime + shippingTime);
    return estimatedDate;
};

// Method to process refund
orderSchema.methods.processRefund = async function (reason, amount) {
    this.refundReason = reason;
    this.refundAmount = amount;
    this.refundStatus = 'pending';
    this.status = 'refunded';
    return await this.save();
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 
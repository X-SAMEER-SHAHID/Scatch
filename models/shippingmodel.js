const mongoose = require('mongoose');

const shippingSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.ObjectId,
        ref: 'Order',
        required: [true, 'Shipping must belong to an order']
    },
    method: {
        type: {
            type: String,
            enum: [
                'standard',
                'express',
                'overnight',
                'same_day',
                'pickup',
                'international',
                'free'
            ],
            required: [true, 'Shipping method is required']
        },
        name: String,
        description: String,
        carrier: {
            type: String,
            required: [true, 'Carrier is required']
        },
        service: String,
        cost: {
            type: Number,
            required: [true, 'Shipping cost is required']
        },
        currency: {
            type: String,
            default: 'USD'
        },
        estimatedDays: {
            min: Number,
            max: Number
        }
    },
    status: {
        type: String,
        enum: [
            'pending',
            'processing',
            'label_created',
            'picked_up',
            'in_transit',
            'out_for_delivery',
            'delivered',
            'failed',
            'returned',
            'cancelled'
        ],
        default: 'pending'
    },
    tracking: {
        number: {
            type: String,
            unique: true,
            sparse: true
        },
        url: String,
        carrier: String,
        status: String,
        lastUpdate: Date,
        history: [{
            status: String,
            location: String,
            timestamp: Date,
            description: String
        }]
    },
    address: {
        type: mongoose.Schema.ObjectId,
        ref: 'Address',
        required: [true, 'Shipping address is required']
    },
    package: {
        weight: Number,
        dimensions: {
            length: Number,
            width: Number,
            height: Number
        },
        items: [{
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product'
            },
            quantity: Number,
            weight: Number
        }]
    },
    insurance: {
        isInsured: {
            type: Boolean,
            default: false
        },
        amount: Number,
        provider: String,
        policyNumber: String
    },
    customs: {
        isInternational: {
            type: Boolean,
            default: false
        },
        declarationValue: Number,
        hsCode: String,
        originCountry: String,
        destinationCountry: String,
        documents: [{
            type: String,
            url: String,
            name: String
        }]
    },
    delivery: {
        attempted: {
            type: Boolean,
            default: false
        },
        attempts: {
            type: Number,
            default: 0
        },
        signature: {
            required: {
                type: Boolean,
                default: false
            },
            received: Boolean,
            name: String,
            date: Date
        },
        instructions: String,
        preferredTime: {
            start: Date,
            end: Date
        }
    },
    return: {
        isReturn: {
            type: Boolean,
            default: false
        },
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'approved', 'in_transit', 'received', 'rejected']
        },
        tracking: {
            number: String,
            url: String,
            carrier: String
        },
        label: {
            url: String,
            expiresAt: Date
        }
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
shippingSchema.index({ order: 1 });
shippingSchema.index({ status: 1 });
shippingSchema.index({ 'tracking.number': 1 });
shippingSchema.index({ createdAt: -1 });
shippingSchema.index({ 'tracking.lastUpdate': -1 });

// Virtual for is delivered
shippingSchema.virtual('isDelivered').get(function () {
    return this.status === 'delivered';
});

// Virtual for is returnable
shippingSchema.virtual('isReturnable').get(function () {
    return ['delivered', 'failed'].includes(this.status);
});

// Method to update status
shippingSchema.methods.updateStatus = async function (status, location, description) {
    this.status = status;

    if (location || description) {
        this.tracking.history.push({
            status,
            location,
            description,
            timestamp: new Date()
        });
        this.tracking.lastUpdate = new Date();
    }

    return await this.save();
};

// Method to create return
shippingSchema.methods.createReturn = async function (reason) {
    if (!this.isReturnable) {
        throw new Error('Shipping is not returnable');
    }

    this.return = {
        isReturn: true,
        reason,
        status: 'pending'
    };

    return await this.save();
};

// Method to update return status
shippingSchema.methods.updateReturnStatus = async function (status, tracking) {
    if (!this.return.isReturn) {
        throw new Error('No return exists');
    }

    this.return.status = status;
    if (tracking) {
        this.return.tracking = tracking;
    }

    return await this.save();
};

// Static method to create shipping
shippingSchema.statics.create = async function (data) {
    const shipping = new this(data);
    return await shipping.save();
};

// Static method to get order shipping
shippingSchema.statics.getOrderShipping = async function (orderId) {
    return await this.findOne({ order: orderId });
};

// Static method to get shipping by tracking number
shippingSchema.statics.getByTrackingNumber = async function (trackingNumber) {
    return await this.findOne({ 'tracking.number': trackingNumber });
};

// Static method to get pending returns
shippingSchema.statics.getPendingReturns = async function () {
    return await this.find({
        'return.isReturn': true,
        'return.status': 'pending'
    });
};

// Static method to get delayed shipments
shippingSchema.statics.getDelayedShipments = async function () {
    const now = new Date();
    return await this.find({
        status: 'in_transit',
        'method.estimatedDays.max': { $lt: now }
    });
};

const Shipping = mongoose.model('Shipping', shippingSchema);

module.exports = Shipping; 
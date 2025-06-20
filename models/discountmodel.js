const mongoose = require('mongoose');

const discountSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        sparse: true
    },
    name: {
        type: String,
        required: [true, 'Discount name is required']
    },
    type: {
        type: String,
        enum: [
            'percentage',
            'fixed_amount',
            'free_shipping',
            'buy_x_get_y',
            'bundle',
            'loyalty_points'
        ],
        required: [true, 'Discount type is required']
    },
    value: {
        type: Number,
        required: [true, 'Discount value is required']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: Date,
    endDate: Date,
    priority: {
        type: Number,
        default: 0
    },
    usage: {
        limit: Number,
        used: {
            type: Number,
            default: 0
        },
        perUser: Number,
        perOrder: Number
    },
    conditions: {
        minOrderValue: Number,
        maxOrderValue: Number,
        minItems: Number,
        maxItems: Number,
        minQuantity: Number,
        maxQuantity: Number,
        customerGroups: [String],
        customerTags: [String],
        customerLoyaltyLevel: String,
        customerPurchaseHistory: {
            minOrders: Number,
            minSpent: Number,
            timeFrame: Number // in days
        },
        productCategories: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Category'
        }],
        productBrands: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Brand'
        }],
        productTags: [String],
        productAttributes: [{
            name: String,
            value: String
        }],
        excludedProducts: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Product'
        }],
        excludedCategories: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Category'
        }],
        excludedBrands: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Brand'
        }],
        shippingMethods: [String],
        paymentMethods: [String],
        countries: [String],
        states: [String],
        cities: [String],
        timeRestrictions: {
            daysOfWeek: [Number], // 0-6 for Sunday-Saturday
            timeRanges: [{
                start: String, // HH:mm format
                end: String // HH:mm format
            }]
        }
    },
    combination: {
        canCombineWithOtherDiscounts: {
            type: Boolean,
            default: false
        },
        excludedDiscounts: [{
            type: mongoose.Schema.ObjectId,
            ref: 'Discount'
        }]
    },
    buyXGetY: {
        buyQuantity: Number,
        getQuantity: Number,
        getProduct: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product'
        },
        getDiscount: Number
    },
    bundle: {
        products: [{
            product: {
                type: mongoose.Schema.ObjectId,
                ref: 'Product'
            },
            quantity: Number
        }],
        discount: Number
    },
    loyaltyPoints: {
        pointsRequired: Number,
        pointsEarned: Number
    },
    display: {
        description: String,
        banner: {
            image: String,
            text: String,
            color: String
        },
        couponCode: String,
        termsAndConditions: String
    },
    tracking: {
        createdBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        lastModifiedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        usageHistory: [{
            user: {
                type: mongoose.Schema.ObjectId,
                ref: 'User'
            },
            order: {
                type: mongoose.Schema.ObjectId,
                ref: 'Order'
            },
            amount: Number,
            date: Date
        }]
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
discountSchema.index({ code: 1 });
discountSchema.index({ name: 1 });
discountSchema.index({ type: 1 });
discountSchema.index({ isActive: 1 });
discountSchema.index({ startDate: 1, endDate: 1 });
discountSchema.index({ 'conditions.productCategories': 1 });
discountSchema.index({ 'conditions.productBrands': 1 });

// Virtual for is valid
discountSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.isActive &&
        (!this.startDate || this.startDate <= now) &&
        (!this.endDate || this.endDate >= now) &&
        (!this.usage.limit || this.usage.used < this.usage.limit);
});

// Method to calculate discount amount
discountSchema.methods.calculateDiscount = function (order) {
    if (!this.isValid) {
        return 0;
    }

    // Check conditions
    if (!this.checkConditions(order)) {
        return 0;
    }

    let discountAmount = 0;

    switch (this.type) {
        case 'percentage':
            discountAmount = (order.subtotal * this.value) / 100;
            break;

        case 'fixed_amount':
            discountAmount = this.value;
            break;

        case 'free_shipping':
            discountAmount = order.shippingCost;
            break;

        case 'buy_x_get_y':
            discountAmount = this.calculateBuyXGetY(order);
            break;

        case 'bundle':
            discountAmount = this.calculateBundle(order);
            break;

        case 'loyalty_points':
            discountAmount = this.calculateLoyaltyPoints(order);
            break;
    }

    return Math.min(discountAmount, order.subtotal);
};

// Method to check conditions
discountSchema.methods.checkConditions = function (order) {
    const conditions = this.conditions;

    // Check order value
    if (conditions.minOrderValue && order.subtotal < conditions.minOrderValue) {
        return false;
    }
    if (conditions.maxOrderValue && order.subtotal > conditions.maxOrderValue) {
        return false;
    }

    // Check items count
    if (conditions.minItems && order.items.length < conditions.minItems) {
        return false;
    }
    if (conditions.maxItems && order.items.length > conditions.maxItems) {
        return false;
    }

    // Check customer groups
    if (conditions.customerGroups.length > 0) {
        if (!conditions.customerGroups.includes(order.user.group)) {
            return false;
        }
    }

    // Check product categories
    if (conditions.productCategories.length > 0) {
        const hasCategory = order.items.some(item =>
            conditions.productCategories.includes(item.product.category)
        );
        if (!hasCategory) {
            return false;
        }
    }

    // Check excluded products
    if (conditions.excludedProducts.length > 0) {
        const hasExcluded = order.items.some(item =>
            conditions.excludedProducts.includes(item.product)
        );
        if (hasExcluded) {
            return false;
        }
    }

    // Check shipping method
    if (conditions.shippingMethods.length > 0) {
        if (!conditions.shippingMethods.includes(order.shippingMethod)) {
            return false;
        }
    }

    // Check payment method
    if (conditions.paymentMethods.length > 0) {
        if (!conditions.paymentMethods.includes(order.paymentMethod)) {
            return false;
        }
    }

    // Check location
    if (conditions.countries.length > 0) {
        if (!conditions.countries.includes(order.shippingAddress.country)) {
            return false;
        }
    }

    // Check time restrictions
    if (conditions.timeRestrictions) {
        const now = new Date();
        const dayOfWeek = now.getDay();

        if (conditions.timeRestrictions.daysOfWeek.length > 0) {
            if (!conditions.timeRestrictions.daysOfWeek.includes(dayOfWeek)) {
                return false;
            }
        }

        if (conditions.timeRestrictions.timeRanges.length > 0) {
            const currentTime = now.toTimeString().slice(0, 5);
            const isInRange = conditions.timeRestrictions.timeRanges.some(range =>
                currentTime >= range.start && currentTime <= range.end
            );
            if (!isInRange) {
                return false;
            }
        }
    }

    return true;
};

// Method to calculate buy X get Y discount
discountSchema.methods.calculateBuyXGetY = function (order) {
    const { buyQuantity, getQuantity, getProduct, getDiscount } = this.buyXGetY;

    let discountAmount = 0;
    const eligibleItems = order.items.filter(item =>
        item.product.equals(getProduct)
    );

    for (const item of eligibleItems) {
        const sets = Math.floor(item.quantity / (buyQuantity + getQuantity));
        if (sets > 0) {
            discountAmount += (item.price * getQuantity * getDiscount) / 100;
        }
    }

    return discountAmount;
};

// Method to calculate bundle discount
discountSchema.methods.calculateBundle = function (order) {
    const { products, discount } = this.bundle;

    let discountAmount = 0;
    const bundleSets = Math.min(
        ...products.map(bundleProduct => {
            const orderItem = order.items.find(item =>
                item.product.equals(bundleProduct.product)
            );
            return orderItem ? Math.floor(orderItem.quantity / bundleProduct.quantity) : 0;
        })
    );

    if (bundleSets > 0) {
        discountAmount = products.reduce((total, bundleProduct) => {
            const orderItem = order.items.find(item =>
                item.product.equals(bundleProduct.product)
            );
            return total + (orderItem.price * bundleProduct.quantity * bundleSets * discount) / 100;
        }, 0);
    }

    return discountAmount;
};

// Method to calculate loyalty points discount
discountSchema.methods.calculateLoyaltyPoints = function (order) {
    const { pointsRequired, pointsEarned } = this.loyaltyPoints;

    if (order.user.loyaltyPoints < pointsRequired) {
        return 0;
    }

    return (order.subtotal * pointsEarned) / 100;
};

// Static method to create discount
discountSchema.statics.create = async function (data) {
    const discount = new this(data);
    return await discount.save();
};

// Static method to get active discounts
discountSchema.statics.getActive = async function () {
    const now = new Date();
    return await this.find({
        isActive: true,
        $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: now } }
        ],
        $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } }
        ]
    });
};

// Static method to get discount by code
discountSchema.statics.getByCode = async function (code) {
    return await this.findOne({ code });
};

// Static method to get applicable discounts
discountSchema.statics.getApplicable = async function (order) {
    const discounts = await this.getActive();
    return discounts.filter(discount => discount.checkConditions(order));
};

// Static method to calculate best discount
discountSchema.statics.calculateBestDiscount = async function (order) {
    const applicableDiscounts = await this.getApplicable(order);
    let bestDiscount = null;
    let maxAmount = 0;

    for (const discount of applicableDiscounts) {
        const amount = discount.calculateDiscount(order);
        if (amount > maxAmount) {
            maxAmount = amount;
            bestDiscount = discount;
        }
    }

    return {
        discount: bestDiscount,
        amount: maxAmount
    };
};

const Discount = mongoose.model('Discount', discountSchema);

module.exports = Discount; 
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, 'A coupon must have a code'],
        unique: true,
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['percentage', 'fixed', 'free_shipping'],
        required: [true, 'A coupon must have a type']
    },
    value: {
        type: Number,
        required: [true, 'A coupon must have a value'],
        min: [0, 'Value must be greater than or equal to 0']
    },
    minPurchase: {
        type: Number,
        default: 0
    },
    maxDiscount: {
        type: Number,
        default: null
    },
    startDate: {
        type: Date,
        required: [true, 'A coupon must have a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'A coupon must have an end date']
    },
    usageLimit: {
        type: Number,
        default: null
    },
    usageCount: {
        type: Number,
        default: 0
    },
    perUserLimit: {
        type: Number,
        default: 1
    },
    userUsageCount: {
        type: Map,
        of: Number,
        default: new Map()
    },
    products: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Product'
    }],
    categories: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Category'
    }],
    brands: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Brand'
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
    firstTimeUser: {
        type: Boolean,
        default: false
    },
    minimumOrderValue: {
        type: Number,
        default: 0
    },
    maximumOrderValue: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'expired'],
        default: 'active'
    },
    description: String,
    terms: String,
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
couponSchema.index({ code: 1 });
couponSchema.index({ status: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

// Virtual for is expired
couponSchema.virtual('isExpired').get(function () {
    return this.endDate < new Date();
});

// Virtual for is active
couponSchema.virtual('isActive').get(function () {
    const now = new Date();
    return this.status === 'active' &&
        now >= this.startDate &&
        now <= this.endDate &&
        (!this.usageLimit || this.usageCount < this.usageLimit);
});

// Method to check if coupon is valid for a user
couponSchema.methods.isValidForUser = function (userId) {
    if (!this.isActive) return false;

    const userUsageCount = this.userUsageCount.get(userId.toString()) || 0;
    return userUsageCount < this.perUserLimit;
};

// Method to check if coupon is valid for a cart
couponSchema.methods.isValidForCart = function (cart) {
    if (!this.isActive) return false;

    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (this.minimumOrderValue && subtotal < this.minimumOrderValue) return false;
    if (this.maximumOrderValue && subtotal > this.maximumOrderValue) return false;

    if (this.products.length > 0) {
        const hasValidProduct = cart.items.some(item =>
            this.products.includes(item.product.toString())
        );
        if (!hasValidProduct) return false;
    }

    if (this.excludedProducts.length > 0) {
        const hasExcludedProduct = cart.items.some(item =>
            this.excludedProducts.includes(item.product.toString())
        );
        if (hasExcludedProduct) return false;
    }

    return true;
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function (subtotal) {
    if (!this.isActive) return 0;

    let discount = 0;

    if (this.type === 'percentage') {
        discount = (subtotal * this.value) / 100;
        if (this.maxDiscount) {
            discount = Math.min(discount, this.maxDiscount);
        }
    } else if (this.type === 'fixed') {
        discount = this.value;
    }

    return Math.min(discount, subtotal);
};

// Method to apply coupon
couponSchema.methods.applyCoupon = async function (userId) {
    if (!this.isValidForUser(userId)) {
        throw new Error('Coupon is not valid for this user');
    }

    this.usageCount += 1;
    const userUsageCount = this.userUsageCount.get(userId.toString()) || 0;
    this.userUsageCount.set(userId.toString(), userUsageCount + 1);

    if (this.usageLimit && this.usageCount >= this.usageLimit) {
        this.status = 'inactive';
    }

    return await this.save();
};

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon; 
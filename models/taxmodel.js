const mongoose = require('mongoose');

const taxSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tax name is required']
    },
    type: {
        type: String,
        enum: [
            'sales_tax',
            'vat',
            'gst',
            'hst',
            'pst',
            'custom'
        ],
        required: [true, 'Tax type is required']
    },
    rate: {
        type: Number,
        required: [true, 'Tax rate is required'],
        min: 0,
        max: 100
    },
    isCompound: {
        type: Boolean,
        default: false
    },
    priority: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    appliesTo: {
        products: {
            type: Boolean,
            default: true
        },
        shipping: {
            type: Boolean,
            default: false
        },
        handling: {
            type: Boolean,
            default: false
        }
    },
    countries: [{
        code: String,
        name: String,
        states: [{
            code: String,
            name: String,
            rate: Number
        }]
    }],
    productCategories: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Category'
    }],
    productBrands: [{
        type: mongoose.Schema.ObjectId,
        ref: 'Brand'
    }],
    minAmount: Number,
    maxAmount: Number,
    startDate: Date,
    endDate: Date,
    calculation: {
        basedOn: {
            type: String,
            enum: ['subtotal', 'total', 'shipping', 'custom'],
            default: 'subtotal'
        },
        customField: String,
        rounding: {
            type: String,
            enum: ['up', 'down', 'nearest'],
            default: 'nearest'
        },
        precision: {
            type: Number,
            default: 2
        }
    },
    exemptions: {
        productTypes: [String],
        customerGroups: [String],
        minOrderValue: Number,
        maxOrderValue: Number
    },
    reporting: {
        taxNumber: String,
        reportingFrequency: {
            type: String,
            enum: ['monthly', 'quarterly', 'annually']
        },
        lastReported: Date,
        nextReporting: Date
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
taxSchema.index({ name: 1 });
taxSchema.index({ type: 1 });
taxSchema.index({ isActive: 1 });
taxSchema.index({ 'countries.code': 1 });
taxSchema.index({ startDate: 1, endDate: 1 });

// Virtual for is valid
taxSchema.virtual('isValid').get(function () {
    const now = new Date();
    return this.isActive &&
        (!this.startDate || this.startDate <= now) &&
        (!this.endDate || this.endDate >= now);
});

// Method to calculate tax amount
taxSchema.methods.calculateTax = function (baseAmount, country, state) {
    if (!this.isValid) {
        return 0;
    }

    // Check country and state
    const countryData = this.countries.find(c => c.code === country);
    if (!countryData) {
        return 0;
    }

    let rate = this.rate;
    if (state && countryData.states) {
        const stateData = countryData.states.find(s => s.code === state);
        if (stateData) {
            rate = stateData.rate;
        }
    }

    // Calculate tax amount
    let taxAmount = (baseAmount * rate) / 100;

    // Apply rounding
    const factor = Math.pow(10, this.calculation.precision);
    switch (this.calculation.rounding) {
        case 'up':
            taxAmount = Math.ceil(taxAmount * factor) / factor;
            break;
        case 'down':
            taxAmount = Math.floor(taxAmount * factor) / factor;
            break;
        case 'nearest':
            taxAmount = Math.round(taxAmount * factor) / factor;
            break;
    }

    return taxAmount;
};

// Method to check if tax applies to amount
taxSchema.methods.appliesToAmount = function (amount) {
    if (this.minAmount && amount < this.minAmount) {
        return false;
    }
    if (this.maxAmount && amount > this.maxAmount) {
        return false;
    }
    return true;
};

// Method to check if tax applies to product
taxSchema.methods.appliesToProduct = function (product) {
    // Check product categories
    if (this.productCategories.length > 0) {
        if (!this.productCategories.includes(product.category)) {
            return false;
        }
    }

    // Check product brands
    if (this.productBrands.length > 0) {
        if (!this.productBrands.includes(product.brand)) {
            return false;
        }
    }

    // Check product types
    if (this.exemptions.productTypes.length > 0) {
        if (this.exemptions.productTypes.includes(product.type)) {
            return false;
        }
    }

    return true;
};

// Static method to create tax
taxSchema.statics.create = async function (data) {
    const tax = new this(data);
    return await tax.save();
};

// Static method to get active taxes
taxSchema.statics.getActive = async function () {
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

// Static method to get taxes by country
taxSchema.statics.getByCountry = async function (countryCode) {
    return await this.find({
        isActive: true,
        'countries.code': countryCode
    });
};

// Static method to get taxes by product
taxSchema.statics.getByProduct = async function (product) {
    return await this.find({
        isActive: true,
        $or: [
            { productCategories: product.category },
            { productBrands: product.brand }
        ]
    });
};

// Static method to calculate total tax
taxSchema.statics.calculateTotalTax = async function (amount, country, state, product) {
    const taxes = await this.getActive();
    let totalTax = 0;

    for (const tax of taxes) {
        if (tax.appliesToAmount(amount) &&
            (!product || tax.appliesToProduct(product))) {
            totalTax += tax.calculateTax(amount, country, state);
        }
    }

    return totalTax;
};

const Tax = mongoose.model('Tax', taxSchema);

module.exports = Tax; 
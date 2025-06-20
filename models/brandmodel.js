const mongoose = require('mongoose');
const slugify = require('slugify');

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A brand must have a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'A brand name must have less or equal than 50 characters'],
        minlength: [2, 'A brand name must have more or equal than 2 characters']
    },
    slug: String,
    description: {
        type: String,
        trim: true
    },
    logo: {
        url: String,
        alt: String
    },
    banner: {
        url: String,
        alt: String
    },
    website: {
        type: String,
        validate: {
            validator: function (v) {
                return /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(v);
            },
            message: props => `${props.value} is not a valid website URL!`
        }
    },
    email: {
        type: String,
        validate: {
            validator: function (v) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
            },
            message: props => `${props.value} is not a valid email address!`
        }
    },
    phone: String,
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String
    },
    socialMedia: {
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String,
        youtube: String
    },
    seo: {
        title: String,
        description: String,
        keywords: [String]
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    featured: {
        type: Boolean,
        default: false
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    showInMenu: {
        type: Boolean,
        default: true
    },
    showInHome: {
        type: Boolean,
        default: false
    },
    showInFooter: {
        type: Boolean,
        default: false
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
brandSchema.index({ slug: 1 });
brandSchema.index({ status: 1 });
brandSchema.index({ featured: 1 });
brandSchema.index({ displayOrder: 1 });

// Virtual for products
brandSchema.virtual('products', {
    ref: 'Product',
    foreignField: 'brand',
    localField: '_id'
});

// Pre-save middleware to create slug
brandSchema.pre('save', function (next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, { lower: true });
    }
    next();
});

// Method to get all products
brandSchema.methods.getAllProducts = async function () {
    return await mongoose.model('Product').find({ brand: this._id });
};

// Method to get featured products
brandSchema.methods.getFeaturedProducts = async function (limit = 4) {
    return await mongoose.model('Product').find({
        brand: this._id,
        featured: true,
        status: 'published'
    }).limit(limit);
};

// Method to get bestseller products
brandSchema.methods.getBestsellerProducts = async function (limit = 4) {
    return await mongoose.model('Product').find({
        brand: this._id,
        bestseller: true,
        status: 'published'
    }).limit(limit);
};

// Method to get new arrival products
brandSchema.methods.getNewArrivalProducts = async function (limit = 4) {
    return await mongoose.model('Product').find({
        brand: this._id,
        newArrival: true,
        status: 'published'
    }).limit(limit);
};

// Method to get sale products
brandSchema.methods.getSaleProducts = async function (limit = 4) {
    return await mongoose.model('Product').find({
        brand: this._id,
        sale: true,
        status: 'published'
    }).limit(limit);
};

const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand; 
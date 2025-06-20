const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Address must belong to a user']
    },
    type: {
        type: String,
        enum: ['shipping', 'billing', 'both'],
        default: 'both'
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    label: {
        type: String,
        enum: ['home', 'work', 'other'],
        default: 'home'
    },
    customLabel: String,
    firstName: {
        type: String,
        required: [true, 'First name is required']
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required']
    },
    company: String,
    addressLine1: {
        type: String,
        required: [true, 'Address line 1 is required']
    },
    addressLine2: String,
    city: {
        type: String,
        required: [true, 'City is required']
    },
    state: {
        type: String,
        required: [true, 'State is required']
    },
    postalCode: {
        type: String,
        required: [true, 'Postal code is required']
    },
    country: {
        type: String,
        required: [true, 'Country is required']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required']
    },
    instructions: String,
    coordinates: {
        latitude: Number,
        longitude: Number
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationDate: Date,
    lastUsed: Date,
    usageCount: {
        type: Number,
        default: 0
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
addressSchema.index({ user: 1 });
addressSchema.index({ type: 1 });
addressSchema.index({ isDefault: 1 });
addressSchema.index({ country: 1 });
addressSchema.index({ city: 1 });
addressSchema.index({ postalCode: 1 });

// Virtual for full name
addressSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for full address
addressSchema.virtual('fullAddress').get(function () {
    const parts = [
        this.addressLine1,
        this.addressLine2,
        this.city,
        this.state,
        this.postalCode,
        this.country
    ].filter(Boolean);
    return parts.join(', ');
});

// Method to set as default
addressSchema.methods.setAsDefault = async function () {
    // Remove default status from other addresses
    await this.constructor.updateMany(
        { user: this.user, _id: { $ne: this._id } },
        { isDefault: false }
    );

    this.isDefault = true;
    return await this.save();
};

// Method to increment usage count
addressSchema.methods.incrementUsage = async function () {
    this.usageCount += 1;
    this.lastUsed = new Date();
    return await this.save();
};

// Method to verify address
addressSchema.methods.verify = async function () {
    this.isVerified = true;
    this.verificationDate = new Date();
    return await this.save();
};

// Static method to get default address
addressSchema.statics.getDefault = async function (userId, type = 'both') {
    return await this.findOne({
        user: userId,
        type: { $in: [type, 'both'] },
        isDefault: true
    });
};

// Static method to get all addresses
addressSchema.statics.getAll = async function (userId, type = 'both') {
    return await this.find({
        user: userId,
        type: { $in: [type, 'both'] }
    }).sort({ isDefault: -1, createdAt: -1 });
};

// Static method to create address
addressSchema.statics.create = async function (data) {
    const address = new this(data);

    // If this is the first address or marked as default
    if (data.isDefault) {
        await address.setAsDefault();
    }

    return address;
};

// Static method to update address
addressSchema.statics.update = async function (id, data) {
    const address = await this.findById(id);
    if (!address) {
        throw new Error('Address not found');
    }

    // Update fields
    Object.assign(address, data);

    // Handle default status
    if (data.isDefault) {
        await address.setAsDefault();
    }

    return await address.save();
};

// Static method to delete address
addressSchema.statics.delete = async function (id) {
    const address = await this.findById(id);
    if (!address) {
        throw new Error('Address not found');
    }

    // If this was the default address, set another address as default
    if (address.isDefault) {
        const nextAddress = await this.findOne({
            user: address.user,
            _id: { $ne: address._id }
        }).sort({ createdAt: -1 });

        if (nextAddress) {
            await nextAddress.setAsDefault();
        }
    }

    return await address.remove();
};

const Address = mongoose.model('Address', addressSchema);

module.exports = Address; 
const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Wishlist must belong to a user']
    },
    name: {
        type: String,
        default: 'My Wishlist'
    },
    isDefault: {
        type: Boolean,
        default: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    items: [{
        product: {
            type: mongoose.Schema.ObjectId,
            ref: 'Product',
            required: [true, 'Wishlist item must have a product']
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        notes: String,
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium'
        },
        quantity: {
            type: Number,
            default: 1,
            min: [1, 'Quantity must be at least 1']
        },
        variant: {
            type: mongoose.Schema.ObjectId,
            ref: 'ProductVariant'
        }
    }],
    shareToken: {
        type: String,
        unique: true,
        sparse: true
    },
    sharedWith: [{
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        permission: {
            type: String,
            enum: ['view', 'edit'],
            default: 'view'
        },
        sharedAt: {
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
wishlistSchema.index({ user: 1 });
wishlistSchema.index({ shareToken: 1 });
wishlistSchema.index({ 'sharedWith.user': 1 });

// Virtual for item count
wishlistSchema.virtual('itemCount').get(function () {
    return this.items.length;
});

// Virtual for total value
wishlistSchema.virtual('totalValue').get(function () {
    return this.items.reduce((total, item) => {
        const product = item.product;
        if (product && product.price) {
            return total + (product.price * item.quantity);
        }
        return total;
    }, 0);
});

// Method to add item to wishlist
wishlistSchema.methods.addItem = async function (productId, options = {}) {
    const existingItem = this.items.find(item =>
        item.product.toString() === productId.toString()
    );

    if (existingItem) {
        existingItem.quantity = options.quantity || existingItem.quantity;
        existingItem.notes = options.notes || existingItem.notes;
        existingItem.priority = options.priority || existingItem.priority;
        existingItem.variant = options.variant || existingItem.variant;
    } else {
        this.items.push({
            product: productId,
            quantity: options.quantity || 1,
            notes: options.notes,
            priority: options.priority || 'medium',
            variant: options.variant
        });
    }

    return await this.save();
};

// Method to remove item from wishlist
wishlistSchema.methods.removeItem = async function (productId) {
    this.items = this.items.filter(item =>
        item.product.toString() !== productId.toString()
    );
    return await this.save();
};

// Method to update item in wishlist
wishlistSchema.methods.updateItem = async function (productId, updates) {
    const item = this.items.find(item =>
        item.product.toString() === productId.toString()
    );

    if (item) {
        Object.assign(item, updates);
        return await this.save();
    }

    return this;
};

// Method to share wishlist
wishlistSchema.methods.share = async function (userId, permission = 'view') {
    if (!this.sharedWith.some(share => share.user.toString() === userId.toString())) {
        this.sharedWith.push({
            user: userId,
            permission: permission
        });
        return await this.save();
    }
    return this;
};

// Method to unshare wishlist
wishlistSchema.methods.unshare = async function (userId) {
    this.sharedWith = this.sharedWith.filter(share =>
        share.user.toString() !== userId.toString()
    );
    return await this.save();
};

// Method to generate share token
wishlistSchema.methods.generateShareToken = async function () {
    const crypto = require('crypto');
    this.shareToken = crypto.randomBytes(32).toString('hex');
    return await this.save();
};

// Method to add all items to cart
wishlistSchema.methods.addAllToCart = async function () {
    const User = mongoose.model('User');
    const user = await User.findById(this.user);

    if (!user) {
        throw new Error('User not found');
    }

    for (const item of this.items) {
        const product = await mongoose.model('Product').findById(item.product);
        if (product && product.stock > 0) {
            const cartItem = user.cart.items.find(cartItem =>
                cartItem.product.toString() === item.product.toString()
            );

            if (cartItem) {
                cartItem.quantity += item.quantity;
            } else {
                user.cart.items.push({
                    product: item.product,
                    quantity: item.quantity,
                    price: product.price,
                    variant: item.variant
                });
            }
        }
    }

    await user.save();
    return user.cart;
};

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist; 